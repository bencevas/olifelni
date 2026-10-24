import { createHash } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { assertStorageConfigured } from "./env";

/**
 * Images live in one of two places, chosen by env:
 *
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY -> Supabase Storage bucket (production)
 *   neither                                  -> public/uploads, served by Next (local)
 *
 * Callers only ever see a storage key. `publicUrl(key)` resolves it for the current backend,
 * so moving from local to Supabase changes no component code.
 */

const BUCKET = process.env.SUPABASE_BUCKET ?? "listings";
const LOCAL_DIR = join(process.cwd(), "public", "uploads");

export const usingSupabaseStorage = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export type StoredImage = { key: string; width: number; height: number };

/** Longest edge, in px. Wheel photos arrive from phones at 3000px+; nothing needs that. */
const MAX_EDGE = 1400;

/**
 * Normalises any uploaded image to a web-sized WebP and stores it.
 * Returns the key plus the final dimensions, so pages can reserve layout space
 * and avoid cumulative layout shift.
 */
export async function storeImage(input: Buffer, hint = "img"): Promise<StoredImage> {
  assertStorageConfigured();

  const processed = await sharp(input)
    .rotate() // honour EXIF orientation — phone photos are routinely sideways without it
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const digest = createHash("sha256").update(processed.data).digest("hex").slice(0, 32);
  const key = `${hint}-${digest}.webp`;

  if (usingSupabaseStorage) {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "image/webp",
          "x-upsert": "true",
        },
        body: new Uint8Array(processed.data),
      },
    );
    if (!res.ok) throw new Error(`Supabase Storage upload failed: ${res.status} ${await res.text()}`);
  } else {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(join(LOCAL_DIR, key), processed.data);
  }

  return { key, width: processed.info.width, height: processed.info.height };
}

export async function deleteImage(key: string): Promise<void> {
  if (usingSupabaseStorage) {
    await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
  } else {
    await unlink(join(LOCAL_DIR, key)).catch(() => {});
  }
}

export function publicUrl(key: string): string {
  return usingSupabaseStorage
    ? `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`
    : `/uploads/${key}`;
}

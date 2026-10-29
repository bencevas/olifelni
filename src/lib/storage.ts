import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, unlink, access } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { assertStorageConfigured } from "./env";
import { VARIANT_WIDTHS, variantKey } from "./image-variants";

/**
 * Images live in one of two places, chosen by env:
 *
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY -> Supabase Storage bucket (production)
 *   neither                                  -> public/uploads, served by Next (local)
 *
 * Callers only ever see a storage key. `publicUrl(key)` resolves it for the current backend,
 * so moving from local to Supabase changes no component code.
 *
 * Each image is stored at full size plus smaller copies (see image-variants.ts), which the
 * site's image loader picks between. That replaces Vercel's image optimizer, whose free
 * quota runs out and then fails every uncached photo with 402 Payment Required.
 */

const BUCKET = process.env.SUPABASE_BUCKET ?? "listings";

/**
 * Trailing slashes trimmed: `https://<ref>.supabase.co/` would otherwise produce
 * `//storage/...` paths in every image URL.
 */
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");

const LOCAL_DIR = join(process.cwd(), "public", "uploads");

export const usingSupabaseStorage = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export type StoredImage = { key: string; width: number; height: number };

/** Longest edge, in px. Wheel photos arrive from phones at 3000px+; nothing needs that. */
const MAX_EDGE = 1400;

const resize = (input: Buffer, edge: number, quality: number) =>
  sharp(input)
    .rotate() // honour EXIF orientation — phone photos are routinely sideways without it
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

async function put(key: string, data: Buffer): Promise<void> {
  if (usingSupabaseStorage) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "image/webp",
        // Keys are content hashes, so a file never changes once written.
        "Cache-Control": "max-age=31536000",
        "x-upsert": "true",
      },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Supabase Storage upload failed: ${res.status} ${await res.text()}`);
  } else {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(join(LOCAL_DIR, key), data);
  }
}

/**
 * Normalises any uploaded image to a web-sized WebP and stores it, with its smaller copies.
 * Returns the key plus the final dimensions, so pages can reserve layout space
 * and avoid cumulative layout shift.
 */
export async function storeImage(input: Buffer, hint = "img"): Promise<StoredImage> {
  assertStorageConfigured();

  const processed = await resize(input, MAX_EDGE, 82);
  const digest = createHash("sha256").update(processed.data).digest("hex").slice(0, 32);
  const key = `${hint}-${digest}.webp`;

  await put(key, processed.data);
  await Promise.all(
    VARIANT_WIDTHS.map(async (w) => put(variantKey(key, w), (await resize(processed.data, w, 78)).data)),
  );

  return { key, width: processed.info.width, height: processed.info.height };
}

export async function deleteImage(key: string): Promise<void> {
  const keys = [key, ...VARIANT_WIDTHS.map((w) => variantKey(key, w))];
  if (usingSupabaseStorage) {
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: keys }),
    });
  } else {
    await Promise.all(keys.map((k) => unlink(join(LOCAL_DIR, k)).catch(() => {})));
  }
}

export function publicUrl(key: string): string {
  return usingSupabaseStorage
    ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`
    : `/uploads/${key}`;
}

/**
 * Makes sure the `width` copy of `key` exists, creating it from the full-size image if not.
 * Photos uploaded before copies were made at upload time get theirs here, on first request.
 * Returns false when the full-size image itself is missing.
 */
export async function ensureVariant(key: string, width: number): Promise<boolean> {
  const target = variantKey(key, width);

  if (!usingSupabaseStorage) {
    if (await access(join(LOCAL_DIR, target)).then(() => true, () => false)) return true;
    const original = await readFile(join(LOCAL_DIR, key)).catch(() => null);
    if (!original) return false;
    await put(target, (await resize(original, width, 78)).data);
    return true;
  }

  if ((await fetch(publicUrl(target), { method: "HEAD" })).ok) return true;
  const res = await fetch(publicUrl(key));
  if (!res.ok) return false;
  await put(target, (await resize(Buffer.from(await res.arrayBuffer()), width, 78)).data);
  return true;
}

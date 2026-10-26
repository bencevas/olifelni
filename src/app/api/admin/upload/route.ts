import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { publicUrl, storeImage } from "@/lib/storage";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";

/**
 * Photo upload endpoint for the admin.
 *
 * A route handler rather than a server action: server actions cap the request body at 1 MB
 * by default, and a set of wheel photos straight off a phone is far larger. The browser
 * shrinks each image before it gets here (see src/lib/client-resize.ts); sharp then
 * normalises whatever arrives to a web-sized WebP.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 401 });

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const hint = slugify(String(form.get("hint") ?? "kep")) || "kep";

  if (!files.length) return NextResponse.json({ error: "Nincs feltöltött fájl." }, { status: 400 });

  const images = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const stored = await storeImage(Buffer.from(await file.arrayBuffer()), hint);
      images.push({ ...stored, url: publicUrl(stored.key) });
    } catch (e) {
      console.error(`upload failed for ${file.name} (${file.type}, ${file.size} bytes)`, e);
      return NextResponse.json(
        { error: `A(z) „${file.name}” kép feldolgozása nem sikerült. Próbáld JPEG formátumban.` },
        { status: 422 },
      );
    }
  }

  if (!images.length) {
    return NextResponse.json({ error: "A fájlok egyike sem volt kép." }, { status: 400 });
  }
  return NextResponse.json({ images });
}

"use client";

/**
 * Shrinks an image in the browser before upload.
 *
 * The owner uploads straight from a phone, where each photo is 3-8 MB. Sending those raw
 * over mobile data is the slowest part of creating a listing, and the server would only
 * downscale them anyway. Doing it here makes a five-photo upload feel instant.
 */
const MAX_EDGE = 1600;
const QUALITY = 0.85;

const isHeic = (file: File) =>
  /^image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);

/**
 * iPhone photos are HEIC. Safari decodes them, but Chrome and Firefox do not, and neither
 * can the server: sharp's prebuilt libvips has no HEVC decoder. So a HEIC the browser
 * cannot read is decoded here with libheif compiled to WASM. That is ~3 MB, so it is only
 * fetched the first time a HEIC actually needs it.
 */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (e) {
    if (!isHeic(file)) throw e;
    const { heicTo } = await import("heic-to/next");
    return heicTo({ blob: file, type: "bitmap" });
  }
}

export async function resizeForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && !isHeic(file)) return file;

  try {
    const bitmap = await decode(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    // Already small enough — re-encoding would only lose quality. HEIC always converts,
    // because the server cannot read it.
    if (scale === 1 && file.size < 1_500_000 && !isHeic(file)) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    if (isHeic(file)) {
      throw new Error(
        `A(z) „${file.name}” iPhone-kép (HEIC) nem nyitható meg. Exportáld JPEG-ként, és töltsd fel úgy.`,
      );
    }
    // Any other failure (odd format, no bitmap support) falls back to the original file.
    return file;
  }
}

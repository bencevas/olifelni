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

export async function resizeForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    // Already small enough — re-encoding would only lose quality.
    if (scale === 1 && file.size < 1_500_000) {
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
    // Any failure (odd format, no bitmap support) just falls back to the original file.
    return file;
  }
}

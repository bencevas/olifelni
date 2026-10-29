"use client";

import { VARIANT_WIDTHS } from "./image-variants";

/**
 * next/image loader (see images.loaderFile in next.config.ts).
 *
 * Listing photos are served straight from storage at the smallest stored size that covers
 * the requested width: a 400 or 800px copy through /api/img, which creates the copy the
 * first time and then redirects to it, or the full-size file. Nothing goes through Vercel's
 * image optimizer, whose free quota ran out and then failed every uncached photo.
 *
 * Other images (logo, hero) are already web-sized files and are served as they are. The
 * width parameter is still appended, because next/image warns about a loader that ignores it.
 */
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  const photo = src.match(/\/storage\/v1\/object\/public\/[^/]+\/([a-z0-9-]+\.webp)$/) ?? src.match(/^\/uploads\/([a-z0-9-]+\.webp)$/);
  if (photo) {
    const w = VARIANT_WIDTHS.find((v) => width <= v);
    if (w) return `/api/img?k=${photo[1]}&w=${w}`;
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}

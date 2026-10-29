/**
 * Widths of the smaller copies stored beside every photo. The full-size image (1400px) covers
 * anything larger. Free of imports so the client-side image loader can use it.
 */
export const VARIANT_WIDTHS = [400, 800] as const;

/** `audi-…​.webp` → `audi-…-w400.webp` */
export const variantKey = (key: string, width: number) => key.replace(/\.webp$/, `-w${width}.webp`);

/** Storage keys are a slug plus a content hash; nothing else is ever resized. */
export const STORAGE_KEY = /^[a-z0-9-]+\.webp$/;

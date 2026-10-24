const NBSP = " ";

/**
 * Hungarian price format, matching the current site: 330 000 Ft.
 * Thousands are separated by a non-breaking space so a price never wraps mid-number.
 */
export function huf(amount: number): string {
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${grouped}${NBSP}Ft`;
}

/** Strips combining marks (U+0300-U+036F) left behind by NFD normalisation. */
const COMBINING = /[̀-ͯ]/g;
/** Straight and typographic quotes, which the Wix slugs leaked into URLs. */
const QUOTES = /["'‘’“”]/g;

/** `Audi 20" 5x112` -> `audi-20-5x112`. ASCII-safe: no quotes, no accents. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING, "")
    .replace(QUOTES, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

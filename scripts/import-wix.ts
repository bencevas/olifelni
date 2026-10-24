/**
 * One-shot import of the scraped Wix catalog into the database.
 *
 *   npm run db:import                     -> local PGlite + public/uploads
 *   DATABASE_URL=... npm run db:import    -> Supabase
 *   npm run db:import -- --skip-images    -> metadata only (fast, for schema iteration)
 *
 * Idempotent: re-running updates listings matched on legacy_slug rather than duplicating.
 *
 * Facets come from the Wix category assignments, not from parsing titles. Every one of the
 * 150 products is categorised, and those categories already encode exactly the dimensions the
 * new schema wants (diameter, bolt pattern, make, brand, season). Regex is used only for the
 * three specs that exist nowhere but the free-text description: width, ET and centre bore.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, listings, listingImages } from "../src/lib/db";
import { storeImage } from "../src/lib/storage";
import { slugify } from "../src/lib/format";
import { CAR_MAKES, WHEEL_BRANDS, TIRE_BRANDS } from "../src/lib/labels";

const EXPORT_DIR = join(process.cwd(), "data", "wix-export");
const skipImages = process.argv.includes("--skip-images");

type WixMedia = { id: string; w: number; h: number; title: string | null; original: string };
type WixProduct = {
  id: string; name: string; urlPart: string; description: string | null;
  price: number; comparePrice: number; categoryIds: string[];
  isVisible: boolean; inventory: string | null; media: WixMedia[];
};
type WixCategory = { id: string; name: string; slug: string; visible: boolean };

const categories: WixCategory[] = JSON.parse(
  readFileSync(join(EXPORT_DIR, "categories.json"), "utf8"),
);
const products: WixProduct[] = JSON.parse(readFileSync(join(EXPORT_DIR, "products.json"), "utf8"));
const categoryName = new Map(categories.map((c) => [c.id, c.name]));

/* ---------------------------------------------------------------- facets */

const DIAMETER_RE = /^(\d{2})"$/;
/** `5 x 112`, `5x130`, `5 x 114,3` all mean the same thing; normalise to `5x112` form. */
const BOLT_RE = /^(\d)\s*x\s*(\d{2,3}(?:,\d)?)$/;
const SEASONS: Record<string, "summer" | "winter" | "all_season"> = {
  "Nyári": "summer",
  "Téli": "winter",
  "Négy évszakos": "all_season",
};
const makeSet = new Set<string>(CAR_MAKES);
const wheelBrandSet = new Set<string>(WHEEL_BRANDS);

type Facets = {
  kind: "wheel" | "tire" | null;
  diameterIn: number | null;
  boltPattern: string | null;
  carMake: string | null;
  wheelBrand: string | null;
  season: "summer" | "winter" | "all_season" | null;
};

function facetsFromCategories(ids: string[]): Facets {
  const f: Facets = {
    kind: null, diameterIn: null, boltPattern: null,
    carMake: null, wheelBrand: null, season: null,
  };

  for (const id of ids) {
    const name = categoryName.get(id);
    if (!name) continue;

    // "Gumiabrocs" is the live site's typo for Gumiabroncs; match it as-is.
    if (name === "Felnik") { f.kind ??= "wheel"; continue; }
    if (name === "Gumiabrocs" || name === "Gumiabroncs") { f.kind ??= "tire"; continue; }
    if (name === "All Products") continue;

    const d = DIAMETER_RE.exec(name);
    if (d) { f.diameterIn ??= Number(d[1]); continue; }

    const b = BOLT_RE.exec(name);
    if (b) { f.boltPattern ??= `${b[1]}x${b[2]}`; continue; }

    if (SEASONS[name]) { f.season ??= SEASONS[name]; continue; }
    if (makeSet.has(name)) { f.carMake ??= name; continue; }
    if (wheelBrandSet.has(name)) { f.wheelBrand ??= name; continue; }
    if (name === "OZ") { f.wheelBrand ??= "OZ Racing"; continue; }
  }
  return f;
}

/* ------------------------------------------------- free-text spec parsing */

/** `9x20 et38` -> width 9, ET 38. Width only; diameter is already known from categories. */
const WIDTH_ET_RE = /(\d{1,2}(?:[.,]\d)?)\s*x\s*(\d{2})\s*(?:et\s*(-?\d{1,2}))?/i;
/** `66-os agy`, `66,6 agy`, `agy: 57.1` -> centre bore in mm. */
const BORE_RE = /(?:agy[:\s]*(\d{2}(?:[.,]\d)?)|(\d{2}(?:[.,]\d)?)\s*-?\s*(?:os|es|ös)?\s*agy)/i;
/** Standalone `et38` / `ET 45` / `et-5` when it is not glued to a width. */
const ET_RE = /\bet\s*(-?\d{1,2})\b/i;
/** `235/55r18` in a tire title. */
const TIRE_SIZE_RE = /(\d{3})\s*\/\s*(\d{2})\s*r\s*(\d{2})/i;

const num = (s: string | undefined) => (s == null ? null : Number(s.replace(",", ".")));

function htmlToText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findBrand(title: string, brands: readonly string[]): string | null {
  const lower = title.toLowerCase();
  // Longest first so "Mercedes AMG" wins over "Mercedes Benz"'s shared prefix.
  for (const b of [...brands].sort((a, z) => z.length - a.length)) {
    if (lower.startsWith(b.toLowerCase())) return b;
  }
  return null;
}

/* ----------------------------------------------------------------- import */

async function main() {
  console.log(`importing ${products.length} products${skipImages ? " (metadata only)" : ""}`);
  const unresolved: string[] = [];
  let created = 0, updated = 0, images = 0;

  for (const [i, p] of products.entries()) {
    const f = facetsFromCategories(p.categoryIds);
    const text = htmlToText(p.description);
    const haystack = `${p.name}\n${text}`;

    // A product with no Felnik/Gumiabrocs category: fall back to the shape of its title.
    const kind = f.kind ?? (TIRE_SIZE_RE.test(p.name) ? "tire" : "wheel");

    const widthEt = WIDTH_ET_RE.exec(text);
    const bore = BORE_RE.exec(text);
    const etOnly = ET_RE.exec(text);
    const tireSize = TIRE_SIZE_RE.exec(p.name);

    // Base the slug on the Wix urlPart, not the title: 150 urlParts are unique whereas
    // 28 titles collide (several sets really are all `Audi 20" 5x112`). It also keeps the
    // 122 unaccented URLs byte-identical to the old site, so those redirects are no-ops.
    const slug = slugify(p.urlPart) || slugify(p.name);

    const row = {
      slug,
      kind,
      title: p.name,
      description: text,
      priceHuf: Math.round(p.price),
      status: (p.isVisible ? "active" : "hidden") as "active" | "hidden",
      quantity: 4,
      condition: /\búj\b|0\s*km/i.test(haystack) ? ("new" as const) : ("used" as const),

      diameterIn: f.diameterIn ?? (tireSize ? Number(tireSize[3]) : null),

      widthIn: kind === "wheel" ? num(widthEt?.[1]) : null,
      boltPattern: kind === "wheel" ? f.boltPattern : null,
      offsetEt: kind === "wheel" ? (num(widthEt?.[3]) ?? num(etOnly?.[1])) : null,
      centreBoreMm: kind === "wheel" ? (num(bore?.[1]) ?? num(bore?.[2])) : null,
      carMake: kind === "wheel" ? (f.carMake ?? findBrand(p.name, CAR_MAKES)) : null,
      wheelBrand: kind === "wheel" ? (f.wheelBrand ?? findBrand(p.name, WHEEL_BRANDS)) : null,

      tireWidthMm: kind === "tire" && tireSize ? Number(tireSize[1]) : null,
      tireAspect: kind === "tire" && tireSize ? Number(tireSize[2]) : null,
      season: kind === "tire" ? f.season : null,
      tireBrand: kind === "tire" ? findBrand(p.name, TIRE_BRANDS) : null,

      legacyWixId: p.id,
      legacySlug: p.urlPart,
      updatedAt: new Date(),
    };

    if (kind === "wheel" && !row.boltPattern) unresolved.push(`${p.name} — no bolt pattern`);
    if (kind === "tire" && !row.season) unresolved.push(`${p.name} — no season`);
    if (!row.diameterIn) unresolved.push(`${p.name} — no diameter`);

    const existing = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.legacySlug, p.urlPart))
      .limit(1);

    let listingId: string;
    if (existing.length) {
      listingId = existing[0].id;
      await db.update(listings).set(row).where(eq(listings.id, listingId));
      await db.delete(listingImages).where(eq(listingImages.listingId, listingId));
      updated++;
    } else {
      const [ins] = await db.insert(listings).values(row).returning({ id: listings.id });
      listingId = ins.id;
      created++;
    }

    if (!skipImages) {
      for (const [pos, m] of p.media.entries()) {
        try {
          const res = await fetch(m.original);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          const stored = await storeImage(buf, slug);
          await db.insert(listingImages).values({
            listingId,
            storageKey: stored.key,
            position: pos,
            width: stored.width,
            height: stored.height,
            alt: p.name,
          });
          images++;
        } catch (e) {
          console.warn(`  ! image failed for ${p.name}: ${(e as Error).message}`);
        }
      }
    }

    if ((i + 1) % 10 === 0 || i === products.length - 1) {
      console.log(`  ${i + 1}/${products.length}  (${images} images)`);
    }
  }

  console.log(`\n${created} created, ${updated} updated, ${images} images stored`);
  if (unresolved.length) {
    console.log(`\n${unresolved.length} field(s) need a human eye:`);
    for (const u of unresolved) console.log(`  - ${u}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

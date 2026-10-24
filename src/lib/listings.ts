import { and, asc, desc, eq, gte, inArray, lte, ne, sql, type SQL } from "drizzle-orm";
import { db, listings, listingImages, type Listing } from "./db";
import { publicUrl } from "./storage";
import { SEASON_LABEL } from "./labels";

export const PAGE_SIZE = 24;

export type Filters = {
  kind?: "wheel" | "tire";
  diameter?: number[];
  boltPattern?: string[];
  carMake?: string[];
  wheelBrand?: string[];
  tireBrand?: string[];
  season?: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  /** Admin-only: include sold/hidden rows, which the public site never shows. */
  includeInactive?: boolean;
};

export type ListingCard = {
  id: string;
  slug: string;
  kind: "wheel" | "tire";
  title: string;
  priceHuf: number;
  status: Listing["status"];
  image: { url: string; width: number; height: number; alt: string } | null;
  specLine: string;
};

/** The one-line spec shown under a card title, e.g. `8x18 ET40 · 5x112` or `235/55 R18 · Téli`. */
export function specLine(l: Listing): string {
  if (l.kind === "tire") {
    const size = l.tireWidthMm && l.tireAspect && l.diameterIn
      ? `${l.tireWidthMm}/${l.tireAspect} R${l.diameterIn}`
      : null;
    const season = l.season ? SEASON_LABEL[l.season] : null;
    return [size, season].filter(Boolean).join(" · ");
  }
  const dims = l.widthIn && l.diameterIn ? `${l.widthIn}x${l.diameterIn}` : null;
  const et = l.offsetEt != null ? `ET${l.offsetEt}` : null;
  return [[dims, et].filter(Boolean).join(" "), l.boltPattern].filter(Boolean).join(" · ");
}

function wheres(f: Filters): SQL[] {
  const w: SQL[] = [];
  if (!f.includeInactive) w.push(ne(listings.status, "hidden"));
  if (f.kind) w.push(eq(listings.kind, f.kind));
  if (f.diameter?.length) w.push(inArray(listings.diameterIn, f.diameter));
  if (f.boltPattern?.length) w.push(inArray(listings.boltPattern, f.boltPattern));
  if (f.carMake?.length) w.push(inArray(listings.carMake, f.carMake));
  if (f.wheelBrand?.length) w.push(inArray(listings.wheelBrand, f.wheelBrand));
  if (f.tireBrand?.length) w.push(inArray(listings.tireBrand, f.tireBrand));
  if (f.season?.length)
    w.push(inArray(listings.season, f.season as ("summer" | "winter" | "all_season")[]));
  if (f.priceMin != null) w.push(gte(listings.priceHuf, f.priceMin));
  if (f.priceMax != null) w.push(lte(listings.priceHuf, f.priceMax));
  return w;
}

function order(sort: Filters["sort"]) {
  if (sort === "price_asc") return [asc(listings.priceHuf)];
  if (sort === "price_desc") return [desc(listings.priceHuf)];
  return [desc(listings.createdAt)];
}

async function attachCovers(rows: Listing[]): Promise<ListingCard[]> {
  if (!rows.length) return [];
  const imgs = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, rows.map((r) => r.id)))
    .orderBy(asc(listingImages.position));

  const cover = new Map<string, (typeof imgs)[number]>();
  for (const img of imgs) if (!cover.has(img.listingId)) cover.set(img.listingId, img);

  return rows.map((l) => {
    const c = cover.get(l.id);
    return {
      id: l.id,
      slug: l.slug,
      kind: l.kind,
      title: l.title,
      priceHuf: l.priceHuf,
      status: l.status,
      specLine: specLine(l),
      image: c
        ? { url: publicUrl(c.storageKey), width: c.width ?? 800, height: c.height ?? 800, alt: c.alt ?? l.title }
        : null,
    };
  });
}

export async function searchListings(f: Filters) {
  const w = wheres(f);
  const page = Math.max(1, f.page ?? 1);
  const where = w.length ? and(...w) : undefined;

  const [rows, counted] = await Promise.all([
    db.select().from(listings).where(where).orderBy(...order(f.sort))
      .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(listings).where(where),
  ]);

  const total = Number(counted[0]?.n ?? 0);
  return {
    items: await attachCovers(rows),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/**
 * Distinct values with counts for one column, respecting every *other* active filter.
 * That is what makes a filter sidebar honest: options that would return nothing disappear.
 */
export async function facetCounts(
  f: Filters,
  column: "diameterIn" | "boltPattern" | "carMake" | "wheelBrand" | "tireBrand" | "season",
) {
  const col = listings[column];
  const without: Filters = { ...f, page: 1 };
  const key = {
    diameterIn: "diameter", boltPattern: "boltPattern", carMake: "carMake",
    wheelBrand: "wheelBrand", tireBrand: "tireBrand", season: "season",
  }[column] as keyof Filters;
  delete without[key];

  const w = wheres(without);
  const rows = await db
    .select({ value: col, n: sql<number>`count(*)::int` })
    .from(listings)
    .where(w.length ? and(...w) : undefined)
    .groupBy(col)
    .orderBy(asc(col));

  return rows
    .filter((r) => r.value != null)
    .map((r) => ({ value: String(r.value), count: Number(r.n) }));
}

export async function priceBounds(f: Filters) {
  const w = wheres({ ...f, priceMin: undefined, priceMax: undefined });
  const [r] = await db
    .select({
      min: sql<number>`coalesce(min(price_huf), 0)::int`,
      max: sql<number>`coalesce(max(price_huf), 0)::int`,
    })
    .from(listings)
    .where(w.length ? and(...w) : undefined);
  return { min: Number(r?.min ?? 0), max: Number(r?.max ?? 0) };
}

export async function getListingBySlug(slug: string) {
  const [l] = await db.select().from(listings).where(eq(listings.slug, slug)).limit(1);
  if (!l) return null;
  const imgs = await db
    .select().from(listingImages)
    .where(eq(listingImages.listingId, l.id))
    .orderBy(asc(listingImages.position));
  return {
    ...l,
    images: imgs.map((i) => ({
      key: i.storageKey,
      url: publicUrl(i.storageKey),
      width: i.width ?? 1000,
      height: i.height ?? 1000,
      alt: i.alt ?? l.title,
    })),
  };
}

/** Old Wix URLs are still indexed; look a listing up by the slug it used to have. */
export async function getListingByLegacySlug(legacySlug: string) {
  const [l] = await db
    .select({ slug: listings.slug, kind: listings.kind })
    .from(listings)
    .where(eq(listings.legacySlug, legacySlug))
    .limit(1);
  return l ?? null;
}

export async function relatedListings(l: Listing, limit = 4): Promise<ListingCard[]> {
  const w: SQL[] = [ne(listings.id, l.id), eq(listings.kind, l.kind), ne(listings.status, "hidden")];
  if (l.kind === "wheel" && l.boltPattern) w.push(eq(listings.boltPattern, l.boltPattern));
  if (l.kind === "tire" && l.diameterIn) w.push(eq(listings.diameterIn, l.diameterIn));
  const rows = await db.select().from(listings).where(and(...w))
    .orderBy(desc(listings.createdAt)).limit(limit);
  return attachCovers(rows);
}

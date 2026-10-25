"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db, listings, listingImages, leads } from "@/lib/db";
import { requireUser, login as doLogin, logout as doLogout } from "@/lib/auth";
import { deleteImage } from "@/lib/storage";
import { slugify } from "@/lib/format";

/* ------------------------------------------------------------------ auth */

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!(await doLogin(email, password))) {
    return { error: "Hibás e-mail cím vagy jelszó." };
  }
  redirect("/admin");
}

export async function logoutAction() {
  await doLogout();
  redirect("/admin/belepes");
}

/* -------------------------------------------------------------- listings */

const num = z.coerce.number().finite().optional().nullable();
const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const ListingSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  kind: z.enum(["wheel", "tire"]),
  title: z.string().trim().min(2, "A cím kötelező."),
  slug: z.string().trim().optional().nullable(),
  description: z.string().trim().default(""),
  priceHuf: z.coerce.number().int().min(0, "Az ár nem lehet negatív."),
  status: z.enum(["active", "reserved", "sold", "hidden"]).default("active"),
  quantity: z.coerce.number().int().min(1).max(20).default(4),
  condition: z.enum(["new", "used"]).default("used"),

  diameterIn: z.preprocess(emptyToNull, num),
  widthIn: z.preprocess(emptyToNull, num),
  boltPattern: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  offsetEt: z.preprocess(emptyToNull, z.coerce.number().int().optional().nullable()),
  centreBoreMm: z.preprocess(emptyToNull, num),
  carMake: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  wheelBrand: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),

  tireWidthMm: z.preprocess(emptyToNull, z.coerce.number().int().optional().nullable()),
  tireAspect: z.preprocess(emptyToNull, z.coerce.number().int().optional().nullable()),
  season: z.preprocess(emptyToNull, z.enum(["summer", "winter", "all_season"]).nullable().optional()),
  tireBrand: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  dotYear: z.preprocess(emptyToNull, z.coerce.number().int().optional().nullable()),
  treadMm: z.preprocess(emptyToNull, num),

  /** JSON array of { key, width, height } in display order, produced by the upload endpoint. */
  images: z.string().default("[]"),
});

const ImagesSchema = z.array(
  z.object({ key: z.string().min(1), width: z.coerce.number(), height: z.coerce.number() }),
);

/** Appends -2, -3 … until the slug is free. Excludes the row being edited. */
async function uniqueSlug(base: string, excludeId?: string | null): Promise<string> {
  const root = slugify(base) || "hirdetes";
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const clash = await db
      .select({ id: listings.id })
      .from(listings)
      .where(excludeId ? and(eq(listings.slug, candidate), ne(listings.id, excludeId)) : eq(listings.slug, candidate))
      .limit(1);
    if (!clash.length) return candidate;
  }
  return `${root}-${Date.now()}`;
}

/** One above the current maximum, so the listing shows first. */
async function topSortOrder(): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`coalesce(max(${listings.sortOrder}), 0)::int` })
    .from(listings);
  return Number(r?.n ?? 0) + 1;
}

export type SaveState = { error?: string };

export async function saveListing(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireUser();

  const parsed = ListingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };
  const d = parsed.data;

  let images: z.infer<typeof ImagesSchema>;
  try {
    images = ImagesSchema.parse(JSON.parse(d.images));
  } catch {
    return { error: "A képek mentése nem sikerült. Töltsd fel őket újra." };
  }

  const isWheel = d.kind === "wheel";
  const slug = await uniqueSlug(d.slug?.trim() || d.title, d.id);

  const row = {
    slug,
    kind: d.kind,
    title: d.title,
    description: d.description ?? "",
    priceHuf: d.priceHuf,
    status: d.status,
    quantity: d.quantity,
    condition: d.condition,
    diameterIn: d.diameterIn ?? null,

    widthIn: isWheel ? (d.widthIn ?? null) : null,
    boltPattern: isWheel ? (d.boltPattern ?? null) : null,
    offsetEt: isWheel ? (d.offsetEt ?? null) : null,
    centreBoreMm: isWheel ? (d.centreBoreMm ?? null) : null,
    carMake: isWheel ? (d.carMake ?? null) : null,
    wheelBrand: isWheel ? (d.wheelBrand ?? null) : null,

    tireWidthMm: !isWheel ? (d.tireWidthMm ?? null) : null,
    tireAspect: !isWheel ? (d.tireAspect ?? null) : null,
    season: !isWheel ? (d.season ?? null) : null,
    tireBrand: !isWheel ? (d.tireBrand ?? null) : null,
    dotYear: !isWheel ? (d.dotYear ?? null) : null,
    treadMm: !isWheel ? (d.treadMm ?? null) : null,

    soldAt: d.status === "sold" ? new Date() : null,
    updatedAt: new Date(),
  };

  let listingId: string;
  if (d.id) {
    listingId = d.id;
    await db.update(listings).set(row).where(eq(listings.id, listingId));
    // Keep the stored files; only the ordering rows are rewritten below.
    await db.delete(listingImages).where(eq(listingImages.listingId, listingId));
  } else {
    const [ins] = await db
      .insert(listings)
      .values({ ...row, sortOrder: await topSortOrder() })
      .returning({ id: listings.id });
    listingId = ins.id;
  }

  if (images.length) {
    await db.insert(listingImages).values(
      images.map((img, position) => ({
        listingId,
        storageKey: img.key,
        position,
        width: img.width,
        height: img.height,
        alt: d.title,
      })),
    );
  }

  revalidatePath("/", "layout");
  redirect(`/admin?mentve=${listingId}`);
}

/** The owner's most frequent action by far, so it is one click from the list view. */
export async function setStatus(id: string, status: "active" | "reserved" | "sold" | "hidden") {
  await requireUser();
  await db
    .update(listings)
    .set({ status, soldAt: status === "sold" ? new Date() : null, updatedAt: new Date() })
    .where(eq(listings.id, id));
  revalidatePath("/", "layout");
}

/**
 * Moves a listing one place up or down, or to the top, of the order the public site shows.
 *
 * "One place" means past the next listing a visitor would actually see it next to: same
 * kind (wheels and tires are separate pages), and sold sets only among sold sets, since
 * those always sort last. Hidden listings are skipped unless the one moving is hidden too,
 * so every click visibly changes the public order.
 */
export async function moveListing(id: string, to: "up" | "down" | "top") {
  await requireUser();

  if (to === "top") {
    await db.update(listings).set({ sortOrder: await topSortOrder() }).where(eq(listings.id, id));
    revalidatePath("/", "layout");
    return;
  }

  const current = () =>
    db
      .select({ kind: listings.kind, status: listings.status, sortOrder: listings.sortOrder })
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1)
      .then((r) => r[0]);

  let cur = await current();
  if (!cur) return;

  // Swapping two equal values would do nothing. Listings created by the importer all start
  // at 0, so spread every value out first, keeping the order they already display in.
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.sortOrder, cur.sortOrder));
  if (Number(n) > 1) {
    await db.execute(sql`
      update ${listings} set sort_order = r.n
      from (select id, row_number() over (order by sort_order, created_at, id) as n from ${listings}) r
      where ${listings.id} = r.id`);
    cur = (await current())!;
  }

  const up = to === "up";
  const [other] = await db
    .select({ id: listings.id, sortOrder: listings.sortOrder })
    .from(listings)
    .where(
      and(
        eq(listings.kind, cur.kind),
        cur.status === "sold" ? eq(listings.status, "sold") : ne(listings.status, "sold"),
        cur.status === "hidden" ? undefined : ne(listings.status, "hidden"),
        up ? gt(listings.sortOrder, cur.sortOrder) : lt(listings.sortOrder, cur.sortOrder),
      ),
    )
    .orderBy(up ? asc(listings.sortOrder) : desc(listings.sortOrder))
    .limit(1);
  if (!other) return; // already first or last

  await db
    .update(listings)
    .set({
      sortOrder: sql`case when ${listings.id} = ${id} then ${other.sortOrder}::int else ${cur.sortOrder}::int end`,
    })
    .where(inArray(listings.id, [id, other.id]));
  revalidatePath("/", "layout");
}

/**
 * Drag and drop: puts a listing directly after `afterId`, or directly before `beforeId`
 * when it was dropped first in the grid. Neighbours rather than an index, because the grid
 * may be showing a filtered subset of all listings.
 *
 * Integers leave no gap between neighbours, so the whole order is rewritten in one
 * statement. That is a few hundred rows at most.
 */
export async function placeListing(id: string, afterId: string | null, beforeId: string | null) {
  await requireUser();

  const all = await db
    .select({ id: listings.id })
    .from(listings)
    .orderBy(desc(listings.sortOrder), desc(listings.createdAt), desc(listings.id));
  const ids = all.map((r) => r.id).filter((x) => x !== id);
  if (ids.length === all.length) return; // no such listing

  const anchor = afterId ?? beforeId;
  const i = anchor ? ids.indexOf(anchor) : -1;
  if (i < 0) return;
  ids.splice(afterId ? i + 1 : i, 0, id);

  const rows = ids.map((x, n) => sql`(${x}::uuid, ${ids.length - n}::int)`);
  await db.execute(sql`
    update ${listings} set sort_order = v.n
    from (values ${sql.join(rows, sql`, `)}) as v(id, n)
    where ${listings.id} = v.id`);
  revalidatePath("/", "layout");
}

export async function deleteListing(id: string) {
  await requireUser();
  const imgs = await db.select().from(listingImages).where(eq(listingImages.listingId, id));

  // Only remove a file if no other listing still points at it (duplicates share a key,
  // because the storage key is a hash of the image contents).
  for (const img of imgs) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(listingImages)
      .where(and(eq(listingImages.storageKey, img.storageKey), ne(listingImages.listingId, id)));
    if (Number(n) === 0) await deleteImage(img.storageKey);
  }

  await db.delete(listings).where(eq(listings.id, id));
  revalidatePath("/", "layout");
  redirect("/admin?torolve=1");
}

/** Clones a listing. Stock arrives in near-identical sets; retyping ten fields is waste. */
export async function duplicateListing(id: string) {
  await requireUser();
  const [src] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!src) redirect("/admin");

  const imgs = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, id))
    .orderBy(listingImages.position);

  const copyFrom = { ...src } as Partial<typeof src>;
  delete copyFrom.id;
  delete copyFrom.createdAt;
  delete copyFrom.updatedAt;

  const [copy] = await db
    .insert(listings)
    .values({
      ...(copyFrom as typeof src),
      title: `${src.title} (másolat)`,
      slug: await uniqueSlug(src.slug),
      sortOrder: await topSortOrder(),
      status: "hidden", // a copy is a draft until the owner says otherwise
      soldAt: null,
      legacyWixId: null,
      legacySlug: null,
    })
    .returning({ id: listings.id });

  if (imgs.length) {
    await db.insert(listingImages).values(
      imgs.map((i) => ({
        listingId: copy.id,
        storageKey: i.storageKey,
        position: i.position,
        width: i.width,
        height: i.height,
        alt: i.alt,
      })),
    );
  }

  redirect(`/admin/${copy.id}`);
}

export async function setLeadHandled(id: string, handled: boolean) {
  await requireUser();
  await db.update(leads).set({ handled }).where(eq(leads.id, id));
  revalidatePath("/admin/erdeklodesek");
}

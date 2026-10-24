import Image from "next/image";
import Link from "next/link";
import { desc, ilike, or, eq, and, type SQL } from "drizzle-orm";
import { db, listings, listingImages } from "@/lib/db";
import { publicUrl } from "@/lib/storage";
import { huf } from "@/lib/format";
import { KIND_LABEL, STATUS_LABEL } from "@/lib/labels";
import { specLine } from "@/lib/listings";
import { StatusControls } from "@/components/admin/status-controls";

type Search = { q?: string; statusz?: string; tipus?: string; mentve?: string; torolve?: string };

export default async function AdminListings({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  const where: SQL[] = [];
  if (sp.q?.trim()) {
    const term = `%${sp.q.trim()}%`;
    where.push(or(ilike(listings.title, term), ilike(listings.slug, term))!);
  }
  if (sp.statusz && sp.statusz in STATUS_LABEL) {
    where.push(eq(listings.status, sp.statusz as keyof typeof STATUS_LABEL));
  }
  if (sp.tipus === "wheel" || sp.tipus === "tire") where.push(eq(listings.kind, sp.tipus));

  const rows = await db
    .select()
    .from(listings)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(listings.updatedAt))
    .limit(200);

  const covers = new Map<string, string>();
  if (rows.length) {
    const imgs = await db.select().from(listingImages).orderBy(listingImages.position);
    for (const img of imgs) if (!covers.has(img.listingId)) covers.set(img.listingId, img.storageKey);
  }

  const counts = {
    all: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    sold: rows.filter((r) => r.status === "sold").length,
  };

  return (
    <div>
      {sp.mentve && <Banner>A hirdetés elmentve.</Banner>}
      {sp.torolve && <Banner>A hirdetés törölve.</Banner>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Hirdetések</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {counts.all} megjelenítve · {counts.active} aktív · {counts.sold} eladva
          </p>
        </div>
        <Link
          href="/admin/uj"
          className="rounded-lg bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark"
        >
          + Új hirdetés
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Keresés cím szerint…"
          className="min-w-52 flex-1 rounded-lg border border-rule px-3.5 py-2.5"
        />
        <select name="tipus" defaultValue={sp.tipus ?? ""} className="rounded-lg border border-rule bg-surface px-3 py-2.5">
          <option value="">Minden típus</option>
          <option value="wheel">Felni</option>
          <option value="tire">Gumi</option>
        </select>
        <select name="statusz" defaultValue={sp.statusz ?? ""} className="rounded-lg border border-rule bg-surface px-3 py-2.5">
          <option value="">Minden státusz</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-ink px-5 py-2.5 font-bold">
          Szűrés
        </button>
      </form>

      <ul className="mt-6 divide-y divide-rule-soft border-y border-rule-soft">
        {rows.map((l) => {
          const cover = covers.get(l.id);
          return (
            <li key={l.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sheet">
                {cover && (
                  <Image src={publicUrl(cover)} alt="" fill sizes="64px" className="object-cover" />
                )}
              </div>

              <div className="min-w-48 flex-1">
                <Link href={`/admin/${l.id}`} className="font-bold hover:text-brand-ink">
                  {l.title}
                </Link>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  {KIND_LABEL[l.kind]} · {specLine(l) || "nincs megadva"}
                </p>
              </div>

              <p className="w-28 shrink-0 font-semibold">{huf(l.priceHuf)}</p>

              <StatusControls id={l.id} status={l.status} />

              <Link
                href={`/admin/${l.id}`}
                className="shrink-0 rounded-lg border border-rule px-4 py-2 text-sm font-bold hover:bg-sheet"
              >
                Szerkesztés
              </Link>
            </li>
          );
        })}
      </ul>

      {!rows.length && (
        <p className="py-16 text-center text-ink-soft">Nincs a keresésnek megfelelő hirdetés.</p>
      )}
    </div>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 font-semibold text-green-800">
      {children}
    </p>
  );
}

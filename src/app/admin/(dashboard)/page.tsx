import Image from "next/image";
import Link from "next/link";
import { desc, ilike, or, eq, and, sql, type SQL } from "drizzle-orm";
import { db, listings, listingImages } from "@/lib/db";
import { publicUrl } from "@/lib/storage";
import { huf } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { specLine } from "@/lib/listings";
import { StatusControls } from "@/components/admin/status-controls";
import { OrderControls } from "@/components/admin/order-controls";

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

  // Both kinds are fetched so each tab can show its count; only the open one is rendered.
  const all = await db
    .select()
    .from(listings)
    .where(where.length ? and(...where) : undefined)
    // The same order the public site uses, so the order buttons do what they show.
    .orderBy(sql`(${listings.status} = 'sold')`, desc(listings.sortOrder), desc(listings.createdAt))
    .limit(500);

  const kind = sp.tipus === "tire" ? "tire" : "wheel";
  const rows = all.filter((r) => r.kind === kind);

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

  const tabHref = (k: "wheel" | "tire") => {
    const p = new URLSearchParams();
    if (k === "tire") p.set("tipus", "tire");
    if (sp.q) p.set("q", sp.q);
    if (sp.statusz) p.set("statusz", sp.statusz);
    return p.size ? `/admin?${p}` : "/admin";
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

      <nav className="mt-6 flex gap-1 border-b border-rule-soft" aria-label="Kategória">
        {(["wheel", "tire"] as const).map((k) => (
          <Link
            key={k}
            href={tabHref(k)}
            aria-current={k === kind ? "page" : undefined}
            className={`-mb-px border-b-2 px-5 py-3 font-bold transition-colors ${
              k === kind
                ? "border-brand text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {k === "wheel" ? "Felnik" : "Gumik"}
            <span className="ml-2 rounded-full bg-sheet px-2 py-0.5 text-xs text-ink-soft">
              {all.filter((r) => r.kind === k).length}
            </span>
          </Link>
        ))}
      </nav>

      <form className="mt-6 flex flex-wrap gap-3">
        {kind === "tire" && <input type="hidden" name="tipus" value="tire" />}
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Keresés cím szerint…"
          className="min-w-52 flex-1 rounded-lg border border-rule px-3.5 py-2.5"
        />
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

      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((l) => {
          const cover = covers.get(l.id);
          const sold = l.status === "sold";
          return (
            <li
              key={l.id}
              className="flex flex-col overflow-hidden rounded-xl border border-rule-soft bg-surface"
            >
              <Link href={`/admin/${l.id}`} className="relative block aspect-square bg-sheet">
                {cover ? (
                  <Image
                    src={publicUrl(cover)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 50vw"
                    className={`object-cover ${sold ? "opacity-45 saturate-0" : ""}`}
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-ink-soft">
                    Nincs kép
                  </span>
                )}
                {l.status !== "active" && (
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white ${
                      sold ? "bg-carbon" : l.status === "hidden" ? "bg-ink-soft" : "bg-brand"
                    }`}
                  >
                    {STATUS_LABEL[l.status]}
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-3 p-3">
                <div className="flex-1">
                  <Link href={`/admin/${l.id}`} className="font-bold leading-snug hover:text-brand-ink">
                    {l.title}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {specLine(l) || "nincs megadva"}
                  </p>
                  <p className="mt-1 font-extrabold">{huf(l.priceHuf)}</p>
                </div>

                <StatusControls id={l.id} status={l.status} />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <OrderControls id={l.id} />
                  <Link
                    href={`/admin/${l.id}`}
                    className="rounded-lg border border-rule px-3 py-2 text-sm font-bold hover:bg-sheet"
                  >
                    Szerkesztés
                  </Link>
                </div>
              </div>
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

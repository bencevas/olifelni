import Image from "next/image";
import Link from "next/link";
import type { ListingCard as Card } from "@/lib/listings";
import { huf } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { SITE } from "@/lib/site";

export function ListingCardView({ item, priority = false }: { item: Card; priority?: boolean }) {
  const href = `/${item.kind === "wheel" ? "felni" : "gumi"}/${item.slug}`;
  const sold = item.status === "sold";

  return (
    <Link href={href} className="group block">
      {/*
        3:4 matches the source photography — 144 of 150 cover shots are portrait phone
        photos. A square card cropped a quarter off the top and bottom of almost every
        wheel.
      */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-sheet ring-1 ring-rule-soft transition-all duration-300 group-hover:shadow-[0_18px_40px_-18px_rgba(13,14,17,0.4)] group-hover:ring-ink/15">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.05] ${
              sold ? "opacity-45 saturate-0" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">
            Nincs kép
          </div>
        )}

        {item.status !== "active" && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ${
              sold ? "bg-carbon" : "bg-brand"
            }`}
          >
            {STATUS_LABEL[item.status]}
          </span>
        )}
      </div>

      <div className="mt-3.5">
        <h3 className="font-display text-[15px] font-bold leading-snug transition-colors group-hover:text-brand">
          {item.title}
        </h3>
        {item.specLine && (
          <p className="mt-1 text-[13px] text-ink-soft tnum">{item.specLine}</p>
        )}
        <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight tnum">
          {huf(item.priceHuf)}
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-rule-soft bg-sheet px-6 py-20 text-center">
      <p className="text-xl font-extrabold">Nincs ilyen szett a készleten</p>
      <p className="mx-auto mt-2.5 max-w-md text-ink-soft">
        Próbálj meg kevesebb szűrőt használni — vagy hívj minket, gyakran van olyan is,
        ami még nincs fenn az oldalon.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="?"
          className="rounded-full border border-ink px-7 py-3 font-bold transition-colors hover:bg-white"
        >
          Szűrők törlése
        </Link>
        <a
          href={SITE.phoneHref}
          className="rounded-full bg-brand px-7 py-3 font-bold text-white transition-colors hover:bg-brand-dark"
        >
          {SITE.phone}
        </a>
      </div>
    </div>
  );
}

export function ListingGrid({ items }: { items: Card[] }) {
  if (!items.length) return <EmptyState />;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <ListingCardView key={item.id} item={item} priority={i < 4} />
      ))}
    </div>
  );
}

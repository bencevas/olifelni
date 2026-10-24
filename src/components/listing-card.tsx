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
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-sheet">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
              sold ? "opacity-50 saturate-50" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">
            Nincs kép
          </div>
        )}

        {item.status !== "active" && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white ${
              sold ? "bg-ink" : "bg-brand"
            }`}
          >
            {STATUS_LABEL[item.status]}
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-[15px] font-bold leading-snug transition-colors group-hover:text-brand">
          {item.title}
        </h3>
        {item.specLine && <p className="mt-0.5 text-[13px] text-ink-soft">{item.specLine}</p>}
        <p className="mt-1 text-[15px] font-semibold">{huf(item.priceHuf)}</p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-bold">Nincs ilyen szett a készleten</p>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Próbálj meg kevesebb szűrőt használni — vagy hívj minket, gyakran van olyan is,
        ami még nincs fenn az oldalon.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="?"
          className="rounded-full border border-ink px-6 py-3 font-bold transition-colors hover:bg-sheet"
        >
          Szűrők törlése
        </Link>
        <a
          href={SITE.phoneHref}
          className="rounded-full bg-brand px-6 py-3 font-bold text-white transition-colors hover:bg-brand-dark"
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <ListingCardView key={item.id} item={item} priority={i < 4} />
      ))}
    </div>
  );
}

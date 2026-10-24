import Image from "next/image";
import Link from "next/link";
import type { ListingCard as Card } from "@/lib/listings";
import { huf } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";

export function ListingCardView({ item, priority = false }: { item: Card; priority?: boolean }) {
  const href = `/${item.kind === "wheel" ? "felni" : "gumi"}/${item.slug}`;
  const sold = item.status === "sold";

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-sheet">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              sold ? "opacity-55" : ""
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
        <h3 className="text-[15px] font-bold leading-snug group-hover:text-brand">{item.title}</h3>
        {item.specLine && <p className="mt-0.5 text-[13px] text-ink-soft">{item.specLine}</p>}
        <p className="mt-1 text-[15px] font-semibold">{huf(item.priceHuf)}</p>
      </div>
    </Link>
  );
}

export function ListingGrid({ items }: { items: Card[] }) {
  if (!items.length) {
    return (
      <p className="py-20 text-center text-ink-soft">
        Nincs a szűrésnek megfelelő találat. Próbálj meg kevesebb szűrőt használni.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <ListingCardView key={item.id} item={item} priority={i < 4} />
      ))}
    </div>
  );
}

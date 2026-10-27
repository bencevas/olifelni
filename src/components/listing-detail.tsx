import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingGallery } from "./listing-gallery";
import { ListingGrid } from "./listing-card";
import { LeadForm } from "./lead-form";
import { getListingBySlug, relatedListings } from "@/lib/listings";
import { huf } from "@/lib/format";
import { SEASON_LABEL, STATUS_LABEL } from "@/lib/labels";
import { SITE } from "@/lib/site";

type Row = NonNullable<Awaited<ReturnType<typeof getListingBySlug>>>;

/** Only the specs that are actually filled in — an empty row reads as missing data. */
function specs(l: Row): [string, string][] {
  const out: [string, string][] = [];
  const push = (k: string, v: string | number | null | undefined, suffix = "") => {
    if (v !== null && v !== undefined && v !== "") out.push([k, `${v}${suffix}`]);
  };

  if (l.kind === "wheel") {
    push("Átmérő", l.diameterIn, '"');
    push("Szélesség", l.widthIn, "J");
    push("Osztókör", l.boltPattern);
    push("ET", l.offsetEt);
    push("Agyfurat", l.centreBoreMm, " mm");
    push("Autó márka", l.carMake);
    push("Felni gyártó", l.wheelBrand);
  } else {
    if (l.tireWidthMm && l.tireAspect && l.diameterIn) {
      out.push(["Méret", `${l.tireWidthMm}/${l.tireAspect} R${l.diameterIn}`]);
    }
    push("Évszak", l.season ? SEASON_LABEL[l.season] : null);
    push("Gyártó", l.tireBrand);
    push("Profilmélység", l.treadMm, " mm");
    push("DOT év", l.dotYear);
  }

  return out;
}

export async function ListingDetail({ slug, kind }: { slug: string; kind: "wheel" | "tire" }) {
  const listing = await getListingBySlug(slug);
  if (!listing || listing.kind !== kind || listing.status === "hidden") notFound();

  const related = await relatedListings(listing);
  const rows = specs(listing);
  const available = listing.status === "active";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <nav aria-label="Morzsamenü" className="mb-6 text-sm text-ink-soft">
        <Link href="/" className="hover:text-brand-ink">Főoldal</Link>
        <span className="mx-2">/</span>
        <Link href={kind === "wheel" ? "/felnik" : "/gumik"} className="hover:text-brand-ink">
          {kind === "wheel" ? "Felnik" : "Gumiabroncsok"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{listing.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ListingGallery images={listing.images} />

        <div>
          {!available && (
            <p className="mb-4 inline-block rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-surface">
              {STATUS_LABEL[listing.status]}
            </p>
          )}

          <h1 className="text-3xl font-extrabold sm:text-[2.6rem] sm:leading-[1.08]">
            {listing.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-display text-3xl font-extrabold tracking-tight tnum sm:text-4xl">
              {huf(listing.priceHuf)}
            </p>
            {available && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sheet px-3 py-1 text-[13px] font-semibold text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Készleten
              </span>
            )}
          </div>

          {rows.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-x-8 border-y border-rule-soft py-5 text-[15px]">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-rule-soft/60 py-2 last:border-0">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="text-right font-semibold tnum">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {listing.description && (
            <div className="prose-plain mt-6 text-[15px] text-ink-soft">{listing.description}</div>
          )}
        </div>
      </div>

      {/*
        Full width under both columns. Squeezed into the info column the form had to stack
        every field, which made the right column far taller than the gallery; across the
        full width the name and phone sit side by side and the whole block is shorter.
        The old site had no call to action at all — this is the point of the page.
      */}
      <section className="mt-12 rounded-2xl border border-rule-soft bg-sheet p-6 sm:p-8 lg:mt-16 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              {available ? "Érdekel ez a szett?" : "Hasonlót keresel?"}
            </h2>
            <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
              Hívj minket, vagy küldj üzenetet és visszakeresünk. A legtöbb kérdésre
              telefonon tudunk a leggyorsabban válaszolni.
            </p>
            <a
              href={SITE.phoneHref}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-brand-dark sm:w-auto sm:px-10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"
                  fill="currentColor"
                />
              </svg>
              {SITE.phone}
            </a>
            <dl className="mt-8 space-y-3 border-t border-rule pt-6 text-[14px]">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-soft">Átvétel</dt>
                <dd className="font-semibold">{SITE.address}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-soft">Szállítás</dt>
                <dd className="font-semibold">Országos, futárral vagy személyesen</dd>
              </div>
            </dl>
          </div>

          <div className="lg:border-l lg:border-rule lg:pl-14">
            <LeadForm listingId={listing.id} listingTitle={listing.title} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-7 border-b border-rule-soft pb-4 text-2xl font-extrabold sm:text-3xl">Hasonló hirdetések</h2>
          <ListingGrid items={related} />
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: listing.title,
            description: listing.description || undefined,
            image: listing.images.map((i) => i.url),
            offers: {
              "@type": "Offer",
              priceCurrency: "HUF",
              price: String(listing.priceHuf),
              availability: available
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: SITE.name },
            },
          }),
        }}
      />
    </div>
  );
}

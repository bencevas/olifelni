import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingGallery } from "./listing-gallery";
import { ListingGrid } from "./listing-card";
import { LeadForm } from "./lead-form";
import { getListingBySlug, relatedListings } from "@/lib/listings";
import { huf } from "@/lib/format";
import { CONDITION_LABEL, SEASON_LABEL, STATUS_LABEL } from "@/lib/labels";
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
    push("Beállítás (ET)", l.offsetEt);
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

  push("Darabszám", l.quantity, " db");
  push("Állapot", CONDITION_LABEL[l.condition]);
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
        <Link href="/" className="hover:text-brand">Főoldal</Link>
        <span className="mx-2">/</span>
        <Link href={kind === "wheel" ? "/felnik" : "/gumik"} className="hover:text-brand">
          {kind === "wheel" ? "Felnik" : "Gumiabroncsok"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{listing.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ListingGallery images={listing.images} />

        <div>
          {!available && (
            <p className="mb-4 inline-block rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-white">
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

          {/* The old site had no call to action at all — this is the whole point of the page. */}
          <div className="mt-9 rounded-2xl border border-rule-soft bg-sheet p-5 sm:p-6">
            <p className="text-lg font-extrabold">
              {available ? "Érdekel ez a szett?" : "Hasonlót keresel?"}
            </p>
            <p className="mt-1 text-[15px] text-ink-soft">
              Hívj minket, vagy küldj üzenetet és visszakeresünk.
            </p>
            <a
              href={SITE.phoneHref}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-brand-dark"
            >
              {SITE.phone}
            </a>
            <div className="mt-5 border-t border-rule pt-5">
              <LeadForm listingId={listing.id} listingTitle={listing.title} compact />
            </div>
          </div>
        </div>
      </div>

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

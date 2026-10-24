import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { LeadForm } from "@/components/lead-form";
import { QuickFind } from "@/components/quick-find";
import { BrowseChips, type Chip } from "@/components/browse-chips";
import { facetCounts, searchListings } from "@/lib/listings";
import { PARAM } from "@/lib/search-params";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const wheelFilter = { kind: "wheel" as const };

  const [wheels, tires, makes, diameters, bolts] = await Promise.all([
    searchListings({ kind: "wheel", sort: "newest", page: 1 }),
    searchListings({ kind: "tire", sort: "newest", page: 1 }),
    facetCounts(wheelFilter, "carMake"),
    facetCounts(wheelFilter, "diameterIn"),
    facetCounts(wheelFilter, "boltPattern"),
  ]);

  const diameterOptions = [...diameters]
    .sort((a, z) => Number(a.value) - Number(z.value))
    .map((o) => ({ ...o, label: `${Number(o.value)}"` }));

  const makeChips: Chip[] = [...makes]
    .sort((a, z) => z.count - a.count)
    .slice(0, 10)
    .map((o) => ({
      href: `/felnik?${PARAM.carMake}=${encodeURIComponent(o.value)}`,
      label: o.value,
      count: o.count,
    }));

  const sizeChips: Chip[] = diameterOptions.map((o) => ({
    href: `/felnik?${PARAM.diameter}=${o.value}`,
    label: o.label,
    count: o.count,
  }));

  return (
    <>
      <section className="border-b border-rule-soft bg-sheet">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:grid lg:grid-cols-[1fr_minmax(0,400px)] lg:items-center lg:gap-14 lg:py-16">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Gyári alufelnik és gumiabroncsok,
              <span className="text-brand"> jó áron.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Komplett szettek 13-tól 22 colig. Országos szállítás, személyes átvétel
              Szegeden.
            </p>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5 text-[15px] font-semibold">
              <Fact>{wheels.total + tires.total} szett készleten</Fact>
              <Fact>Országos szállítás</Fact>
              <Fact>Beszámítás lehetséges</Fact>
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/felnik"
                className="rounded-full bg-brand px-7 py-3.5 text-center font-bold text-white transition-colors hover:bg-brand-dark"
              >
                Felnik böngészése
              </Link>
              <a
                href={SITE.phoneHref}
                className="rounded-full border border-ink px-7 py-3.5 text-center font-bold transition-colors hover:bg-white"
              >
                {SITE.phone}
              </a>
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <QuickFind
              makes={makes.map((o) => ({ ...o, label: o.value }))}
              diameters={diameterOptions}
              bolts={bolts.map((o) => ({ ...o, label: o.value }))}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <BrowseChips title="Népszerű márkák" chips={makeChips} />
        <BrowseChips title="Átmérő szerint" chips={sizeChips} />
      </section>

      <Section title="Legújabb felnik" href="/felnik" linkLabel={`Mind a ${wheels.total} felni`}>
        <ListingGrid items={wheels.items.slice(0, 8)} />
      </Section>

      <Section title="Gumiabroncsok" href="/gumik" linkLabel={`Mind a ${tires.total} gumi`}>
        <ListingGrid items={tires.items.slice(0, 4)} />
      </Section>

      {/* The red shipping block, carried over from the current site. */}
      <section className="mt-20 bg-brand text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Szállítás</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-extrabold">1. Személyes átadás</h3>
              <p className="mt-3 leading-relaxed text-white/90">
                Országszerte, heti rendszerességgel szállítunk felniket és gumikat
                ügyfeleinkkel egyeztetett időpontban és helyszínen. Amennyiben felpróbálnád,
                személyesen megtekintenéd, vagy beszámíttatnád meglévő felnidet, a személyes
                átadás lehet a legjobb megoldás.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-extrabold">2. Futárszolgálat</h3>
              <p className="mt-3 leading-relaxed text-white/90">
                Ha nem tudsz várni a következő szállításra, futárral is feladjuk a csomagot.
                A szállítási díjról és a várható időpontról telefonon egyeztetünk.
              </p>
              <a
                href={SITE.phoneHref}
                className="mt-6 inline-block rounded-full bg-white px-7 py-3.5 font-bold text-brand transition-opacity hover:opacity-90"
              >
                {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="kapcsolat" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Kérdésed van?</h2>
            <p className="mt-3 max-w-md text-ink-soft">
              Írj nekünk, és egy munkanapon belül válaszolunk. Ha sürgős, hívj bátran.
            </p>
            <dl className="mt-8 space-y-4 text-[15px]">
              <div>
                <dt className="font-bold">Telefon</dt>
                <dd>
                  <a className="text-brand hover:underline" href={SITE.phoneHref}>
                    {SITE.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-bold">E-mail</dt>
                <dd>
                  <a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>
                    {SITE.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-bold">Cím</dt>
                <dd className="text-ink-soft">{SITE.address}</dd>
              </div>
            </dl>
          </div>
          <LeadForm />
        </div>
      </section>
    </>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-brand" aria-hidden>
        <path
          d="M4 10.5l4 4 8-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </li>
  );
}

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="mb-7 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        <Link href={href} className="shrink-0 text-sm font-bold text-brand hover:underline">
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

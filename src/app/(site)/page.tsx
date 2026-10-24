import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { LeadForm } from "@/components/lead-form";
import { searchListings } from "@/lib/listings";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [wheels, tires] = await Promise.all([
    searchListings({ kind: "wheel", sort: "newest", page: 1 }),
    searchListings({ kind: "tire", sort: "newest", page: 1 }),
  ]);

  return (
    <>
      <section className="border-b border-rule-soft bg-sheet">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Gyári alufelnik és gumiabroncsok,<br className="hidden sm:block" />
            <span className="text-brand"> jó áron.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Komplett szettek 13-tól 22 colig. Országos szállítás, személyes átvétel Szegeden.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/felnik" className="rounded-full bg-brand px-7 py-3.5 text-center font-bold text-white transition-colors hover:bg-brand-dark">
              Felnik böngészése
            </Link>
            <Link href="/gumik" className="rounded-full border border-ink px-7 py-3.5 text-center font-bold transition-colors hover:bg-white">
              Gumiabroncsok
            </Link>
          </div>
        </div>
      </section>

      <Section
        title="Összes felni / komplett szett"
        href="/felnik"
        linkLabel={`Mind a ${wheels.total} felni`}
      >
        <ListingGrid items={wheels.items.slice(0, 8)} />
      </Section>

      <Section
        title="Gumiabroncsok"
        href="/gumik"
        linkLabel={`Mind a ${tires.total} gumi`}
      >
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
                Országszerte, heti rendszerességgel szállítunk felniket és gumikat ügyfeleinkkel
                egyeztetett időpontban és helyszínen. Amennyiben felpróbálnád, személyesen
                megtekintenéd, vagy beszámíttatnád meglévő felnidet, a személyes átadás lehet a
                legjobb megoldás.
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
                <dd><a className="text-brand hover:underline" href={SITE.phoneHref}>{SITE.phone}</a></dd>
              </div>
              <div>
                <dt className="font-bold">E-mail</dt>
                <dd><a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></dd>
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
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
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

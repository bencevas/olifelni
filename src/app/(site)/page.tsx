import Image from "next/image";
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
      <section className="relative isolate overflow-hidden bg-carbon">
        <Image
          src="/hero-garage.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_58%]"
        />
        {/* Mobile text runs the full width, so it needs a flat scrim; on wider screens the
            gradient clears the right half and leaves the wheels visible. */}
        <div className="absolute inset-0 bg-carbon/75 sm:hidden" aria-hidden />
        <div
          className="absolute inset-0 hidden sm:block sm:bg-gradient-to-r sm:from-carbon sm:via-carbon/88 sm:to-carbon/20"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-carbon to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:pb-32 lg:pt-28">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
              <span className="h-px w-7 bg-brand" aria-hidden />
              Alufelni &amp; gumiabroncs · Szeged
            </p>

            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.03] text-white sm:text-6xl lg:text-[4.1rem]">
              Gyári alufelnik
              <br />
              <span className="text-brand">jó áron.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
              Komplett szettek 13-tól 22 colig, téli és nyári gumikkal. Országos
              szállítás, személyes átvétel Szegeden.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/felnik"
                className="rounded-full bg-brand px-8 py-4 text-center font-bold text-white transition-colors hover:bg-brand-dark"
              >
                Felnik böngészése
              </Link>
              <a
                href={SITE.phoneHref}
                className="rounded-full border border-white/30 px-8 py-4 text-center font-bold text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-carbon"
              >
                {SITE.phone}
              </a>
            </div>

            <dl className="mt-11 grid grid-cols-3 gap-4 border-t border-white/15 pt-7 sm:flex sm:gap-x-12">
              <Stat value={`${wheels.total + tires.total}`} label="szett készleten" />
              <Stat value="13–22″" label="átmérő" />
              <Stat value="Országos" label="szállítás" />
            </dl>
          </div>
        </div>
      </section>

      {/* Lifted over the hero's edge: the search is the main action, so it should not be
          something you scroll to find. */}
      <div className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:-mt-14">
        <QuickFind
          makes={makes.map((o) => ({ ...o, label: o.value }))}
          diameters={diameterOptions}
          bolts={bolts.map((o) => ({ ...o, label: o.value }))}
        />
      </div>

      <section className="mx-auto max-w-7xl space-y-7 px-4 py-14 sm:px-6">
        <BrowseChips title="Népszerű márkák" chips={makeChips} />
        <BrowseChips title="Átmérő szerint" chips={sizeChips} />
      </section>

      <Section title="Legújabb felnik" href="/felnik" linkLabel={`Mind a ${wheels.total} felni`}>
        <ListingGrid items={wheels.items.slice(0, 8)} />
      </Section>

      <Section title="Gumiabroncsok" href="/gumik" linkLabel={`Mind a ${tires.total} gumi`}>
        <ListingGrid items={tires.items.slice(0, 4)} />
      </Section>

      <section className="mt-24 bg-carbon text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.18em] text-white/60">
            <span className="h-px w-7 bg-brand" aria-hidden />
            Átvétel
          </p>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Hogyan jut el hozzád?</h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-carbon-line bg-carbon-line md:grid-cols-2">
            <Delivery
              n="01"
              title="Személyes átadás"
              body="Országszerte, heti rendszerességgel szállítunk felniket és gumikat ügyfeleinkkel egyeztetett időpontban és helyszínen. Amennyiben felpróbálnád, személyesen megtekintenéd, vagy beszámíttatnád meglévő felnidet, a személyes átadás lehet a legjobb megoldás."
            />
            <Delivery
              n="02"
              title="Futárszolgálat"
              body="Ha nem tudsz várni a következő szállításra, futárral is feladjuk a csomagot. A szállítási díjról és a várható időpontról telefonon egyeztetünk."
            />
          </div>

          <a
            href={SITE.phoneHref}
            className="mt-10 inline-flex rounded-full bg-brand px-8 py-4 font-bold text-white transition-colors hover:bg-brand-dark"
          >
            Egyeztetek telefonon — {SITE.phone}
          </a>
        </div>
      </section>

      <section id="kapcsolat" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Kérdésed van?</h2>
            <p className="mt-3 max-w-md text-lg text-ink-soft">
              Írj nekünk, és egy munkanapon belül válaszolunk. Ha sürgős, hívj bátran.
            </p>
            <dl className="mt-9 space-y-5">
              <Contact label="Telefon">
                <a className="text-lg font-bold text-brand hover:underline" href={SITE.phoneHref}>
                  {SITE.phone}
                </a>
              </Contact>
              <Contact label="E-mail">
                <a className="font-semibold hover:text-brand" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </Contact>
              <Contact label="Cím">
                <a
                  className="font-semibold hover:text-brand"
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {SITE.address}
                </a>
              </Contact>
            </dl>
          </div>

          <div className="rounded-2xl border border-rule-soft bg-sheet p-6 sm:p-8">
            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-[1.4rem] font-extrabold tracking-tight text-white tnum sm:text-3xl">
          {value}
        </span>
        <span className="mt-0.5 block text-[13px] text-white/60 sm:text-sm">{label}</span>
      </dd>
    </div>
  );
}

function Delivery({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-carbon p-7 sm:p-9">
      <span className="font-display text-sm font-extrabold tracking-widest text-brand tnum">{n}</span>
      <h3 className="mt-3 text-xl font-extrabold">{title}</h3>
      <p className="mt-3 leading-relaxed text-white/65">{body}</p>
    </div>
  );
}

function Contact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-rule-soft pb-4 last:border-0">
      <dt className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-soft">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
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
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-rule-soft pb-4">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        <Link
          href={href}
          className="shrink-0 text-sm font-bold text-brand transition-opacity hover:opacity-70"
        >
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

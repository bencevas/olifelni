import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Elérhetőség",
  description: `Keress minket telefonon a ${SITE.phone} számon, vagy írj a ${SITE.email} címre. Címünk: ${SITE.address}.`,
};

export default function ContactPage() {
  return (
    <>
      <header className="bg-carbon text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.18em] text-white/55">
            <span className="h-px w-7 bg-brand" aria-hidden />
            Kapcsolat
          </p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Elérhetőség</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-white/65">
            Hívj minket, vagy írj üzenetet és egy munkanapon belül válaszolunk.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <a
              href={SITE.phoneHref}
              className="flex items-center justify-between gap-4 rounded-2xl bg-brand px-6 py-5 text-white transition-colors hover:bg-brand-dark"
            >
              <span>
                <span className="block text-[12px] font-bold uppercase tracking-[0.14em] text-white/70">
                  Hívj minket
                </span>
                <span className="mt-1 block font-display text-2xl font-extrabold tnum">
                  {SITE.phone}
                </span>
              </span>
              <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden>
                <path
                  d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"
                  fill="currentColor"
                />
              </svg>
            </a>

            <dl className="mt-8">
              <Row label="E-mail">
                <a href={`mailto:${SITE.email}`} className="font-semibold hover:text-brand-ink">
                  {SITE.email}
                </a>
              </Row>
              <Row label="Cím">
                <a
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold hover:text-brand-ink"
                >
                  {SITE.address}
                </a>
              </Row>
              <Row label="Cégnév">
                <span className="font-semibold">{SITE.legalName}</span>
              </Row>
            </dl>

            <div className="mt-8 overflow-hidden rounded-2xl border border-rule-soft">
              <iframe
                title="Térkép"
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-rule-soft bg-sheet p-6 sm:p-8">
            <h2 className="text-xl font-extrabold">Írj nekünk</h2>
            <p className="mt-1.5 text-[15px] text-ink-soft">
              Egy munkanapon belül visszakeresünk.
            </p>
            <div className="mt-6">
              <LeadForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-rule-soft py-4 first:border-t">
      <dt className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-soft">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}

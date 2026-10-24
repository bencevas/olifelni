import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Elérhetőség",
  description: `Keress minket telefonon a ${SITE.phone} számon, vagy írj a ${SITE.email} címre. Címünk: ${SITE.address}.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Elérhetőség</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Hívj minket, vagy írj üzenetet és egy munkanapon belül válaszolunk.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <div>
          <dl className="space-y-6 text-[15px]">
            <div>
              <dt className="font-bold">Telefon</dt>
              <dd className="mt-1">
                <a href={SITE.phoneHref} className="text-xl font-bold text-brand hover:underline">
                  {SITE.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">E-mail</dt>
              <dd className="mt-1">
                <a href={`mailto:${SITE.email}`} className="text-brand hover:underline">
                  {SITE.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">Cím</dt>
              <dd className="mt-1 text-ink-soft">
                <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-brand">
                  {SITE.address}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">Cégnév</dt>
              <dd className="mt-1 text-ink-soft">{SITE.legalName}</dd>
            </div>
          </dl>

          <div className="mt-8 overflow-hidden rounded-xl border border-rule-soft">
            <iframe
              title="Térkép"
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-rule bg-sheet p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Írj nekünk</h2>
          <div className="mt-4">
            <LeadForm />
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-carbon text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          {/* The logo's wordmark is black and would disappear here, so this is set in type. */}
          <p className="font-display text-2xl font-extrabold tracking-tight">
            OLI<span className="text-brand-ink">FELNI</span>
          </p>
          <p className="mt-3 max-w-xs leading-relaxed text-white/60">{SITE.tagline}</p>
          <a
            href={SITE.phoneHref}
            className="mt-6 inline-flex rounded-full bg-brand px-6 py-3 font-bold text-white transition-colors hover:bg-brand-dark"
          >
            {SITE.phone}
          </a>
        </div>

        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/45">
            Elérhetőség
          </p>
          <ul className="mt-4 space-y-2.5 text-white/70">
            <li>
              <a className="transition-colors hover:text-white" href={SITE.phoneHref}>
                {SITE.phone}
              </a>
            </li>
            <li>
              <a className="transition-colors hover:text-white" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                className="transition-colors hover:text-white"
                href={SITE.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                {SITE.address}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/45">Oldalak</p>
          <ul className="mt-4 space-y-2.5 text-white/70">
            {NAV.map((i) => (
              <li key={i.href}>
                <Link className="transition-colors hover:text-white" href={i.href}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-carbon-line">
        <p className="mx-auto max-w-7xl px-4 pb-24 pt-6 text-center text-sm text-white/45 sm:px-6 lg:pb-6">
          <span className="font-semibold text-white/70">{SITE.legalName}</span> — Minden jog
          fenntartva{" "}
          {/* The Wix footer was hardcoded to 2024 and went stale. */}
          {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

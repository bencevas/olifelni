import Link from "next/link";
import { NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-rule-soft bg-sheet">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold">{SITE.name}</p>
          <p className="mt-2 text-sm text-ink-soft">{SITE.tagline}</p>
        </div>

        <div className="text-sm">
          <p className="font-bold">Elérhetőség</p>
          <ul className="mt-2 space-y-1.5 text-ink-soft">
            <li><a className="hover:text-brand" href={SITE.phoneHref}>{SITE.phone}</a></li>
            <li><a className="hover:text-brand" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li>{SITE.address}</li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-bold">Oldalak</p>
          <ul className="mt-2 space-y-1.5 text-ink-soft">
            {NAV.map((i) => (
              <li key={i.href}>
                <Link className="hover:text-brand" href={i.href}>{i.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-rule-soft">
        <p className="mx-auto max-w-7xl px-4 pb-24 pt-5 text-center text-sm text-ink-soft sm:px-6 lg:pb-5">
          <span className="font-bold text-ink">{SITE.legalName}</span> — Minden jog fenntartva{" "}
          {/* The Wix footer was hardcoded to 2024 and went stale. */}
          {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

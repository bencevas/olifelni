import Link from "next/link";
import { SITE } from "@/lib/site";

/**
 * Shared 404 body. Rendered by both the root not-found (unmatched URLs) and the site
 * group's not-found (a notFound() call inside a page, e.g. an unknown listing slug).
 */
export function NotFoundContent() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:py-28">
      <p className="font-display text-7xl font-extrabold tracking-tight text-brand-ink tnum">404</p>
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
        Ez az oldal nem található
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        Lehet, hogy a hirdetés már elkelt, vagy elírás van a címben. Nézd meg a
        kínálatunkat, vagy hívj minket.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/felnik"
          className="rounded-full bg-brand px-7 py-3.5 font-bold text-white transition-colors hover:bg-brand-dark"
        >
          Felnik
        </Link>
        <Link
          href="/gumik"
          className="rounded-full border border-ink px-7 py-3.5 font-bold transition-colors hover:bg-sheet"
        >
          Gumiabroncsok
        </Link>
        <a
          href={SITE.phoneHref}
          className="rounded-full border border-rule px-7 py-3.5 font-bold text-ink-soft transition-colors hover:bg-sheet"
        >
          {SITE.phone}
        </a>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";
import { NAV, SITE } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-rule-soft bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20">
        {/* Mobile: a spacer keeps the logo optically centred against the menu button. */}
        <span className="w-10 lg:hidden" aria-hidden />

        <Link href="/" onClick={close} className="lg:mr-10" aria-label={`${SITE.name} — főoldal`}>
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center justify-end gap-10 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`text-[15px] font-bold transition-colors hover:text-brand ${
                isActive(item.href) ? "text-brand" : "text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={SITE.phoneHref}
            className="rounded-full bg-brand px-5 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
          >
            {SITE.phone}
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
          className="-mr-2 flex h-10 w-10 items-center justify-center lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
            {open ? (
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-rule-soft bg-white lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`block border-b border-rule-soft py-4 text-lg font-bold last:border-0 ${
                  isActive(item.href) ? "text-brand" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={SITE.phoneHref}
              onClick={close}
              className="my-4 block rounded-full bg-brand px-5 py-3.5 text-center text-lg font-bold text-white"
            >
              {SITE.phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

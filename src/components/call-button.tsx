import { SITE } from "@/lib/site";

/**
 * Floating call button, mobile only.
 *
 * The business runs on phone calls, but the header number scrolls out of view and the
 * contact form sits at the very bottom of a long catalogue. This keeps the primary action
 * one tap away wherever someone has got to.
 */
export function CallButton() {
  return (
    <a
      href={SITE.phoneHref}
      className="fixed bottom-5 right-4 z-30 flex items-center gap-2 rounded-full bg-brand py-3.5 pl-4 pr-5 font-bold text-white shadow-lg shadow-black/20 transition-colors hover:bg-brand-dark lg:hidden"
      aria-label={`Hívás: ${SITE.phone}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"
          fill="currentColor"
        />
      </svg>
      Hívás
    </a>
  );
}

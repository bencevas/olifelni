"use client";

/**
 * Light/dark switch. Untouched, the site follows the operating system; once this is
 * used the choice is pinned in localStorage and the system preference is ignored.
 *
 * Which icon shows is decided in CSS, not React state. The theme is applied before
 * hydration, so a state-driven icon would render empty on first paint and pop in later.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing can refuse storage; the toggle still works for this page view.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Téma váltása"
      title="Téma váltása"
      className={`flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sheet hover:text-ink ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 dark:hidden" aria-hidden>
        <path
          d="M20.1 14.6A8.4 8.4 0 019.4 3.9a8.6 8.6 0 102.3 16.8 8.6 8.6 0 008.4-6.1z"
          fill="currentColor"
        />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 dark:block" aria-hidden>
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2.6v2.1M12 19.3v2.1M4.2 12H2.1M21.9 12h-2.1M6.3 6.3L4.8 4.8M19.2 19.2l-1.5-1.5M17.7 6.3l1.5-1.5M4.8 19.2l1.5-1.5" />
        </g>
      </svg>
    </button>
  );
}

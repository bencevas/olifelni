/**
 * Stand-in for the OF Felni wordmark: a red rim ring plus the lettering, in the site's
 * red/black. Swap in the real asset by dropping it at public/logo.svg and replacing this.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 40 40" aria-hidden className="h-9 w-9 shrink-0">
        <circle cx="20" cy="20" r="18" fill="none" stroke="var(--color-brand)" strokeWidth="3.5" />
        <circle cx="20" cy="20" r="10.5" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="3" fill="var(--color-ink)" />
        {[0, 72, 144, 216, 288].map((deg) => (
          <rect
            key={deg}
            x="19.1"
            y="7.5"
            width="1.8"
            height="8"
            rx="0.9"
            fill="var(--color-ink)"
            transform={`rotate(${deg} 20 20)`}
          />
        ))}
      </svg>
      <span className="text-xl font-extrabold tracking-tight">
        <span className="text-brand">OF</span> FELNI
      </span>
    </span>
  );
}

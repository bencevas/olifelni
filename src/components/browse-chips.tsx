import Link from "next/link";

export type Chip = { href: string; label: string; count: number };

/** Fast entry points. The old Wix site had 75 category links because this is how people shop. */
export function BrowseChips({ title, chips }: { title: string; chips: Chip[] }) {
  if (!chips.length) return null;
  return (
    <div>
      <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">{title}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="inline-flex items-baseline gap-1.5 rounded-full border border-rule bg-white px-4 py-2 text-[14px] font-semibold transition-colors hover:border-ink hover:bg-sheet"
            >
              {c.label}
              <span className="text-[12px] font-normal text-ink-soft">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

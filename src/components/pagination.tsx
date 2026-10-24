import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  baseParams,
}: {
  page: number;
  pageCount: number;
  baseParams: URLSearchParams;
}) {
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(baseParams);
    if (p === 1) sp.delete("oldal");
    else sp.set("oldal", String(p));
    const q = sp.toString();
    return q ? `?${q}` : "?";
  };

  // Always show first, last, current and its neighbours; gaps become an ellipsis.
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);

  const out: (number | "gap")[] = [];
  for (const [i, p] of pages.entries()) {
    if (i > 0 && p - (pages[i - 1] as number) > 1) out.push("gap");
    out.push(p);
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Lapozás">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" aria-label="Előző oldal"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-sheet">
          ‹
        </Link>
      )}
      {out.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1.5 text-ink-soft">…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm font-bold ${
              p === page ? "bg-brand text-white" : "text-ink hover:bg-sheet"
            }`}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link href={href(page + 1)} rel="next" aria-label="Következő oldal"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-sheet">
          ›
        </Link>
      )}
    </nav>
  );
}

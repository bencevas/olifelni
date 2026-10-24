"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { huf } from "@/lib/format";

export type ChipDef = { param: string; value: string; label: string };

/**
 * Shows what is currently filtered, as removable chips.
 *
 * With five facet groups collapsed in the sidebar it is easy to lose track of what is
 * applied — and removing one meant finding and reopening the right accordion.
 */
export function ActiveFilters({
  chips,
  priceMin,
  priceMax,
}: {
  chips: ChipDef[];
  priceMin?: number;
  priceMax?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, start] = useTransition();

  const hasPrice = priceMin != null || priceMax != null;
  if (!chips.length && !hasPrice) return null;

  const go = (mutate: (sp: URLSearchParams) => void) => {
    const sp = new URLSearchParams(params.toString());
    mutate(sp);
    sp.delete("oldal");
    start(() => router.push(sp.toString() ? `?${sp}` : "?", { scroll: false }));
  };

  const removeValue = (param: string, value: string) =>
    go((sp) => {
      const rest = sp.getAll(param).filter((v) => v !== value);
      sp.delete(param);
      for (const v of rest) sp.append(param, v);
    });

  const clearAll = () =>
    go((sp) => {
      for (const c of chips) sp.delete(c.param);
      sp.delete("ar_min");
      sp.delete("ar_max");
    });

  const priceLabel =
    priceMin != null && priceMax != null
      ? `${huf(priceMin)} – ${huf(priceMax)}`
      : priceMin != null
        ? `${huf(priceMin)} felett`
        : `${huf(priceMax!)} alatt`;

  return (
    <ul className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <li key={`${c.param}-${c.value}`}>
          <Chip label={c.label} onRemove={() => removeValue(c.param, c.value)} />
        </li>
      ))}

      {hasPrice && (
        <li>
          <Chip
            label={priceLabel}
            onRemove={() =>
              go((sp) => {
                sp.delete("ar_min");
                sp.delete("ar_max");
              })
            }
          />
        </li>
      )}

      <li>
        <button
          type="button"
          onClick={clearAll}
          className="px-2 py-1 text-[13px] font-semibold text-ink-soft underline-offset-2 hover:text-brand-ink hover:underline"
        >
          Összes szűrő törlése
        </button>
      </li>
    </ul>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-sheet py-1.5 pl-3.5 pr-1.5 text-[13px] font-semibold">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} szűrő eltávolítása`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-brand-ink"
      >
        <svg viewBox="0 0 14 14" className="h-3 w-3" aria-hidden>
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

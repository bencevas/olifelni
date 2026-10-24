"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { huf } from "@/lib/format";

export type FacetGroup = {
  /** URL query key, Hungarian so the links read naturally. */
  param: string;
  label: string;
  options: { value: string; label: string; count: number }[];
};

export function Filters({
  groups,
  priceBounds,
}: {
  groups: FacetGroup[];
  priceBounds: { min: number; max: number };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const selected = (param: string) => params.getAll(param);

  const activeCount =
    groups.reduce((n, g) => n + selected(g.param).length, 0) +
    (params.get("ar_min") || params.get("ar_max") ? 1 : 0);

  function update(mutate: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(params.toString());
    mutate(sp);
    sp.delete("oldal"); // any filter change invalidates the current page number
    startTransition(() => router.push(sp.toString() ? `?${sp}` : "?", { scroll: false }));
  }

  const toggle = (param: string, value: string) =>
    update((sp) => {
      const current = sp.getAll(param);
      sp.delete(param);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of next) sp.append(param, v);
    });

  const clearAll = () =>
    update((sp) => {
      for (const g of groups) sp.delete(g.param);
      sp.delete("ar_min");
      sp.delete("ar_max");
    });

  const body = (
    <div className="divide-y divide-rule-soft">
      {groups
        .filter((g) => g.options.length > 0)
        .map((g) => (
          <FilterGroup
            key={g.param}
            group={g}
            selected={selected(g.param)}
            onToggle={(v) => toggle(g.param, v)}
          />
        ))}

      <PriceFilter
        bounds={priceBounds}
        min={params.get("ar_min")}
        max={params.get("ar_max")}
        onApply={(min, max) =>
          update((sp) => {
            if (min) sp.set("ar_min", String(min));
            else sp.delete("ar_min");
            if (max) sp.set("ar_max", String(max));
            else sp.delete("ar_max");
          })
        }
      />
    </div>
  );

  return (
    <>
      {/* Mobile: the live site uses a single "Szűrő" button opening a sheet. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-rule py-3 text-[15px] font-bold"
        >
          Szűrő
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">{activeCount}</span>
          )}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-rule-soft px-4 py-4">
              <p className="text-lg font-extrabold">Szűrő</p>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Bezárás" className="h-9 w-9">
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4">{body}</div>

            <div className="flex gap-3 border-t border-rule-soft p-4">
              <button type="button" onClick={clearAll} className="flex-1 rounded-lg border border-rule py-3 font-bold">
                Törlés
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-brand py-3 font-bold text-white"
              >
                Találatok mutatása
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-extrabold">Szűrés</h2>
          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="text-sm text-brand hover:underline">
              Törlés
            </button>
          )}
        </div>
        <div className="mt-3 border-t border-rule">{body}</div>
      </aside>
    </>
  );
}

function FilterGroup({
  group,
  selected,
  onToggle,
}: {
  group: FacetGroup;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(selected.length > 0);

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3.5 text-left text-[15px] font-semibold"
      >
        <span>
          {group.label}
          {selected.length > 0 && <span className="ml-2 text-sm text-brand">({selected.length})</span>}
        </span>
        <span className="text-xl leading-none text-ink-soft">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <ul className="pb-3">
          {group.options.map((o) => (
            <li key={o.value}>
              <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[15px]">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => onToggle(o.value)}
                  className="h-4 w-4 accent-[var(--color-brand)]"
                />
                <span className="flex-1">{o.label}</span>
                <span className="text-[13px] text-ink-soft">{o.count}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PriceFilter({
  bounds,
  min,
  max,
  onApply,
}: {
  bounds: { min: number; max: number };
  min: string | null;
  max: string | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const [open, setOpen] = useState(Boolean(min || max));
  const [lo, setLo] = useState(min ?? "");
  const [hi, setHi] = useState(max ?? "");

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3.5 text-left text-[15px] font-semibold"
      >
        Ár
        <span className="text-xl leading-none text-ink-soft">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="pb-4">
          <p className="mb-2 text-[13px] text-ink-soft">
            {huf(bounds.min)} – {huf(bounds.max)}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" inputMode="numeric" value={lo} onChange={(e) => setLo(e.target.value)}
              placeholder={String(bounds.min)} aria-label="Minimum ár"
              className="w-full rounded border border-rule px-2 py-1.5 text-sm"
            />
            <span className="text-ink-soft">–</span>
            <input
              type="number" inputMode="numeric" value={hi} onChange={(e) => setHi(e.target.value)}
              placeholder={String(bounds.max)} aria-label="Maximum ár"
              className="w-full rounded border border-rule px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => onApply(lo ? Number(lo) : null, hi ? Number(hi) : null)}
            className="mt-2.5 w-full rounded border border-rule py-1.5 text-sm font-bold hover:bg-sheet"
          >
            Alkalmaz
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PARAM } from "@/lib/search-params";

const OPTIONS = [
  { value: "newest", label: "Legújabb" },
  { value: "price_asc", label: "Ár szerint növekvő" },
  { value: "price_desc", label: "Ár szerint csökkenő" },
];

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2.5 text-sm">
      <span className="sr-only sm:not-sr-only sm:text-ink-soft">Rendezés</span>
      <div className="relative">
        <select
          value={params.get(PARAM.sort) ?? "newest"}
          onChange={(e) => {
            const sp = new URLSearchParams(params.toString());
            if (e.target.value === "newest") sp.delete(PARAM.sort);
            else sp.set(PARAM.sort, e.target.value);
            sp.delete(PARAM.page);
            router.push(sp.toString() ? `?${sp}` : "?", { scroll: false });
          }}
          className="h-10 appearance-none rounded-lg border border-rule bg-surface pl-3 pr-9 text-sm font-semibold transition-colors hover:border-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          aria-hidden
        >
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}

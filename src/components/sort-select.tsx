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
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only sm:not-sr-only sm:text-ink-soft">Rendezés</span>
      <select
        value={params.get(PARAM.sort) ?? "newest"}
        onChange={(e) => {
          const sp = new URLSearchParams(params.toString());
          if (e.target.value === "newest") sp.delete(PARAM.sort);
          else sp.set(PARAM.sort, e.target.value);
          sp.delete(PARAM.page);
          router.push(sp.toString() ? `?${sp}` : "?", { scroll: false });
        }}
        className="rounded border border-rule bg-white px-2.5 py-1.5 text-sm font-semibold"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

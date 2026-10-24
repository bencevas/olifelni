"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PARAM } from "@/lib/search-params";

export type Option = { value: string; label: string; count: number };

/**
 * Hero search. A wheel buyer knows their car, their rim size or their bolt pattern, and
 * previously had to land on /felnik, open the right accordion and tick a box to use any of
 * them. This deep-links straight into the filtered catalogue.
 *
 * Counts are shown next to each option so nothing leads to an empty result.
 */
export function QuickFind({
  makes,
  diameters,
  bolts,
}: {
  makes: Option[];
  diameters: Option[];
  bolts: Option[];
}) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [diameter, setDiameter] = useState("");
  const [bolt, setBolt] = useState("");
  const [pending, setPending] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (make) sp.set(PARAM.carMake, make);
    if (diameter) sp.set(PARAM.diameter, diameter);
    if (bolt) sp.set(PARAM.boltPattern, bolt);
    setPending(true);
    router.push(sp.toString() ? `/felnik?${sp}` : "/felnik");
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-rule-soft bg-white p-5 shadow-[0_20px_60px_-24px_rgba(13,14,17,0.55)] sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-extrabold">Keresd meg a felnid</h2>
        <p className="hidden text-[13px] text-ink-soft sm:block">
          Elég egy mezőt kitölteni
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end lg:gap-4">
        <Field label="Autó márka" value={make} onChange={setMake} options={makes} />
        <Field label="Átmérő" value={diameter} onChange={setDiameter} options={diameters} />
        <Field label="Osztókör" value={bolt} onChange={setBolt} options={bolts} />

        <button
          type="submit"
          disabled={pending}
          className="h-[50px] rounded-xl bg-brand px-8 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:col-span-2 lg:col-span-1"
        >
          {pending ? "Keresés…" : "Mutasd"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-[50px] w-full appearance-none rounded-xl border border-rule bg-white pl-3.5 pr-10 text-[15px] font-semibold transition-colors hover:border-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Mindegy</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.count})
            </option>
          ))}
        </select>
        {/* appearance-none drops the native arrow, so the control needs its own. */}
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          aria-hidden
        >
          <path
            d="M5 8l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}

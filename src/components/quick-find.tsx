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

  const field =
    "w-full appearance-none rounded-lg border border-rule bg-white px-3.5 py-3 text-[15px] font-semibold focus:border-brand focus:outline-none";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-rule-soft bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-extrabold">Keresd meg a felnid</h2>
      <p className="mt-1 text-[13px] text-ink-soft">
        Elég egy mezőt kitölteni — a többit szűkítheted a találati oldalon.
      </p>

      <div className="mt-4 space-y-3">
        <Select label="Autó márka" value={make} onChange={setMake} options={makes} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Átmérő" value={diameter} onChange={setDiameter} options={diameters} />
          <Select label="Osztókör" value={bolt} onChange={setBolt} options={bolts} />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-brand px-6 py-3.5 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Keresés…" : "Mutasd a felniket"}
      </button>

      <p className="mt-3 text-center text-[13px] text-ink-soft">
        Nem találod? <span className="font-semibold text-ink">Hívj minket</span>, és
        megkeressük.
      </p>
    </form>
  );

  function Select({
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
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={field}
          aria-label={label}
        >
          <option value="">Mindegy</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.count})
            </option>
          ))}
        </select>
      </label>
    );
  }
}

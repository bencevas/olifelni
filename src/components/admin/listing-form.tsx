"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { PhotoUploader, type UploadedImage } from "./photo-uploader";
import { saveListing, type SaveState } from "@/app/admin/actions";
import { huf, slugify } from "@/lib/format";
import {
  BOLT_PATTERNS, CAR_MAKES, DIAMETERS, SEASON_LABEL,
  STATUS_LABEL, TIRE_BRANDS, WHEEL_BRANDS,
} from "@/lib/labels";

export type ListingFormValues = {
  id?: string;
  kind: "wheel" | "tire";
  title: string;
  slug?: string;
  description: string;
  priceHuf: number | "";
  status: "active" | "reserved" | "sold" | "hidden";
  diameterIn: string;
  widthIn: string;
  boltPattern: string;
  offsetEt: string;
  centreBoreMm: string;
  carMake: string;
  wheelBrand: string;
  tireWidthMm: string;
  tireAspect: string;
  season: string;
  tireBrand: string;
  dotYear: string;
  treadMm: string;
  images: UploadedImage[];
};

export const EMPTY_LISTING: ListingFormValues = {
  kind: "wheel", title: "", description: "", priceHuf: "", status: "active",
  diameterIn: "", widthIn: "", boltPattern: "",
  offsetEt: "", centreBoreMm: "", carMake: "", wheelBrand: "", tireWidthMm: "",
  tireAspect: "", season: "", tireBrand: "", dotYear: "", treadMm: "", images: [],
};

/**
 * Builds the title from the specs, following the naming the shop already uses:
 * `Audi 20" 5x112` for wheels, `Nexen 235/55r18 téli` for tires.
 * The owner can always override it; the override is kept once they type.
 */
function autoTitle(v: ListingFormValues): string {
  if (v.kind === "wheel") {
    const brand = v.carMake || v.wheelBrand;
    const size = v.diameterIn ? `${v.diameterIn}"` : "";
    return [brand, size, v.boltPattern].filter(Boolean).join(" ");
  }
  const size =
    v.tireWidthMm && v.tireAspect && v.diameterIn
      ? `${v.tireWidthMm}/${v.tireAspect}r${v.diameterIn}`
      : "";
  const season = v.season ? SEASON_LABEL[v.season as keyof typeof SEASON_LABEL].toLowerCase() : "";
  return [v.tireBrand, size, season].filter(Boolean).join(" ");
}

export function ListingForm({ initial }: { initial: ListingFormValues }) {
  const [v, setV] = useState(initial);
  const [titleTouched, setTitleTouched] = useState(Boolean(initial.title));
  const [state, action] = useActionState<SaveState, FormData>(saveListing, {});

  const set = <K extends keyof ListingFormValues>(k: K, value: ListingFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: value }));

  const suggested = useMemo(() => autoTitle(v), [v]);
  const title = titleTouched ? v.title : suggested;
  const isWheel = v.kind === "wheel";

  return (
    <form action={action} className="pb-28">
      <input type="hidden" name="id" value={v.id ?? ""} />
      <input type="hidden" name="kind" value={v.kind} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="images" value={JSON.stringify(
        v.images.map((i) => ({ key: i.key, width: i.width, height: i.height })),
      )} />

      {/* 1 — what is it? This decides which spec fields make sense below. */}
      <Step n={1} title="Mit hirdetsz?">
        <div className="grid max-w-md grid-cols-2 gap-3">
          {(["wheel", "tire"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => set("kind", k)}
              aria-pressed={v.kind === k}
              className={`rounded-xl border-2 px-4 py-5 text-lg font-bold transition-colors ${
                v.kind === k ? "border-brand bg-brand/5 text-brand-ink" : "border-rule hover:border-ink"
              }`}
            >
              {k === "wheel" ? "Felni" : "Gumi"}
            </button>
          ))}
        </div>
      </Step>

      {/* 2 — photos. The slowest step, so it comes before the typing. */}
      <Step n={2} title="Fényképek">
        <PhotoUploader
          value={v.images}
          onChange={(images) => set("images", images)}
          hint={slugify(title) || v.kind}
        />
      </Step>

      {/* 3 — specs, as closed lists wherever a closed list exists. */}
      <Step n={3} title={isWheel ? "Felni adatok" : "Gumi adatok"}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isWheel ? (
            <>
              <Select label="Átmérő" name="diameterIn" required value={v.diameterIn} onChange={(x) => set("diameterIn", x)}
                options={DIAMETERS.map((d) => ({ value: String(d), label: `${d}"` }))} />
              <Select label="Osztókör" name="boltPattern" required value={v.boltPattern} onChange={(x) => set("boltPattern", x)}
                options={BOLT_PATTERNS.map((b) => ({ value: b, label: b }))} />
              <Select label="Autó márka" name="carMake" value={v.carMake} onChange={(x) => set("carMake", x)}
                options={CAR_MAKES.map((m) => ({ value: m, label: m }))} />
              <Select label="Felni gyártó" name="wheelBrand" value={v.wheelBrand} onChange={(x) => set("wheelBrand", x)}
                options={WHEEL_BRANDS.map((m) => ({ value: m, label: m }))} />
              <Field label="Szélesség (J)" name="widthIn" value={v.widthIn} onChange={(x) => set("widthIn", x)}
                type="number" step="0.5" placeholder="8" hint="Pl. 8 vagy 8.5" />
              <Field label="ET" name="offsetEt" value={v.offsetEt} onChange={(x) => set("offsetEt", x)}
                type="number" placeholder="38" />
              <Field label="Agyfurat (mm)" name="centreBoreMm" value={v.centreBoreMm}
                onChange={(x) => set("centreBoreMm", x)} type="number" step="0.1" placeholder="66.6"
                hint="Ha nem tudod, hagyd üresen" />
            </>
          ) : (
            <>
              <Field label="Szélesség (mm)" name="tireWidthMm" value={v.tireWidthMm}
                onChange={(x) => set("tireWidthMm", x)} type="number" placeholder="235" required />
              <Field label="Profil (%)" name="tireAspect" value={v.tireAspect}
                onChange={(x) => set("tireAspect", x)} type="number" placeholder="55" required />
              <Select label="Átmérő" name="diameterIn" required value={v.diameterIn} onChange={(x) => set("diameterIn", x)}
                options={DIAMETERS.map((d) => ({ value: String(d), label: `${d}"` }))} />
              <Select label="Évszak" name="season" required value={v.season} onChange={(x) => set("season", x)}
                options={Object.entries(SEASON_LABEL).map(([value, label]) => ({ value, label }))} />
              <Select label="Gyártó" name="tireBrand" value={v.tireBrand} onChange={(x) => set("tireBrand", x)}
                options={TIRE_BRANDS.map((m) => ({ value: m, label: m }))} />
              <Field label="Profilmélység (mm)" name="treadMm" value={v.treadMm}
                onChange={(x) => set("treadMm", x)} type="number" step="0.5" placeholder="7" />
              <Field label="DOT év" name="dotYear" value={v.dotYear} onChange={(x) => set("dotYear", x)}
                type="number" placeholder="2024" />
            </>
          )}
        </div>
      </Step>

      {/* 4 — title, price, text. */}
      <Step n={4} title="Cím és ár">
        <div className="space-y-5">
          <label className="block max-w-2xl">
            <span className="mb-1.5 block font-semibold">Hirdetés címe</span>
            <input
              value={title}
              onChange={(e) => { setTitleTouched(true); set("title", e.target.value); }}
              className="w-full rounded-lg border border-rule px-3.5 py-3 text-lg focus:border-brand focus:outline-none"
              placeholder="Pl. Audi 20&quot; 5x112"
            />
            {!titleTouched && suggested && (
              <span className="mt-1.5 block text-[13px] text-ink-soft">
                A címet az adatokból állítottuk össze. Írd át, ha mást szeretnél.
              </span>
            )}
            {titleTouched && suggested && suggested !== v.title && (
              <button
                type="button"
                onClick={() => { setTitleTouched(false); set("title", ""); }}
                className="mt-1.5 text-[13px] text-brand-ink hover:underline"
              >
                Vissza az automatikus címre: „{suggested}”
              </button>
            )}
          </label>

          <label className="block max-w-xs">
            <span className="mb-1.5 block font-semibold">Ár (Ft)</span>
            <input
              name="priceHuf"
              type="number"
              inputMode="numeric"
              required
              value={v.priceHuf}
              onChange={(e) => set("priceHuf", e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-rule px-3.5 py-3 text-lg focus:border-brand focus:outline-none"
              placeholder="330000"
            />
            {v.priceHuf !== "" && (
              <span className="mt-1.5 block text-[13px] text-ink-soft">
                Így jelenik meg: <strong>{huf(Number(v.priceHuf))}</strong>
              </span>
            )}
          </label>

          <label className="block max-w-2xl">
            <span className="mb-1.5 block font-semibold">Leírás</span>
            <textarea
              name="description"
              rows={8}
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-lg border border-rule px-3.5 py-3 focus:border-brand focus:outline-none"
              placeholder={"Eladó gyári alufelni szett...\n\n9x20 et38\n66-os agy\n\nSérülés és javítás mentesek"}
            />
            <span className="mt-1.5 block text-[13px] text-ink-soft">
              Sima szöveg. A sortörések úgy jelennek meg, ahogy beírod.
            </span>
          </label>
        </div>
      </Step>

      <Step n={5} title="Megjelenés">
        <Select
          label="Státusz"
          name="status"
          value={v.status}
          onChange={(x) => set("status", x as ListingFormValues["status"])}
          options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          allowEmpty={false}
          hint="A rejtett hirdetést csak te látod. Az eladott megmarad, de jelöljük rajta."
        />
      </Step>

      {/* Sticky save bar: on a phone the form is long and the button must always be reachable. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="rounded-lg border border-rule px-5 py-3 font-bold">
            Mégse
          </Link>
          {state.error && (
            <p role="alert" className="flex-1 text-sm font-semibold text-brand-ink">{state.error}</p>
          )}
          <SaveButton isNew={!v.id} />
        </div>
      </div>
    </form>
  );
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="ml-auto rounded-lg bg-brand px-8 py-3 font-bold text-white disabled:opacity-60"
    >
      {pending ? "Mentés…" : isNew ? "Hirdetés létrehozása" : "Mentés"}
    </button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-rule-soft py-8 first:pt-4">
      <h2 className="mb-5 flex items-center gap-3 text-xl font-extrabold">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-surface">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label, name, value, onChange, type = "text", placeholder, hint, step, required,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; step?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-semibold">
        {label} {required && <span className="text-brand-ink">*</span>}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-rule px-3.5 py-2.5 focus:border-brand focus:outline-none"
      />
      {hint && <span className="mt-1 block text-[13px] text-ink-soft">{hint}</span>}
    </label>
  );
}

function Select({
  label, name, value, onChange, options, hint, allowEmpty = true, required,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string; allowEmpty?: boolean; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-semibold">
        {label} {required && <span className="text-brand-ink">*</span>}
      </span>
      <select
        name={name}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-rule bg-surface px-3.5 py-2.5 focus:border-brand focus:outline-none"
      >
        {allowEmpty && <option value="">— válassz —</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-[13px] text-ink-soft">{hint}</span>}
    </label>
  );
}

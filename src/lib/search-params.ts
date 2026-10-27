import type { Filters } from "./listings";

/** Query keys are Hungarian so shared links read naturally: /felnik?atmero=18&marka=Audi */
export const PARAM = {
  diameter: "atmero",
  boltPattern: "osztokor",
  carMake: "marka",
  tireBrand: "gumimarka",
  season: "evszak",
  priceMin: "ar_min",
  priceMax: "ar_max",
  sort: "rendezes",
  page: "oldal",
} as const;

export type RawParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

const int = (v: string | string[] | undefined): number | undefined => {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export function toSearchParams(raw: RawParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) for (const item of list(v)) sp.append(k, item);
  return sp;
}

export function parseFilters(raw: RawParams, kind: "wheel" | "tire"): Filters {
  const rawSort = raw[PARAM.sort];
  const sortRaw = Array.isArray(rawSort) ? rawSort[0] : rawSort;
  const sort =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "newest"
      ? sortRaw
      : "featured";

  return {
    kind,
    diameter: list(raw[PARAM.diameter]).map(Number).filter(Number.isFinite),
    boltPattern: list(raw[PARAM.boltPattern]),
    carMake: list(raw[PARAM.carMake]),
    tireBrand: list(raw[PARAM.tireBrand]),
    season: list(raw[PARAM.season]),
    priceMin: int(raw[PARAM.priceMin]),
    priceMax: int(raw[PARAM.priceMax]),
    sort,
    page: int(raw[PARAM.page]) ?? 1,
  };
}

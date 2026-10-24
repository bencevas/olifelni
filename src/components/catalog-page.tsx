import { Suspense } from "react";
import { ListingGrid } from "./listing-card";
import { Filters, type FacetGroup } from "./filters";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";
import { ActiveFilters, type ChipDef } from "./active-filters";
import { ListingGridSkeleton } from "./listing-skeleton";
import { facetCounts, priceBounds, searchListings, type Filters as F } from "@/lib/listings";
import { PARAM, parseFilters, toSearchParams, type RawParams } from "@/lib/search-params";
import { SEASON_LABEL } from "@/lib/labels";

export async function CatalogPage({
  kind,
  title,
  intro,
  raw,
}: {
  kind: "wheel" | "tire";
  title: string;
  intro?: string;
  raw: RawParams;
}) {
  const filters = parseFilters(raw, kind);

  const [bounds, diameters, bolts, makes, wheelBrands, tireBrands, seasons] = await Promise.all([
    priceBounds(filters),
    facetCounts(filters, "diameterIn"),
    kind === "wheel" ? facetCounts(filters, "boltPattern") : [],
    kind === "wheel" ? facetCounts(filters, "carMake") : [],
    kind === "wheel" ? facetCounts(filters, "wheelBrand") : [],
    kind === "tire" ? facetCounts(filters, "tireBrand") : [],
    kind === "tire" ? facetCounts(filters, "season") : [],
  ]);

  const groups: FacetGroup[] = [
    {
      param: PARAM.diameter,
      label: "Átmérő",
      // Numeric sort: a text sort puts 20" before 9".
      options: [...diameters]
        .sort((a, z) => Number(a.value) - Number(z.value))
        .map((o) => ({ ...o, label: `${Number(o.value)}"` })),
    },
    ...(kind === "wheel"
      ? [
          { param: PARAM.boltPattern, label: "Osztókör", options: bolts.map((o) => ({ ...o, label: o.value })) },
          { param: PARAM.carMake, label: "Márka", options: makes.map((o) => ({ ...o, label: o.value })) },
          { param: PARAM.wheelBrand, label: "Felni gyártó", options: wheelBrands.map((o) => ({ ...o, label: o.value })) },
        ]
      : [
          {
            param: PARAM.season,
            label: "Évszak",
            options: seasons.map((o) => ({
              ...o,
              label: SEASON_LABEL[o.value as keyof typeof SEASON_LABEL] ?? o.value,
            })),
          },
          { param: PARAM.tireBrand, label: "Gyártó", options: tireBrands.map((o) => ({ ...o, label: o.value })) },
        ]),
  ];

  /**
   * Chips mirror the sidebar's labels, so "18" reads as 18" and "winter" as Téli.
   *
   * A selected value can be absent from its own facet list when another filter rules it
   * out — Porsche plus 13", say — so there is a fallback for the two params whose raw
   * query value is not presentable. Resolved here on the server: ChipDef carries plain
   * strings, and a formatter function could not cross into the client component.
   */
  const fallbackLabel = (param: string, value: string): string => {
    if (param === PARAM.diameter) return `${Number(value)}"`;
    if (param === PARAM.season) return SEASON_LABEL[value as keyof typeof SEASON_LABEL] ?? value;
    return value;
  };

  const chips: ChipDef[] = groups.flatMap((g) => {
    const raws = raw[g.param];
    const selected = raws == null ? [] : Array.isArray(raws) ? raws : [raws];
    return selected.map((value) => ({
      param: g.param,
      value,
      label: g.options.find((o) => o.value === value)?.label ?? fallbackLabel(g.param, value),
    }));
  });

  const sp = toSearchParams(raw);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-ink-soft">{intro}</p>}
      </header>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <Filters groups={groups} priceBounds={bounds} />

        <div className="mt-6 lg:mt-0">
          <ActiveFilters chips={chips} priceMin={filters.priceMin} priceMax={filters.priceMax} />

          {/*
            Keyed on the query string so a filter change remounts the boundary and shows the
            skeleton while the server re-queries, instead of leaving the old results sitting
            there looking interactive.
          */}
          <Suspense key={sp.toString()} fallback={<ResultsSkeleton />}>
            <Results filters={filters} sp={sp} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Results({ filters, sp }: { filters: F; sp: URLSearchParams }) {
  const result = await searchListings(filters);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-rule-soft pb-4">
        <p className="text-sm text-ink-soft">
          <span className="font-bold text-ink">{result.total}</span> találat
        </p>
        <SortSelect />
      </div>

      <ListingGrid items={result.items} />
      <Pagination page={result.page} pageCount={result.pageCount} baseParams={sp} />
    </>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-rule-soft pb-4">
        <div className="h-4 w-24 animate-pulse rounded bg-sheet" />
        <div className="h-8 w-40 animate-pulse rounded bg-sheet" />
      </div>
      <ListingGridSkeleton />
    </>
  );
}

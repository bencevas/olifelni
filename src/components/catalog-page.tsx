import { ListingGrid } from "./listing-card";
import { Filters, type FacetGroup } from "./filters";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";
import { facetCounts, priceBounds, searchListings } from "@/lib/listings";
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

  const [result, bounds, diameters, bolts, makes, wheelBrands, tireBrands, seasons] =
    await Promise.all([
      searchListings(filters),
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

  const sp = toSearchParams(raw);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-ink-soft">{intro}</p>}
      </header>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <Filters groups={groups} priceBounds={bounds} total={result.total} />

        <div className="mt-6 lg:mt-0">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-rule-soft pb-4">
            <p className="text-sm text-ink-soft">
              <span className="font-bold text-ink">{result.total}</span> találat
            </p>
            <SortSelect />
          </div>

          <ListingGrid items={result.items} />
          <Pagination page={result.page} pageCount={result.pageCount} baseParams={sp} />
        </div>
      </div>
    </div>
  );
}

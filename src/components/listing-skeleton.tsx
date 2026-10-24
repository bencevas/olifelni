/** Placeholder grid shown while a filter change is fetched, so the page never goes blank. */
export function ListingGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Találatok betöltése"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-lg bg-sheet" />
          <div className="mt-3 h-4 w-4/5 rounded bg-sheet" />
          <div className="mt-2 h-3 w-3/5 rounded bg-sheet" />
          <div className="mt-2 h-4 w-2/5 rounded bg-sheet" />
        </div>
      ))}
    </div>
  );
}

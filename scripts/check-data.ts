/**
 * Data-quality report over the imported catalog.
 *
 *   npm run db:check
 *
 * The importer derives facets from Wix categories and regexes the rest out of free text.
 * This prints what landed and, more importantly, what is still missing — so gaps get fixed
 * in the admin UI rather than silently becoming wrong filter results.
 */
import { db, listings } from "../src/lib/db";
import { huf } from "../src/lib/format";

type Row = typeof listings.$inferSelect;
const missing = (rows: Row[], f: keyof Row) => rows.filter((r) => r[f] == null).length;

function bar(label: string, have: number, total: number) {
  const pct = total === 0 ? 0 : Math.round((have / total) * 100);
  const filled = Math.round(pct / 5);
  return `  ${label.padEnd(16)} ${"█".repeat(filled)}${"·".repeat(20 - filled)} ${String(pct).padStart(3)}%  (${have}/${total})`;
}

async function main() {
  const all = await db.select().from(listings);
  const wheels = all.filter((l) => l.kind === "wheel");
  const tires = all.filter((l) => l.kind === "tire");

  console.log(`\n${all.length} listings — ${wheels.length} felni, ${tires.length} gumi`);
  console.log(
    `price range: ${huf(Math.min(...all.map((l) => l.priceHuf)))} – ${huf(Math.max(...all.map((l) => l.priceHuf)))}\n`,
  );

  console.log("FELNI field coverage");
  for (const f of ["diameterIn", "boltPattern", "widthIn", "offsetEt", "centreBoreMm", "carMake"] as const) {
    console.log(bar(f, wheels.length - missing(wheels, f), wheels.length));
  }

  console.log("\nGUMI field coverage");
  for (const f of ["diameterIn", "tireWidthMm", "tireAspect", "season", "tireBrand"] as const) {
    console.log(bar(f, tires.length - missing(tires, f), tires.length));
  }

  const gaps: string[] = [];
  for (const l of wheels) {
    const m = (["diameterIn", "boltPattern", "widthIn", "offsetEt", "centreBoreMm", "carMake"] as const)
      .filter((f) => l[f] == null);
    if (m.length) gaps.push(`  ${l.title.padEnd(28)} /${l.slug}  hiányzik: ${m.join(", ")}`);
  }
  for (const l of tires) {
    const m = (["diameterIn", "tireWidthMm", "tireAspect", "season", "tireBrand"] as const)
      .filter((f) => l[f] == null);
    if (m.length) gaps.push(`  ${l.title.padEnd(28)} /${l.slug}  hiányzik: ${m.join(", ")}`);
  }

  console.log(`\n${gaps.length} listing(s) with at least one empty spec:`);
  for (const g of gaps) console.log(g);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

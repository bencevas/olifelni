import Link from "next/link";
import { and, desc, gte, like, notLike, or, sql } from "drizzle-orm";
import { db, leads, listings, pageViews } from "@/lib/db";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const TZ = "Europe/Budapest";
/**
 * Inlined rather than bound: Postgres matches a GROUP BY expression to the SELECT one by
 * its text, and two separate $n parameters never count as the same expression.
 */
const tz = sql.raw(`'${TZ}'`);
const nf = new Intl.NumberFormat("hu-HU");

/** Midnight in Budapest, `days - 1` days ago — so "7 nap" is today plus the six before. */
const since = (days: number) =>
  sql`(date_trunc('day', now() at time zone ${tz}) - make_interval(days => ${days - 1})) at time zone ${tz}`;
const day = sql<string>`to_char(${pageViews.createdAt} at time zone ${tz}, 'YYYY-MM-DD')`;
/** A visitor id is only stable for one day, so a "visitor" is a (day, id) pair. */
const visitorDays = sql<number>`count(distinct (${day} || ${pageViews.visitor}))::int`;
const views = sql<number>`count(*)::int`;

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ nap?: string }> }) {
  const sp = await searchParams;
  const range: Range = RANGES.find((r) => String(r) === sp.nap) ?? 30;
  const inRange = gte(pageViews.createdAt, since(range));
  const isListing = or(like(pageViews.path, "/felni/%"), like(pageViews.path, "/gumi/%"));

  const [daily, [enquiries], topListings, topPages, referrers, [device]] = await Promise.all([
    db.select({ day, views, visitors: sql<number>`count(distinct ${pageViews.visitor})::int` })
      .from(pageViews).where(inRange).groupBy(day),

    db.select({ n: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, since(range))),

    db.select({ path: pageViews.path, title: listings.title, views, visitors: visitorDays })
      .from(pageViews)
      .leftJoin(listings, sql`${listings.slug} = split_part(${pageViews.path}, '/', 3)`)
      .where(and(inRange, isListing))
      .groupBy(pageViews.path, listings.title)
      .orderBy(desc(views))
      .limit(10),

    db.select({ path: pageViews.path, views, visitors: visitorDays })
      .from(pageViews)
      .where(and(inRange, notLike(pageViews.path, "/felni/%"), notLike(pageViews.path, "/gumi/%")))
      .groupBy(pageViews.path)
      .orderBy(desc(views))
      .limit(8),

    db.select({ host: pageViews.referrer, visitors: visitorDays })
      .from(pageViews).where(inRange).groupBy(pageViews.referrer).orderBy(desc(visitorDays)).limit(8),

    db.select({
      mobile: sql<number>`count(distinct (${day} || ${pageViews.visitor})) filter (where ${pageViews.mobile})::int`,
      all: visitorDays,
    }).from(pageViews).where(inRange),
  ]);

  // Every day in the range, including the ones nobody visited.
  // Counted from noon so a 23- or 25-hour daylight-saving day cannot skip or repeat a date.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const todayNoon = new Date(`${new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date())}T12:00:00Z`);
  const days = Array.from({ length: range }, (_, i) => {
    const date = new Date(todayNoon.getTime() - (range - 1 - i) * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    return { key, date, views: byDay.get(key)?.views ?? 0, visitors: byDay.get(key)?.visitors ?? 0 };
  });

  const totalVisitors = days.reduce((n, d) => n + d.visitors, 0);
  const totalViews = days.reduce((n, d) => n + d.views, 0);
  const today = days[days.length - 1];
  const mobileShare = device?.all ? Math.round((device.mobile / device.all) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Statisztika</h1>
          <p className="mt-1 text-sm text-ink-soft">Látogatók a weboldalon. A saját böngészésed nem számít bele.</p>
        </div>
        <nav className="flex rounded-lg border border-rule p-1" aria-label="Időszak">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={r === 30 ? "/admin/statisztika" : `/admin/statisztika?nap=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={`rounded-md px-4 py-1.5 text-sm font-bold ${
                r === range ? "bg-ink text-surface" : "text-ink-soft hover:text-ink"
              }`}
            >
              {r} nap
            </Link>
          ))}
        </nav>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Látogatók" value={totalVisitors} note={`utolsó ${range} nap`} />
        <Tile label="Oldalmegtekintések" value={totalViews} note={`utolsó ${range} nap`} />
        <Tile label="Látogatók ma" value={today.visitors} note={`${nf.format(today.views)} megtekintés`} />
        <Tile label="Érdeklődések" value={enquiries?.n ?? 0} note={`utolsó ${range} nap`} />
      </dl>

      {totalViews === 0 ? (
        <p className="mt-6 rounded-xl border border-rule-soft bg-sheet px-6 py-12 text-center text-ink-soft">
          Ebben az időszakban még nincs adat. A látogatások számlálása a funkció bekapcsolásakor indult.
        </p>
      ) : (
        <>
          <section className="mt-6 rounded-xl border border-rule-soft p-5">
            <h2 className="font-bold">Napi látogatók</h2>
            <DailyChart days={days} />
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-ink-soft hover:text-ink">Napi bontás táblázatban</summary>
              <table className="mt-3 w-full max-w-md tabular-nums">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="py-1 font-semibold">Nap</th>
                    <th className="py-1 text-right font-semibold">Látogatók</th>
                    <th className="py-1 text-right font-semibold">Megtekintések</th>
                  </tr>
                </thead>
                <tbody>
                  {[...days].reverse().map((d) => (
                    <tr key={d.key} className="border-t border-rule-soft">
                      <td className="py-1">{longDate(d.date)}</td>
                      <td className="py-1 text-right">{nf.format(d.visitors)}</td>
                      <td className="py-1 text-right">{nf.format(d.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Ranked
              title="Legnézettebb hirdetések"
              rows={topListings.map((r) => ({
                key: r.path,
                label: r.title ?? `${r.path} (törölt hirdetés)`,
                href: r.title ? r.path : undefined,
                visitors: r.visitors,
                views: r.views,
              }))}
            />
            <Ranked
              title="Oldalak"
              rows={topPages.map((r) => ({
                key: r.path,
                label: PAGE_NAMES[r.path] ?? r.path,
                href: r.path,
                visitors: r.visitors,
                views: r.views,
              }))}
            />
            <Ranked
              title="Honnan jöttek"
              rows={referrers.map((r) => ({
                key: r.host ?? "",
                label: r.host ?? "Közvetlen / ismeretlen",
                visitors: r.visitors,
              }))}
            />
            <section className="rounded-xl border border-rule-soft p-5">
              <h2 className="font-bold">Eszköz</h2>
              <div className="mt-4 flex items-baseline justify-between text-sm">
                <span><b className="text-lg">{mobileShare}%</b> telefon</span>
                <span><b className="text-lg">{100 - mobileShare}%</b> számítógép</span>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-brand-ink/15"
                role="img"
                aria-label={`${mobileShare}% telefon, ${100 - mobileShare}% számítógép`}
              >
                <div className="h-full rounded-full bg-brand-ink" style={{ width: `${mobileShare}%` }} />
              </div>
            </section>
          </div>
        </>
      )}

      <p className="mt-8 text-[13px] text-ink-soft">
        A számlálás sütik nélkül működik, és nem tárol IP-címet. Egy látogató naponta egyszer
        számít, a robotok és a saját böngészésed (amíg be vagy jelentkezve) nem számítanak bele.
      </p>
    </div>
  );
}

const PAGE_NAMES: Record<string, string> = {
  "/": "Főoldal",
  "/felnik": "Felnik",
  "/gumik": "Gumik",
  "/kapcsolat": "Elérhetőség",
};

const shortDate = (d: Date) =>
  new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, month: "short", day: "numeric" }).format(d);
const longDate = (d: Date) =>
  new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, month: "short", day: "numeric", weekday: "short" }).format(d);

function Tile({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-xl border border-rule-soft p-4">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-1 text-3xl font-extrabold">{nf.format(value)}</dd>
      <dd className="mt-0.5 text-xs text-ink-soft">{note}</dd>
    </div>
  );
}

/** A round, even top tick at or above the maximum, so the axis reads 0 / 20 / 40. */
function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(n));
  const unit = step >= 10 ? step / 2 : 1;
  return Math.ceil(n / (2 * unit)) * 2 * unit;
}

/**
 * One column per day, in the brand red. Hover or focus a day for its numbers; the busiest
 * day is labelled, and the table below the chart has every value.
 */
function DailyChart({ days }: { days: { key: string; date: Date; visitors: number; views: number }[] }) {
  const max = niceMax(Math.max(...days.map((d) => d.visitors)));
  const peak = days.reduce((a, d) => (d.visitors > a.visitors ? d : a), days[0]);
  const ticks = [max, max / 2, 0];

  return (
    <div className="mt-4 flex gap-3">
      <div className="relative h-48 w-8 text-right text-xs text-ink-soft tabular-nums" aria-hidden>
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
            {nf.format(t)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-48">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-rule-soft"
              style={{ bottom: `${(t / max) * 100}%` }}
              aria-hidden
            />
          ))}
          <ol className="absolute inset-0 flex items-end gap-[2px]">
            {days.map((d) => (
              <li
                key={d.key}
                tabIndex={0}
                aria-label={`${longDate(d.date)}: ${d.visitors} látogató, ${d.views} megtekintés`}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <div
                  className="w-full max-w-6 rounded-t bg-brand-ink transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                  style={{ height: `${(d.visitors / max) * 100}%` }}
                />
                {d === peak && d.visitors > 0 && (
                  <span
                    className="absolute text-xs font-bold tabular-nums"
                    style={{ bottom: `calc(${(d.visitors / max) * 100}% + 4px)` }}
                  >
                    {nf.format(d.visitors)}
                  </span>
                )}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs text-surface shadow-lg group-hover:block group-focus-visible:block">
                  <b className="text-sm">{nf.format(d.visitors)}</b> látogató
                  <span className="mx-1.5 opacity-50">·</span>
                  {nf.format(d.views)} megtekintés
                  <div className="mt-0.5 opacity-70">{longDate(d.date)}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-soft" aria-hidden>
          <span>{shortDate(days[0].date)}</span>
          <span>ma</span>
        </div>
      </div>
    </div>
  );
}

function Ranked({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; href?: string; visitors: number; views?: number }[];
}) {
  return (
    <section className="rounded-xl border border-rule-soft p-5">
      <h2 className="font-bold">{title}</h2>
      {rows.length ? (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th className="py-1.5 font-semibold" />
              <th className="py-1.5 text-right font-semibold">Látogatók</th>
              {rows[0].views !== undefined && <th className="py-1.5 pl-4 text-right font-semibold">Megtekintés</th>}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-rule-soft">
                <td className="py-1.5 pr-3">
                  {r.href ? (
                    <a href={r.href} target="_blank" rel="noreferrer" className="hover:text-brand-ink">{r.label}</a>
                  ) : (
                    r.label
                  )}
                </td>
                <td className="py-1.5 text-right font-semibold">{nf.format(r.visitors)}</td>
                {r.views !== undefined && <td className="py-1.5 pl-4 text-right">{nf.format(r.views)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">Még nincs adat.</p>
      )}
    </section>
  );
}

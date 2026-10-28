import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db, listings, pageViews } from "@/lib/db";
import { EVENT_LABEL, type TrackedEvent } from "@/lib/tracking";
import { PAGE_NAMES, TZ, day, nf, todayKey } from "../shared";

type Step = { at: Date; path: string; title: string | null; event: TrackedEvent | null };
type Visit = { n: number; steps: Step[]; referrer: string | null; mobile: boolean };

const time = (d: Date) =>
  new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
const longDay = (key: string) =>
  new Intl.DateTimeFormat("hu-HU", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric", weekday: "long" })
    .format(new Date(`${key}T12:00:00Z`));
const shiftDay = (key: string, by: number) =>
  new Date(new Date(`${key}T12:00:00Z`).getTime() + by * 86_400_000).toISOString().slice(0, 10);

/**
 * One anonymous visitor per card, with the pages and listings they opened in order and any
 * contact click. The visitor id only lives for a day, so a journey is one day's visit.
 */
export default async function VisitorJourneys({
  searchParams,
}: {
  searchParams: Promise<{ nap?: string; kapcsolat?: string }>;
}) {
  const sp = await searchParams;
  const today = todayKey();
  const dayKey = sp.nap && /^\d{4}-\d{2}-\d{2}$/.test(sp.nap) && sp.nap <= today ? sp.nap : today;
  const onlyContacts = sp.kapcsolat === "1";

  const rows = await db
    .select({
      at: pageViews.createdAt,
      visitor: pageViews.visitor,
      path: pageViews.path,
      referrer: pageViews.referrer,
      mobile: pageViews.mobile,
      event: pageViews.event,
      title: listings.title,
    })
    .from(pageViews)
    .leftJoin(listings, sql`${listings.slug} = split_part(${pageViews.path}, '/', 3)`)
    .where(eq(day, dayKey))
    .orderBy(asc(pageViews.createdAt))
    .limit(5000);

  // Numbered in order of arrival, shown newest first.
  const byVisitor = new Map<string, Visit>();
  for (const r of rows) {
    let v = byVisitor.get(r.visitor);
    if (!v) {
      v = { n: byVisitor.size + 1, steps: [], referrer: r.referrer, mobile: r.mobile };
      byVisitor.set(r.visitor, v);
    }
    v.steps.push({ at: r.at, path: r.path, title: r.title, event: r.event as TrackedEvent | null });
  }
  const all = [...byVisitor.values()].reverse();
  const contacted = all.filter((v) => v.steps.some((s) => s.event));
  const visits = onlyContacts ? contacted : all;

  const href = (d: string, contacts = onlyContacts) => {
    const p = new URLSearchParams();
    if (d !== today) p.set("nap", d);
    if (contacts) p.set("kapcsolat", "1");
    return p.size ? `?${p}` : "?";
  };

  return (
    <div>
      <Link href="/admin/statisztika" className="text-sm text-ink-soft hover:text-ink">← Statisztika</Link>
      <h1 className="mt-2 text-2xl font-extrabold">Látogatók útja</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Melyik látogató milyen hirdetéseket és oldalakat nézett meg, és felvette-e a kapcsolatot.
        A látogatók névtelenek: nem tudjuk, kik ők, és másnap már új látogatóként számítanak.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-rule">
          <Link href={href(shiftDay(dayKey, -1))} className="px-3 py-2 font-bold hover:bg-sheet" aria-label="Előző nap">←</Link>
          <span className="min-w-56 border-x border-rule px-4 py-2 text-center text-sm font-semibold">
            {dayKey === today ? "Ma, " : ""}{longDay(dayKey)}
          </span>
          {dayKey < today ? (
            <Link href={href(shiftDay(dayKey, 1))} className="px-3 py-2 font-bold hover:bg-sheet" aria-label="Következő nap">→</Link>
          ) : (
            <span className="px-3 py-2 font-bold text-rule" aria-hidden>→</span>
          )}
        </div>
        <div className="flex rounded-lg border border-rule p-1 text-sm font-bold">
          <Link href={href(dayKey, false)} className={`rounded-md px-3 py-1 ${!onlyContacts ? "bg-ink text-surface" : "text-ink-soft hover:text-ink"}`}>
            Mind ({nf.format(all.length)})
          </Link>
          <Link href={href(dayKey, true)} className={`rounded-md px-3 py-1 ${onlyContacts ? "bg-ink text-surface" : "text-ink-soft hover:text-ink"}`}>
            Kapcsolatot keresett ({nf.format(contacted.length)})
          </Link>
        </div>
      </div>

      {visits.length === 0 ? (
        <p className="mt-6 rounded-xl border border-rule-soft bg-sheet px-6 py-12 text-center text-ink-soft">
          {onlyContacts ? "Ezen a napon senki nem kattintott hívásra, e-mailre vagy útvonalra." : "Ezen a napon nem volt látogató."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {visits.map((v) => {
            const pages = v.steps.filter((s) => !s.event).length;
            const contactedHere = v.steps.some((s) => s.event);
            return (
              <li key={v.n} className={`rounded-xl border p-4 ${contactedHere ? "border-brand/40" : "border-rule-soft"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold">
                    {v.n}. látogató
                    {contactedHere && (
                      <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                        Kapcsolat
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {v.mobile ? "Telefon" : "Számítógép"} · {v.referrer ?? "közvetlen"} · {pages} oldal
                  </p>
                </div>
                <ol className="mt-3 space-y-1.5 border-l-2 border-rule-soft pl-4 text-sm">
                  {v.steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-11 shrink-0 text-ink-soft tabular-nums">{time(s.at)}</span>
                      {s.event ? (
                        <span className="font-bold text-brand-ink">
                          {EVENT_LABEL[s.event]}
                          <span className="font-normal text-ink-soft"> · {stepLabel(s)}</span>
                        </span>
                      ) : (
                        <a href={s.path} target="_blank" rel="noreferrer" className="min-w-0 truncate hover:text-brand-ink">
                          {stepLabel(s)}
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function stepLabel(s: Step) {
  if (s.title) return s.title;
  if (PAGE_NAMES[s.path]) return PAGE_NAMES[s.path];
  if (/^\/(felni|gumi)\//.test(s.path)) return `${s.path} (törölt hirdetés)`;
  return s.path;
}

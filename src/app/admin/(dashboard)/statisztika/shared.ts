import { sql } from "drizzle-orm";
import { pageViews } from "@/lib/db";

export const TZ = "Europe/Budapest";
/**
 * Inlined rather than bound: Postgres matches a GROUP BY expression to the SELECT one by
 * its text, and two separate $n parameters never count as the same expression.
 */
export const tz = sql.raw(`'${TZ}'`);

/** The Budapest calendar day of a row, as YYYY-MM-DD. */
export const day = sql<string>`to_char(${pageViews.createdAt} at time zone ${tz}, 'YYYY-MM-DD')`;

export const todayKey = () => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date());

export const nf = new Intl.NumberFormat("hu-HU");

export const PAGE_NAMES: Record<string, string> = {
  "/": "Főoldal",
  "/felnik": "Felnik",
  "/gumik": "Gumik",
  "/kapcsolat": "Elérhetőség",
};

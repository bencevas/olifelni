import { createHash } from "node:crypto";
import { db, pageViews } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget/i;
const MOBILE = /Mobi|Android|iPhone|iPad|iPod/i;

/**
 * Hashing secret for visitor ids. Any server-only value works; it only has to be unknown
 * to the public so an id cannot be recomputed from a guessed IP.
 */
const SALT = process.env.ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-dev";

const budapestDay = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(new Date());

/**
 * Page-view beacon: POST /api/pv { path, referrer }, sent by PageViewBeacon on each public
 * page. Always answers 204 — a stats failure must never surface on the site.
 *
 * Not counted: bots, the admin's own browsing (anyone with a session cookie), and admin
 * or API paths. Sent from the browser rather than logged on the server, so crawlers that
 * do not run JavaScript never reach it.
 */
export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (!ua || BOT.test(ua)) return done();
    if (request.headers.get("cookie")?.includes(`${SESSION_COOKIE}=`)) return done();

    const body = (await request.json().catch(() => null)) as { path?: unknown; referrer?: unknown } | null;
    const path = typeof body?.path === "string" ? body.path : "";
    if (!path.startsWith("/") || path.length > 300 || /^\/(admin|api)(\/|$)/.test(path)) return done();

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const visitor = createHash("sha256")
      .update(`${SALT}|${budapestDay()}|${ip}|${ua}`)
      .digest("hex")
      .slice(0, 16);

    await db.insert(pageViews).values({
      path,
      visitor,
      referrer: externalHost(body?.referrer, request),
      mobile: MOBILE.test(ua),
    });
  } catch (e) {
    console.error("page view not recorded", e);
  }
  return done();
}

const done = () => new Response(null, { status: 204 });

/** "google.com" for a visit from Google; null for direct visits and our own pages. */
function externalHost(referrer: unknown, request: Request): string | null {
  if (typeof referrer !== "string" || !referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    const own = (request.headers.get("host") ?? new URL(request.url).host).split(":")[0].replace(/^www\./, "");
    return host && host !== own ? host.slice(0, 100) : null;
  } catch {
    return null;
  }
}

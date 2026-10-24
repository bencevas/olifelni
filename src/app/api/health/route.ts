import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, listings } from "@/lib/db";
import { hasDatabaseUrl, hasSupabaseStorage, isServerless } from "@/lib/env";
import { emailConfigured } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Host and port only — never the user or password, so this is safe on a live deployment. */
function endpoint(url: string | undefined): { host: string; port: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return { host: u.hostname, port: u.port || "5432" };
  } catch {
    return null;
  }
}

/**
 * Supabase's direct host is IPv6-only, and Vercel's functions egress over IPv4, so a
 * direct URL does not fail — it hangs until the function is killed. That looks identical
 * to an outage, so it is worth naming explicitly.
 */
/**
 * Three things change at once, and changing only the port leaves it still broken:
 * the username gains the project ref, and the host is a different machine entirely.
 */
const POOLER_FIX =
  'Copy the whole string from Supabase -> Project Settings -> Database -> Connection string -> "Transaction pooler". Both the username and the host change, not just the port: user postgres -> postgres.<ref>, host -> aws-N-<region>.pooler.supabase.com, port 6543.';

function diagnose(ep: { host: string; port: string } | null): string | null {
  if (!ep) return null;
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(ep.host)) {
    return `DATABASE_URL points at Supabase's direct connection (${ep.host}). That host is IPv6-only and Vercel cannot reach it, so connections hang rather than fail. ${POOLER_FIX}`;
  }
  // The project API hostname has no "db." prefix and serves HTTPS via Cloudflare — it
  // does not run Postgres at all, so a database port there is dropped and hangs.
  if (/^[a-z0-9]+\.supabase\.co$/i.test(ep.host)) {
    return `DATABASE_URL points at ${ep.host}, which is the project's API hostname (the value of SUPABASE_URL), not a database host. It serves HTTPS and does not accept Postgres connections, so they hang. ${POOLER_FIX}`;
  }
  if (ep.host.includes("pooler.supabase.com") && ep.port !== "6543") {
    return `DATABASE_URL uses the pooler host but port ${ep.port}. Serverless needs the transaction pooler on port 6543.`;
  }
  return null;
}

/**
 * Drizzle wraps driver errors, and the useful part — the Postgres SQLSTATE and detail —
 * lives on `cause`. Reading only the outer `.message` reports "Failed query" and hides
 * whether the table is missing or the password is wrong.
 */
function describeError(e: unknown): { text: string; code: string | null } {
  const parts: string[] = [];
  let code: string | null = null;
  const seen = new Set<unknown>();
  let cur: unknown = e;

  while (cur && typeof cur === "object" && !seen.has(cur)) {
    seen.add(cur);
    const err = cur as { message?: string; code?: string; detail?: string; cause?: unknown };
    if (!code && typeof err.code === "string") code = err.code;
    if (err.message) parts.push(err.message.split("\n")[0]);
    if (err.detail) parts.push(err.detail);
    cur = err.cause;
  }

  const text = parts.filter((v, i) => parts.indexOf(v) === i).join(" <- ");
  return { text: text || String(e), code };
}

/** https://www.postgresql.org/docs/current/errcodes-appendix.html */
function hintForCode(code: string | null): string | null {
  switch (code) {
    case "42P01":
      return 'The "listings" table does not exist, so the schema was never applied. In Supabase -> SQL Editor, run supabase/migrations/0000_init.sql and then 0001_rls.sql, then load the catalogue with: npm run db:import';
    case "28P01":
    case "28000":
      return "Authentication was rejected. Check the password in DATABASE_URL — if the string still contains [YOUR-PASSWORD] it was pasted unedited, and any special characters in the password must be percent-encoded.";
    case "3D000":
      return "That database does not exist. The connection string should end in /postgres.";
    case "08P01":
      return "Protocol error — this usually means prepared statements are on against the transaction pooler. The code sets prepare:false, so check DATABASE_URL is the pooler on port 6543 and not a direct host.";
    default:
      return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`no response after ${ms}ms — the connection is hanging, not erroring`)),
        ms,
      );
    }),
  ]);
}

/**
 * Configuration and connectivity check: GET /api/health
 *
 * Reports only whether each variable is set, never its value, so it is safe to hit on a
 * live deployment. Exists because a missing DATABASE_URL otherwise surfaces as Vercel's
 * generic "This page couldn't load" with the real cause buried in the function logs.
 */
export async function GET() {
  const ep = endpoint(process.env.DATABASE_URL);

  const checks: Record<string, unknown> = {
    environment: isServerless ? "serverless (Vercel)" : "local",
    database: hasDatabaseUrl ? "Supabase (DATABASE_URL set)" : "local PGlite",
    databaseHost: ep ? `${ep.host}:${ep.port}` : null,
    storage: hasSupabaseStorage ? "Supabase Storage" : "local public/uploads",
    leadEmail: emailConfigured ? "Resend" : "off (admin only)",
  };

  const problems: string[] = [];
  if (isServerless && !hasDatabaseUrl) {
    problems.push(
      "DATABASE_URL is not set. Add Supabase's transaction pooler string (port 6543) in Vercel → Settings → Environment Variables, then redeploy.",
    );
  }
  if (isServerless && !hasSupabaseStorage) {
    problems.push(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set, so listing photos will not load or upload.",
    );
  }

  const misconfigured = diagnose(ep);
  if (misconfigured) problems.push(misconfigured);

  try {
    // Capped so a hanging connection answers in seconds instead of stalling the request.
    const [row] = await withTimeout(
      db.select({ n: sql<number>`count(*)::int` }).from(listings),
      5000,
    );
    checks.listings = Number(row?.n ?? 0);
    if (checks.listings === 0) {
      problems.push("The database is reachable but empty. Run: npm run db:import");
    }
  } catch (e) {
    checks.listings = null;
    const { text, code } = describeError(e);
    checks.databaseError = code ? `${text} [${code}]` : text;
    problems.push(`Database query failed: ${text}${code ? ` [${code}]` : ""}`);

    const hint = hintForCode(code);
    if (hint) {
      problems.push(hint);
    } else if (!misconfigured && /timed out|no response|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(text)) {
      problems.push(
        "The connection is not being answered. Check the Supabase project is not paused — free projects pause after a week idle and hang exactly like this.",
      );
    }
  }

  const ok = problems.length === 0;
  return NextResponse.json({ ok, checks, problems }, { status: ok ? 200 : 503 });
}

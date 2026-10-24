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
function diagnose(ep: { host: string; port: string } | null): string | null {
  if (!ep) return null;
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(ep.host)) {
    return `DATABASE_URL points at Supabase's direct connection (${ep.host}). That host is IPv6-only and Vercel cannot reach it, so connections hang rather than fail. Use the "Transaction pooler" string instead — Supabase → Project Settings → Database → Connection string → Transaction pooler. The host looks like aws-0-<region>.pooler.supabase.com and the port is 6543.`;
  }
  if (ep.host.includes("pooler.supabase.com") && ep.port !== "6543") {
    return `DATABASE_URL uses the pooler host but port ${ep.port}. Serverless needs the transaction pooler on port 6543.`;
  }
  return null;
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
    problems.push(`Database query failed: ${(e as Error).message}`);
    if (!misconfigured) {
      problems.push(
        "If the endpoint above looks right, check the Supabase project is not paused — free projects pause after a week idle and connections then hang exactly like this.",
      );
    }
  }

  const ok = problems.length === 0;
  return NextResponse.json({ ok, checks, problems }, { status: ok ? 200 : 503 });
}

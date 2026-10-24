import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, listings } from "@/lib/db";
import { hasDatabaseUrl, hasSupabaseStorage, isServerless } from "@/lib/env";
import { emailConfigured } from "@/lib/notify";
import { describeError, diagnoseEndpoint, endpointOf, hintForCode } from "@/lib/db-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const ep = endpointOf(process.env.DATABASE_URL);

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

  const misconfigured = diagnoseEndpoint(ep);
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

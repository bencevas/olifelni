import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, listings } from "@/lib/db";
import { hasDatabaseUrl, hasSupabaseStorage, isServerless } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Configuration and connectivity check: GET /api/health
 *
 * Reports only whether each variable is set, never its value, so it is safe to hit on a
 * live deployment. Exists because a missing DATABASE_URL otherwise surfaces as Vercel's
 * generic "This page couldn't load" with the real cause buried in the function logs.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    environment: isServerless ? "serverless (Vercel)" : "local",
    database: hasDatabaseUrl ? "Supabase (DATABASE_URL set)" : "local PGlite",
    storage: hasSupabaseStorage ? "Supabase Storage" : "local public/uploads",
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

  try {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(listings);
    checks.listings = Number(row?.n ?? 0);
    if (checks.listings === 0) {
      problems.push("The database is reachable but empty. Run: npm run db:import");
    }
  } catch (e) {
    checks.listings = null;
    problems.push(`Database query failed: ${(e as Error).message}`);
  }

  const ok = problems.length === 0;
  return NextResponse.json({ ok, checks, problems }, { status: ok ? 200 : 503 });
}

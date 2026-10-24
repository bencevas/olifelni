/**
 * Turning a driver failure into something actionable.
 *
 * Shared by /api/health and `npm run db:ping` so the two cannot drift — the deployed
 * check and the local check should always explain a failure the same way.
 */

/**
 * Drizzle wraps driver errors, and the useful part — the Postgres SQLSTATE and detail —
 * lives on `cause`. Reading only the outer `.message` reports "Failed query" and hides
 * whether the table is missing or the password is wrong.
 */
export function describeError(e: unknown): { text: string; code: string | null } {
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
export function hintForCode(code: string | null): string | null {
  switch (code) {
    case "42P01":
      return 'The "listings" table does not exist, so the schema was never applied. In Supabase -> SQL Editor, run supabase/migrations/0000_init.sql and then 0001_rls.sql, then load the catalogue with: npm run db:import';
    case "28P01":
    case "28000":
      return 'Authentication was rejected. Note that Supavisor reports the user as "postgres" even when the username correctly carries the project ref, so this is the password, not the username. If the string still contains [YOUR-PASSWORD] it was pasted unedited; otherwise reset it in Supabase -> Project Settings -> Database, and prefer letters and numbers so nothing needs percent-encoding.';
    case "3D000":
      return "That database does not exist. The connection string should end in /postgres.";
    case "08P01":
      return "Protocol error — this usually means prepared statements are on against the transaction pooler. The code sets prepare:false, so check DATABASE_URL is the pooler on port 6543 and not a direct host.";
    default:
      return null;
  }
}

/** Host and port only — never the user or password, so this is safe to print or serve. */
export function endpointOf(url: string | undefined): { host: string; port: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return { host: u.hostname, port: u.port || "5432" };
  } catch {
    return null;
  }
}

const POOLER_FIX =
  'Copy the whole string from Supabase -> Project Settings -> Database -> Connection string -> "Transaction pooler". Both the username and the host change, not just the port: user postgres -> postgres.<ref>, host -> aws-N-<region>.pooler.supabase.com, port 6543.';

/**
 * Supabase's direct host is IPv6-only, and Vercel's functions egress over IPv4, so a
 * direct URL does not fail — it hangs until the function is killed. That looks identical
 * to an outage, so it is worth naming explicitly.
 */
export function diagnoseEndpoint(ep: { host: string; port: string } | null): string | null {
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

/**
 * Checks a DATABASE_URL end to end, without deploying:
 *
 *   npm run db:ping
 *
 * Reads .env if DATABASE_URL is not already exported. Vercel binds environment variables
 * to a deployment at build time, so each attempt there costs a redeploy; this answers the
 * same question in about a second. Prints the host and port but never the credentials.
 */
import { readFileSync } from "node:fs";
import { describeError, diagnoseEndpoint, endpointOf, hintForCode } from "../src/lib/db-errors";

/** Minimal .env reader — enough for one variable, and avoids a dependency for it. */
function fromEnvFile(key: string): string | undefined {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && m[1] === key) return m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env; the variable may still be exported in the shell.
  }
  return undefined;
}

const ok = (s: string) => `  \x1b[32m✓\x1b[0m ${s}`;
const bad = (s: string) => `  \x1b[31m✗\x1b[0m ${s}`;
const note = (s: string) => `    \x1b[2m${s}\x1b[0m`;

async function main() {
  const url = process.env.DATABASE_URL ?? fromEnvFile("DATABASE_URL");

  if (!url) {
    console.log(bad("DATABASE_URL is not set"));
    console.log(note("Put it in .env (git-ignored) as: DATABASE_URL=postgresql://..."));
    process.exit(1);
  }

  const ep = endpointOf(url);
  if (!ep) {
    console.log(bad("DATABASE_URL is not a valid URL"));
    console.log(note("It should start postgresql:// and end /postgres"));
    process.exit(1);
  }

  console.log(`\n  endpoint  ${ep.host}:${ep.port}`);

  // The commonest failure by far: the template pasted without substituting the password.
  if (/\[YOUR-PASSWORD\]|\[your-password\]/.test(url)) {
    console.log(bad("The password is still the literal [YOUR-PASSWORD] placeholder"));
    console.log(note("Supabase never shows the real password — reset it under Project Settings → Database"));
    process.exit(1);
  }

  const misconfigured = diagnoseEndpoint(ep);
  if (misconfigured) {
    console.log(bad(misconfigured));
    process.exit(1);
  }
  console.log(ok("endpoint looks right"));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require("postgres");
  const client = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });

  try {
    await client`select 1`;
    console.log(ok("connected and authenticated"));

    const [t] = await client`select to_regclass('public.listings') is not null as present`;
    if (!t.present) {
      console.log(bad('schema not applied — "listings" does not exist'));
      console.log(note(hintForCode("42P01") ?? ""));
      process.exit(1);
    }
    console.log(ok("schema present"));

    const [c] = await client`select count(*)::int as n from listings`;
    if (c.n === 0) {
      console.log(bad("no listings — run: npm run db:import"));
      process.exit(1);
    }
    console.log(ok(`${c.n} listings\n`));
  } catch (e) {
    const { text, code } = describeError(e);
    console.log(bad(`${text}${code ? ` [${code}]` : ""}`));
    const hint = hintForCode(code);
    if (hint) console.log(note(hint));
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

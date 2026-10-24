/**
 * Applies supabase/migrations/*.sql in order, to whichever database is configured.
 * Safe to re-run: every statement is guarded by a ledger table.
 *
 *   npm run db:migrate              -> local PGlite (./.pglite)
 *   DATABASE_URL=... npm run db:migrate  -> Supabase
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "supabase", "migrations");

type Runner = {
  exec: (sql: string) => Promise<unknown>;
  all: (sql: string) => Promise<Array<Record<string, unknown>>>;
  close: () => Promise<void>;
};

async function connect(): Promise<{ runner: Runner; label: string }> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { prepare: false, max: 1 });
    return {
      label: `Supabase (${url.replace(/:[^:@]+@/, ":****@")})`,
      runner: {
        exec: (s) => sql.unsafe(s),
        all: async (s) => (await sql.unsafe(s)) as unknown as Array<Record<string, unknown>>,
        close: () => sql.end(),
      },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? "./.pglite";
  const pg = new PGlite(dir);
  return {
    label: `local PGlite (${dir})`,
    runner: {
      exec: (s) => pg.exec(s),
      all: async (s) => (await pg.query(s)).rows as Array<Record<string, unknown>>,
      close: () => pg.close(),
    },
  };
}

async function main() {
  const { runner, label } = await connect();
  console.log(`→ migrating ${label}`);

  await runner.exec(
    `create table if not exists _migrations (
       name text primary key,
       applied_at timestamptz not null default now()
     )`,
  );
  const done = new Set(
    (await runner.all(`select name from _migrations`)).map((r) => String(r.name)),
  );

  const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
  let applied = 0;

  for (const file of files) {
    if (done.has(file)) {
      console.log(`  = ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(DIR, file), "utf8");
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) await runner.exec(trimmed);
    }
    await runner.exec(`insert into _migrations (name) values ('${file}')`);
    console.log(`  + ${file}`);
    applied++;
  }

  await runner.close();
  console.log(applied ? `done, ${applied} migration(s) applied` : "done, already up to date");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

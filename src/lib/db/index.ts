import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { assertDatabaseConfigured } from "../env";

/**
 * One schema, two drivers.
 *
 *   DATABASE_URL set   -> postgres-js against Supabase (staging / production)
 *   DATABASE_URL unset -> PGlite, a real PostgreSQL 18 compiled to WASM, stored in ./.pglite
 *
 * PGlite exists so the site runs locally with no Docker, no Postgres install and no cloud
 * account. It speaks the same SQL, so the migration in supabase/migrations applies verbatim
 * to both and there is no "works locally, breaks in Supabase" gap.
 */
/**
 * Typed as the postgres-js instance for both drivers. They expose the same query builder,
 * but a union of the two makes TypeScript unable to resolve overloads like `.returning()`,
 * so the PGlite instance is cast to this shape at the single point where it is created.
 */
export type Db = ReturnType<typeof drizzlePg<typeof schema>>;

declare global {
  // Survives Next.js hot reloads, which would otherwise open a connection per edit.
  var __oliDb: Db | undefined;
}

function create(): Db {
  assertDatabaseConfigured();
  const url = process.env.DATABASE_URL;

  if (url) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres");
    // `prepare: false` is required by Supabase's transaction pooler (port 6543), which is
    // the right endpoint for serverless. The pool stays small because every Vercel
    // function instance opens its own, and they add up fast.
    const client = postgres(url, { prepare: false, max: 3 });
    return drizzlePg(client, { schema });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite");
  return drizzlePglite(new PGlite(process.env.PGLITE_DIR ?? "./.pglite"), {
    schema,
  }) as unknown as Db;
}

function getDb(): Db {
  if (!globalThis.__oliDb) globalThis.__oliDb = create();
  return globalThis.__oliDb;
}

/**
 * Connects on first use, not on import.
 *
 * Next.js spins up a worker per CPU to collect page data and prerender, and every worker
 * imports this module. Connecting eagerly made all of them open the same PGlite directory
 * at once, which only one can hold — the rest died with "PGlite failed to initialize".
 * Deferring until a query actually runs means only the process that needs the database
 * opens it.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const usingSupabase = Boolean(process.env.DATABASE_URL);
export * from "./schema";

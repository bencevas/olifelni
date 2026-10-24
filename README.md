# Oli Felni

Replacement for the Wix site at [olifelni.com](https://www.olifelni.com) — a Hungarian
wheel and tire dealer. The site is a **lead generator, not a shop**: visitors browse the
catalog and then call or send a message. There is no cart and no checkout.

- **Owner's guide (Hungarian):** [`docs/HASZNALAT.md`](docs/HASZNALAT.md)
- **Going live on Supabase + Vercel:** [`docs/DEPLOY.md`](docs/DEPLOY.md)
- **Migration background and findings:** [`docs/migration-plan.md`](docs/migration-plan.md)

## Running it

```bash
npm install
npm run db:migrate              # create the tables
npm run db:import               # load 150 listings + 342 photos from the Wix scrape
npm run db:seed-admin           # create an admin login, prints a generated password
npm run dev                     # http://localhost:3000
```

Nothing else to install. With no environment variables set, the database is
[PGlite](https://pglite.dev) — real PostgreSQL 18 compiled to WASM, stored in `./.pglite` —
and photos go to `public/uploads`. No Docker, no Postgres, no cloud account.

Set `DATABASE_URL` and it talks to Supabase instead, using the same schema and the same
migrations. See [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Layout

```
src/
  app/
    (site)/          public pages — home, /felnik, /gumik, /felni/[slug], /gumi/[slug], /kapcsolat
    admin/           owner's area; (dashboard) is auth-gated, /belepes is the login
    api/admin/upload photo upload (a route handler, to dodge the 1 MB server-action body cap)
  components/        site chrome, catalog grid, filters, gallery, admin form
  lib/
    db/              Drizzle schema + lazy connection (PGlite or Supabase)
    listings.ts      catalog queries, facet counts, price bounds
    storage.ts       image storage (local filesystem or Supabase Storage)
    auth.ts          scrypt password hashing + cookie sessions
    labels.ts        Hungarian UI labels for the English database enums
supabase/migrations/ plain SQL, applied by scripts/migrate.ts to either backend
scripts/             migrate, import, seed-admin, data-quality check, scrape-wix.py
data/wix-export/     the scraped Wix catalog that db:import reads
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build and serve |
| `npm run db:migrate` | apply `supabase/migrations/*.sql` |
| `npm run db:import` | import the scraped Wix catalog (`-- --skip-images` for metadata only) |
| `npm run db:seed-admin` | create or reset the admin account |
| `npm run db:check` | report spec coverage and list listings with empty fields |
| `npm run db:generate` | regenerate SQL after editing the Drizzle schema |

## Notes

- **Database keys are English, the UI is Hungarian.** `kind`, `status` and `season` are
  enums like `wheel`/`tire`; `src/lib/labels.ts` maps them to what people see.
- **Facets are columns, not categories.** The Wix site used 75 flat categories which were
  really six dimensions tangled together, and every new listing meant hand-ticking four to
  six checkboxes. Diameter, bolt pattern, make, brand and season are now typed columns, and
  the filter pages are derived queries.
- **Old URLs still resolve.** Every listing keeps its `legacy_slug`, and
  `/product-page/<slug>` 301s to the new URL. The six Wix brand pages —
  which served the *wrong* brand, `/copy-of-audi` showing Toyota — redirect to the right
  filtered page. See `next.config.ts`.

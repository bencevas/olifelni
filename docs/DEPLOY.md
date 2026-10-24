# Going live: Supabase + Vercel

Everything here is one-time setup. Once it is done, publishing a listing is just the admin
page — no deploys, no code.

The app reads two things from the environment and changes behaviour accordingly:

| Environment | Database | Images |
|---|---|---|
| nothing set | PGlite, local file `./.pglite` | `public/uploads` |
| `DATABASE_URL` set | Supabase Postgres | — |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set | — | Supabase Storage |

Same schema, same code. The SQL in `supabase/migrations/` applies verbatim to both.

---

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com). **Pick region `eu-central-1`
   (Frankfurt)** — it is the closest to Hungary and keeps queries fast.
2. **Project Settings → Database → Connection string → Transaction pooler.**
   Copy it and replace `[YOUR-PASSWORD]` with the database password.
   It ends in `:6543/postgres`. The transaction pooler (not the direct `5432` connection)
   is what serverless functions need.
3. **Storage → New bucket** → name it `listings` → tick **Public bucket** → Create.
   Public is correct here: these are product photos meant to be seen. Nothing private
   ever goes in this bucket.
4. **Project Settings → API** → copy the `service_role` key.
   This key bypasses every access rule. It goes only in server-side environment
   variables — never in the browser, never in git.

### Create the tables

From this folder:

```bash
DATABASE_URL='postgres://postgres.<ref>:<password>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres' \
  npm run db:migrate
```

It prints each migration as it applies and is safe to re-run — a `_migrations` ledger
table tracks what has already run.

### Move the catalog across

```bash
DATABASE_URL='<same as above>' \
SUPABASE_URL='https://<ref>.supabase.co' \
SUPABASE_SERVICE_ROLE_KEY='<service-role-key>' \
  npm run db:import
```

This re-reads the scraped Wix catalog in `data/wix-export/`, inserts all 150 listings and
uploads all 342 photos to Supabase Storage. It matches on the old Wix slug, so running it
twice updates rather than duplicates.

### Create the owner's login

```bash
DATABASE_URL='<same as above>' npm run db:seed-admin -- oli@olifelni.hu 'a-strong-password'
```

---

## 2. Vercel

1. Push this repository to GitHub.
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   Next.js is detected automatically; `vercel.json` already pins the region to
   **Frankfurt (`fra1`)**, next to the database.
3. Before the first deploy, add the environment variables under
   **Settings → Environment Variables** (tick Production *and* Preview):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the transaction pooler string from step 1.2 |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` key |
   | `SUPABASE_BUCKET` | `listings` |
   | `NEXT_PUBLIC_SITE_URL` | `https://olifelni.com` |

4. Deploy.

### Pointing olifelni.com at it

Do this **after** checking the deployment works on its `*.vercel.app` URL.

1. Vercel → Project → **Settings → Domains** → add `olifelni.com` and `www.olifelni.com`.
2. Vercel shows the DNS records to set. Change them at whoever manages the domain today
   (currently Wix).
3. Keep the Wix site paid up for a few weeks as a fallback. DNS changes take up to 48
   hours to propagate everywhere.

---

## 3. Before switching the domain

- [ ] Every page loads on the `*.vercel.app` URL
- [ ] Photos appear (if not, the bucket is not public, or `SUPABASE_BUCKET` is wrong)
- [ ] The owner can log in at `/admin/belepes`
- [ ] Creating a listing with photos works **from a phone**, on mobile data
- [ ] The contact form delivers — submit one and check `/admin/erdeklodesek`
- [ ] Old links still work: `/product-page/audi-20-5x112` should land on the new page
- [ ] `https://<domain>/sitemap.xml` lists the catalog
- [ ] Add the site to [Google Search Console](https://search.google.com/search-console)
      and submit the sitemap

### Re-run the import just before the switch

The Wix site stays live while all this is set up, and the owner will have added or sold
sets in the meantime. Re-scrape and re-import right before flipping DNS so nothing is
lost — see [`migration-plan.md`](migration-plan.md) §1.6.

---

## Everyday commands

| What | Command |
|---|---|
| Run locally | `npm run dev` → http://localhost:3000 |
| Production build locally | `npm run build && npm start` |
| Apply new migrations | `npm run db:migrate` |
| Check catalog data quality | `npm run db:check` |
| Reset the owner's password | `npm run db:seed-admin -- <email> '<new-password>'` |

Prefix any of them with `DATABASE_URL=...` to act on Supabase instead of the local copy.

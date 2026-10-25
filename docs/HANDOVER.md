# Handing the project over to the owner

Written for whoever runs the handover, not for the owner. The owner-facing guide is
[HASZNALAT.md](HASZNALAT.md) (Hungarian); deployment detail is in [DEPLOY.md](DEPLOY.md).

There are four separate things to move, and they are independent:

| What | Where it lives now | Moves to |
|---|---|---|
| Code | GitHub repo | Owner's GitHub account |
| Hosting | Vercel project, **Realfood Budapest** team | Owner's own Vercel account |
| Database + photos | Supabase project | Owner's Supabase organisation |
| Domain | Wix (registrar + DNS) | See [DEPLOY.md](DEPLOY.md) — separate track |

**The live site stays up throughout.** Vercel keeps serving the last successful build no
matter who owns the repo or whether git is connected. Only the ability to ship *new*
changes is briefly interrupted. Nothing below risks downtime except the domain step, which
is why the domain goes last.

---

## 0. Before transferring anything

### 0.1 Create the owner's admin login

There is currently **no admin account in production**, so the owner cannot sign in to
`/admin` at all. Create one against the production database:

```bash
mv .env.supabase .env          # points the scripts at Supabase, not local PGlite
npm run db:seed-admin -- oli@olifelni.hu "a-strong-password"
mv .env .env.supabase          # put it back so local dev stays offline
```

Verify at `https://<deployment>/admin/belepes`, then give the owner the password out of
band and have them change it.

### 0.2 Rotate the credentials

The database password and the Supabase `service_role` key were both shared in chat during
setup, so treat them as compromised. The service role key is the serious one — it bypasses
Row Level Security entirely, meaning anyone holding it has unrestricted read and write on
the whole database.

1. Supabase → Project Settings → Database → **Reset database password**
   (letters and digits only, so nothing needs percent-encoding in the URL)
2. Supabase → Project Settings → API Keys → **rotate `service_role`**
3. Update both in Vercel → Settings → Environment Variables, then **redeploy**
4. Confirm `/api/health` returns `"ok": true`

Do this *before* the owner takes over, so what you hand across is already clean.

### 0.3 Check the connection string locally first

Each wrong value in Vercel costs a redeploy to discover. This answers in a second:

```bash
mv .env.supabase .env && npm run db:ping && mv .env .env.supabase
```

---

## 1. Supabase

Do this first: it is the least coupled. **Transferring a project does not change its
connection string or its API keys**, so Vercel keeps working untouched throughout.

1. Owner creates (or already has) an organisation.
2. They invite you to it, or you invite them to yours — you need to be a member of both
   to move a project between them.
3. Supabase → Project Settings → General → **Transfer project** → choose the owner's org.
4. Verify afterwards: `/api/health` still reports `"ok": true` with 150 listings.

Watch for:

- **Free tier allows two active projects per organisation.** If the owner's org is already
  at the limit the transfer will be refused.
- **Free projects pause after about a week with no traffic**, and a paused project makes
  connections hang rather than fail — it looks exactly like an outage. Once the domain is
  live, real traffic keeps it awake. If the site is quiet, Pro ($25/mo) avoids it.
- **The storage bucket was created by hand, not by a migration.** It is a public bucket
  named `listings`. If the project is ever rebuilt from the SQL files alone, that bucket
  must be recreated or every photo 404s.

## 2. GitHub

Transferring the repo breaks Vercel's git connection, so the project stops auto-deploying
until step 3 reconnects it. The live site is unaffected.

1. GitHub → repo → Settings → Danger Zone → **Transfer ownership** → owner's username.
2. Owner accepts the transfer email.
3. Have the owner confirm they can see the repo and its history.

Nothing in the repo contains secrets — `.env*` is git-ignored and only `.env.example`
(placeholders) is committed — so the transfer carries no credentials with it.

## 3. Vercel — getting it off the Realfood Budapest plan

**Do this before pointing olifelni.com at Vercel.** No custom domain is attached to the
project yet, which makes the transfer clean; moving a project that is already serving a
live domain risks downtime while the domain is removed and re-added.

1. Owner signs in to their own Vercel account.
2. Realfood Budapest team → the project → Settings → General → **Transfer Project** →
   transfer to the owner's account. They must accept.
3. After the transfer, in the owner's account:
   - **Check every environment variable came across** — `DATABASE_URL`, `SUPABASE_URL`,
     `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Do not assume; open each one.
   - **Reconnect the GitHub repo** (Settings → Git) to the owner's transferred repo.
   - Push a trivial commit and confirm it builds and deploys.
   - Confirm `/api/health` is `"ok": true`.
4. Confirm the project no longer appears under Realfood Budapest, so it stops being billed.

Watch for:

- **The `*.vercel.app` subdomain may change** if `olifelni` is taken in the owner's
  account. Update `NEXT_PUBLIC_SITE_URL` to match, or it will be wrong in sitemap and
  share-card URLs.
- **Vercel's Hobby plan is for non-commercial use** under their fair-use terms. This is a
  business site, so strictly it belongs on Pro ($20/mo). Plenty of small sites run on
  Hobby, but it is the owner's risk to accept knowingly rather than discover later.
- `vercel.json` pins the region to `fra1` (Frankfurt) and travels with the repo — nothing
  to redo.

## 4. Domain

Only once the owner holds all three accounts. The full decision — repoint DNS versus
transfer the registration away from Wix — is in [DEPLOY.md](DEPLOY.md). Two things that
matter here:

- **Re-run the import immediately before switching DNS.** The Wix site stays live until
  the moment you cut over, so stock will have changed since the last import:
  `mv .env.supabase .env && npm run db:import && mv .env .env.supabase`
- Keep the Wix plan paid for a few weeks afterwards as a rollback.

## 5. Finish

- [ ] Owner can sign in at `/admin/belepes` and edit a listing
- [ ] Owner can add a listing with photos **from a phone**, on mobile data
- [ ] `/api/health` is `"ok": true`
- [ ] Owner has pushed a commit and seen it deploy
- [ ] Project gone from the Realfood Budapest team
- [ ] Credentials rotated (0.2) and the owner holds the new ones
- [ ] **Remove your own access**: leave the Supabase org, the GitHub repo, and the Vercel
      project — last, once everything above passes
- [ ] Delete any local `.env.supabase`, and the `.pglite.broken-*` directory if present

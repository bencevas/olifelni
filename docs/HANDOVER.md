# Handing the project over to the owner

Written for whoever runs the handover, not for the owner. The owner-facing guide is
[HASZNALAT.md](HASZNALAT.md) (Hungarian); deployment detail is in [DEPLOY.md](DEPLOY.md).

There are four separate things to move, and they are independent:

| What | Where it lives now | Moves to |
|---|---|---|
| Code | GitHub repo | Owner's GitHub account |
| Hosting | Vercel project, **Realfood Budapest** team | Owner's own Vercel account |
| Database + photos | Supabase project | Owner's Supabase organisation |
| Domain | **Live on Vercel.** Registrar + DNS still Wix | Moves with the Vercel project |

**Steps 1 and 2 cannot take the site down.** Vercel keeps serving the last successful
build no matter who owns the repo or whether git is connected — only the ability to ship
*new* changes is interrupted.

**Step 3 can.** olifelni.com is already live on Vercel, so the project transfer now
involves moving a domain that is serving real traffic. Read that section before starting
it; it is the only genuinely risky part of the handover.

> **Wix cannot be cancelled.** DNS for olifelni.com is still hosted on Wix nameservers
> (`ns0/ns1.wixdns.net`), and Wix is still the registrar. Cancelling the Wix plan stops
> those nameservers answering and the site goes dark — even though it is hosted on Vercel
> and nothing about Vercel changed. Move DNS off Wix first if the owner wants to stop
> paying them. See [DEPLOY.md](DEPLOY.md).

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

This is the step that can cause an outage, because olifelni.com is already serving live
traffic from this project. A domain can only belong to one Vercel project at a time, so
there is a window between removing it from the old project and it being verified on the
new one. Expect seconds to a couple of minutes while Vercel issues a TLS certificate for
the new project.

**The DNS records at Wix do not change.** They point at Vercel's shared edge
(`cname.vercel-dns.com` for www, and an anycast A record for the apex), not at a specific
project, so nothing needs editing on the Wix side.

Do it at a quiet hour, with both accounts open and ready.

1. Owner signs in to their own Vercel account and accepts the invite.
2. Realfood Budapest team → the project → Settings → General → **Transfer Project** →
   to the owner's account.
3. Move the domain to the new project — remove `olifelni.com` and `www.olifelni.com` from
   the old project, add them to the new one, and let the certificate issue.
4. Verify straight away:

   ```bash
   curl -sI https://www.olifelni.com | head -1            # expect 200
   curl -s https://www.olifelni.com/api/health            # expect "ok": true
   ```

5. Then, in the owner's account:
   - **Check every environment variable came across** — `DATABASE_URL`, `SUPABASE_URL`,
     `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Do not assume; open each one.
   - **Reconnect the GitHub repo** (Settings → Git) to the owner's transferred repo.
   - Push a trivial commit and confirm it builds and deploys.
6. Confirm the project no longer appears under Realfood Budapest, so it stops being billed.

**Keep your Realfood Budapest access until step 4 passes.** If the domain will not attach
to the owner's project, re-adding it to the original project is the rollback, and that is
only possible while you are still in that team. Leaving early removes the way back.

Watch for:

- **The `*.vercel.app` subdomain may change** if `olifelni` is taken in the owner's
  account. Update `NEXT_PUBLIC_SITE_URL` to match, or it will be wrong in sitemap and
  share-card URLs.
- **Vercel's Hobby plan is for non-commercial use** under their fair-use terms. This is a
  business site, so strictly it belongs on Pro ($20/mo). Plenty of small sites run on
  Hobby, but it is the owner's risk to accept knowingly rather than discover later.
- `vercel.json` pins the region to `fra1` (Frankfurt) and travels with the repo — nothing
  to redo.

## 4. Wix — what is still tied to it

The cutover already happened: olifelni.com resolves to Vercel and the legacy Wix URLs
redirect correctly (`/bmw` → `/felnik?marka=BMW`, and the rest, from `next.config.ts`).
What remains is that **Wix is still the registrar and still hosts the DNS**.

So the Wix plan cannot simply be cancelled. Either:

- **Keep a domain-only Wix account.** Fewest moving parts; the site plan can go.
- **Move DNS and the registration elsewhere.** Lower long-term cost and no Wix login to
  maintain, but it is a multi-day transfer. Full detail in [DEPLOY.md](DEPLOY.md).

Either way, do it *after* the Vercel transfer, and never cancel Wix before DNS lives
somewhere else.

## 5. Finish

- [ ] Owner can sign in at `/admin/belepes` and edit a listing
- [ ] Owner can add a listing with photos **from a phone**, on mobile data
- [ ] `/api/health` is `"ok": true`
- [ ] Owner has pushed a commit and seen it deploy
- [ ] `https://www.olifelni.com` serves 200 and `/api/health` is `"ok": true`
- [ ] Project gone from the Realfood Budapest team
- [ ] Credentials rotated (0.2) and the owner holds the new ones
- [ ] **Remove your own access**: leave the Supabase org, the GitHub repo, and the Vercel
      project — last, once everything above passes
- [ ] Delete any local `.env.supabase`, and the `.pglite.broken-*` directory if present

# olifelni.com → own stack: migration plan

Target: replace the Wix site **olifelni.com** ("Oli Felni" / OF Felni Kft.) with a self-hosted
Next.js site that owns its catalog, has a purpose-built admin for creating listings, and visually
matches the current site on desktop and mobile.

Everything in "What the recon established" below was verified live on 2026-10-24, not assumed.

---

## 0. What the recon established

**Platform.** Wix (site id `95de607c-c362-491c-9642-919551a9bf61`), Wix Stores app, locale `hu`,
currency HUF, served via Cloudflare. Images on `static.wixstatic.com`.

**Scale.**

| Thing | Count |
|---|---|
| Product listings | **150** (119 wheel sets, 29 tire sets, 2 wheels with no brand in slug) |
| Categories | **75**, all flat (`parentCategoryId` is `null` for every one); 74 public, 1 hidden |
| Standalone pages | 7 (home + 6 brand landing pages) |
| Images | ~2–5 per listing, originals up to ~3000px / 1.4 MB |

**The catalog is fully extractable without a headless browser.** Each product page ships the
complete Wix product record inside the server-rendered HTML, in the warmup-data blob under the key
`productPage_HUF_<slug>` → `catalog.product`. It contains:

```
id, name, urlPart, description (rich HTML), sku, ribbon, brand,
price, comparePrice, discountedPrice, formattedPrice,
categoryIds[], productType, isVisible, options[], customTextFields[], additionalInfo[],
inventory{status}, media[]{id, width, height, title}
```

A JSON-LD `Product` block on the same page independently carries name/description/images/price —
useful as a cross-check.

**Images.** `media[].id` (e.g. `0cc695_9a6b…~mv2.jpeg`) resolves to the **original** upload at
`https://static.wixstatic.com/media/<id>` — no `/v1/fit/w_500…` transform, no auth. Verified: 200,
`image/jpeg`, 1,434,857 bytes. The `title` field preserves the original filename
(`IMG_4732 3.jpeg`), which is worth keeping for provenance.

**Categories.** The complete taxonomy — `{id, name, slug, visible, parentCategoryId}` for all 75 —
is embedded in any `/category/<slug>` page under `"categories":{"list":[…]}`. One fetch gets the
lot. Saved to `recon/categories.json`.

**Enumeration.** `/store-products-sitemap.xml` lists all 150 product URLs. Cross-checked against
every product link on the homepage: zero products appear on the homepage that are missing from the
sitemap, so the sitemap is trustworthy as the crawl seed.

**Site architecture is not what the nav suggests.** `Főoldal`, `Felnik`, `Gumik` and `Elérhetőség`
all link to `https://www.olifelni.com` — they are anchors into one long homepage, which itself
paginates via `?page=N`. The real page types are: the one-page home, 75 `/category/<slug>` grids,
150 `/product-page/<slug>` pages, and 6 brand pages.

**Prototype status.** `recon/scrape.py` is a working extractor, run against 14 real products:
14/14 extracted with correct name, price, image set and description. Sample output in
`recon/products.sample.json`.

### Defects in the current site worth fixing during the move

These are live bugs, not cosmetic nitpicks. The migration is the cheap moment to fix them.

1. **Brand pages have wrong URLs.** `/copy-of-bmw` serves the **Audi** page, `/copy-of-audi` serves
   **Toyota**, `/copy-of-audi-1` serves **Mercedes Benz**, `/copy-of-audi-2` serves **Volkswagen**,
   `/copy-of-volkswagen` serves **Seat**. Only `/bmw` is correct. Classic Wix duplicate-page drift;
   actively harmful for search.
2. **The 18" category has the slug `19"`**, and the real 19" category is `19"-1`. A customer
   filtering 18" lands on a URL that says 19".
3. **Quote characters in category slugs** (`/category/13"`, `/category/19"-1`) — URL-unsafe, and
   they show up percent-encoded in the sitemap.
4. **`Gumiabrocs`** is a typo for `Gumiabroncs`, and it is in a public URL.
5. **`OZ` (slug `untitled-oz`) and `OZ Racing` are duplicate categories.**
6. **Tire brands are effectively uncategorised.** 14 tire brands appear in listings (Pirelli,
   Michelin, Bridgestone, Continental, Semperit, Goodyear, Dunlop, Hankook, Nexen, Vredestein,
   Uniroyal, Barum, Lassa, Platin). Only Pirelli has a category at all — and it is
   `visible: false`, so no customer can reach it. That hidden category is the entire gap between
   the 75 categories in the data and the 74 in the sitemap.
7. **No call to action on product pages.** No add-to-cart, no "enquire", no phone link — a visitor
   who wants a set has nothing to click.
8. **Footer year is hardcoded to 2024.**

---

## 1. Scrape the catalog

Goal: a complete, re-runnable, verifiable export of all 150 listings plus original images, in a
form the new database imports directly.

### 1.1 Get the Wix CSV too, if the dashboard is reachable

If you still have Wix dashboard access, export the product CSV from Wix Stores as well. It is the
authoritative record for prices and inventory, and it costs five minutes. **It does not remove the
need to scrape** — the CSV references images by URL rather than shipping the files, so the image
download below is required either way. Use the CSV to diff against the scrape; any disagreement is
a scraper bug.

### 1.2 Crawl

Seed from `/store-products-sitemap.xml` (already saved as `recon/product-urls.txt`). For each URL:
fetch the HTML, pull the `productPage_HUF_<slug>` blob, keep the raw JSON *and* a slimmed record.

**Keep the raw HTML of all 150 pages.** It is ~150 MB and it means a mistake in the parser never
requires re-hitting the site.

Known gotcha, already hit and fixed: **28 product slugs contain accented Hungarian characters**
(`téli`, `nyári`). They must be percent-encoded before the request or the fetch dies with an ASCII
codec error. `recon/scrape.py` handles this.

Rate: ~0.5–1 s between requests, one worker. 150 pages ≈ 3 minutes. This is a small site on
Cloudflare; there is no reason to hammer it.

### 1.3 Download original images

For every `media[]` entry, GET `https://static.wixstatic.com/media/<id>` and store under a
content-addressed key. Expect ~400–600 files, ~400 MB–1 GB. Record `width`/`height` from the
product JSON so the new site can set correct `<Image>` dimensions without re-probing.

Verify each download: non-zero length, decodes as an image, and dimensions match the recorded
`width`/`height`. Log mismatches rather than silently accepting.

### 1.4 Parse specs out of free text

This is the part that needs judgement and should not be fully automated.

Specs currently live in prose in the description. Real example:

> `9x20 et38` / `66-os agy` / `Sérülés és javítás mentesek`

That is width 9", diameter 20", ET 38, centre bore 66 mm. Titles carry more
(`Audi 20" 5x112` → make Audi, diameter 20, bolt pattern 5x112), and tire titles are regular
(`Nexen 235/55r18 téli` → brand, 235 mm, 55 aspect, 18", winter).

Approach: regex what is reliably regexable (title fields, `\d+x\d+` bolt patterns, `et\d+`,
`\d{3}/\d{2}r\d{2}`, `\d+-os agy`), emit a **confidence flag per field**, and dump everything to a
review CSV. Hand-check the ~150 rows — it is an hour of work and it is the difference between
filters that work and filters that quietly lie. Do not let a regex guess silently become a
database fact.

### 1.5 Outputs

```
export/
  raw/<slug>.html            # untouched source, 150 files
  products.json              # full extracted records
  products.review.csv        # parsed specs + confidence flags, for human review
  categories.json            # 75 categories (already captured)
  images/<sha256>.jpg        # originals
  manifest.json              # slug → images, dimensions, checksums
  redirects.csv              # old URL → new URL, all 231 public URLs
```

### 1.6 Snapshot drift

Stock turns over — sets sell, new ones arrive. The scrape is a point-in-time snapshot, so either
freeze listing changes on Wix during cutover, or re-run the scrape immediately before DNS switch and
import the delta. Re-running is cheap by design; plan on doing it.

---

## 2. Data model and admin

### 2.1 The key decision: replace 75 flat categories with typed attributes

The current 75 categories are really **six independent dimensions** flattened into one list:

| Dimension | Values on the live site |
|---|---|
| Type | Felnik, Gumiabrocs, All Products |
| Diameter | 13"–22" |
| Bolt pattern | 4x98, 4x100, 4x108, 5x98, 5x100, 5x108, 5x110, 5x112, 5x114,3, 5x115, 5x120, 5x130 |
| Car make | Audi, BMW, Mercedes, VW, Volvo, Porsche, … (~35) |
| Wheel brand | BBS, OZ, Borbet, Brock, Dezent, ATS, AEZ, Ronal, Alutec, Advanti, TEC, ABT, Breyton, Japan Racing |
| Tire season | Nyári, Téli, Négy évszakos |

The live filter sidebar already exposes exactly these — *Ár, Átmérő, Márka, Évszak, Méret,
Osztókör* — so the site is straining against its own data model. Every new listing today means
hand-ticking 4–6 category checkboxes, and forgetting one makes the listing invisible to that
filter.

Model them as columns. Categories and filters then become **derived queries**, which kills defects
2–6 above by construction.

```sql
listing
  id, slug, kind ('wheel' | 'tire'), title, description_html,
  price_huf, compare_price_huf,
  status ('active' | 'reserved' | 'sold' | 'hidden'),
  quantity,                        -- 4-es szett / darab
  condition,                       -- új / használt
  seo_title, seo_description,
  created_at, updated_at, sold_at,
  legacy_wix_id, legacy_slug       -- keep: makes redirects and re-import trivial

wheel_spec   (listing_id PK)
  diameter_in, width_in, bolt_pattern, offset_et, centre_bore_mm,
  car_make, wheel_brand, finish

tire_spec    (listing_id PK)
  width_mm, aspect, diameter_in, season, tire_brand,
  dot_year, tread_mm, load_index, speed_rating

listing_image
  listing_id, storage_key, position, width, height, alt
```

Index `(kind, status, diameter_in)`, `(kind, status, bolt_pattern)`, `(car_make)`, `(price_huf)`.
At 150 rows none of this matters for speed; it matters when the catalog is 1500.

### 2.2 Admin page

One authenticated user (the owner). Email+password or a magic link — do not build user accounts
for a single operator.

**The listing form is the whole product.** The owner is realistically standing in a workshop with a
phone, having just photographed a set of wheels. Optimise for that, not for a generic CMS grid.

- **Kind toggle first** — wheel or tire — because it changes every subsequent field. Show only the
  relevant spec block.
- **Photo upload before anything else.** Multi-select from camera roll, drag-to-reorder,
  first image is the cover, client-side resize before upload so a phone on 4G isn't shipping 8 MB
  originals. This is the slowest step in creating a listing; make it the one that works best.
- **Spec fields as selects, not free text** — diameter, bolt pattern, make, brand, season are all
  closed sets. Typing is where `5x114,3` vs `5x114.3` vs `5x1143` comes from.
- **Auto-generate title and slug** from the specs (`Audi 20" 5x112`), with an override. This is
  exactly how the current titles already read, so the convention is preserved for free.
- **Live preview** of the product card and product page beside the form.
- **Sold in one tap.** A wheel shop's most frequent admin action is not creating a listing, it is
  marking one sold. Put it on the list view, not three clicks deep. Keep sold listings in the
  database with `sold_at` — they are the only sales history this business will have.
- **Duplicate listing.** Stock arrives in near-identical sets; cloning a listing and changing two
  fields beats retyping ten.

Admin list view: search, filter by status/kind, sort by created/price, bulk status change.

Out of scope unless asked: orders, inventory counts, customer accounts, discounts.

### 2.3 Build it, don't adopt a CMS

A schema-driven admin (Payload, Sanity, Directus) gets you a panel for free, but the form above —
kind-conditional spec blocks, phone-first photo reordering, auto-derived titles, one-tap sold — is
precisely the part a generic admin does badly, and you end up fighting it. The custom version is a
few hundred lines against a schema you control. Payload is the fallback if the admin turns out to
need to grow a lot of surface fast.

---

## 3. Match the look, web and mobile

Reference screenshots at 1440px and 390px are in `recon/shots/` (home, category, product × desktop,
mobile). Note the desktop homepage capture shows two galleries overlapping — that is a headless
rendering artifact from screenshotting mid-layout, not a real defect; they are sequential sections.

### 3.1 Extracted design tokens

| Token | Value |
|---|---|
| Text / near-black | `#2B2B2B` |
| Brand red | `#D22730` (also `#DF3131`) |
| Background | `#FFFFFF` |
| Borders, dividers, inactive | `#C9C9C9` |
| Headings | bold rounded geometric sans; Wix serves Nunito/Oswald variants |
| Body | same family, lighter weight |
| Price format | `330 000 Ft` — space as thousands separator, `Ft` suffix |

(`#116dff` and `#3899ec` also appear in the HTML; those are Wix editor chrome, not site colours.)

### 3.2 Layouts to reproduce

**Header.** Desktop: logo left, horizontal nav right — *Főoldal · Felnik · Gumik · Elérhetőség* —
active item in red. Mobile: centred logo, hamburger right, full-screen drawer.

**Home.** A long one-pager: "Összes felni/komplett szett" gallery (paginated, 7 pages) →
"Gumiabroncsok" gallery → red `#D22730` **Szállítás** block with white text and the delivery van
photo, subsection "1. Személyes átadás" → contact. Nav items are anchors into this page.

**Gallery / category.** Desktop: left filter sidebar — *Ár* (range slider, observed 25 000–300 000 Ft
and 80 000–1 300 000 Ft on the two galleries), *Átmérő*, *Márka*, *Évszak*, *Méret*, *Osztókör* —
with a 4-column product grid and numbered pagination. Mobile: a **Szűrő** button opening a drawer,
2-column grid.

**Card.** Square image on a light grey backdrop, bold title, price beneath.

**Product.** Desktop: vertical thumbnail strip on the left, main image centre, right column with
title, price, description and an `Olvass tovább!` expander. Mobile: swipeable image carousel with
dot indicators, then title, price, description.

**Footer.** `OF Felni Kft. - Minden jog fenntartva <year>` — compute the year.

### 3.3 Two things to change rather than copy

- **Add a CTA to the product page.** There is currently no way to act on a listing. A phone link,
  Messenger/WhatsApp, or a short enquiry form sending `listing + name + phone` to email. Decide
  whether the new site takes orders at all (see open question 1).
- **Fix the nav.** `Felnik` and `Gumik` should be real pages, not anchors into a paginated
  homepage. It costs nothing in the new architecture and makes both URLs linkable and indexable.

### 3.4 Stack

Next.js (App Router) + TypeScript + Tailwind, Postgres (Neon or Supabase), Drizzle, images on
Cloudflare R2 or Supabase Storage behind `next/image`, deployed on Vercel. 150 listings is small
enough that every public page can be statically generated and revalidated on publish, which makes
the site fast and effectively free to host.

---

## 4. SEO and cutover

231 public URLs are currently indexed. Map every one.

| Old | New |
|---|---|
| `/product-page/<slug>` | `/felni/<slug>` or `/gumi/<slug>` |
| `/category/<slug>` | `/felnik/<facet>` / `/gumik/<facet>` / `/marka/<make>` |
| `/bmw`, `/copy-of-*` | `/marka/<correct-make>` — and these finally point at the right brand |

All 301, generated from `redirects.csv` which falls out of the scrape. Keep `legacy_slug` on each
listing so the redirect table can be regenerated at any time.

Also: new `sitemap.xml`, `robots.txt`, JSON-LD `Product` on every listing (match the existing
shape — it is already correct), Open Graph tags, `hreflang`/`lang="hu"`, and Search Console
verification on the new deployment *before* DNS switch.

Cutover: deploy to a staging domain → verify all 231 redirects resolve → re-scrape for delta →
import → switch DNS → keep the Wix site alive but unindexed for a few weeks as a fallback.

---

## 5. Sequence

| Phase | Work | Rough effort |
|---|---|---|
| 0 | Answer the open questions below; confirm Wix dashboard access | — |
| 1 | Full scrape: 150 products, images, categories, redirect map | 0.5–1 day |
| 1b | Spec parsing + **human review** of the 150-row CSV | 0.5 day |
| 2 | Next.js skeleton, schema, importer | 1 day |
| 3 | Public site: home, gallery + filters, product, contact — desktop and mobile | 2–3 days |
| 4 | Admin: auth, listing CRUD, photo upload, sold toggle | 2 days |
| 5 | SEO, redirects, staging verification, cutover | 1 day |

Phase 1 is the one that is already de-risked — the extractor works end to end. Phase 3 is the
largest and the one where the screenshots earn their keep.

---

## 6. Open questions

1. **Does the new site sell, or does it generate enquiries?** The current product pages have no
   add-to-cart and no contact CTA, yet Wix cart/checkout/thank-you pages exist in the site
   structure. This changes the scope of phases 3 and 4 substantially — decide before phase 2.
2. **Wix dashboard access?** Determines whether the CSV cross-check is available.
3. **Hungarian only, or is English wanted later?** Cheap to leave room for now, expensive to retrofit.
4. **Who hosts and owns the domain record**, and what is the acceptable downtime window for the
   DNS switch?
5. **Keep the Wix subscription running during transition** as a rollback, or hard cut?

---

## Where the artifacts ended up

| Artifact | Location |
|---|---|
| The extractor | `scripts/scrape-wix.py` |
| 150 products, 75 categories, crawl seed | `data/wix-export/` |
| Reference screenshots of the old Wix site | `.context/recon/shots/` (not committed — large, and reproducible) |

**Status: implemented.** This plan was executed; see [`../README.md`](../README.md) for the
result and [`DEPLOY.md`](DEPLOY.md) for the Supabase and Vercel setup. The scrape ran
150/150 with zero failures.

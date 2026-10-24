# Wix catalog export

The source data for `npm run db:import`, scraped from the live Wix site on 2026-10-24
by `scripts/scrape-wix.py`.

| File | What it is |
|---|---|
| `products.json` | 150 listings — name, slug, description, price, category ids, media |
| `categories.json` | all 75 Wix categories with ids, names and slugs |
| `product-urls.txt` | the crawl seed, taken from `/store-products-sitemap.xml` |

Committed deliberately: the import is reproducible from a fresh clone without re-scraping,
and this is the only record of what the Wix catalog contained at migration time.

To refresh it before the DNS switch (stock turns over while the Wix site is still live):

```bash
curl -s https://www.olifelni.com/store-products-sitemap.xml \
  | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' > data/wix-export/product-urls.txt
python3 scripts/scrape-wix.py data/wix-export/product-urls.txt
npm run db:import
```

Image files are not stored here — `products.json` records each image's
`static.wixstatic.com` URL, and the importer downloads them.

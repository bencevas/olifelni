-- Manual display order, set from the up/down buttons in the admin list. Higher shows first.
-- Seeded from created_at, so the newest-first order the site had before is kept as is.

ALTER TABLE "listings" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "listings" SET "sort_order" = s.n
FROM (SELECT "id", row_number() OVER (ORDER BY "created_at", "id") AS n FROM "listings") s
WHERE "listings"."id" = s."id";

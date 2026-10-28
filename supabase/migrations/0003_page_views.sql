-- Visitor stats for the admin. See pageViews in src/lib/db/schema.ts for what is stored.

CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"path" text NOT NULL,
	"visitor" text NOT NULL,
	"referrer" text,
	"mobile" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX "page_views_created_idx" ON "page_views" USING btree ("created_at");--> statement-breakpoint
-- Same as every other table (see 0001_rls.sql): closed to Supabase's public API.
ALTER TABLE "page_views" ENABLE ROW LEVEL SECURITY;

-- Supabase exposes every table in `public` through PostgREST using the anon key.
-- This app never uses that API: it talks to Postgres directly over DATABASE_URL as the
-- table owner, and owners bypass RLS. So enabling RLS with no policies closes the public
-- API completely while leaving the app untouched.
--
-- Net effect: if the anon key ever leaks, it reads nothing.

ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "listing_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;

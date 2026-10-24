CREATE TYPE "public"."item_condition" AS ENUM('new', 'used');--> statement-breakpoint
CREATE TYPE "public"."listing_kind" AS ENUM('wheel', 'tire');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'reserved', 'sold', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."tire_season" AS ENUM('summer', 'winter', 'all_season');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"listing_title" text,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"message" text DEFAULT '' NOT NULL,
	"handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "listing_kind" NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_huf" integer NOT NULL,
	"status" "listing_status" DEFAULT 'active' NOT NULL,
	"quantity" smallint DEFAULT 4 NOT NULL,
	"condition" "item_condition" DEFAULT 'used' NOT NULL,
	"diameter_in" numeric(4, 1),
	"width_in" numeric(4, 1),
	"bolt_pattern" text,
	"offset_et" integer,
	"centre_bore_mm" numeric(5, 1),
	"car_make" text,
	"wheel_brand" text,
	"tire_width_mm" integer,
	"tire_aspect" integer,
	"season" "tire_season",
	"tire_brand" text,
	"dot_year" integer,
	"tread_mm" numeric(3, 1),
	"legacy_wix_id" text,
	"legacy_slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sold_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_created_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_handled_idx" ON "leads" USING btree ("handled");--> statement-breakpoint
CREATE INDEX "listing_images_listing_idx" ON "listing_images" USING btree ("listing_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_slug_key" ON "listings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "listings_kind_status_idx" ON "listings" USING btree ("kind","status");--> statement-breakpoint
CREATE INDEX "listings_diameter_idx" ON "listings" USING btree ("diameter_in");--> statement-breakpoint
CREATE INDEX "listings_bolt_pattern_idx" ON "listings" USING btree ("bolt_pattern");--> statement-breakpoint
CREATE INDEX "listings_car_make_idx" ON "listings" USING btree ("car_make");--> statement-breakpoint
CREATE INDEX "listings_price_idx" ON "listings" USING btree ("price_huf");--> statement-breakpoint
CREATE INDEX "listings_legacy_slug_idx" ON "listings" USING btree ("legacy_slug");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
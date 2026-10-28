import {
  pgTable, pgEnum, uuid, text, integer, smallint, numeric,
  timestamp, boolean, index, uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Stable English keys in the database, Hungarian labels in the UI (see src/lib/labels.ts).
 * Keeps the schema readable for future maintainers without hardcoding display text.
 */
export const listingKind = pgEnum("listing_kind", ["wheel", "tire"]);
export const listingStatus = pgEnum("listing_status", ["active", "reserved", "sold", "hidden"]);
export const tireSeason = pgEnum("tire_season", ["summer", "winter", "all_season"]);
export const itemCondition = pgEnum("item_condition", ["new", "used"]);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    kind: listingKind("kind").notNull(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    priceHuf: integer("price_huf").notNull(),
    status: listingStatus("status").default("active").notNull(),
    quantity: smallint("quantity").default(4).notNull(),
    condition: itemCondition("condition").default("used").notNull(),

    // Shared by both kinds: rim diameter in inches (wheel 18", tire ...R18).
    diameterIn: numeric("diameter_in", { precision: 4, scale: 1, mode: "number" }),

    // Wheel-only
    widthIn: numeric("width_in", { precision: 4, scale: 1, mode: "number" }),
    boltPattern: text("bolt_pattern"),
    offsetEt: integer("offset_et"),
    centreBoreMm: numeric("centre_bore_mm", { precision: 5, scale: 1, mode: "number" }),
    carMake: text("car_make"),
    wheelBrand: text("wheel_brand"),

    // Tire-only
    tireWidthMm: integer("tire_width_mm"),
    tireAspect: integer("tire_aspect"),
    season: tireSeason("season"),
    tireBrand: text("tire_brand"),
    dotYear: integer("dot_year"),
    treadMm: numeric("tread_mm", { precision: 3, scale: 1, mode: "number" }),

    // Provenance from the Wix site, so redirects and re-imports stay possible.
    legacyWixId: text("legacy_wix_id"),
    legacySlug: text("legacy_slug"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }),

    // Manual display order from the admin list's up/down buttons. Higher shows first.
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [
    uniqueIndex("listings_slug_key").on(t.slug),
    index("listings_kind_status_idx").on(t.kind, t.status),
    index("listings_diameter_idx").on(t.diameterIn),
    index("listings_bolt_pattern_idx").on(t.boltPattern),
    index("listings_car_make_idx").on(t.carMake),
    index("listings_price_idx").on(t.priceHuf),
    index("listings_legacy_slug_idx").on(t.legacySlug),
  ],
);

export const listingImages = pgTable(
  "listing_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    position: integer("position").default(0).notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt"),
  },
  (t) => [index("listing_images_listing_idx").on(t.listingId, t.position)],
);

/**
 * One row per public page view, for the admin's visitor stats. No cookies and no raw IP:
 * `visitor` is a hash of IP + browser + a secret + the day, so a person counts once per
 * day and cannot be followed from one day to the next.
 */
export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    path: text("path").notNull(),
    visitor: text("visitor").notNull(),
    /** Hostname of the external site the visit came from; null when direct or unknown. */
    referrer: text("referrer"),
    mobile: boolean("mobile").default(false).notNull(),
    /** Null for a page view; otherwise the contact action taken on `path` (see TRACKED_EVENTS). */
    event: text("event"),
  },
  (t) => [index("page_views_created_idx").on(t.createdAt)],
);

/** Contact-form submissions. This site generates leads; it does not sell. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
    listingTitle: text("listing_title"),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    message: text("message").default("").notNull(),
    handled: boolean("handled").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("leads_created_idx").on(t.createdAt), index("leads_handled_idx").on(t.handled)],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("admin_users_email_key").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingImage = typeof listingImages.$inferSelect;
export type Lead = typeof leads.$inferSelect;

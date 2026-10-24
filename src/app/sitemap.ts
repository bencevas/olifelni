import type { MetadataRoute } from "next";
import { ne } from "drizzle-orm";
import { db, listings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const rows = await db
    .select({
      slug: listings.slug,
      kind: listings.kind,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .where(ne(listings.status, "hidden"));

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/felnik`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/gumik`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/kapcsolat`, changeFrequency: "monthly", priority: 0.5 },
    ...rows.map((l) => ({
      url: `${base}/${l.kind === "wheel" ? "felni" : "gumi"}/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

import { permanentRedirect, notFound } from "next/navigation";
import { getListingByLegacySlug } from "@/lib/listings";

/**
 * The Wix site published every listing under /product-page/<slug>, and those URLs are
 * indexed. Each listing keeps its old slug in legacy_slug, so this resolves the old URL
 * and 301s to the new one rather than serving a 404 to existing search traffic.
 */
export default async function LegacyProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getListingByLegacySlug(decodeURIComponent(slug));
  if (!found) notFound();
  permanentRedirect(`/${found.kind === "wheel" ? "felni" : "gumi"}/${found.slug}`);
}

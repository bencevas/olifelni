import type { Metadata } from "next";
import { ListingDetail } from "@/components/listing-detail";
import { getListingBySlug } from "@/lib/listings";
import { huf } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l) return { title: "Nem található" };
  return {
    title: l.title,
    description: l.description?.slice(0, 160) || `${l.title} — ${huf(l.priceHuf)}`,
    openGraph: {
      title: l.title,
      description: l.description?.slice(0, 160),
      images: l.images.slice(0, 1).map((i) => i.url),
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <ListingDetail slug={slug} kind="tire" />;
}

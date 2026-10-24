import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, listings, listingImages } from "@/lib/db";
import { publicUrl } from "@/lib/storage";
import { ListingForm, type ListingFormValues } from "@/components/admin/listing-form";
import { DangerZone } from "@/components/admin/danger-zone";

const str = (v: number | string | null | undefined) => (v == null ? "" : String(v));

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [l] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!l) notFound();

  const imgs = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, id))
    .orderBy(asc(listingImages.position));

  const initial: ListingFormValues = {
    id: l.id,
    kind: l.kind,
    title: l.title,
    slug: l.slug,
    description: l.description,
    priceHuf: l.priceHuf,
    status: l.status,
    quantity: l.quantity,
    condition: l.condition,
    diameterIn: str(l.diameterIn),
    widthIn: str(l.widthIn),
    boltPattern: str(l.boltPattern),
    offsetEt: str(l.offsetEt),
    centreBoreMm: str(l.centreBoreMm),
    carMake: str(l.carMake),
    wheelBrand: str(l.wheelBrand),
    tireWidthMm: str(l.tireWidthMm),
    tireAspect: str(l.tireAspect),
    season: str(l.season),
    tireBrand: str(l.tireBrand),
    dotYear: str(l.dotYear),
    treadMm: str(l.treadMm),
    images: imgs.map((i) => ({
      key: i.storageKey,
      width: i.width ?? 1000,
      height: i.height ?? 1000,
      url: publicUrl(i.storageKey),
    })),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Hirdetés szerkesztése</h1>
        <Link
          href={`/${l.kind === "wheel" ? "felni" : "gumi"}/${l.slug}`}
          target="_blank"
          className="text-sm font-bold text-brand hover:underline"
        >
          Megtekintés az oldalon ↗
        </Link>
      </div>

      <ListingForm initial={initial} />
      <DangerZone id={l.id} />
    </div>
  );
}

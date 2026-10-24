import { ListingForm, EMPTY_LISTING } from "@/components/admin/listing-form";

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold">Új hirdetés</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Töltsd ki a lépéseket. A csillaggal jelölt mezők kötelezőek.
      </p>
      <ListingForm initial={EMPTY_LISTING} />
    </div>
  );
}

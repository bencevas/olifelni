import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog-page";
import type { RawParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Gumiabroncsok",
  description:
    "Téli, nyári és négy évszakos gumiabroncsok prémium gyártóktól. Szűrj méret, évszak és gyártó szerint.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  return (
    <CatalogPage
      kind="tire"
      title="Gumiabroncsok"
      intro="Téli, nyári és négy évszakos gumiabroncsok. Szűrj méret, évszak vagy gyártó szerint."
      raw={await searchParams}
    />
  );
}

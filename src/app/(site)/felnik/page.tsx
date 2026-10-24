import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog-page";
import type { RawParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Felnik",
  description:
    "Gyári és utángyártott alufelni szettek 13-tól 22 colig, minden gyakori osztókörrel. Szűrj átmérő, osztókör és márka szerint.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  return (
    <CatalogPage
      kind="wheel"
      title="Felnik"
      intro="Gyári és utángyártott alufelni szettek. Szűrj átmérő, osztókör vagy márka szerint."
      raw={await searchParams}
    />
  );
}

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: "Az oldal nem található",
  robots: { index: false, follow: true },
};

/**
 * Catches URLs that match no route at all. Next renders this inside the root layout,
 * which has no chrome of its own, so the header and footer are added here.
 */
export default function RootNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}

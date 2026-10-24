import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: "Az oldal nem található",
  robots: { index: false, follow: true },
};

/** For notFound() raised inside a site page — a sold-and-deleted listing slug, say. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}

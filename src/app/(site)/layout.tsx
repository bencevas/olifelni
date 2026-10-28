import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CallButton } from "@/components/call-button";
import { PageViewBeacon } from "@/components/page-view-beacon";

/**
 * Public site chrome. The admin lives outside this group so it does not inherit the
 * customer-facing header, nav and footer.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CallButton />
      <PageViewBeacon />
    </>
  );
}

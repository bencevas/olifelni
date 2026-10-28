"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Reports each public page view to /api/pv for the admin's visitor stats. Fire-and-forget:
 * sendBeacon does not hold up the page, and nothing here can break it.
 */
export function PageViewBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    // Effects can run twice for one page (React does it deliberately in development);
    // a page is only reported once.
    if (last.current === pathname) return;
    // document.referrer stays the same across client-side navigation, so only the first
    // page of a visit says where the visitor came from.
    const referrer = last.current === null ? document.referrer : "";
    last.current = pathname;

    const body = JSON.stringify({ path: pathname, referrer });
    const sent = navigator.sendBeacon?.("/api/pv", new Blob([body], { type: "application/json" }));
    if (!sent) {
      fetch("/api/pv", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "content-type": "application/json" },
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}

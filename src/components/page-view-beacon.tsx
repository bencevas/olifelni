"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { TrackedEvent } from "@/lib/tracking";

function send(payload: { path: string; referrer?: string; event?: TrackedEvent }) {
  const body = JSON.stringify(payload);
  const sent = navigator.sendBeacon?.("/api/pv", new Blob([body], { type: "application/json" }));
  if (!sent) {
    fetch("/api/pv", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => {});
  }
}

/** Records a contact action against the page it happened on. */
export function trackEvent(event: TrackedEvent) {
  send({ path: location.pathname, event });
}

/** Which links count as getting in touch, by where they lead. */
function eventFor(href: string): TrackedEvent | null {
  if (href.startsWith("tel:")) return "call";
  if (href.startsWith("mailto:")) return "email";
  if (/maps\.google\.|google\.[a-z.]+\/maps|maps\.apple\.com/.test(href)) return "maps";
  return null;
}

/**
 * Reports each public page view, and each click on a phone, e-mail or directions link, to
 * /api/pv for the admin's visitor stats. Fire-and-forget: sendBeacon does not hold up the
 * page, and nothing here can break it.
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
    send({ path: pathname, referrer });
  }, [pathname]);

  // One listener for the whole site, so every phone number and e-mail link is covered,
  // including ones added later.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const event = link && eventFor(link.getAttribute("href") ?? "");
      if (event) trackEvent(event);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

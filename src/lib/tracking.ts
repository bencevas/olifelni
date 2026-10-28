/**
 * The clicks worth counting: the ways a visitor gets in touch. Its own module, free of
 * imports, so the browser-side beacon can use it without pulling in the database code.
 */
export const TRACKED_EVENTS = ["call", "email", "maps", "enquiry"] as const;
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

export const EVENT_LABEL: Record<TrackedEvent, string> = {
  call: "Hívás gomb",
  email: "E-mail",
  maps: "Útvonaltervezés",
  enquiry: "Üzenetet küldött",
};

"use server";

import { z } from "zod";
import { db, leads } from "@/lib/db";

const LeadSchema = z.object({
  name: z.string().trim().min(2, "Kérlek add meg a neved."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Érvénytelen e-mail cím.").optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  listingId: z.string().uuid().optional().or(z.literal("")),
  listingTitle: z.string().trim().max(200).optional().or(z.literal("")),
  // Honeypot: a real person never fills a hidden field, bots fill everything.
  // Accept any value here and drop it below — a schema error would hand the bot a
  // message naming the exact field that caught it.
  website: z.string().optional(),
});

export type LeadState = { ok: boolean; error?: string };

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = LeadSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Hibás adatok." };
  }
  const d = parsed.data;

  if (d.website) return { ok: true }; // silently drop bots

  if (!d.phone && !d.email) {
    return { ok: false, error: "Adj meg telefonszámot vagy e-mail címet, hogy válaszolni tudjunk." };
  }

  await db.insert(leads).values({
    listingId: d.listingId || null,
    listingTitle: d.listingTitle || null,
    name: d.name,
    phone: d.phone || null,
    email: d.email || null,
    message: d.message ?? "",
  });

  return { ok: true };
}

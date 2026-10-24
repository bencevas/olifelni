import { SITE } from "./site";

/**
 * Emails the owner when a contact-form enquiry arrives.
 *
 * Optional: with no RESEND_API_KEY this is a no-op, and the lead still lands in the admin.
 * It exists because the admin is a pull interface — without a nudge, an enquiry can sit
 * unread for a day, which for a wheel set usually means the sale is gone.
 *
 * Uses Resend's HTTP API directly rather than an SDK; it is one POST.
 */

export type LeadNotification = {
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  listingTitle: string | null;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const emailConfigured = Boolean(
  process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_TO && process.env.LEAD_NOTIFY_FROM,
);

export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  if (!emailConfigured) return;

  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/erdeklodesek`;
  const subject = lead.listingTitle
    ? `Új érdeklődés: ${lead.listingTitle}`
    : "Új érdeklődés az oldalról";

  const rows: [string, string][] = [["Név", lead.name]];
  if (lead.phone) rows.push(["Telefon", lead.phone]);
  if (lead.email) rows.push(["E-mail", lead.email]);
  if (lead.listingTitle) rows.push(["Hirdetés", lead.listingTitle]);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;max-width:520px">
      <h2 style="color:#d22730;margin:0 0 16px">${esc(subject)}</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-size:15px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="color:#6b6b6b">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`,
          )
          .join("")}
      </table>
      ${lead.message ? `<p style="white-space:pre-line;font-size:15px">${esc(lead.message)}</p>` : ""}
      <p style="font-size:14px"><a href="${esc(adminUrl)}" style="color:#d22730">Megnyitás az adminban</a></p>
      <hr style="border:0;border-top:1px solid #e6e6e6;margin:20px 0">
      <p style="color:#6b6b6b;font-size:12px">${esc(SITE.name)}</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.LEAD_NOTIFY_FROM,
      to: process.env.LEAD_NOTIFY_TO!.split(",").map((s) => s.trim()),
      reply_to: lead.email ?? undefined,
      subject,
      html,
    }),
  });

  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${await res.text()}`);
}

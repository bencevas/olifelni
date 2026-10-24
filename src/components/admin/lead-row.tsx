"use client";

import { useTransition } from "react";
import { setLeadHandled } from "@/app/admin/actions";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  listingTitle: string | null;
  handled: boolean;
  createdAt: string;
};

export function LeadRow({ lead }: { lead: Lead }) {
  const [pending, start] = useTransition();

  const when = new Date(lead.createdAt).toLocaleString("hu-HU", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });

  return (
    <li className={`py-4 ${lead.handled ? "opacity-55" : ""}`}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-56 flex-1">
          <p className="font-bold">
            {lead.name}
            {lead.listingTitle && (
              <span className="ml-2 font-normal text-ink-soft">— {lead.listingTitle}</span>
            )}
          </p>
          <p className="mt-0.5 text-sm">
            {lead.phone && (
              <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="font-semibold text-brand-ink hover:underline">
                {lead.phone}
              </a>
            )}
            {lead.phone && lead.email && <span className="mx-2 text-rule">·</span>}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="font-semibold text-brand-ink hover:underline">
                {lead.email}
              </a>
            )}
          </p>
          {lead.message && <p className="mt-1.5 whitespace-pre-line text-sm text-ink-soft">{lead.message}</p>}
        </div>

        <p className="w-32 shrink-0 text-[13px] text-ink-soft">{when}</p>

        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => { void setLeadHandled(lead.id, !lead.handled); })}
          className="shrink-0 rounded-lg border border-rule px-4 py-2 text-sm font-bold hover:bg-sheet disabled:opacity-50"
        >
          {lead.handled ? "Visszanyit" : "Elintézve"}
        </button>
      </div>
    </li>
  );
}

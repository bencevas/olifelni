"use client";

import { useTransition } from "react";
import { moveListing } from "@/app/admin/actions";

const BUTTONS = [
  { to: "top", label: "Legelőre", path: "M5 4h10M6 12l4-4 4 4M10 8v9" },
  { to: "up", label: "Feljebb", path: "M5 12.5l5-5 5 5" },
  { to: "down", label: "Lejjebb", path: "M5 7.5l5 5 5-5" },
] as const;

/** Sets where a listing appears on the public site: one place up or down, or first. */
export function OrderControls({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex shrink-0 gap-1">
      {BUTTONS.map((b) => (
        <button
          key={b.to}
          type="button"
          disabled={pending}
          title={b.label}
          aria-label={b.label}
          onClick={() => start(() => moveListing(id, b.to))}
          className="grid h-9 w-9 place-items-center rounded-lg border border-rule text-ink-soft transition-colors hover:bg-sheet hover:text-ink disabled:opacity-50"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
            <path d={b.path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}

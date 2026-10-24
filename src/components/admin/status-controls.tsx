"use client";

import { useTransition } from "react";
import { setStatus } from "@/app/admin/actions";
import { STATUS_LABEL } from "@/lib/labels";

/**
 * Marking a set sold is the owner's most frequent action — far more frequent than creating
 * a listing — so it is one click from the list, not buried in the edit form.
 */
export function StatusControls({
  id,
  status,
}: {
  id: string;
  status: keyof typeof STATUS_LABEL;
}) {
  const [pending, start] = useTransition();

  const tone: Record<string, string> = {
    active: "border-green-600 text-green-700 bg-green-50",
    reserved: "border-amber-500 text-amber-700 bg-amber-50",
    sold: "border-ink text-ink bg-sheet",
    hidden: "border-rule text-ink-soft bg-surface",
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <select
        value={status}
        disabled={pending}
        aria-label="Státusz"
        onChange={(e) =>
          start(() => {
            void setStatus(id, e.target.value as keyof typeof STATUS_LABEL);
          })
        }
        className={`rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50 ${tone[status]}`}
      >
        {Object.entries(STATUS_LABEL).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      {status !== "sold" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => { void setStatus(id, "sold"); })}
          className="rounded-lg border border-rule px-3 py-2 text-sm font-bold hover:bg-sheet disabled:opacity-50"
        >
          Eladva
        </button>
      )}
    </div>
  );
}

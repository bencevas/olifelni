"use client";

import { useTransition } from "react";
import { deleteListing, duplicateListing } from "@/app/admin/actions";

export function DangerZone({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="mb-24 mt-4 flex flex-wrap gap-3 border-t border-rule-soft pt-6">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => { void duplicateListing(id); })}
        className="rounded-lg border border-rule px-5 py-2.5 font-bold hover:bg-sheet disabled:opacity-50"
      >
        Másolat készítése
      </button>
      <p className="w-full text-[13px] text-ink-soft sm:w-auto sm:flex-1 sm:self-center">
        A másolat rejtett állapotban jön létre, hogy nyugodtan átírhasd.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Biztosan törlöd ezt a hirdetést? Ez nem vonható vissza.")) {
            start(() => { void deleteListing(id); });
          }
        }}
        className="rounded-lg border border-brand px-5 py-2.5 font-bold text-brand hover:bg-brand/10 disabled:opacity-50"
      >
        Hirdetés törlése
      </button>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitLead, type LeadState } from "@/app/actions/lead";
import { SITE } from "@/lib/site";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand px-6 py-4 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "Küldés…" : "Üzenet küldése"}
    </button>
  );
}

export function LeadForm({
  listingId,
  listingTitle,
  compact = false,
}: {
  listingId?: string;
  listingTitle?: string;
  compact?: boolean;
}) {
  const [state, action] = useActionState<LeadState, FormData>(submitLead, { ok: false });

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-rule-soft bg-surface p-8 text-center">
        <p className="text-lg font-extrabold">Köszönjük, megkaptuk!</p>
        <p className="mt-1.5 text-ink-soft">
          Hamarosan keresünk. Ha sürgős, hívj minket:{" "}
          <a href={SITE.phoneHref} className="font-bold text-brand-ink">{SITE.phone}</a>
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-rule bg-surface px-3.5 py-3 text-[15px] transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form action={action} className="space-y-3">
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      {listingTitle && <input type="hidden" name="listingTitle" value={listingTitle} />}

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Név *</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Telefonszám</span>
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" className={field} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">E-mail</span>
        <input name="email" type="email" autoComplete="email" className={field} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Üzenet</span>
        <textarea
          name="message"
          rows={compact ? 3 : 4}
          className={field}
          defaultValue={listingTitle ? `Érdeklődöm a(z) "${listingTitle}" iránt.` : ""}
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm font-semibold text-brand-ink">
          {state.error}
        </p>
      )}

      <p className="text-[13px] text-ink-soft">
        Telefonszám vagy e-mail cím közül legalább az egyiket add meg.
      </p>

      <SubmitButton />
    </form>
  );
}

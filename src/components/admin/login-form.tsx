"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand px-6 py-3.5 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "Belépés…" : "Belépés"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  const field =
    "w-full rounded-xl border border-rule px-3.5 py-3 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-semibold">E-mail cím</span>
        <input name="email" type="email" required autoComplete="username" className={field} />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-semibold">Jelszó</span>
        <input
          name="password" type="password" required autoComplete="current-password" className={field}
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-brand/10 px-3.5 py-2.5 text-sm font-semibold text-brand-ink">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}

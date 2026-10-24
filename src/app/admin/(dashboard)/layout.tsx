import Link from "next/link";
import { Logo } from "@/components/logo";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { logoutAction } from "../actions";
import { db, leads } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/admin/belepes");

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(leads)
    .where(eq(leads.handled, false));
  const pending = Number(n);

  return (
    <div className="flex-1">
      <div className="border-b border-rule-soft bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo className="h-9" />
            <span className="sr-only">Adminisztráció</span>
          </Link>

          <nav className="flex items-center gap-5 text-[15px] font-semibold">
            <Link href="/admin" className="hover:text-brand">Hirdetések</Link>
            <Link href="/admin/erdeklodesek" className="hover:text-brand">
              Érdeklődések
              {pending > 0 && (
                <span className="ml-1.5 rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                  {pending}
                </span>
              )}
            </Link>
            <Link href="/" className="text-ink-soft hover:text-brand">Weboldal ↗</Link>
          </nav>

          <form action={logoutAction} className="ml-auto">
            <button type="submit" className="text-sm text-ink-soft hover:text-brand">
              Kilépés ({user.email})
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}

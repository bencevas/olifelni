import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";

export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Logo className="mb-8" />
      <h1 className="text-2xl font-extrabold">Belépés</h1>
      <p className="mt-1.5 text-ink-soft">Hirdetések kezeléséhez jelentkezz be.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}

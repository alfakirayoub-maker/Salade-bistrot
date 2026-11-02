import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getAdminEmail } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { isAdmin } = await getAdminEmail();
  if (isAdmin) redirect("/admin");
  const { erreur } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <Image src="/brand/logo-mark.png" alt="" width={372} height={450} className="h-12 w-auto self-start" priority />
      <p className="t-eyebrow mt-6 text-leaf-deep">Bistrot Salad Bar · Admin</p>
      <h1 className="t-h1 mt-2">Gérer le menu</h1>
      <p className="t-body mt-3 text-ink-soft">Recevez un lien de connexion par e-mail. Aucun mot de passe à retenir.</p>
      {erreur === "lien" && (
        <p role="alert" className="t-small mt-4 rounded-xl bg-red-50 p-3 text-red-800">
          Ce lien n&apos;est plus valable (déjà utilisé ou expiré). Demandez-en un nouveau.
        </p>
      )}
      <LoginForm />
    </main>
  );
}

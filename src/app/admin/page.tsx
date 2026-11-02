import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminEmail } from "@/lib/supabase/server";
import { rowsToItems } from "@/lib/menu/rows";
import { AdminMenu } from "@/components/admin/AdminMenu";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminPage() {
  const { supabase, email, isAdmin } = await getAdminEmail();
  if (!email) redirect("/admin/login");

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
        <h1 className="t-h2">Accès refusé</h1>
        <p className="t-body mt-3 text-ink-soft">
          L&apos;adresse <strong>{email}</strong> n&apos;est pas autorisée à modifier le menu.
        </p>
        <form action={signOut} className="mt-6">
          <button className="btn btn-primary w-full">Se déconnecter</button>
        </form>
      </main>
    );
  }

  // Fresh, uncached read: the admin always edits the current data.
  const { data, error } = await supabase.from("menu_items").select("*").order("sort_order");
  if (error) {
    return (
      <main className="mx-auto max-w-sm px-5 py-16">
        <h1 className="t-h2">Menu indisponible</h1>
        <p className="t-body mt-3 text-ink-soft">La base de données ne répond pas. Rechargez la page dans un instant.</p>
      </main>
    );
  }
  return <AdminMenu initialItems={rowsToItems(data)} email={email} />;
}

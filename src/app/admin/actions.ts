"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MENU_TAG } from "@/lib/supabase/config";
import { createSupabaseServerClient, getAdminEmail } from "@/lib/supabase/server";
import { rowToItem, slugify, uniqueId, validateItemInput, type ItemInput, type MenuItemRow } from "@/lib/menu/rows";
import type { MenuItem } from "@/lib/menu/types";

export type SaveResult =
  | { ok: true; item: MenuItem }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof ItemInput, string>> };

const DENIED = "Accès refusé : reconnectez-vous avec une adresse autorisée.";

/** Every write goes through RLS as the signed-in user; this check gives a clear message first. */
async function adminClient() {
  const { supabase, isAdmin } = await getAdminEmail();
  return isAdmin ? supabase : null;
}

const dbError = (message: string) =>
  message.includes("row-level security") ? DENIED : "La base de données a refusé la modification. Réessayez.";

export async function setAvailability(id: string, available: boolean): Promise<SaveResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: DENIED };
  const { data, error } = await supabase.from("menu_items").update({ available }).eq("id", id).select().single<MenuItemRow>();
  if (error || !data) return { ok: false, error: dbError(error?.message ?? "") };
  updateTag(MENU_TAG);
  return { ok: true, item: rowToItem(data) };
}

/** Creates an item when `id` is null, otherwise updates it. */
export async function saveItem(id: string | null, raw: Record<string, unknown>): Promise<SaveResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: DENIED };
  const parsed = validateItemInput(raw);
  if (!parsed.ok) return { ok: false, error: "Vérifiez les champs en rouge.", fieldErrors: parsed.errors };
  const input = parsed.value;

  if (id) {
    const { data, error } = await supabase.from("menu_items").update(input).eq("id", id).select().single<MenuItemRow>();
    if (error || !data) return { ok: false, error: dbError(error?.message ?? "") };
    updateTag(MENU_TAG);
    return { ok: true, item: rowToItem(data) };
  }

  const { data: existing, error: listError } = await supabase.from("menu_items").select("id, category, sort_order");
  if (listError) return { ok: false, error: dbError(listError.message) };
  const newId = uniqueId(slugify(input.name_fr), new Set((existing ?? []).map((r) => r.id as string)));
  // New items go to the end of their category unless an order was given.
  const lastOrder = Math.max(0, ...(existing ?? []).filter((r) => r.category === input.category).map((r) => r.sort_order as number));
  const row = { ...input, id: newId, sort_order: input.sort_order || lastOrder + 10 };
  const { data, error } = await supabase.from("menu_items").insert(row).select().single<MenuItemRow>();
  if (error || !data) return { ok: false, error: dbError(error?.message ?? "") };
  updateTag(MENU_TAG);
  return { ok: true, item: rowToItem(data) };
}

export async function deleteItem(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: DENIED };
  const { data, error } = await supabase.from("menu_items").delete().eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, error: dbError(error?.message ?? "row-level security") };
  updateTag(MENU_TAG);
  return { ok: true };
}

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

/** Sends a sign-in link. The answer is the same for any address (no account probing). */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Adresse e-mail invalide.", email };
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/admin/auth/callback` },
  });
  if (error) {
    const rateLimited = error.status === 429 || /rate limit/i.test(error.message);
    return {
      status: "error",
      email,
      message: rateLimited ? "Trop de demandes. Patientez une minute puis réessayez." : "Impossible d'envoyer le lien pour le moment.",
    };
  }
  return { status: "sent", email };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

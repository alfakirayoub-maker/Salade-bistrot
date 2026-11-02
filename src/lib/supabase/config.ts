/**
 * Public Supabase settings. The URL and the publishable key are meant to be
 * public (they ship to every browser); access is enforced by Row Level
 * Security in the database (supabase/migrations). Override them with
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://funoehzkjtlplboybqhi.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_JwCkk5eQ1EjMjHIaPn5F-Q_0LpaoOiv";

/** Cache tag of the public menu; admin writes expire it. */
export const MENU_TAG = "menu";

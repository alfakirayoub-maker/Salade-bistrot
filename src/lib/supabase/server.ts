import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Supabase client bound to the visitor's auth cookies (Server Components,
 * Server Actions, Route Handlers). Create one per request.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in admin's e-mail, or null (not signed in / not on the allowlist). */
export async function getAdminEmail() {
  const supabase = await createSupabaseServerClient();
  // getUser() asks the Auth server, so a forged cookie is never trusted.
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return { supabase, email: null, isAdmin: false } as const;
  // RLS only lets a user read their own row in public.admins.
  const { data: row } = await supabase.from("admins").select("email").eq("email", email).maybeSingle();
  return { supabase, email, isAdmin: !!row } as const;
}

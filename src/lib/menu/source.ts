/**
 * Server-side menu loader. Reads public.menu_items through Supabase's REST API
 * with the public key, cached under the "menu" tag (expired by admin writes).
 * Falls back to the menu bundled in data.ts if Supabase is unreachable, so
 * the site keeps working.
 */
import { MENU_ITEMS } from "./data";
import { rowsToItems } from "./rows";
import type { MenuItem } from "./types";
import { MENU_TAG, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?select=*&order=sort_order.asc`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      cache: "force-cache",
      // The tag gives instant updates after an admin save; the interval is a safety net.
      next: { tags: [MENU_TAG], revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`menu_items ${res.status}`);
    const items = rowsToItems(await res.json());
    if (items.length) return items;
  } catch (error) {
    console.warn("[menu] Supabase unavailable, using the bundled menu:", error instanceof Error ? error.message : error);
  }
  return MENU_ITEMS;
}

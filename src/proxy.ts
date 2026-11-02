import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSupabaseSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // The admin area is French-only and outside the /fr, /ar routes.
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    return updateSupabaseSession(request);
  }
  return intl(request);
}

export const config = {
  // Everything except API routes, Next internals and static files.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};

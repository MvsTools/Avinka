import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next.js 16 noemt dit "proxy" (voorheen "middleware"). Draait bij elke
// aanvraag: houdt de Supabase-sessie vers en beschermt /dashboard.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Draai op alle pagina's en API-routes, maar sla statische bestanden over.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

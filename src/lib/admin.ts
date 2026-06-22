// Admin-check vanaf de server. Een admin is een gewone gebruiker die ook in de
// `admins`-tabel staat. RLS staat alleen toe dat je je eigen admin-rij ziet,
// dus dit lekt niets over andere gebruikers.
import { createClient } from "@/utils/supabase/server";

export async function isAdminServer(): Promise<boolean> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

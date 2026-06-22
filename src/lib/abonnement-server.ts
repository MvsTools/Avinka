// Abonnement uitlezen vanaf de SERVER (server components + API-routes).
// De browser-variant staat in db.ts (getAbonnement); deze gebruikt de
// server-Supabaseclient. Beide delen dezelfde mapper uit lib/abonnement.
import { createClient } from "@/utils/supabase/server";
import {
  type Abonnement,
  type AbonnementRow,
  ABON_COLS,
  mapAbonnementRow,
} from "@/lib/abonnement";

export async function getAbonnementServer(): Promise<Abonnement> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("instellingen")
    .select(ABON_COLS)
    .maybeSingle();
  if (error || !data) return mapAbonnementRow(null);
  return mapAbonnementRow(data as AbonnementRow);
}

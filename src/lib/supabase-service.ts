import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// De servicesleutel: een verbinding met de database die ALLE beveiliging
// omzeilt — RLS én het fraude-slot op `instellingen` (de trigger
// `instellingen_bewaakt`, zie database/migratie-fraude-slot.sql).
//
// ⚠️ Daarom mag deze functie alleen in serverbestanden worden aangeroepen
// (route handlers, server actions). Nooit in een component die de browser
// ophaalt, en de sleutel nooit met NEXT_PUBLIC_ ervoor.
//
// Waarvoor: het abonnement vastleggen na een betaling, en de dagelijkse taak
// die de proefherinnering verstuurt. Alles wat een gebruiker over zichzelf mag
// zeggen, blijft gewoon via zijn eigen ingelogde verbinding lopen.
//
// Geeft null als de sleutel niet is ingesteld. De aanroeper moet dat behandelen
// als "er is niets vastgelegd" en dat ook laten merken — nooit stilzwijgend
// doorgaan alsof het gelukt is.
export function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sleutel) return null;
  return createClient(url, sleutel, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

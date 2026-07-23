import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase-client voor code die in de BROWSER draait (client components).
// Leest de sleutels uit de NEXT_PUBLIC_-variabelen; die mogen openbaar zijn.
//
// We houden ÉÉN gedeelde client aan (singleton), zoals Supabase aanraadt. Anders
// maakt elke aanroep een verse client die z'n sessie nog moet laden; een RLS-query
// die meteen daarna afgaat, draait dan ongeauthenticeerd en krijgt (terecht) niets
// terug. Eén gedeelde client warmt de sessie één keer op en houdt 'm warm.
// Het type expliciet erbij: zonder deze aanduiding weet TypeScript niet wat er
// uit de client komt en werd bijvoorbeeld `data` uit getUser() stilletjes "any".
let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return browserClient;
}

import { createBrowserClient } from "@supabase/ssr";

// Supabase-client voor code die in de BROWSER draait (client components).
// Leest de sleutels uit de NEXT_PUBLIC_-variabelen; die mogen openbaar zijn.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

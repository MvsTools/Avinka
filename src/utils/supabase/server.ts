import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase-client voor code die op de SERVER draait (server components,
// server actions, route handlers). Leest en schrijft de sessie via cookies.
// In Next.js 16 is cookies() asynchroon, vandaar het await.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll wordt aangeroepen vanuit een server component waar je
            // geen cookies mag schrijven. De middleware ververst de sessie al,
            // dus dit mag je hier veilig negeren.
          }
        },
      },
    },
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ABON_COLS,
  type AbonnementRow,
  BETALINGEN_LIVE,
  mapAbonnementRow,
  magToolGebruiken,
  magBestandenGebruiken,
  heeftToegang,
} from "@/lib/abonnement";

// Draait bij elke aanvraag (zie src/middleware.ts). Twee taken:
// 1. De ingelogde sessie vers houden (tokens verversen) via cookies.
// 2. Wie niet is ingelogd weren van beschermde pagina's (alles onder /dashboard).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // BELANGRIJK: niets tussen createServerClient en getUser() zetten — anders
  // kunnen gebruikers willekeurig uitgelogd worden.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Niet ingelogd én op een beschermde pagina? Stuur naar het inlogscherm.
  // Zowel het dashboard als de tools zelf (/tools/...) zitten achter de login.
  const pad = request.nextUrl.pathname;
  const isBeschermd =
    pad.startsWith("/dashboard") || pad.startsWith("/tools") || pad.startsWith("/admin");
  if (!user && isBeschermd) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Admin-gedeelte: alleen voor wie in de admins-tabel staat (RLS laat je alleen
  // je eigen rij zien). Niet-admins gaan terug naar hun eigen dashboard.
  if (user && pad.startsWith("/admin")) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!adminRow) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Tier-afscherming. Alleen actief als betalingen live zijn (anders kan
  // iedereen alles — de testfase). We lezen de abonnementsstand één keer en
  // sturen waar nodig naar het abonnement-scherm.
  if (user && BETALINGEN_LIVE && isBeschermd) {
    const opAbonnement = pad === "/dashboard/abonnement";
    const { data: abonRow } = await supabase
      .from("instellingen")
      .select(ABON_COLS)
      .eq("user_id", user.id)
      .maybeSingle();
    const ab = mapAbonnementRow(abonRow as AbonnementRow | null);

    // Proef voorbij én geen lopend abonnement? Stuur de leerkracht meteen naar
    // het abonnement-scherm (behalve als hij daar al is), zodat hij eerst kiest.
    if (!heeftToegang(ab) && !opAbonnement) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/abonnement";
      return NextResponse.redirect(url);
    }

    // Wél toegang, maar een tool buiten je pakket (bv. Start-klant)? Ook naar
    // het abonnement-scherm.
    const m = pad.match(/^\/tools\/([a-z]+)\.html$/);
    if (m && !magToolGebruiken(ab, m[1])) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/abonnement";
      return NextResponse.redirect(url);
    }

    // Bestanden hoort bij Compleet/Pro: een Start-klant sturen we naar het
    // abonnement-scherm in plaats van de Bestanden-pagina te tonen.
    if (pad.startsWith("/dashboard/mijn-teksten") && !magBestandenGebruiken(ab)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/abonnement";
      return NextResponse.redirect(url);
    }
  }

  // Altijd supabaseResponse teruggeven, zodat de verse cookies bewaard blijven.
  return supabaseResponse;
}

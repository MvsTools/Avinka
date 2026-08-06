import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
import { haalBetaling } from "@/lib/mollie";

// Hier komt de gebruiker terug ná het afrekenen bij Mollie. We halen de status
// van de betaling op (direct bij Mollie, dus betrouwbaar én lokaal werkend) en
// zetten bij succes het abonnement actief. Daarna terug naar het abonnement-scherm.
//
// ⚠️ Het abonnement zelf wordt met de SERVICESLEUTEL weggeschreven. De gebruiker
// mag `abon_status` niet meer zelf zetten (fraude-slot, zie
// database/migratie-fraude-slot.sql) — anders kon iedereen zichzelf op 'actief'
// zetten zonder te betalen. Zonder SUPABASE_SERVICE_ROLE_KEY kan een betaling
// dus niet worden vastgelegd; dat melden we, we doen niet alsof het misging.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dash = new URL("/dashboard/abonnement", request.nextUrl.origin);
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.nextUrl.origin));
  }

  const { data } = await supabase
    .from("instellingen")
    .select("mollie_payment_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const pid = data?.mollie_payment_id as string | undefined;
  if (!pid) {
    dash.searchParams.set("betaald", "0");
    return NextResponse.redirect(dash);
  }

  try {
    const payment = await haalBetaling(pid);
    if (payment.status === "paid") {
      const md = payment.metadata ?? {};
      const eind = new Date();
      eind.setMonth(eind.getMonth() + 1); // eerste betaalde periode: één maand
      const db = serviceClient();
      if (!db) {
        console.error(
          "[mollie/return] betaling geslaagd maar SUPABASE_SERVICE_ROLE_KEY ontbreekt — abonnement NIET vastgelegd",
        );
        dash.searchParams.set("betaald", "fout");
        return NextResponse.redirect(dash);
      }
      const { error } = await db.from("instellingen").upsert(
        {
          user_id: user.id,
          abon_plan: md.plan ?? null,
          abon_vorm: md.vorm ?? "maand",
          abon_status: "actief",
          periode_eindigt: eind.toISOString(),
          mollie_payment_id: null, // afgehandeld
        },
        { onConflict: "user_id" },
      );
      if (error) {
        // Het geld is binnen; dit stil laten passeren zou de gebruiker met een
        // betaling én zonder abonnement achterlaten.
        console.error("[mollie/return] vastleggen mislukt:", error.message);
        dash.searchParams.set("betaald", "fout");
        return NextResponse.redirect(dash);
      }
      dash.searchParams.set("betaald", "1");
    } else {
      dash.searchParams.set("betaald", "0");
    }
  } catch {
    dash.searchParams.set("betaald", "0");
  }

  return NextResponse.redirect(dash);
}

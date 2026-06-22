import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { haalBetaling } from "@/lib/mollie";

// Hier komt de gebruiker terug ná het afrekenen bij Mollie. We halen de status
// van de betaling op (direct bij Mollie, dus betrouwbaar én lokaal werkend) en
// zetten bij succes het abonnement actief. Daarna terug naar het abonnement-scherm.
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
      await supabase.from("instellingen").upsert(
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
      dash.searchParams.set("betaald", "1");
    } else {
      dash.searchParams.set("betaald", "0");
    }
  } catch {
    dash.searchParams.set("betaald", "0");
  }

  return NextResponse.redirect(dash);
}

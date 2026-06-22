import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { maakBetaling, maakKlant } from "@/lib/mollie";
import { PLANNEN, type Vorm } from "@/lib/abonnement";

// Start een betaling: maakt bij Mollie een betaling aan voor het gekozen pakket
// en geeft de afreken-URL terug. De browser stuurt de gebruiker daarheen.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { plan?: string; vorm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const plan = PLANNEN.find((p) => p.id === body.plan);
  const vorm: Vorm = body.vorm === "jaar" ? "jaar" : "maand";
  if (!plan) return NextResponse.json({ error: "onbekend_plan" }, { status: 400 });

  const origin = request.nextUrl.origin;

  // Mandaat-flow (terugkerende incasso) alleen als die op het Mollie-account
  // is ingeschakeld. Tot dan: gewone eenmalige betaling, zodat de checkout werkt.
  // Zet MOLLIE_RECURRING=true zodra "recurring" bij Mollie aanstaat.
  const recurringAan = process.env.MOLLIE_RECURRING === "true";

  try {
    let customerId: string | null = null;
    if (recurringAan) {
      // Klant ophalen of aanmaken. De klant + de eerste betaling ("first") zetten
      // samen een machtiging op, zodat we later automatisch kunnen incasseren.
      const { data: inst } = await supabase
        .from("instellingen")
        .select("mollie_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      customerId = (inst?.mollie_customer_id as string | null) ?? null;
      if (!customerId) {
        customerId = await maakKlant({
          naam: (user.user_metadata?.first_name as string) || undefined,
          email: user.email || undefined,
        });
      }
    }

    const payment = await maakBetaling({
      planId: plan.id,
      vorm,
      redirectUrl: `${origin}/api/mollie/return`,
      userId: user.id,
      customerId: customerId ?? undefined,
      sequenceType: recurringAan ? "first" : undefined,
    });

    // Bewaar de (eventuele) klant + de lopende betaling, zodat de terugkeer
    // 'm kan verifiëren (zo werkt het lokaal, ook zonder webhook).
    await supabase
      .from("instellingen")
      .upsert(
        {
          user_id: user.id,
          ...(customerId ? { mollie_customer_id: customerId } : {}),
          mollie_payment_id: payment.id,
        },
        { onConflict: "user_id" },
      );

    if (!payment.checkoutUrl)
      return NextResponse.json({ error: "geen_url" }, { status: 502 });
    return NextResponse.json({ url: payment.checkoutUrl });
  } catch (e) {
    console.error("[mollie/checkout] fout:", e);
    return NextResponse.json({ error: "mollie_fout" }, { status: 502 });
  }
}

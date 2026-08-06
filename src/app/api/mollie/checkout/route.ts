import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
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

  // ⚠️ De Mollie-velden staan achter het fraude-slot op `instellingen` (zie
  // database/migratie-fraude-slot.sql), dus die schrijven we met de
  // servicesleutel. Dit MOET vóór het aanmaken van de betaling gebeuren:
  // zonder sleutel kunnen we het betaal-id niet bewaren, en dan staat er straks
  // wél een afschrijving tegenover een terugkeer die niets terugvindt.
  const db = serviceClient();
  if (!db) {
    console.error("[mollie/checkout] SUPABASE_SERVICE_ROLE_KEY ontbreekt — geen betaling gestart");
    return NextResponse.json({ error: "server_niet_klaar" }, { status: 503 });
  }

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
      webhookUrl: `${origin}/api/mollie/webhook`,
    });

    // Bewaar de (eventuele) klant + de lopende betaling, zodat de terugkeer
    // 'm kan verifiëren (zo werkt het lokaal, ook zonder webhook).
    const { error: bewaarFout } = await db
      .from("instellingen")
      .upsert(
        {
          user_id: user.id,
          ...(customerId ? { mollie_customer_id: customerId } : {}),
          mollie_payment_id: payment.id,
        },
        { onConflict: "user_id" },
      );
    if (bewaarFout) {
      // Het betaal-id niet kunnen bewaren betekent dat de terugkeer straks niets
      // terugvindt. Dan liever hier stoppen dan de gebruiker laten afrekenen.
      console.error("[mollie/checkout] betaal-id bewaren mislukt:", bewaarFout.message);
      return NextResponse.json({ error: "bewaren_mislukt" }, { status: 500 });
    }

    if (!payment.checkoutUrl)
      return NextResponse.json({ error: "geen_url" }, { status: 502 });
    return NextResponse.json({ url: payment.checkoutUrl });
  } catch (e) {
    console.error("[mollie/checkout] fout:", e);
    return NextResponse.json({ error: "mollie_fout" }, { status: 502 });
  }
}

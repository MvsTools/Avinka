import { type NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-service";
import { haalBetaling } from "@/lib/mollie";

// Mollie roept dit adres zelf aan zodra de status van een betaling verandert.
// Mollie stuurt geen JSON maar een gewoon formulier (application/x-www-form-
// urlencoded) met alleen een `id`. Wat er precies veranderd is, halen we
// daarna zelf op — dat is hoe Mollie het wil (never trust de payload zelf).
//
// Twee soorten betalingen komen hier binnen:
//   - eerste betaling ("first"/"oneoff"): de browser-terugkeer in
//     /api/mollie/return zet het abonnement al actief. Deze route doet
//     hetzelfde nog eens (onschuldig dubbelop) — vooral een vangnet voor wie
//     zijn tabblad sluit vóór hij terugkeert.
//   - VERLENGING ("recurring"): hier zit niemand in de browser, dus dit is de
//     ENIGE plek waar de uitkomst binnenkomt. Zie de cron-route
//     src/app/api/cron/mollie-verlengen voor wie een verlenging start.
//
// Herkenning bij een verlenging loopt via `mollie_verleng_payment_id` in de
// database, niet via de metadata van de betaling: alleen de rij die exact
// deze betaling nog "openstaand" heeft, wordt bijgewerkt. Komt Mollie twee
// keer langs voor dezelfde betaling (dat gebeurt), dan is de tweede keer een
// no-op — het veld is dan al leeggemaakt.
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const id = String(form.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "geen_id" }, { status: 400 });

  const db = serviceClient();
  if (!db) {
    console.error("[mollie/webhook] SUPABASE_SERVICE_ROLE_KEY ontbreekt");
    return NextResponse.json({ error: "server_niet_klaar" }, { status: 500 });
  }

  let payment;
  try {
    payment = await haalBetaling(id);
  } catch (e) {
    console.error("[mollie/webhook] ophalen bij Mollie mislukt:", e);
    return NextResponse.json({ error: "mollie_fout" }, { status: 502 });
  }

  if (payment.sequenceType === "recurring") {
    const { data: rij, error: zoekFout } = await db
      .from("instellingen")
      .select("user_id, periode_eindigt")
      .eq("mollie_verleng_payment_id", payment.id)
      .maybeSingle();
    if (zoekFout) {
      console.error("[mollie/webhook] opzoeken verlenging mislukt:", zoekFout.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
    if (!rij) {
      // Onbekend of al verwerkt (tweede keer voor dezelfde betaling). Geen fout.
      return NextResponse.json({ ok: true, genegeerd: true });
    }

    if (payment.status === "paid") {
      const huidig = rij.periode_eindigt ? new Date(rij.periode_eindigt as string) : new Date();
      const nieuweEind = new Date(Math.max(huidig.getTime(), Date.now()));
      nieuweEind.setMonth(nieuweEind.getMonth() + 1);
      const { error } = await db
        .from("instellingen")
        .update({
          abon_status: "actief",
          periode_eindigt: nieuweEind.toISOString(),
          mollie_verleng_payment_id: null,
        })
        .eq("user_id", rij.user_id as string);
      if (error) {
        console.error("[mollie/webhook] verlenging vastleggen mislukt:", error.message);
        return NextResponse.json({ error: "db_error" }, { status: 500 });
      }
    } else if (["failed", "expired", "canceled"].includes(payment.status)) {
      // De incasso is niet gelukt: geen nieuwe periode, en de toegang stopt bij
      // het al vastgelegde periode_eindigt (heeftToegang() in abonnement.ts kijkt
      // naar abon_status, dus die moet hier expliciet omlaag).
      const { error } = await db
        .from("instellingen")
        .update({ abon_status: "verlopen", mollie_verleng_payment_id: null })
        .eq("user_id", rij.user_id as string);
      if (error) {
        console.error("[mollie/webhook] verlopen zetten mislukt:", error.message);
        return NextResponse.json({ error: "db_error" }, { status: 500 });
      }
    }
    // status 'pending'/'open': nog onderweg bij de bank, wachten op de volgende call.
    return NextResponse.json({ ok: true });
  }

  // Eerste betaling: zelfde activatie als /api/mollie/return, als vangnet voor
  // wie zijn tabblad sluit vóór hij terugkeert. Alleen toepassen als DEZE
  // betaling nog steeds de "lopende" is (mollie_payment_id matcht nog) — komt
  // Mollie een tweede keer (of laat, na een storing) langs terwijl de
  // gebruiker intussen alweer een NIEUWERE betaling is gestart, dan zou dit
  // anders een oudere staat over een nieuwere heen zetten.
  if (payment.status === "paid" && payment.metadata?.userId) {
    const { data: rij, error: zoekFout } = await db
      .from("instellingen")
      .select("user_id")
      .eq("user_id", payment.metadata.userId)
      .eq("mollie_payment_id", payment.id)
      .maybeSingle();
    if (zoekFout) {
      console.error("[mollie/webhook] opzoeken eerste betaling mislukt:", zoekFout.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
    if (rij) {
      const eind = new Date();
      eind.setMonth(eind.getMonth() + 1);
      const { error } = await db
        .from("instellingen")
        .update({
          abon_plan: payment.metadata.plan ?? null,
          abon_vorm: payment.metadata.vorm ?? "maand",
          abon_status: "actief",
          periode_eindigt: eind.toISOString(),
          mollie_payment_id: null,
        })
        .eq("user_id", payment.metadata.userId);
      if (error) {
        console.error("[mollie/webhook] eerste betaling vastleggen mislukt:", error.message);
        return NextResponse.json({ error: "db_error" }, { status: 500 });
      }
    }
    // Geen rij gevonden: al afgehandeld door /api/mollie/return, of ingehaald
    // door een nieuwere betaling. Geen fout, gewoon niets meer te doen.
  }

  return NextResponse.json({ ok: true });
}

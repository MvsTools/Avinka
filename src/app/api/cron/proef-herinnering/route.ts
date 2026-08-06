import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
import { verstuurMail } from "@/lib/mail";
import { PROEF_ONDERWERP, proefHtml, proefTekst } from "@/lib/mail-proef";

// De dagelijkse herinnering dat een proefperiode bijna afloopt.
//
// Draait straks als geplande taak bij Vercel (zie vercel.json). Tot de
// verhuizing doet hij niets vanzelf, en dat is precies goed: er zijn nog geen
// gebruikers om te herinneren.
//
// ── WIE MAG HEM AANROEPEN ──────────────────────────────────────────────────
// Twee ingangen, allebei nodig:
//   1. Vercel, met de geheime sleutel in de kop. Zo weet de route dat het
//      verzoek van de geplande taak komt en niet van iemand die het adres heeft
//      geraden. Een open route die mail verstuurt naar je hele bestand is het
//      ergste wat je kunt hebben.
//   2. Jij, ingelogd als admin. Anders kun je het pas testen ná de verhuizing.
//
// ⚠️ Zonder CRON_SECRET is de eerste ingang DICHT (niet open). Een ontbrekende
// instelling mag nooit een slot openzetten.
//
// ── DROOGLOPEN ─────────────────────────────────────────────────────────────
// Met ?droog=1 stuurt hij niets en vertelt hij alleen wie er aan de beurt zou
// zijn. Zo controleer je de selectie zonder iemand een mail te sturen.

export const dynamic = "force-dynamic";

function datumInWoorden(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  });
}

export async function GET(request: NextRequest) {
  const geheim = process.env.CRON_SECRET;
  const meegestuurd = request.headers.get("authorization");
  const vanDeTaak = !!geheim && meegestuurd === `Bearer ${geheim}`;

  if (!vanDeTaak) {
    // Geen geplande taak? Dan moet je een ingelogde admin zijn.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { data: isAdmin } = await supabase.rpc("wijs_is_admin");
    if (isAdmin !== true) return NextResponse.json({ error: "geen_admin" }, { status: 403 });
  }

  // De servicesleutel omzeilt alle beveiliging en mag daarom alleen hier
  // bestaan, in een serverbestand. Nooit met NEXT_PUBLIC_ ervoor.
  const db = serviceClient();
  if (!db) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ontbreekt, er is niets verstuurd." },
      { status: 500 },
    );
  }

  const { data: aanDeBeurt, error } = await db.rpc("wijs_proef_herinneringen", { p_dagen: 2 });
  if (error) {
    return NextResponse.json({ error: `Ophalen mislukt: ${error.message}` }, { status: 500 });
  }

  type Rij = { user_id: string; email: string; voornaam: string; proef_eindigt: string };
  const rijen = (aanDeBeurt ?? []) as Rij[];

  const droog = new URL(request.url).searchParams.get("droog") === "1";
  if (droog) {
    return NextResponse.json({
      droogloop: true,
      aantal: rijen.length,
      wie: rijen.map((r) => ({ email: r.email, eindigt: datumInWoorden(r.proef_eindigt) })),
    });
  }

  const oorsprong = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const link = `${oorsprong}/dashboard/abonnement`;

  let verstuurd = 0;
  const mislukt: { email: string; reden: string }[] = [];

  for (const r of rijen) {
    const gegevens = {
      voornaam: r.voornaam,
      eindDatum: datumInWoorden(r.proef_eindigt),
      link,
    };
    const antwoord = await verstuurMail({
      naar: r.email,
      onderwerp: PROEF_ONDERWERP,
      tekst: proefTekst(gegevens),
      html: proefHtml(gegevens),
    });

    if (!antwoord.ok) {
      // ⚠️ Bewust NIET afvinken als het versturen mislukte. Dan probeert de
      // taak het morgen gewoon opnieuw, en dat is precies wat je wilt bij een
      // storing die een uur duurt. Afvinken zou de mail voorgoed overslaan.
      mislukt.push({ email: r.email, reden: antwoord.melding });
      continue;
    }

    // Meteen afvinken, per persoon. Niet aan het eind in één keer: klapt de
    // taak halverwege, dan zijn de al verstuurde mails wél afgevinkt en krijgt
    // niemand hem dubbel.
    const { error: merkFout } = await db
      .from("instellingen")
      .update({ proef_herinnering_op: new Date().toISOString() })
      .eq("user_id", r.user_id);
    if (merkFout) {
      // Verstuurd maar niet afgevinkt: dat is het gevaarlijke geval, want
      // morgen gaat hij opnieuw. Melden zodat het opvalt.
      mislukt.push({ email: r.email, reden: `verstuurd maar niet afgevinkt: ${merkFout.message}` });
      continue;
    }
    verstuurd++;
  }

  return NextResponse.json({ ok: true, gevonden: rijen.length, verstuurd, mislukt });
}

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
import { verstuurMail } from "@/lib/mail";
import { BETALINGEN_LIVE } from "@/lib/abonnement";
import { PROEF_VERLOPEN_ONDERWERP, proefVerlopenHtml, proefVerlopenTekst } from "@/lib/mail-proef-verlopen";

// De mail dat een proefperiode is verlopen.
//
// ⚠️ VAST GEBOUWD VÓÓR MOLLIE LIVE GAAT, MAAR DOET NIETS TOT DAN. Zolang
// BETALINGEN_LIVE uit staat verandert er bij het verlopen van een proef
// namelijk niets (zie src/lib/abonnement.ts, heeftToegang()) — iedereen
// houdt volledige toegang. Deze mail zou dan beweren dat de tools op slot
// staan terwijl dat niet zo is. Vandaar de vlaggencontrole hieronder, vóór er
// ook maar iets uit de database wordt gehaald.
//
// Zelfde opzet als /api/cron/proef-herinnering: twee ingangen (Vercel met
// CRON_SECRET, of jij als ingelogde admin), ?droog=1 om te controleren zonder
// te versturen, en per persoon afvinken i.p.v. aan het eind.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const geheim = process.env.CRON_SECRET;
  const meegestuurd = request.headers.get("authorization");
  const vanDeTaak = !!geheim && meegestuurd === `Bearer ${geheim}`;

  if (!vanDeTaak) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { data: isAdmin } = await supabase.rpc("wijs_is_admin");
    if (isAdmin !== true) return NextResponse.json({ error: "geen_admin" }, { status: 403 });
  }

  const droog = new URL(request.url).searchParams.get("droog") === "1";

  if (!BETALINGEN_LIVE) {
    // Bewust geen 500: dit is geen storing, dit is de bedoeling zolang
    // betalingen nog niet live zijn. Wel duidelijk zeggen wat er (niet)
    // gebeurd is, ook bij een droogloop.
    return NextResponse.json({ ok: true, overgeslagen: "BETALINGEN_LIVE staat uit, er is niets gedaan." });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ontbreekt, er is niets verstuurd." },
      { status: 500 },
    );
  }

  const { data: aanDeBeurt, error } = await db.rpc("wijs_proef_verlopen", { p_dagen: 3 });
  if (error) {
    return NextResponse.json({ error: `Ophalen mislukt: ${error.message}` }, { status: 500 });
  }

  type Rij = { user_id: string; email: string; voornaam: string; proef_eindigt: string };
  const rijen = (aanDeBeurt ?? []) as Rij[];

  if (droog) {
    return NextResponse.json({
      droogloop: true,
      aantal: rijen.length,
      wie: rijen.map((r) => ({ email: r.email })),
    });
  }

  const oorsprong = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const link = `${oorsprong}/dashboard/abonnement`;

  let verstuurd = 0;
  const mislukt: { email: string; reden: string }[] = [];

  for (const r of rijen) {
    const gegevens = { voornaam: r.voornaam, link };
    const antwoord = await verstuurMail({
      naar: r.email,
      onderwerp: PROEF_VERLOPEN_ONDERWERP,
      tekst: proefVerlopenTekst(gegevens),
      html: proefVerlopenHtml(gegevens),
    });

    if (!antwoord.ok) {
      // Bewust NIET afvinken bij mislukken: morgen probeert de taak het
      // gewoon opnieuw (zolang binnen het p_dagen-venster van de functie).
      mislukt.push({ email: r.email, reden: antwoord.melding });
      continue;
    }

    const { error: merkFout } = await db
      .from("instellingen")
      .update({ proef_verlopen_op: new Date().toISOString() })
      .eq("user_id", r.user_id);
    if (merkFout) {
      mislukt.push({ email: r.email, reden: `verstuurd maar niet afgevinkt: ${merkFout.message}` });
      continue;
    }
    verstuurd++;
  }

  return NextResponse.json({ ok: true, gevonden: rijen.length, verstuurd, mislukt });
}

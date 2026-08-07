import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
import { verstuurMail, SUPPORT } from "@/lib/mail";
import { BETALINGEN_LIVE } from "@/lib/abonnement";
import { OPZEGGING_ONDERWERP, opzeggingHtml, opzeggingTekst } from "@/lib/mail-opzeggen";

// De waarschuwing dat de leerlinggegevens over ~7 dagen opgeruimd worden
// (3 maanden na het aflopen van het abonnement). Het eigen vakwerk van de
// leerkracht blijft staan; zie k_bewaren in de databasefunctie.
//
// ⚠️ DIT IS HET SLOT OP DE VERWIJDERING, niet alleen een beleefde mail. De
// databasefunctie wijs_verwijder_klasdata() wist uitsluitend bij wie hier
// minstens 7 dagen eerder in heeft gezeten (kolom verwijder_waarschuwing_op).
// Gaat deze taak niet, dan wordt er ook niets verwijderd. Dat is met opzet zo
// gebouwd: stilzwijgend iemands klas wissen is een ergere fout dan te lang
// bewaren. Zie database/migratie-verwijder-klasdata.sql.
//
// ⚠️ VERSTUURT NIETS ZOLANG BETALINGEN_LIVE UIT STAAT. Er verloopt dan namelijk
// niets — iedereen houdt volledige toegang (src/lib/abonnement.ts,
// heeftToegang()) — en deze mail zou dus een verwijdering aankondigen die niet
// gaat gebeuren. Gevolg: zolang die vlag uit staat wist de nachtelijke
// databasetaak bij niemand iets. Ook dat is de bedoeling.
//
// Zelfde opzet als /api/cron/proef-verlopen: twee ingangen (Vercel met
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
    return NextResponse.json({
      ok: true,
      overgeslagen: "BETALINGEN_LIVE staat uit, er is niets gedaan (en er wordt dus ook niets verwijderd).",
    });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ontbreekt, er is niets verstuurd." },
      { status: 500 },
    );
  }

  // Dag 83 van de 90: zeven dagen respijt, en dat is precies wat
  // wijs_verwijder_klasdata() als slot afdwingt.
  const { data: aanDeBeurt, error } = await db.rpc("wijs_verwijder_waarschuwing", {
    p_dag: 83,
    p_max: 50,
  });
  if (error) {
    return NextResponse.json({ error: `Ophalen mislukt: ${error.message}` }, { status: 500 });
  }

  type Rij = { user_id: string; email: string; voornaam: string; wist_op: string };
  const rijen = (aanDeBeurt ?? []) as Rij[];

  if (droog) {
    return NextResponse.json({
      droogloop: true,
      aantal: rijen.length,
      wie: rijen.map((r) => ({ email: r.email, wist_op: r.wist_op })),
    });
  }

  const oorsprong = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const link = `${oorsprong}/dashboard/abonnement`;
  // Instellingen, want daar staat de knop "download je gegevens" (AccountBeheer).
  const downloadLink = `${oorsprong}/dashboard/instellingen`;

  let verstuurd = 0;
  const mislukt: { email: string; reden: string }[] = [];

  for (const r of rijen) {
    const gegevens = { voornaam: r.voornaam, wistOp: r.wist_op, link, downloadLink };
    const antwoord = await verstuurMail({
      naar: r.email,
      onderwerp: OPZEGGING_ONDERWERP,
      tekst: opzeggingTekst(gegevens),
      html: opzeggingHtml(gegevens),
      // Op deze mail wíl je een antwoord kunnen krijgen: hier zit iemand die
      // zijn klas dreigt kwijt te raken, dat is geen no-reply-moment.
      antwoordAan: SUPPORT,
    });

    if (!antwoord.ok) {
      // Bewust NIET afvinken bij mislukken: morgen probeert de taak het
      // gewoon opnieuw. En omdat het afvinken tegelijk de klok van de
      // respijttermijn start, betekent "niet verstuurd" hier ook automatisch
      // "nog niet verwijderen". Precies goed.
      mislukt.push({ email: r.email, reden: antwoord.melding });
      continue;
    }

    const { error: merkFout } = await db
      .from("instellingen")
      .update({ verwijder_waarschuwing_op: new Date().toISOString() })
      .eq("user_id", r.user_id);
    if (merkFout) {
      // ⚠️ Hier is de mail wél de deur uit maar de datum niet opgeslagen. Dat
      // is de veilige kant van de fout (er wordt niets verwijderd), maar hij
      // krijgt morgen dezelfde mail nog eens. Daarom expliciet melden.
      mislukt.push({ email: r.email, reden: `verstuurd maar niet afgevinkt: ${merkFout.message}` });
      continue;
    }
    verstuurd++;
  }

  return NextResponse.json({ ok: true, gevonden: rijen.length, verstuurd, mislukt });
}

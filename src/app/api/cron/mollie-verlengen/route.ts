import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
import { maakBetaling, heeftGeldigMandaat } from "@/lib/mollie";

// De dagelijkse verlenging van een betaald abonnement: voor iedereen wiens
// betaalde periode is afgelopen, wordt via het bestaande Mollie-mandaat een
// nieuwe incasso gestart. De uitkomst (gelukt/mislukt) komt NIET hier binnen —
// daarvoor zit niemand in de browser — maar bij /api/mollie/webhook, die
// Mollie zelf aanroept zodra de bank heeft beslist.
//
// Zelfde twee-ingangen-patroon als /api/cron/proef-herinnering: Vercel met
// CRON_SECRET, of jij zelf ingelogd als admin (zie vercel.json).
//
// ── WAAROM `mollie_verleng_payment_id` HET STUUR IS ────────────────────────
// SEPA-incasso duurt dagen, niet seconden. Zonder dit veld zou de taak van
// morgen gewoon nóg een incasso starten voor dezelfde klant terwijl de vorige
// nog bij de bank onderweg is. Staat het veld al gevuld, dan slaan we die
// klant vandaag gewoon over — de webhook maakt het weer leeg zodra Mollie
// antwoord geeft.
//
// ── HET ZOMERSCHEMA ─────────────────────────────────────────────────────────
// Bij een jaarabonnement zijn juli en augustus gratis (zie GRATIS_MAANDEN_JAAR
// in src/lib/abonnement.ts): valt de nieuwe periode in juli of augustus, dan
// verlengen we de datum gewoon zonder ook maar een betaling te starten.
//
// ── DROOGLOPEN ───────────────────────────────────────────────────────────────
// ?droog=1 verlengt niets en start geen enkele betaling — laat alleen zien wie
// er aan de beurt zou zijn.

export const dynamic = "force-dynamic";

function maandIsGratis(datum: Date): boolean {
  const maand = Number(
    new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", month: "numeric" }).format(datum),
  );
  return maand === 7 || maand === 8; // juli, augustus
}

type Rij = {
  user_id: string;
  abon_plan: string | null;
  abon_vorm: string | null;
  periode_eindigt: string;
  mollie_customer_id: string;
};

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

  const db = serviceClient();
  if (!db) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ontbreekt, er is niets verlengd." },
      { status: 500 },
    );
  }

  const nu = new Date();
  const { data: rijen, error } = await db
    .from("instellingen")
    .select("user_id, abon_plan, abon_vorm, periode_eindigt, mollie_customer_id")
    .eq("abon_status", "actief")
    .lte("periode_eindigt", nu.toISOString())
    .is("mollie_verleng_payment_id", null)
    .not("mollie_customer_id", "is", null)
    .not("abon_plan", "is", null);
  if (error) {
    return NextResponse.json({ error: `Ophalen mislukt: ${error.message}` }, { status: 500 });
  }
  const teVerlengen = (rijen ?? []) as Rij[];

  const droog = new URL(request.url).searchParams.get("droog") === "1";
  if (droog) {
    return NextResponse.json({
      droogloop: true,
      aantal: teVerlengen.length,
      wie: teVerlengen.map((r) => ({ user_id: r.user_id, plan: r.abon_plan, eindigt: r.periode_eindigt })),
    });
  }

  const oorsprong = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  let gratisVerlengd = 0;
  let incassoGestart = 0;
  let verlopen = 0;
  const mislukt: { user_id: string; reden: string }[] = [];

  for (const r of teVerlengen) {
    const huidig = new Date(r.periode_eindigt);
    const nieuweEind = new Date(Math.max(huidig.getTime(), nu.getTime()));
    nieuweEind.setMonth(nieuweEind.getMonth() + 1);

    if (r.abon_vorm === "jaar" && maandIsGratis(nieuweEind)) {
      // Zomerschema: geen incasso, gewoon de datum opschuiven.
      const { error: fout } = await db
        .from("instellingen")
        .update({ periode_eindigt: nieuweEind.toISOString() })
        .eq("user_id", r.user_id);
      if (fout) mislukt.push({ user_id: r.user_id, reden: fout.message });
      else gratisVerlengd++;
      continue;
    }

    try {
      const mandaatOk = await heeftGeldigMandaat(r.mollie_customer_id);
      if (!mandaatOk) {
        // Geen bruikbaar mandaat meer (ingetrokken bij de bank) — er valt niets
        // te incasseren. heeftToegang() in abonnement.ts kijkt naar abon_status,
        // dus die moet hier expliciet omlaag, anders blijft de toegang open.
        const { error: fout } = await db
          .from("instellingen")
          .update({ abon_status: "verlopen" })
          .eq("user_id", r.user_id);
        if (fout) mislukt.push({ user_id: r.user_id, reden: fout.message });
        else verlopen++;
        continue;
      }

      const payment = await maakBetaling({
        planId: r.abon_plan as string,
        vorm: r.abon_vorm ?? "maand",
        redirectUrl: `${oorsprong}/dashboard/abonnement`,
        userId: r.user_id,
        customerId: r.mollie_customer_id,
        sequenceType: "recurring",
        webhookUrl: `${oorsprong}/api/mollie/webhook`,
      });

      // Zet het slot pas NA een geslaagde aanvraag bij Mollie. periode_eindigt
      // zelf raken we hier niet aan — dat doet de webhook, pas na bevestigd
      // betaald. Zo krijgt niemand toegang voor een incasso die nog kan mislukken.
      const { error: fout } = await db
        .from("instellingen")
        .update({ mollie_verleng_payment_id: payment.id })
        .eq("user_id", r.user_id);
      if (fout) {
        mislukt.push({
          user_id: r.user_id,
          reden: `betaling gestart bij Mollie maar niet vastgelegd: ${fout.message}`,
        });
      } else {
        incassoGestart++;
      }
    } catch (e) {
      mislukt.push({ user_id: r.user_id, reden: e instanceof Error ? e.message : "onbekende fout" });
    }
  }

  return NextResponse.json({
    ok: true,
    gevonden: teVerlengen.length,
    gratisVerlengd,
    incassoGestart,
    verlopen,
    mislukt,
  });
}

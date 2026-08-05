import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
import { amsterdamDatum, isVrijeDag, volgendeStreakStand } from "@/lib/streak";
import { haalStreakVakanties } from "@/lib/planning";
import { minutenVoor, type TijdSignaal } from "@/lib/tijdwinst";

// Cumulatieve tellers per gebruiker (Mijn statistieken).
// - GET  → { tellers: {...}, minuten: {...} }
// - POST { type, signaal? } → telt er één bij op én telt de adaptieve tijdwinst
//   op, berekend uit het omvang-signaal (woorden/items/leerlingen). Door de
//   tools aangeroepen bij een afgeronde actie.
// RLS zorgt dat je alleen bij je eigen tellers kunt LEZEN.
//
// ⚠️ SCHRIJVEN GAAT MET DE SERVICESLEUTEL, en dat is geen detail: deze tellers
// worden op de VOORPAGINA bij elkaar opgeteld (`avinka_landing_cijfers` →
// "Avinka in cijfers"). Kon iedereen zijn eigen rij schrijven, dan kon één
// account "1.284 uur bespaard" op de homepage zetten. De database houdt de
// browser nu tegen (trigger `statistiek_bewaakt`); alleen deze route telt op,
// en die telt per aanroep precies één actie.

// Meer dan dit aantal acties op één dag is geen leerkracht maar een script.
// Boven de grens blijft alles gewoon werken, het telt alleen niet meer mee.
// Ruim gekozen: een zware dag met alle tools blijft er ver onder.
const MAX_ACTIES_PER_DAG = 100;

export async function GET() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await sb.from("statistiek").select("tellers, minuten").maybeSingle();
  return NextResponse.json({
    tellers: data?.tellers ?? {},
    minuten: data?.minuten ?? {},
  });
}

export async function POST(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const type =
    body && typeof body.type === "string" ? body.type.trim().slice(0, 40) : "";
  if (!type) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // Omvang-signaal (optioneel): alleen nette, niet-negatieve hele getallen.
  const signaal: TijdSignaal = {};
  if (body && typeof body.signaal === "object" && body.signaal) {
    const s = body.signaal as Record<string, unknown>;
    const num = (v: unknown) =>
      typeof v === "number" && isFinite(v) ? Math.max(0, Math.floor(v)) : undefined;
    if (num(s.woorden) !== undefined) signaal.woorden = num(s.woorden);
    if (num(s.items) !== undefined) signaal.items = num(s.items);
    if (num(s.leerlingen) !== undefined) signaal.leerlingen = num(s.leerlingen);
  }

  const { data } = await sb
    .from("statistiek")
    .select("tellers, minuten, per_dag, streak, streak_max, streak_freezes, laatste_actief")
    .maybeSingle();
  const tellers = { ...((data?.tellers as Record<string, number>) ?? {}) };
  tellers[type] = (tellers[type] ?? 0) + 1;

  // Adaptieve tijdwinst voor déze actie, opgeteld bij het totaal per soort.
  const gewonnen = minutenVoor(type, signaal);
  const minuten = { ...((data?.minuten as Record<string, number>) ?? {}) };
  minuten[type] = (minuten[type] ?? 0) + gewonnen;

  const vandaag = amsterdamDatum(new Date());

  // Per dag bijhouden (minuten + acties) voor de periode-filters op de statistiekenpagina.
  const perDag = { ...((data?.per_dag as Record<string, { m: number; n: number }>) ?? {}) };
  const dag = perDag[vandaag] ?? { m: 0, n: 0 };

  // Dagplafond. Zonder dit kost het niets om deze route in een lus aan te roepen
  // en zo het cijfer op de voorpagina op te blazen — elke aanroep telde door.
  // We geven bewust GEEN fout terug: de gebruiker heeft niets fout gedaan en de
  // tool moet gewoon blijven werken. Er wordt alleen niets meer bij opgeteld.
  if (dag.n >= MAX_ACTIES_PER_DAG) {
    return NextResponse.json({
      ok: true,
      geteld: false,
      tellers: data?.tellers ?? {},
      minuten: data?.minuten ?? {},
      streak: (data?.streak as number) ?? 0,
      gewonnen: 0,
    });
  }

  perDag[vandaag] = { m: dag.m + gewonnen, n: dag.n + 1 };

  // ── Streak bijwerken (alleen op schooldagen; weekend én schoolvakantie
  //    tellen niet mee, breken de reeks ook niet). Een verdiende vrijstelling
  //    vangt precies één gemiste schooldag op — zie volgendeStreakStand. ──
  const vakanties = await haalStreakVakanties(sb, vandaag);
  const laatsteVoor = (data?.laatste_actief as string | null) ?? null;
  let streak = (data?.streak as number) ?? 0;
  let streakMax = (data?.streak_max as number) ?? 0;
  let streakFreezes = (data?.streak_freezes as number) ?? 0;
  let laatste = laatsteVoor;
  if (!isVrijeDag(vandaag, vakanties) && laatste !== vandaag) {
    const uitkomst = volgendeStreakStand(
      vandaag,
      laatsteVoor,
      { streak, streakMax, freezes: streakFreezes },
      vakanties,
    );
    streak = uitkomst.streak;
    streakMax = uitkomst.streakMax;
    streakFreezes = uitkomst.freezes;
    laatste = uitkomst.laatste;
  }

  // Schrijven met de servicesleutel: de browser mag deze velden niet meer zelf
  // zetten (zie de toelichting bovenaan). Ontbreekt de sleutel, dan tellen we
  // niets en zeggen we dat ook — stilzwijgend doorgaan zou betekenen dat je
  // statistieken maandenlang leeg blijven zonder dat iemand weet waarom.
  const db = serviceClient();
  if (!db) {
    console.error(
      "[api/statistiek] SUPABASE_SERVICE_ROLE_KEY ontbreekt — er is niets geteld",
    );
    return NextResponse.json({ ok: false, geteld: false, reden: "server_niet_klaar" });
  }

  const { error } = await db.from("statistiek").upsert(
    {
      user_id: user.id,
      tellers,
      minuten,
      per_dag: perDag,
      streak,
      streak_max: streakMax,
      streak_freezes: streakFreezes,
      laatste_actief: laatste,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    // De reden MOET in de log staan. Zonder deze regel zie je alleen "500" en
    // moet je gaan raden — precies wat er bij de eerste test van dit slot
    // gebeurde. Naar de gebruiker blijft het een nette, korte fout.
    console.error("[api/statistiek] opslaan geweigerd:", error.code, error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, tellers, minuten, streak, gewonnen });
}

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { amsterdamDatum, isWeekend, vorigeWerkdag } from "@/lib/streak";

// Cumulatieve tellers per gebruiker (Mijn statistieken).
// - GET  → { tellers: {...} }
// - POST { type } → telt er één bij op (door de tools aangeroepen bij een actie)
// RLS zorgt dat je alleen bij je eigen tellers kunt.

export async function GET() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await sb.from("statistiek").select("tellers").maybeSingle();
  return NextResponse.json({ tellers: data?.tellers ?? {} });
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

  const { data } = await sb
    .from("statistiek")
    .select("tellers, streak, streak_max, laatste_actief")
    .maybeSingle();
  const tellers = { ...((data?.tellers as Record<string, number>) ?? {}) };
  tellers[type] = (tellers[type] ?? 0) + 1;

  // ── Streak bijwerken (alleen op werkdagen; weekend telt niet mee) ──
  const vandaag = amsterdamDatum(new Date());
  let streak = (data?.streak as number) ?? 0;
  let streakMax = (data?.streak_max as number) ?? 0;
  let laatste = (data?.laatste_actief as string | null) ?? null;
  if (!isWeekend(vandaag) && laatste !== vandaag) {
    streak = laatste === vorigeWerkdag(vandaag) ? streak + 1 : 1;
    laatste = vandaag;
    if (streak > streakMax) streakMax = streak;
  }

  const { error } = await sb.from("statistiek").upsert(
    { user_id: user.id, tellers, streak, streak_max: streakMax, laatste_actief: laatste },
    { onConflict: "user_id" },
  );
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true, tellers, streak });
}

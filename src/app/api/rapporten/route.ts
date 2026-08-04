import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Opgeslagen rapportteksten per kind (Rapporten). RLS zorgt dat je alleen
// je eigen rapporten ziet. GET = ophalen, POST = bewaren/bijwerken, DELETE = wissen.
async function ingelogd() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await ingelogd();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // RLS geeft ook de rapporten van een actieve duo-partner terug, maar
  // alleen die met een klas_id die bij het gedeelde koppel hoort — je eigen
  // (ongekoppelde) rapporten van vroeger blijven altijd van jou alleen.
  const { data } = await supabase.from("rapporten").select("naam, verhaal");
  return NextResponse.json({ rapporten: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await ingelogd();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { naam?: string; verhaal?: string; klas_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const naam = String(body.naam ?? "").trim();
  const verhaal = String(body.verhaal ?? "");
  const klasId = body.klas_id ? String(body.klas_id) : null;
  if (!naam || !verhaal.trim()) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (klasId) {
    // Kijk je bij deze groep alleen mee, dan schrijf je er geen rapporten.
    // De database weigert het ook (policy "duo-partner rapporten"), maar dan
    // komt er een kale 500 terug die niets uitlegt. Hier zeggen we wat er aan
    // de hand is, zodat de tool het kan tonen.
    const { data: volledig } = await supabase.rpc("klas_toegang_volledig", {
      p_klas: klasId,
    });
    if (volledig !== true) {
      return NextResponse.json({ error: "geen_rapportrecht" }, { status: 403 });
    }

    // Gescoped op de klas: zoek een bestaande rij voor DIT kind in DEZE klas
    // (van jezelf óf je duo-partner, RLS staat dat toe) en werk die bij, in
    // plaats van er een dubbele rij naast te zetten.
    const { data: bestaand } = await supabase
      .from("rapporten")
      .select("id")
      .eq("klas_id", klasId)
      .eq("naam", naam)
      .maybeSingle();
    const { error } = bestaand
      ? await supabase.from("rapporten").update({ verhaal }).eq("id", bestaand.id)
      : await supabase
          .from("rapporten")
          .insert({ user_id: user.id, klas_id: klasId, naam, verhaal });
    if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Geen klas meegestuurd: oud gedrag, uniek per gebruiker + naam.
  const { error } = await supabase
    .from("rapporten")
    .upsert({ user_id: user.id, naam, verhaal }, { onConflict: "user_id,naam" });
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { supabase, user } = await ingelogd();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await supabase.from("rapporten").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

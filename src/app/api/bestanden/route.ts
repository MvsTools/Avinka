import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAbonnementServer } from "@/lib/abonnement-server";
import { magBestandenGebruiken } from "@/lib/abonnement";

// Bestanden-API voor de tools (nu: Plattegrond).
// - GET            → lijst opgeslagen plattegronden (voor de "overschrijven?"-keuze)
// - GET ?id=…      → één plattegrond ophalen (om in de tool te openen)
// - POST           → plattegrond bewaren: met id = overschrijven, zonder id = nieuw
//                    (komt in de map "Mijn plattegrond", die we zo nodig aanmaken)
// RLS in de database zorgt dat je alleen bij je eigen bestanden kunt.

const MAP_NAAM = "Mijn plattegrond";

export async function GET(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Bestanden hoort bij Compleet/Pro (en de proef); Start heeft geen toegang.
  if (!magBestandenGebruiken(await getAbonnementServer())) {
    return NextResponse.json({ error: "geen_toegang" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const { data } = await sb
      .from("bestanden")
      .select("id, naam, data")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(data);
  }

  const { data } = await sb
    .from("bestanden")
    .select("id, naam, updated_at")
    .eq("type", "plattegrond")
    .order("updated_at", { ascending: false });
  return NextResponse.json({ plattegronden: data ?? [] });
}

export async function POST(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Bestanden hoort bij Compleet/Pro (en de proef); Start kan niet opslaan.
  if (!magBestandenGebruiken(await getAbonnementServer())) {
    return NextResponse.json({ error: "geen_toegang" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || body.data == null) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const naam = String(body.naam || "Plattegrond").slice(0, 120);

  // Overschrijven van een bestaande plattegrond
  if (body.id) {
    const { data, error } = await sb
      .from("bestanden")
      .update({ naam, data: body.data })
      .eq("id", body.id)
      .select("id, naam")
      .single();
    if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
    return NextResponse.json(data);
  }

  // Nieuw: zorg dat de map "Mijn plattegrond" in de wortel bestaat
  const { data: mappen } = await sb
    .from("bestanden")
    .select("id")
    .eq("type", "map")
    .eq("naam", MAP_NAAM)
    .is("parent_id", null)
    .limit(1);
  let mapId = mappen?.[0]?.id ?? null;
  if (!mapId) {
    const { data: nieuweMap } = await sb
      .from("bestanden")
      .insert({ user_id: user.id, type: "map", naam: MAP_NAAM, parent_id: null })
      .select("id")
      .single();
    mapId = nieuweMap?.id ?? null;
  }

  const { data, error } = await sb
    .from("bestanden")
    .insert({
      user_id: user.id,
      type: "plattegrond",
      naam,
      data: body.data,
      parent_id: mapId,
      tool: "plattegrondwijs",
    })
    .select("id, naam")
    .single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json(data);
}

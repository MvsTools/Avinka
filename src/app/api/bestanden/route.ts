import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAbonnementServer } from "@/lib/abonnement-server";
import { magBestandenGebruiken } from "@/lib/abonnement";

// Bestanden-API voor de tools.
//  GET                 → lijst opgeslagen plattegronden (legacy: "overschrijven?"-keuze)
//  GET ?id=…           → één plattegrond ophalen (om in de tool te openen)
//  GET ?tree=1         → de hele mappenboom (licht: id/parent_id/type/naam/tool) voor de kiezer
//  POST {actie:"map"}  → nieuwe map aanmaken: {naam, parent_id?}
//  POST {type,…}       → een item (bv. een les) opslaan in een map:
//                        {type:"les"|"tekst", naam, inhoud?, data?, tool?, pad?|parent_id?}
//                        - pad = lijst mapnamen vanaf de wortel; ontbrekende mappen worden
//                          lui aangemaakt (zo ontstaat "Lesontwerpen → Rekenen" pas bij opslaan).
//                        - parent_id = een bestaande map (als de leerkracht zelf navigeert).
//  POST {naam,data,id?}→ legacy: plattegrond opslaan/overschrijven (ongewijzigd gedrag).
// RLS in de database zorgt dat je alleen bij je eigen bestanden kunt.

type SB = Awaited<ReturnType<typeof createClient>>;

const MAP_NAAM = "Mijn plattegrond";

// Geeft de map-id terug als die map van de gebruiker is (RLS) — anders null.
async function geldigeMapId(sb: SB, parentId: unknown): Promise<string | null> {
  if (!parentId || typeof parentId !== "string") return null;
  const { data } = await sb
    .from("bestanden")
    .select("id")
    .eq("id", parentId)
    .eq("type", "map")
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

// Zorgt dat een pad van mapnamen bestaat (maakt ontbrekende mappen aan) en geeft
// de id van de diepste map terug. Leeg pad → null (de wortel).
async function ensurePad(sb: SB, userId: string, pad: unknown[]): Promise<string | null> {
  let parentId: string | null = null;
  for (const rauw of pad) {
    const naam = String(rauw ?? "").trim().slice(0, 120);
    if (!naam) continue;
    const basis = sb
      .from("bestanden")
      .select("id")
      .eq("type", "map")
      .eq("naam", naam)
      .limit(1);
    const zoek = parentId === null
      ? basis.is("parent_id", null)
      : basis.eq("parent_id", parentId);
    const gevonden = (await zoek).data as { id: string }[] | null;
    let id: string | null = gevonden?.[0]?.id ?? null;
    if (!id) {
      const res = (await sb
        .from("bestanden")
        .insert({ user_id: userId, type: "map", naam, parent_id: parentId })
        .select("id")
        .single()) as { data: { id: string } | null };
      id = res.data?.id ?? null;
    }
    if (!id) break;
    parentId = id;
  }
  return parentId;
}

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

  const params = new URL(req.url).searchParams;

  // De hele mappenboom voor de kiezer — licht, zonder inhoud/data.
  if (params.get("tree")) {
    const { data } = await sb
      .from("bestanden")
      .select("id, parent_id, type, naam, tool, updated_at")
      .order("naam", { ascending: true });
    return NextResponse.json({ bestanden: data ?? [] });
  }

  const id = params.get("id");
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
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // 1) Een nieuwe map aanmaken.
  if (body.actie === "map") {
    const naam = String(body.naam || "").trim().slice(0, 120);
    if (!naam) return NextResponse.json({ error: "bad_request" }, { status: 400 });
    const parentId = await geldigeMapId(sb, body.parent_id);
    const { data, error } = await sb
      .from("bestanden")
      .insert({ user_id: user.id, type: "map", naam, parent_id: parentId })
      .select("id, naam, parent_id")
      .single();
    if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
    return NextResponse.json(data);
  }

  // 2) Een algemeen item (bv. een les) opslaan in een gekozen map.
  if (body.type && body.type !== "plattegrond") {
    const type = String(body.type).slice(0, 20); // "les" | "tekst"
    const naam = String(body.naam || "Naamloos").trim().slice(0, 120) || "Naamloos";

    // Een bestaand item overschrijven (zelfde plek; alleen naam/inhoud/data bij).
    if (body.id) {
      const { data, error } = await sb
        .from("bestanden")
        .update({
          naam,
          inhoud: body.inhoud != null ? String(body.inhoud) : null,
          data: body.data ?? null,
        })
        .eq("id", body.id)
        .select("id, naam")
        .single();
      if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
      return NextResponse.json(data);
    }

    // Doelmap: via een pad (lui aanmaken) of een bestaande map-id.
    let parentId: string | null = null;
    if (Array.isArray(body.pad) && body.pad.length) {
      parentId = await ensurePad(sb, user.id, body.pad);
    } else if (body.parent_id) {
      parentId = await geldigeMapId(sb, body.parent_id);
      if (parentId === null) {
        return NextResponse.json({ error: "map_niet_gevonden" }, { status: 400 });
      }
    }

    const { data, error } = await sb
      .from("bestanden")
      .insert({
        user_id: user.id,
        type,
        naam,
        inhoud: body.inhoud != null ? String(body.inhoud) : null,
        data: body.data ?? null,
        parent_id: parentId,
        tool: body.tool ? String(body.tool).slice(0, 40) : null,
      })
      .select("id, naam, parent_id")
      .single();
    if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
    return NextResponse.json(data);
  }

  // 3) Legacy: plattegrond opslaan/overschrijven (ongewijzigd gedrag).
  if (body.data == null) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const naam = String(body.naam || "Plattegrond").slice(0, 120);

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

  // Nieuw: zorg dat de map "Mijn plattegrond" in de wortel bestaat.
  const mapId = await ensurePad(sb, user.id, [MAP_NAAM]);
  const { data, error } = await sb
    .from("bestanden")
    .insert({
      user_id: user.id,
      type: "plattegrond",
      naam,
      data: body.data,
      parent_id: mapId,
      tool: "plattegrond",
    })
    .select("id, naam")
    .single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json(data);
}

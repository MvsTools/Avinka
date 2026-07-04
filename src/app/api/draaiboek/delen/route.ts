import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";

// Delen van een draaiboek (een bestand) met anderen op e-mail, of via een
// leeslink. De mail zelf wordt (nog) niet verstuurd — de eigenaar krijgt een
// kopieerbare link die hij zelf kan doorsturen. Zodra SMTP klaarstaat sturen
// we de uitnodiging automatisch.
//   POST   {bestand_id, email?, rol?}  → maak een deling, geeft {…, link} terug
//   GET    ?bestand_id=…               → de bestaande delingen van dat bestand
//   DELETE ?id=…                       → een deling intrekken
// Alleen de EIGENAAR van het bestand kan delen/beheren.

function origin(req: Request): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return `${proto}://${host}`;
}

type BestRij = { id: string; user_id: string } | null;

export async function POST(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const bestandId = body?.bestand_id;
  if (!bestandId || typeof bestandId !== "string")
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // Alleen de eigenaar mag delen (een uitgenodigde bewerker kan niet her-delen).
  const { data: best } = await sb
    .from("bestanden")
    .select("id, user_id")
    .eq("id", bestandId)
    .maybeSingle();
  if (!best || (best as BestRij)?.user_id !== user.id)
    return NextResponse.json({ error: "geen_eigenaar" }, { status: 403 });

  const email =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim().toLowerCase().slice(0, 200)
      : null;
  const rol = body.rol === "bekijken" ? "bekijken" : "bewerken";
  const token = (randomUUID() + randomUUID()).replace(/-/g, "").slice(0, 40);

  const { data, error } = await sb
    .from("bestand_deling")
    .insert({ bestand_id: bestandId, eigenaar: user.id, gedeeld_email: email, rol, token })
    .select("id, gedeeld_email, rol, token, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({
    ...data,
    link: `${origin(req)}/gedeeld.html?token=${data.token}`,
  });
}

export async function GET(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bestandId = new URL(req.url).searchParams.get("bestand_id");
  if (!bestandId) return NextResponse.json({ delingen: [] });

  const { data } = await sb
    .from("bestand_deling")
    .select("id, gedeeld_email, rol, token, created_at")
    .eq("bestand_id", bestandId)
    .eq("eigenaar", user.id)
    .order("created_at", { ascending: true });

  const base = origin(req);
  const delingen = (data ?? []).map((d) => ({
    ...(d as Record<string, unknown>),
    link: `${base}/gedeeld.html?token=${(d as { token: string }).token}`,
  }));
  return NextResponse.json({ delingen });
}

export async function DELETE(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { error } = await sb
    .from("bestand_deling")
    .delete()
    .eq("id", id)
    .eq("eigenaar", user.id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

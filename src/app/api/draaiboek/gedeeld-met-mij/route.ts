import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// De bestanden die met MIJ zijn gedeeld (op mijn e-mailadres). Voor de
// "Gedeeld met mij"-tab in Bestanden. RLS laat me deze delingen + bestanden
// zien (policies "deling voor mij zichtbaar" en "gedeelde bestanden lezen").
export async function GET() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = (user.email || "").toLowerCase();
  if (!email) return NextResponse.json({ bestanden: [] });

  const { data: delingen } = await sb
    .from("bestand_deling")
    .select("bestand_id, rol")
    .ilike("gedeeld_email", email);

  const rolByBestand = new Map<string, string>();
  for (const d of (delingen ?? []) as { bestand_id: string; rol: string }[]) {
    if (!rolByBestand.has(d.bestand_id)) rolByBestand.set(d.bestand_id, d.rol);
  }
  const ids = [...rolByBestand.keys()];
  if (!ids.length) return NextResponse.json({ bestanden: [] });

  const { data: best } = await sb
    .from("bestanden")
    .select("id, naam, tool, type, updated_at")
    .in("id", ids)
    .order("updated_at", { ascending: false });

  const bestanden = (best ?? []).map((b) => {
    const rij = b as { id: string };
    return { ...(b as Record<string, unknown>), rol: rolByBestand.get(rij.id) ?? "bekijken" };
  });
  return NextResponse.json({ bestanden });
}

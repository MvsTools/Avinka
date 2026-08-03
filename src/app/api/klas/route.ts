import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Geeft de klassenlijst van de INGELOGDE leerkracht terug, zodat de tools
// (Plattegrond, Rapporten, Oudercontact) de namen kunnen invullen.
// RLS in de database zorgt dat je alleen je eigen klas krijgt.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Heeft de leerkracht een gedeelde duo-klas gekozen als actief? Die
  // voorkeur staat los van klassen.actief (zie schema.sql sectie 19) — een
  // gedeelde klas mag de eigenaar zijn eigen "actief"-vlag niet omgooien.
  const { data: instelling } = await supabase
    .from("instellingen")
    .select("actieve_duo_klas_id")
    .maybeSingle();
  const duoKlasId = instelling?.actieve_duo_klas_id as string | null | undefined;

  const KLAS_COLS = "id, naam, leerlingen, leerlingen_data";
  let data: {
    id: string;
    naam: string;
    leerlingen: string[] | null;
    leerlingen_data: unknown;
  } | null = null;
  if (duoKlasId) {
    const r = await supabase.from("klassen").select(KLAS_COLS).eq("id", duoKlasId).maybeSingle();
    data = r.data;
  }
  if (!data) {
    // Geen (geldige) gedeelde voorkeur: de gewone eigen-klas-volgorde.
    const { data: eigen, error } = await supabase
      .from("klassen")
      .select(KLAS_COLS)
      .order("actief", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
    data = eigen;
  }

  const namen: string[] = data?.leerlingen ?? [];
  const ruw = data?.leerlingen_data;
  const leerlingenData =
    Array.isArray(ruw) && ruw.length
      ? ruw
      : namen.map((n) => ({ naam: n, geslacht: "" }));

  return NextResponse.json({
    id: data?.id ?? "", // voor tools die een rapport/bestand aan deze klas koppelen (duo-collega's)
    naam: data?.naam ?? "",
    leerlingen: namen, // platte namenlijst — bestaande tools blijven werken
    leerlingenData, // [{naam, geslacht}] — voor tools die hij/zij willen gebruiken
  });
}

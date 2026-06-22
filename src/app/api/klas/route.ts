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

  // De ACTIEVE klas (de leerkracht kan meerdere klassen hebben).
  const { data, error } = await supabase
    .from("klassen")
    .select("naam, leerlingen, leerlingen_data")
    .order("actief", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const namen: string[] = data?.leerlingen ?? [];
  const ruw = data?.leerlingen_data;
  const leerlingenData =
    Array.isArray(ruw) && ruw.length
      ? ruw
      : namen.map((n) => ({ naam: n, geslacht: "" }));

  return NextResponse.json({
    naam: data?.naam ?? "",
    leerlingen: namen, // platte namenlijst — bestaande tools blijven werken
    leerlingenData, // [{naam, geslacht}] — voor tools die hij/zij willen gebruiken
  });
}

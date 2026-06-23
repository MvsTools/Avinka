import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Geeft ALLE voornamen van de ingelogde leerkracht terug — over al z'n klassen
// heen — als platte, ontdubbelde lijst.
//
// Enig doel: de extra maskeringslaag in de tools (public/avinka-masking.js).
// Die vervangt deze namen client-side als losse hele woorden (hoofdletter-
// ongevoelig) door codes vóór verzending naar de AI, als vangnet bovenop de
// maskering die elke tool zelf al doet. Zo wordt ook een per ongeluk met kleine
// letter getypte naam ("rik") nog afgeschermd.
//
// RLS zorgt dat je alleen je eigen namen krijgt. Bij geen sessie/fout geven we
// een lege lijst terug (de tool valt dan stil terug op z'n eigen maskering).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ namen: [] }, { status: 401 });
  }

  const { data, error } = await supabase.from("klassen").select("leerlingen");
  if (error) {
    return NextResponse.json({ namen: [] }, { status: 500 });
  }

  const set = new Set<string>();
  for (const rij of data ?? []) {
    const lijst: unknown = (rij as { leerlingen?: unknown }).leerlingen;
    if (!Array.isArray(lijst)) continue;
    for (const n of lijst) {
      const naam = String(n ?? "").trim();
      if (naam.length >= 2) set.add(naam);
    }
  }

  return NextResponse.json({ namen: [...set] });
}

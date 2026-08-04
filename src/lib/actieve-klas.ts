import type { SupabaseClient } from "@supabase/supabase-js";

/* Welke groep is op dit moment de actieve voor DEZE gebruiker?
 *
 * Op één plek, want het antwoord wordt inmiddels op twee plekken gebruikt: de
 * tools vragen het via /api/klas, en de Start-pagina heeft het nodig om te
 * kunnen zeggen dat je bij deze groep alleen meekijkt. Zouden die twee het
 * ieder zelf uitrekenen, dan gaan ze bij de eerste wijziging uit elkaar lopen
 * en zegt je dashboard iets anders dan je tool.
 *
 * De volgorde: heeft de leerkracht een gedeelde groep als actief gekozen, dan
 * die. Anders de gewone eigen-klas-volgorde. Zie schema.sql sectie 19 voor
 * waarom die voorkeur per gebruiker staat en niet op de klas zelf. */
export async function haalActieveKlas<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  kolommen: string,
): Promise<T | null> {
  const { data: instelling } = await supabase
    .from("instellingen")
    .select("actieve_duo_klas_id")
    .maybeSingle();
  const duoKlasId = instelling?.actieve_duo_klas_id as string | null | undefined;

  if (duoKlasId) {
    const { data } = await supabase
      .from("klassen")
      .select(kolommen)
      .eq("id", duoKlasId)
      .maybeSingle();
    if (data) return data as T;
    // Geen rij: de gedeelde klas is weg of je toegang is ingetrokken. Val
    // gewoon terug op je eigen volgorde hieronder, dat is geen fout.
  }

  const { data, error } = await supabase
    .from("klassen")
    .select(kolommen)
    .order("actief", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  // Bewust gooien en niet null teruggeven: null betekent "je hebt nog geen
  // klas", en dat is iets heel anders dan "de database deed het niet". Wie
  // dat door elkaar haalt, laat een leerkracht denken dat zijn klas leeg is.
  if (error) throw new Error(`klas ophalen mislukt: ${error.message}`);
  return (data as T) ?? null;
}

/* Mag je voor de actieve groep rapporten schrijven?
 *
 * Nee als je er alleen meekijkt: rapporten zijn geschreven oordelen over
 * kinderen en horen bij wie medeverantwoordelijk is voor de groep. De
 * database bewaakt dit zelf ook (policy "duo-partner rapporten"); dit is er
 * om het te kunnen zéggen vóór iemand een heel rapport heeft getypt.
 *
 * Zonder groep is er niets te beperken: dan schrijf je gewoon voor jezelf. */
export async function haalRapportGrens(
  supabase: SupabaseClient,
): Promise<{ klasNaam: string; magRapporten: boolean }> {
  // Hier bewust NIET laten klappen: dit voedt alleen een regeltje op een
  // toolkaart. Gaat er iets mis, dan laten we die regel weg in plaats van de
  // hele Start-pagina te breken. Het slot zelf zit in de database, niet hier.
  let klas: { id: string; naam: string | null } | null = null;
  try {
    klas = await haalActieveKlas<{ id: string; naam: string | null }>(
      supabase,
      "id, naam",
    );
  } catch {
    return { klasNaam: "", magRapporten: true };
  }
  if (!klas?.id) return { klasNaam: "", magRapporten: true };

  const { data: volledig } = await supabase.rpc("klas_toegang_volledig", {
    p_klas: klas.id,
  });
  return { klasNaam: (klas.naam ?? "").trim(), magRapporten: volledig === true };
}

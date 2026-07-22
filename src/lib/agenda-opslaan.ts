import type { SupabaseClient } from "@supabase/supabase-js";
import { haalAgenda, maskeerNamen } from "./agenda-ophalen";
import { herkenAlles, vouwSamen } from "./agenda-herken";
import { ontsleutel } from "./geheim";

// Een gekoppelde agenda ophalen en de afspraken bijwerken. Gebruikt bij het
// koppelen zelf en straks bij het nachtelijke verversen.

export type VersUitslag = { aantal: number } | { fout: string };

/** De voornamen uit de klassen van deze leerkracht, voor de maskering. */
async function eigenVoornamen(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from("klassen").select("leerlingen");
  const set = new Set<string>();
  for (const rij of data ?? []) {
    const lijst: unknown = (rij as { leerlingen?: unknown }).leerlingen;
    if (!Array.isArray(lijst)) continue;
    for (const n of lijst) {
      const naam = String(n ?? "").trim();
      if (naam.length >= 3) set.add(naam);
    }
  }
  return [...set];
}

export async function ververBron(
  supabase: SupabaseClient,
  bron: { id: string; link_geheim: string; modus: string },
): Promise<VersUitslag> {
  let link: string;
  try {
    link = ontsleutel(bron.link_geheim);
  } catch {
    return { fout: "De opgeslagen link kon niet worden gelezen. Koppel de agenda opnieuw." };
  }

  const opgehaald = await haalAgenda(link);
  if ("fout" in opgehaald) {
    await supabase
      .from("agenda_bronnen")
      .update({ laatste_fout: opgehaald.fout })
      .eq("id", bron.id);
    return { fout: opgehaald.fout };
  }

  let groepen = vouwSamen(herkenAlles(opgehaald.agenda.afspraken));
  if (bron.modus === "heledagen") groepen = groepen.filter((g) => g.heleDag);

  const namen = await eigenVoornamen(supabase);

  const rijen = groepen.map((g, i) => ({
    bron_id: bron.id,
    // Zelfde afspraak op dezelfde dag moet altijd dezelfde sleutel krijgen,
    // anders komt hij er bij elke verversing opnieuw bij.
    uid: `${g.van}|${g.soort}|${g.begin ?? "heledag"}|${i}`,
    datum: g.van,
    tot_datum: g.tot,
    hele_dag: g.heleDag,
    begintijd: g.begin ?? null,
    eindtijd: g.eind ?? null,
    titel: maskeerNamen(g.titel, namen).slice(0, 300),
    soort: g.soort,
    tijdvakken: g.aantal,
    bijgewerkt: new Date().toISOString(),
  }));

  // Alles van deze bron vervangen. Simpel en altijd kloppend: wat de school
  // heeft geschrapt verdwijnt zo ook bij ons, zonder ingewikkeld vergelijken.
  const { error: wisFout } = await supabase.from("agenda_items").delete().eq("bron_id", bron.id);
  if (wisFout) return { fout: "De oude afspraken konden niet worden opgeruimd." };

  if (rijen.length) {
    const { error } = await supabase.from("agenda_items").insert(rijen);
    if (error) return { fout: "De afspraken konden niet worden opgeslagen." };
  }

  await supabase
    .from("agenda_bronnen")
    .update({
      laatst_gelukt: new Date().toISOString(),
      laatste_fout: null,
      aantal_items: rijen.length,
    })
    .eq("id", bron.id);

  return { aantal: rijen.length };
}

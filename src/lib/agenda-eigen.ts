import type { SupabaseClient } from "@supabase/supabase-js";

// Je eigen afspraken — die je zelf invoert, zonder gekoppelde agenda.
//
// WAAROM DIT ALS "BRON" IS OPGEZET
// Elke afspraak hangt aan een agendabron (`agenda_items.bron_id`). Dat is
// handig: de dubbelingen-logica, de kleuren en het overzicht werken allemaal
// per bron. Je eigen afspraken krijgen daarom ook een bron — eentje zonder
// link, die alleen van jou is. Zo hoefde er niets aan de database te
// veranderen en doen ze in de rest van het platform precies mee als de rest:
// ze worden herkend, ze leveren signalen op in "Wat eraan komt", ze staan in
// je dagbeeld.
//
// ⚠️ HET GEVAAR, EN WAAR HET SLOT ZIT
// Een gekoppelde agenda verversen betekent: alles van die bron weggooien en
// opnieuw ophalen. Zou je eigen agenda ooit meegaan in dat rondje, dan is alles
// wat je zelf hebt ingevoerd in één klap weg. Het slot staat daarom in
// `ververBron` zelf — bij de delete, niet bij de aanroeper. Wie later een
// nieuwe knop bouwt die verversen aanroept, kan dit dus niet per ongeluk
// omzeilen.

export const EIGEN_SYSTEEM = "eigen";
export const EIGEN_NAAM = "Mijn eigen afspraken";

export type EigenBron = { id: string; naam: string };

/**
 * De eigen-agenda-bron van deze leerkracht, of maak hem aan als hij er nog niet
 * is. Eén per gebruiker.
 *
 * `link_geheim` blijft leeg: er is geen link om op te halen. Precies daarom
 * herkent `ververBron` hem ook als "hier valt niets te verversen".
 */
export async function haalOfMaakEigenBron(
  supabase: SupabaseClient,
  userId: string,
): Promise<EigenBron | { fout: string }> {
  const { data: bestaand } = await supabase
    .from("agenda_bronnen")
    .select("id, naam")
    .eq("systeem", EIGEN_SYSTEEM)
    .maybeSingle();
  if (bestaand) return bestaand as EigenBron;

  const { data, error } = await supabase
    .from("agenda_bronnen")
    .insert({
      user_id: userId,
      naam: EIGEN_NAAM,
      systeem: EIGEN_SYSTEEM,
      link_geheim: "",
      modus: "alles",
      kleur: "amber",
      actief: true,
    })
    .select("id, naam")
    .single();

  // Zonder .select() zou een geblokkeerde insert er precies zo uitzien als een
  // geslaagde: nul rijen is voor Postgres geen fout. Die les staat inmiddels op
  // meerdere plekken in dit project.
  if (error || !data) return { fout: "Je eigen agenda kon niet worden aangemaakt." };
  return data as EigenBron;
}

export function isEigenBron(bron: { systeem?: string | null } | null | undefined): boolean {
  return bron?.systeem === EIGEN_SYSTEEM;
}

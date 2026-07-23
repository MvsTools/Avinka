// Het ophalen van alles wat Mijn schooljaar nodig heeft, in één keer.
//
// Alleen hier praten we met de database. De rest van het onderdeel rekent met
// gewone gegevens, zodat we het los kunnen nakijken en er niets stiekem een
// extra vraag aan de database stelt.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Soort } from "../agenda-herken";
import { vandaag } from "./datum";
import { beschikbareSchooljaren, maakSchooljaar, periodesVan, schooljaarVoor } from "./schooljaar";
import type { PlanItem, PlanningBron, Taak } from "./types";
import { isRegio, STANDAARD_REGIO, type Regio } from "./vakanties";

/** De vakantieregio van deze leerkracht. Niet ingevuld? Dan het landelijke midden. */
export async function haalRegio(supabase: SupabaseClient): Promise<Regio> {
  const { data } = await supabase.from("instellingen").select("vakantieregio").maybeSingle();
  const gekozen = (data as { vakantieregio?: unknown } | null)?.vakantieregio;
  return isRegio(gekozen) ? gekozen : STANDAARD_REGIO;
}

type ItemRij = {
  id: string;
  bron_id: string;
  datum: string;
  tot_datum: string | null;
  hele_dag: boolean;
  begintijd: string | null;
  eindtijd: string | null;
  titel: string;
  soort: string;
  tijdvakken: number | null;
};

/** Tijden komen als "18:00:00" uit de database; op het scherm willen we "18:00". */
function uur(waarde: string | null): string | undefined {
  return waarde ? waarde.slice(0, 5) : undefined;
}

function naarItem(rij: ItemRij): PlanItem {
  return {
    id: rij.id,
    bronId: rij.bron_id,
    datum: rij.datum,
    totDatum: rij.tot_datum || rij.datum,
    heleDag: Boolean(rij.hele_dag),
    begin: uur(rij.begintijd),
    eind: uur(rij.eindtijd),
    titel: rij.titel,
    soort: rij.soort as Soort,
    tijdvakken: rij.tijdvakken || 1,
  };
}

export async function haalItems(
  supabase: SupabaseClient,
  van: string,
  tot: string,
): Promise<PlanItem[]> {
  const { data } = await supabase
    .from("agenda_items")
    .select("id, bron_id, datum, tot_datum, hele_dag, begintijd, eindtijd, titel, soort, tijdvakken")
    // Een meerdaagse afspraak telt mee zodra hij het bereik raakt.
    .lte("datum", tot)
    .gte("tot_datum", van)
    .order("datum");
  return ((data as ItemRij[] | null) ?? []).map(naarItem);
}

export async function haalTaken(
  supabase: SupabaseClient,
  van: string,
  tot: string,
): Promise<Taak[]> {
  const { data } = await supabase
    .from("taken")
    .select("id, tekst, gedaan, deadline")
    .gte("deadline", van)
    .lte("deadline", tot)
    .order("deadline");
  const rijen = (data as { id: string; tekst: string; gedaan: boolean; deadline: string }[]) ?? [];
  return rijen.map((r) => ({ id: r.id, tekst: r.tekst, gedaan: r.gedaan, deadline: r.deadline }));
}

/**
 * Alles voor een stuk van de kalender. Geef geen bereik mee en je krijgt het
 * hele schooljaar; dat is precies wat de Jaar-laag nodig heeft.
 */
export async function haalPlanning(
  supabase: SupabaseClient,
  opties: { van?: string; tot?: string; schooljaarId?: string; nu?: string } = {},
): Promise<PlanningBron> {
  const nu = opties.nu ?? vandaag();
  const regio = await haalRegio(supabase);
  const schooljaar = maakSchooljaar(opties.schooljaarId ?? schooljaarVoor(nu, regio), regio, nu);

  // Ook de vakanties zelf horen erbij, dus we kijken iets ruimer dan de
  // schooldagen: van de eerste vakantiedag tot en met de zomervakantie.
  const van = opties.van ?? schooljaar.vakanties[0]?.van ?? schooljaar.start;
  const tot = opties.tot ?? schooljaar.vakanties.at(-1)?.tot ?? schooljaar.eind;

  const [items, taken] = await Promise.all([
    haalItems(supabase, van, tot),
    haalTaken(supabase, van, tot),
  ]);

  return {
    schooljaar,
    periodes: periodesVan(schooljaar),
    items,
    taken,
    // Het basisrooster komt in fase 2 uit de database. Tot die tijd rekenen de
    // schermen met een lege week; alles eromheen werkt al wel.
    blokken: [],
  };
}

/** Dit schooljaar en het vorige, voor de kiezer bovenin. */
export async function haalSchooljaren(supabase: SupabaseClient, nu: string = vandaag()) {
  return beschikbareSchooljaren(await haalRegio(supabase), nu);
}

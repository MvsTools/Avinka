// Het ophalen van alles wat Mijn schooljaar nodig heeft, in één keer.
//
// Alleen hier praten we met de database. De rest van het onderdeel rekent met
// gewone gegevens, zodat we het los kunnen nakijken en er niets stiekem een
// extra vraag aan de database stelt.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Soort } from "../agenda-herken";
import { plus, vandaag } from "./datum";
import { markeerDubbelingen } from "./dubbelingen";
import { mijnGroepen } from "./relevantie";
import {
  isBasisrooster,
  isRoosterWeekData,
  naarBlokken,
  type Basisrooster,
  type RoosterSetup,
} from "./rooster";
import { metEigenVakanties } from "./eigen-vakanties";
import { beschikbareSchooljaren, maakSchooljaar, periodesVan, schooljaarVoor } from "./schooljaar";
import type { PlanItem, PlanningBron, Roosterblok, Taak } from "./types";
import { isRegio, STANDAARD_REGIO, type Regio, type Vakantie } from "./vakanties";

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

/**
 * De vakanties om een streak tegen af te zetten (zie src/lib/streak.ts): de
 * landelijke regio-kalender, aangevuld met de eigen schoolagenda als die
 * gekoppeld is — precies zoals Mijn schooljaar dat ook al doet, zie
 * metEigenVakanties. Kijkt alleen terug (een streak kijkt nooit vooruit), dus
 * we halen ook maar een klein stukje agenda op, niet het hele schooljaar.
 */
export async function haalStreakVakanties(
  supabase: SupabaseClient,
  nu: string = vandaag(),
): Promise<Vakantie[]> {
  const regio = await haalRegio(supabase);
  const jaren = beschikbareSchooljaren(regio, nu);
  const items = await haalItems(supabase, plus(nu, -120), nu);
  return jaren.flatMap((jaar) => metEigenVakanties(jaar, items).vakanties);
}

/**
 * De groep(en) van deze leerkracht, uit zijn instellingen. Daarmee zetten we de
 * afspraken van andere groepen opzij. In dat veld staat vrije tekst ("Groep 7",
 * "7", "1/2"), dus we halen er de nummers uit; lukt dat niet, dan filteren we
 * niet.
 */
export async function haalMijnGroepen(supabase: SupabaseClient): Promise<number[]> {
  const { data } = await supabase.from("instellingen").select("standaardgroep").maybeSingle();
  return mijnGroepen((data as { standaardgroep?: string } | null)?.standaardgroep);
}

/**
 * Het basisrooster van dit schooljaar. Nog niet gemaakt? Dan null, en de
 * schermen rekenen met een lege week.
 */
export async function haalBasisrooster(
  supabase: SupabaseClient,
  schooljaarId: string,
): Promise<Basisrooster | null> {
  const { data } = await supabase
    .from("basisrooster")
    .select("data")
    .eq("schooljaar", schooljaarId)
    .maybeSingle();
  const ruw = (data as { data?: unknown } | null)?.data;
  return isBasisrooster(ruw) ? ruw : null;
}

type RoosterWeekRij = { maandag: string; data: unknown };

/**
 * De weken die van het basisrooster afwijken, in een bereik. De kleuren komen
 * altijd uit het HUIDIGE basisrooster (rooster_week bewaart alleen blokken,
 * nooit een eigen vakkenlijst) — wijzig je later een vakkleur, dan zie je die
 * ook meteen terug in een al bestaande weekafwijking.
 */
export async function haalRoosterWeken(
  supabase: SupabaseClient,
  van: string,
  tot: string,
  setup: RoosterSetup,
): Promise<Record<string, Roosterblok[]>> {
  const { data } = await supabase
    .from("rooster_week")
    .select("maandag, data")
    .gte("maandag", van)
    .lte("maandag", tot);
  const rijen = (data as RoosterWeekRij[] | null) ?? [];
  const uit: Record<string, Roosterblok[]> = {};
  for (const rij of rijen) {
    if (!isRoosterWeekData(rij.data)) continue;
    uit[rij.maandag] = naarBlokken({ setup, blokken: rij.data.blokken });
  }
  return uit;
}

export type AgendaBron = {
  id: string;
  naam: string;
  systeem: string;
  modus: string;
  aantal_items: number;
  laatst_gelukt: string | null;
  laatste_fout: string | null;
};

/**
 * De gekoppelde agenda's op volgorde van koppelen. De eerste is de
 * hoofdagenda: staat dezelfde afspraak in twee agenda's, dan is die van de
 * hoofdagenda het origineel.
 */
export async function haalBronnen(supabase: SupabaseClient): Promise<AgendaBron[]> {
  const { data } = await supabase
    .from("agenda_bronnen")
    .select("id, naam, systeem, modus, aantal_items, laatst_gelukt, laatste_fout")
    .eq("actief", true)
    .order("created_at");
  return (data as AgendaBron[] | null) ?? [];
}

export async function haalBronvolgorde(supabase: SupabaseClient): Promise<string[]> {
  return (await haalBronnen(supabase)).map((b) => b.id);
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

  // We kijken bewust ruimer dan de schooldagen. De vakanties zelf horen erbij,
  // en de school kan eerder beginnen of later stoppen dan de landelijke lijst
  // zegt; dat willen we zien vóór we het schooljaar vastzetten.
  const van = opties.van ?? plus(schooljaar.start, -45);
  const tot = opties.tot ?? plus(schooljaar.eind, 75);

  const [ruwe, taken, volgorde, rooster] = await Promise.all([
    haalItems(supabase, van, tot),
    haalTaken(supabase, van, tot),
    haalBronvolgorde(supabase),
    haalBasisrooster(supabase, schooljaar.id),
  ]);

  // De weekafwijkingen hebben het basisrooster (voor zijn vakkleuren) al
  // nodig, dus die vraag doen we pas hierna.
  const weekOverrides = await haalRoosterWeken(supabase, van, tot, rooster?.setup ?? {});

  // Staat dezelfde afspraak in twee agenda's, dan tonen we hem één keer.
  const items = markeerDubbelingen(ruwe, volgorde);

  // De vakanties van je eigen school gaan boven de landelijke lijst.
  const eigen = metEigenVakanties(schooljaar, items);

  return {
    schooljaar: eigen,
    periodes: periodesVan(eigen),
    items,
    taken,
    blokken: naarBlokken(rooster),
    weekOverrides,
  };
}

/** Dit schooljaar en het vorige, voor de kiezer bovenin. */
export async function haalSchooljaren(supabase: SupabaseClient, nu: string = vandaag()) {
  return beschikbareSchooljaren(await haalRegio(supabase), nu);
}

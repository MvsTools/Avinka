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
import type { Context, Schoolsystemen } from "./aanleiding";
import { haalActieveKlas } from "../actieve-klas";
import {
  isBasisrooster,
  isRoosterWeekData,
  naarBlokken,
  type Basisrooster,
  type RoosterSetup,
} from "./rooster";
import { metEigenVakanties } from "./eigen-vakanties";
import { feestdagenAlsItems } from "./feestdagen";
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
 * De seintjes in "Wat eraan komt" die deze leerkracht zelf heeft weggeklikt
 * (zie /api/aanleiding/negeer). Geen scherm laat je meer vooraf het soort
 * instellen — dit is de correctie áchteraf, per Aanleiding.id.
 */
export async function haalGenegeerdeAanleidingen(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from("aanleiding_genegeerd").select("aanleiding_id");
  return ((data as { aanleiding_id: string }[] | null) ?? []).map((r) => r.aanleiding_id);
}

/**
 * Met welke systemen werkt deze school (Instellingen → Voorkeuren)? Daarmee
 * wordt "maak een gespreksrooster" een concrete "zet de gesprekken open in
 * Parro". Niets ingevuld = lege waarden, en dan blijft alles algemeen.
 */
export async function haalSchoolsystemen(supabase: SupabaseClient): Promise<Schoolsystemen> {
  const { data } = await supabase
    .from("instellingen")
    .select("communicatie_app, lvs_systeem, toets_systeem")
    .maybeSingle();
  const r = (data ?? {}) as { communicatie_app?: string; lvs_systeem?: string; toets_systeem?: string };
  return {
    communicatieApp: r.communicatie_app ?? "",
    lvsSysteem: r.lvs_systeem ?? "",
    toetsSysteem: r.toets_systeem ?? "",
  };
}

/**
 * Wat de signalen scherper maakt dan alleen "er komt iets aan": op welke dagen
 * je werkt, en hoe ver je al bent met de rapporten van je huidige groep.
 *
 * ⚠️ We tellen alleen. Er gaan geen namen van kinderen mee naar het scherm —
 * "nog 16 van de 28" zegt genoeg en blijft binnen de afspraken over wat we van
 * een klas mogen tonen.
 *
 * Mislukt er iets, dan komt er een lege context terug en werkt alles gewoon
 * zonder deze extra's. Dit is een verrijking, geen voorwaarde.
 */
export async function haalPlanningContext(supabase: SupabaseClient): Promise<Context> {
  const [{ data: inst }, klas] = await Promise.all([
    supabase.from("instellingen").select("werkdagen").maybeSingle(),
    haalActieveKlas<{ leerlingen: string[] | null }>(supabase, "leerlingen").catch(() => null),
  ]);

  const context: Context = {
    werkdagen: (inst as { werkdagen?: string } | null)?.werkdagen ?? "",
  };

  const namen = (klas?.leerlingen ?? []).filter((n) => String(n).trim());
  if (namen.length) {
    // Tellen op naam en niet op klas_id: rapporten van vóór de duo-functie
    // hebben nog geen klas_id, en die horen gewoon mee te tellen.
    const { data } = await supabase.from("rapporten").select("naam, verhaal");
    const rijen = (data as { naam: string; verhaal: string }[] | null) ?? [];
    const inDeKlas = new Set(namen.map((n) => n.trim().toLowerCase()));
    const klaar = rijen.filter(
      (r) => r.verhaal?.trim() && inDeKlas.has(String(r.naam).trim().toLowerCase()),
    ).length;
    context.rapporten = { klaar, totaal: namen.length };
  }

  return context;
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
/**
 * De GEKOPPELDE agenda's — dus zonder je eigen afspraken.
 *
 * ⚠️ Je eigen agenda is technisch ook een bron, maar hoort hier niet bij: hij
 * zou anders in het koppelscherm verschijnen met een verversknop ernaast, en
 * verversen betekent "alles van deze bron weggooien en opnieuw ophalen". Bij
 * een agenda zonder link is dat gewoon weggooien. Ook telt hij zo niet mee in
 * "Agenda's (1)" terwijl je er geen gekoppeld hebt.
 */
export async function haalBronnen(supabase: SupabaseClient): Promise<AgendaBron[]> {
  const { data } = await supabase
    .from("agenda_bronnen")
    .select("id, naam, systeem, modus, aantal_items, laatst_gelukt, laatste_fout")
    .eq("actief", true)
    .neq("systeem", "eigen")
    .order("created_at");
  return (data as AgendaBron[] | null) ?? [];
}

/**
 * De volgorde waarin agenda's elkaar overstemmen bij dubbele afspraken: wie
 * vooraan staat wint.
 *
 * Je eigen afspraken staan bewust VOORAAN. Die heb je zelf ingetypt, dus als
 * er iets lijkt op een afspraak uit de schoolagenda hoort de jouwe te blijven
 * staan — anders typ je iets in en is het meteen "verdwenen".
 */
export async function haalBronvolgorde(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("agenda_bronnen")
    .select("id, systeem, created_at")
    .eq("actief", true)
    .order("created_at");
  const alle = (data as { id: string; systeem: string }[] | null) ?? [];
  return [
    ...alle.filter((b) => b.systeem === "eigen").map((b) => b.id),
    ...alle.filter((b) => b.systeem !== "eigen").map((b) => b.id),
  ];
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

  // De landelijke feestdagen (Koningsdag, Hemelvaartsdag …) horen er ook bij,
  // ook als er geen agenda gekoppeld is. Noemt de gekoppelde agenda dezelfde
  // dag óók (bijv. "Koningsdag - alle groepen vrij"), dan wint die hieronder
  // gewoon via de dubbelingen-check, net als bij de landelijke vakantiedata.
  const metFeestdagen = [...ruwe, ...feestdagenAlsItems(schooljaar)];

  // Staat dezelfde afspraak in twee agenda's, dan tonen we hem één keer.
  const items = markeerDubbelingen(metFeestdagen, volgorde);

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

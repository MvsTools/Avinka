// Van een datum naar een schooljaar, en van een schooljaar naar zijn periodes.

import { maandagVan, plus, schoolweken, vandaag, weekdag } from "./datum";
import type { Periode, Schooljaar } from "./types";
import {
  BEKENDE_SCHOOLJAREN,
  SCHOOLJAREN,
  STANDAARD_REGIO,
  vakantiesVan,
  zomervakantieVan,
  type Regio,
} from "./vakanties";

/**
 * De eerste schooldag: de dag na de zomervakantie van het vórige schooljaar.
 *
 * Van het oudste schooljaar dat we kennen hebben we die vorige zomer niet.
 * Dan schatten we hem: zomervakanties liggen elk jaar in dezelfde week, dus we
 * nemen de zomer van dit jaar min 52 weken. Dat scheelt hooguit een dag of wat
 * en het gaat alleen om een afgesloten jaar dat je nog kunt terugkijken.
 */
function eersteSchooldag(schooljaarId: string, regio: Regio): string {
  const jaar = Number(schooljaarId.slice(0, 4));
  const vorige = zomervakantieVan(`${jaar - 1}-${jaar}`, regio);
  const eigen = zomervakantieVan(schooljaarId, regio);
  const eindeZomer = vorige ? vorige.tot : eigen ? plus(eigen.tot, -364) : `${jaar}-08-31`;
  return naarWerkdag(plus(eindeZomer, 1), 1);
}

/** De laatste schooldag: de dag vóór de zomervakantie van dit schooljaar. */
function laatsteSchooldag(schooljaarId: string, regio: Regio): string {
  const eigen = zomervakantieVan(schooljaarId, regio);
  const jaar = Number(schooljaarId.slice(5));
  return naarWerkdag(eigen ? plus(eigen.van, -1) : `${jaar}-07-15`, -1);
}

/** Valt een datum in het weekend, schuif hem dan naar de dichtstbijzijnde werkdag. */
function naarWerkdag(iso: string, richting: 1 | -1): string {
  let d = iso;
  while (weekdag(d) >= 5) d = plus(d, richting);
  return d;
}

export function maakSchooljaar(
  schooljaarId: string,
  regio: Regio = STANDAARD_REGIO,
  nu: string = vandaag(),
): Schooljaar {
  const start = eersteSchooldag(schooljaarId, regio);
  const eind = laatsteSchooldag(schooljaarId, regio);
  // De startweek: de vijf werkdagen (ma t/m vr) vlak vóór de eerste schooldag.
  // Voor de leerkracht begint het jaar dan al — lokaal klaarmaken, plannen —
  // terwijl de kinderen nog een week vakantie hebben. Elke school heeft dit;
  // wanneer precies hangt aan de regio (want die bepaalt de eerste schooldag).
  const startweekMaandag = plus(maandagVan(start), -7);
  return {
    id: schooljaarId,
    label: schooljaarId.replace("-", "/"),
    regio,
    start,
    eind,
    vakanties: vakantiesVan(schooljaarId, regio),
    startweek: { van: startweekMaandag, tot: plus(startweekMaandag, 4) },
    afgesloten: nu > eind,
  };
}

/**
 * Bij welk schooljaar hoort deze datum?
 *
 * In de zomervakantie kiezen we bewust het nieuwe jaar: wie in juli of augustus
 * aan zijn planning zit, is met het komende jaar bezig, niet met het jaar dat
 * net voorbij is.
 */
export function schooljaarVoor(datum: string, regio: Regio = STANDAARD_REGIO): string {
  for (const id of BEKENDE_SCHOOLJAREN) {
    if (datum <= laatsteSchooldag(id, regio)) return id;
  }
  return BEKENDE_SCHOOLJAREN[BEKENDE_SCHOOLJAREN.length - 1];
}

/**
 * De schooljaren die je mag openen: dit jaar en het vorige. Verder terug
 * bewaren we niet (goed voor de privacy) en vooruit plannen we niet.
 */
export function beschikbareSchooljaren(
  regio: Regio = STANDAARD_REGIO,
  nu: string = vandaag(),
): Schooljaar[] {
  const huidigId = schooljaarVoor(nu, regio);
  const plek = BEKENDE_SCHOOLJAREN.indexOf(huidigId);
  const vorigId = plek > 0 ? BEKENDE_SCHOOLJAREN[plek - 1] : undefined;
  const uit = [maakSchooljaar(huidigId, regio, nu)];
  if (vorigId && SCHOOLJAREN[vorigId]) uit.push(maakSchooljaar(vorigId, regio, nu));
  return uit;
}

/** De vakantie waarin deze datum valt, als die er is. */
export function vakantieOp(jaar: Schooljaar, datum: string) {
  return jaar.vakanties.find((v) => datum >= v.van && datum <= v.tot);
}

/**
 * Het schooljaar geknipt in blokken tussen de vakanties. Dit is de Periode-laag:
 * de brokken waarin een leerkracht echt denkt ("nog drie weken tot de kerst").
 */
export function periodesVan(jaar: Schooljaar): Periode[] {
  const vakanties = [...jaar.vakanties].sort((a, b) => a.van.localeCompare(b.van));
  const uit: Periode[] = [];
  let van = jaar.start;
  let vorige: string | undefined;

  for (const vakantie of vakanties) {
    const tot = plus(vakantie.van, -1);
    if (tot < van) continue; // een vakantie vóór de eerste schooldag slaan we over
    uit.push({
      nummer: uit.length + 1,
      naam: `Periode ${uit.length + 1}`,
      omschrijving: vorige
        ? `van de ${vorige.toLowerCase()} tot de ${vakantie.naam.toLowerCase()}`
        : `van de eerste schooldag tot de ${vakantie.naam.toLowerCase()}`,
      van,
      tot,
      weken: schoolweken(van, tot),
      eindigtMet: vakantie,
    });
    van = plus(vakantie.tot, 1);
    vorige = vakantie.naam;
  }

  return uit;
}

export function periodeOp(periodes: Periode[], datum: string): Periode | undefined {
  return periodes.find((p) => datum >= p.van && datum <= p.tot);
}

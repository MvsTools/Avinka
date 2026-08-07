/* Avinka — de landelijke schoolvakanties verversen.
 *
 * WAAROM DIT BESTAAT
 * De schoolvakanties (in tegenstelling tot feestdagen als Koningsdag) stelt
 * de Rijksoverheid elk jaar met de hand vast — daar is geen formule voor.
 * Vroeger betekende dat: elk jaar de website van Rijksoverheid overtypen in
 * src/lib/planning/vakanties.ts. Dit script haalt in plaats daarvan de
 * officiële open-data-feed op (dezelfde data, machineleesbaar) en herschrijft
 * het gegenereerde blok in dat bestand vanzelf.
 *
 * WAAROM JE DIT NOOIT ZELF HOEFT TE DRAAIEN
 * `npm run dev` draait dit automatisch (via "predev" in package.json), maar
 * ALLEEN als het nodig is: staat er al ruim twee schooljaren vooruit in
 * vakanties.ts, dan slaat het commando de internetaanroep gewoon over. Zo
 * ververst het bestand vanzelf, ergens in het schooljaar dat de teller onder
 * de twee jaar vooruit zakt, zonder dat je eraan hoeft te denken — en zonder
 * dat elke `npm run dev` een trage netwerkaanroep doet.
 *
 * Gaat er iets mis (geen internet, Rijksoverheid ligt eruit), dan slikt dit
 * script de fout in en laat het bestaande bestand gewoon staan: `npm run dev`
 * mag hier nooit door blokkeren.
 *
 * WAT HET WEL EN NIET DOET
 * - Overschrijft ALLEEN de tekst tussen "// GEGENEREERD:START" en
 *   "// GEGENEREERD:EIND" in vakanties.ts. De rest van het bestand (uitleg,
 *   regio's, functies) blijft precies zoals die is.
 * - Draait GEEN live aanroep in het platform zelf: de site blijft werken
 *   zonder internetverbinding naar Rijksoverheid. Dit is een los commando,
 *   geen onderdeel van wat een bezoeker ooit te zien krijgt.
 *
 * GEBRUIK
 *   node scripts/ververs-vakanties.mjs            (ververst alleen als nodig)
 *   node scripts/ververs-vakanties.mjs --forceer   (ververst altijd)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PROJECT = resolve(import.meta.dirname, "..");
const BESTAND = join(PROJECT, "src/lib/planning/vakanties.ts");
const FEED_URL = "https://opendata.rijksoverheid.nl/v1/infotypes/schoolholidays?output=json";

// Hoeveel schooljaren er minstens NA het huidige bekend moeten zijn voordat
// we het de moeite waard vinden om Rijksoverheid lastig te vallen.
const MINIMALE_VOORSPRONG = 2;

const VOLGORDE = ["Herfstvakantie", "Kerstvakantie", "Voorjaarsvakantie", "Meivakantie", "Zomervakantie"];
const KORT = {
  Herfstvakantie: "herfst",
  Kerstvakantie: "kerst",
  Voorjaarsvakantie: "voorjaar",
  Meivakantie: "mei",
  Zomervakantie: "zomer",
};

function dagdeel(tijdstip) {
  // "2026-04-25T00:00:00.000Z" -> "2026-04-25". De feed zet de einddatum op
  // 21:59/22:59 UTC van de laatste vrije dag (net vóór middernacht NL-tijd),
  // dus het datumdeel is altijd precies de juiste dag.
  return tijdstip.slice(0, 10);
}

/** "heel Nederland" telt voor alle drie de regio's. */
function regioSleutel(naam) {
  const schoon = naam.trim().toLowerCase();
  if (schoon.includes("nederland")) return "heel Nederland";
  if (["noord", "midden", "zuid"].includes(schoon)) return schoon;
  throw new Error(`Onbekende regio in de feed: "${naam}"`);
}

async function haalFeed() {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`Rijksoverheid gaf ${res.status} ${res.statusText} terug`);
  return res.json();
}

/** Eén schooljaar uit de feed omzetten naar het RuweVakantie-formaat van vakanties.ts. */
function naarRuweVakanties(entry) {
  const vakanties = [];
  for (const naam of VOLGORDE) {
    const vak = entry.vacations?.find((v) => v.type.trim() === naam);
    if (!vak) throw new Error(`${naam} ontbreekt voor schooljaar ${entry.schoolyear.trim()}`);

    const perRegio = {};
    for (const r of vak.regions) {
      const datums = [dagdeel(r.startdate), dagdeel(r.enddate)];
      const sleutel = regioSleutel(r.region);
      if (sleutel === "heel Nederland") {
        perRegio.noord = datums;
        perRegio.midden = datums;
        perRegio.zuid = datums;
      } else {
        perRegio[sleutel] = datums;
      }
    }
    for (const regio of ["noord", "midden", "zuid"]) {
      if (!perRegio[regio]) throw new Error(`${naam} (${entry.schoolyear.trim()}) mist regio "${regio}"`);
    }

    vakanties.push({ naam, kort: KORT[naam], ...perRegio });
  }
  return vakanties;
}

function formatteerSchooljaren(schooljaren) {
  const jaren = Object.keys(schooljaren).sort();
  const blokken = jaren.map((jaar) => {
    const vakanties = schooljaren[jaar]
      .map(
        (v) =>
          `    {\n      naam: "${v.naam}",\n      kort: "${v.kort}",\n      noord: ["${v.noord[0]}", "${v.noord[1]}"],\n      midden: ["${v.midden[0]}", "${v.midden[1]}"],\n      zuid: ["${v.zuid[0]}", "${v.zuid[1]}"],\n    }`,
      )
      .join(",\n");
    return `  "${jaar}": [\n${vakanties},\n  ]`;
  });
  return `export const SCHOOLJAREN: Record<string, RuweVakantie[]> = {\n${blokken.join(",\n")},\n};`;
}

/** Het schooljaar waar "nu" in valt, geschat op kalenderjaar (zonder de precieze
 *  eerste-schooldag-regels van schooljaar.ts nodig te hebben): augustus e.v. →
 *  dit kalenderjaar begint het schooljaar, ervoor → vorig kalenderjaar. */
function huidigSchooljaarStartjaar(nu = new Date()) {
  return nu.getMonth() + 1 >= 8 ? nu.getFullYear() : nu.getFullYear() - 1;
}

/** Hoeveel schooljaren staan er al bekend, geteld vanaf (en met) het huidige? */
function voorsprong(huidig) {
  const tekst = readFileSync(BESTAND, "utf8");
  const start = tekst.indexOf("// GEGENEREERD:START");
  const eind = tekst.indexOf("// GEGENEREERD:EIND");
  const blok = start !== -1 && eind !== -1 ? tekst.slice(start, eind) : tekst;
  const jaren = [...blok.matchAll(/"(\d{4})-\d{4}"\s*:/g)].map((m) => Number(m[1]));
  const verste = jaren.length ? Math.max(...jaren) : huidig - 1;
  return verste - huidig;
}

async function ververs() {
  const feed = await haalFeed();

  const schooljaren = {};
  for (const bron of feed) {
    for (const entry of bron.content ?? []) {
      const jaar = entry.schoolyear.trim();
      schooljaren[jaar] = naarRuweVakanties(entry);
    }
  }

  const jarenGevonden = Object.keys(schooljaren).sort();
  if (!jarenGevonden.length) throw new Error("Geen schooljaren gevonden in de feed — niets bijgewerkt.");

  const vandaag = new Date().toISOString().slice(0, 10);
  const nieuwBlok = [
    `// GEGENEREERD:START — laatst ververst ${vandaag} via scripts/ververs-vakanties.mjs, schooljaren ${jarenGevonden[0]} t/m ${jarenGevonden[jarenGevonden.length - 1]}`,
    formatteerSchooljaren(schooljaren),
    "// GEGENEREERD:EIND",
  ].join("\n");

  const huidig = readFileSync(BESTAND, "utf8");
  const start = huidig.indexOf("// GEGENEREERD:START");
  const eind = huidig.indexOf("// GEGENEREERD:EIND");
  if (start === -1 || eind === -1) {
    throw new Error("Kan de GEGENEREERD-markeringen niet vinden in vakanties.ts. Niets aangepast.");
  }
  const bijgewerkt = huidig.slice(0, start) + nieuwBlok + huidig.slice(eind + "// GEGENEREERD:EIND".length);

  writeFileSync(BESTAND, bijgewerkt, "utf8");
  console.log(`[vakanties] ververst — schooljaren ${jarenGevonden.join(", ")} staan nu in vakanties.ts.`);
}

async function main() {
  const forceer = process.argv.includes("--forceer");
  const huidigJaar = huidigSchooljaarStartjaar();

  if (!forceer && voorsprong(huidigJaar) >= MINIMALE_VOORSPRONG) {
    // Ruim genoeg vooruit bekend: niets te doen, en geen internet nodig.
    return;
  }

  await ververs();
}

main().catch((err) => {
  // Nooit `npm run dev` laten stoppen omdat Rijksoverheid niet bereikbaar is.
  console.warn(`[vakanties] verversen overgeslagen (${err.message}). Bestaande data blijft staan.`);
});

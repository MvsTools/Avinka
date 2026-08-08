import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Je gegevens inzien/downloaden (AVG: recht op inzage + dataportabiliteit, art. 15/20).
// Verzamelt alles wat via RLS onder jouw account leesbaar is. RLS dwingt af dat
// je alleen je eigen rijen krijgt.
//   standaard      → een leesbare webpagina, zodat je gewoon kunt zíen wat we bewaren
//   ?format=json   → een machineleesbaar bestand, om je gegevens over te zetten
// ⚠️ DEZE LIJST MOET MEEGROEIEN. Stond er lang op acht tabellen terwijl de
// pagina beweerde "dit is alles wat we onder jouw account bewaren" — en dat was
// het niet: het weekrooster, de agenda en de ingestuurde feedback ontbraken
// allemaal. Zelfde soort fout als "Onbeperkt gebruik" op de prijzenpagina: een
// zin die waar was toen hij geschreven werd en het daarna niet meer is.
// Bouw je een tabel met gegevens van een gebruiker erin, zet hem hier dan bij
// én geef hem een regel in SECTIES hieronder.
//
// ⚠️ Veiligheid leunt volledig op RLS: de route leest met de sessie van de
// bezoeker, dus hij krijgt per definitie alleen zijn eigen rijen. Zet er dus
// nooit een tabel bij die RLS uit heeft staan — dan lekt de export alles.
const TABELLEN = [
  "instellingen",
  "klassen",
  "rapporten",
  "bestanden",
  "statistiek",
  "taken",
  "reviews",
  "toestemmingen",
  "agenda_bronnen",
  "agenda_items",
  "basisrooster",
  "rooster_week",
  "feedback",
  "proef_feedback",
  "ai_verbruik",
] as const;

// ⚠️ GEHEIMEN GAAN NOOIT MEE. `agenda_bronnen.link_geheim` is de privélink naar
// iemands schoolagenda: wie die heeft, leest die agenda. Die hoort niet in een
// bestand dat per mail rondgaat of in een downloadmap blijft slingeren.
// Dit filter grijpt vóór ALLEBEI de uitvoerpaden, ook de JSON — de VERBERG-lijst
// verderop werkt alleen op de leesbare pagina en zou hier dus te laat komen.
const GEHEIM = new Set(["link_geheim"]);

// Vriendelijke titel per categorie.
const SECTIES: Record<string, { titel: string; leeg: string }> = {
  instellingen: { titel: "Je account en voorkeuren", leeg: "Nog geen voorkeuren ingesteld." },
  klassen: { titel: "Je klassen", leeg: "Je hebt nog geen klas ingevuld." },
  rapporten: { titel: "Concept-rapportteksten", leeg: "Geen opgeslagen concepten." },
  bestanden: { titel: "Opgeslagen bestanden en plattegronden", leeg: "Nog niets opgeslagen." },
  statistiek: { titel: "Je gebruik van Avinka", leeg: "Nog geen gebruiksgegevens." },
  taken: { titel: "Je takenlijst", leeg: "Geen taken." },
  reviews: { titel: "Je beoordeling", leeg: "Je hebt geen beoordeling achtergelaten." },
  toestemmingen: { titel: "Je akkoord op de voorwaarden", leeg: "Nog geen akkoord vastgelegd." },
  agenda_bronnen: {
    titel: "Je gekoppelde agenda's",
    leeg: "Je hebt geen agenda gekoppeld.",
  },
  agenda_items: {
    titel: "Afspraken uit je agenda",
    leeg: "Geen afspraken opgehaald of toegevoegd.",
  },
  basisrooster: { titel: "Je basisrooster", leeg: "Nog geen basisrooster ingevuld." },
  rooster_week: { titel: "Je weekroosters", leeg: "Nog geen week ingevuld." },
  feedback: { titel: "Feedback die je instuurde", leeg: "Je hebt geen feedback ingestuurd." },
  proef_feedback: {
    titel: "Je reactie na de proefperiode",
    leeg: "Je hebt hier niets ingevuld.",
  },
  ai_verbruik: {
    titel: "Je AI-gebruik",
    leeg: "Nog geen AI-gebruik.",
  },
};

// Nette labels voor de velden die ertoe doen.
const LABELS: Record<string, string> = {
  schoolnaam: "School",
  school_brin: "BRIN-code van de school",
  school_vestiging: "Vestigingscode van de school",
  standaardgroep: "Standaardgroep",
  toon: "Toon van de teksten",
  taalniveau: "Taalniveau",
  lengte: "Lengte van de teksten",
  aanspreekvorm: "Aanspreekvorm",
  abon_plan: "Abonnement",
  abon_vorm: "Betaalvorm",
  abon_status: "Abonnementsstatus",
  ref_code: "Jouw uitnodigingscode",
  verwezen_door: "Uitgenodigd door (code)",
  naam: "Naam",
  leerlingen: "Leerlingen (voornamen)",
  leerlingen_data: "Leerlingen",
  // ⚠️ Deze lijst geldt voor ALLE tabellen tegelijk, dus een label moet kloppen
  // voor elke tabel die de kolom heeft. `actief` bestaat bij een klas én bij
  // een agenda; daarom het neutrale "Actief" en niet "Actieve klas".
  actief: "Actief",
  verhaal: "Tekst",
  type: "Soort",
  inhoud: "Inhoud",
  tool: "Welke tool",
  tellers: "Aantal keer gebruikt",
  minuten: "Tijd bespaard (minuten)",
  streak: "Reeks actieve dagen",
  streak_max: "Langste reeks",
  laatste_actief: "Laatst actief",
  tekst: "Tekst",
  gedaan: "Afgevinkt",
  wekelijks: "Wekelijks terugkerend",
  deadline: "Deadline",
  sterren: "Sterren",
  mag_tonen: "Mag openbaar getoond worden",
  created_at: "Aangemaakt op",
  updated_at: "Laatst gewijzigd",
  gedaan_op: "Afgevinkt op",
  voorwaarden_versie: "Versie algemene voorwaarden",
  privacy_versie: "Versie privacyverklaring",
  geaccepteerd_op: "Akkoord gegeven op",
  bron: "Waar akkoord gegeven",
  // Agenda
  systeem: "Soort agenda",
  modus: "Wat we ophalen",
  kleur: "Kleur in de kalender",
  laatst_gelukt: "Laatst opgehaald",
  aantal_items: "Aantal afspraken",
  datum: "Datum",
  tot_datum: "Tot en met",
  hele_dag: "Hele dag",
  begintijd: "Begintijd",
  eindtijd: "Eindtijd",
  titel: "Titel",
  soort: "Soort",
  tijdvakken: "Aantal tijdvakken",
  locatie: "Locatie",
  bijgewerkt: "Bijgewerkt op",
  // Rooster
  data: "Opgeslagen indeling",
  schooljaar: "Schooljaar",
  maandag: "Week vanaf maandag",
  // AI-gebruik
  model: "AI-model",
  input_tokens: "Omvang van de vraag",
  output_tokens: "Omvang van het antwoord",
  cache_creation_tokens: "Opgeslagen voor hergebruik",
  cache_read_tokens: "Hergebruikt uit eerdere vragen",
  // Feedback
  bericht: "Je bericht",
  pagina: "Vanaf welke pagina",
  status: "Status",
  categorie: "Categorie",
  intentie: "Wat je van plan was",
  reden: "Je toelichting",
};

// Puur technische velden die niets toevoegen voor een mens.
//
// ⚠️ `leerlingen` staat hier omdat een klas de namen TWEE KEER opslaat: de kale
// lijst (oud) en `leerlingen_data` met jongen/meisje erbij (nieuw). Allebei
// tonen leverde dezelfde klas twee keer onder elkaar op. We tonen de rijke
// versie; valt die weg, dan springt de kale lijst in (zie rijHtml).
const VERBERG = new Set(["id", "user_id", "parent_id", "per_dag", "leerlingen"]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function label(key: string): string {
  return LABELS[key] ?? key;
}

/* ── MEENEMEN ───────────────────────────────────────────────────────────────
 * Welke categorieën kun je downloaden, en in welk formaat. De regel komt van de
 * eigenaar (8-8-2026) en is scherper dan "alles downloadbaar maken":
 *
 *   ⭐ DOWNLOADBAAR IS PRECIES WAT WIJ WEGGOOIEN.
 *
 * Rapporten, plattegronden, agenda-afspraken, je klas en je taken verdwijnen 90
 * dagen na je laatste abonnement (wijs_verwijder_klasdata). Die moet je dus mee
 * kunnen nemen, anders ben je ze kwijt. Je lesontwerpen, werkbladen, draaiboeken
 * en je weekrooster bewaren we juist voor altijd — daar hoort géén knop bij,
 * maar de zin dat we ze voor je bewaren. Een knop die niet werkt leest als
 * gijzeling; een zin leest als zorg.
 *
 * ⚠️ Het formaat is het halve werk. Een leerkracht die haar rapportteksten
 * ophaalt wil ze in Word kunnen plakken, niet in JSON kunnen lezen. Kies dus per
 * categorie het bestand dat op haar computer ergens IN gaat. */
export const MEENEMEN: Record<string, { formaat: "csv" | "ics" | "doc"; bestand: string; knop: string }> = {
  klassen: { formaat: "csv", bestand: "avinka-klassenlijst.csv", knop: "Klassenlijst (Excel)" },
  rapporten: { formaat: "doc", bestand: "avinka-rapportteksten.doc", knop: "Rapportteksten (Word)" },
  taken: { formaat: "csv", bestand: "avinka-takenlijst.csv", knop: "Takenlijst (Excel)" },
  agenda_items: { formaat: "ics", bestand: "avinka-agenda.ics", knop: "Agenda (Outlook, Google)" },
};

// Bovenaan de pagina staat wat je mee kunt nemen, daaronder de rest. Dat is de
// volgorde waarin een leerkracht kijkt; de onderkant is er voor de wet.
const EIGEN_WERK = ["klassen", "rapporten", "taken", "agenda_items", "bestanden"];

/* Alles in de onderste helft is ook per stuk te downloaden, maar dan als gewone
 * Excel-tabel. Daar zitten te veel verschillende soorten tussen om er per
 * categorie een eigen vorm voor te bedenken, en het doel is er ook een ander:
 * niet "hiermee werk je verder" maar "dit is de kopie waar je recht op hebt".
 *
 * ⚠️ `bestanden` staat hier BEWUST niet bij en heeft dus geen hokje. Daarin
 * zitten je lesontwerpen, werkbladen en draaiboeken, en de afspraak is dat die
 * bij ons bewaard blijven in plaats van dat je ze meeneemt. Plattegronden zitten
 * er óók in en die verdwijnen wél — daar hoort een tekening bij, en die kunnen
 * we nog niet maken. Zolang dat zo is: geen half werkende knop. */
export function bestandsnaamVoor(tabel: string): string {
  return MEENEMEN[tabel]?.bestand ?? `avinka-${tabel.replace(/_/g, "-")}.csv`;
}

/** ⚠️ Een cel die met = + - of @ begint, voert Excel uit als formule. Dat is een
 *  bekende manier om via een onschuldig ogend bestand iets te laten draaien op
 *  de computer van de ontvanger. Alles hier is door een gebruiker ingetypt, dus
 *  zo'n cel krijgt er een apostrof voor en blijft gewoon tekst. */
function csvCel(waarde: unknown): string {
  const s = waarde === null || waarde === undefined ? "" : String(waarde);
  const veilig = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${veilig.replace(/"/g, '""')}"`;
}

/** Puntkomma's en een BOM: zo opent het bestand meteen goed in een Nederlandse
 *  Excel, met accenten en al. Met komma's belandt alles in één kolom. */
function csvBestand(koppen: string[], rijen: unknown[][]): string {
  const regels = [koppen.map(csvCel).join(";")];
  for (const r of rijen) regels.push(r.map(csvCel).join(";"));
  return "﻿" + regels.join("\r\n") + "\r\n";
}

/** Tekst veilig in een agendabestand: komma's, puntkomma's en backslashes
 *  hebben daar een betekenis, en een echte regelovergang breekt het bestand. */
function icsTekst(s: string): string {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsDatum(d: string): string {
  return String(d ?? "").slice(0, 10).replace(/-/g, "");
}

/** Een dag erbij voor de einddatum: in een agendabestand is die exclusief, dus
 *  zonder dit valt de laatste dag van een schoolkamp van de kalender af. */
function dagErbij(datum: string): string {
  const d = new Date(`${String(datum).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return icsDatum(datum);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** ⚠️ Een agendabestand mag geen regels langer dan 75 tekens hebben; langere
 *  regels breek je af en laat je verdergaan met een spatie ervoor. Een
 *  agendatitel mag bij ons 300 tekens zijn, dus zonder dit maak je een bestand
 *  dat een strenge agenda-app weigert — en dat merk je pas bij de leerkracht
 *  die hem probeert te importeren. */
function icsVouw(regel: string): string {
  if (regel.length <= 75) return regel;
  const stukken = [regel.slice(0, 75)];
  for (let i = 75; i < regel.length; i += 74) stukken.push(" " + regel.slice(i, i + 74));
  return stukken.join("\r\n");
}

function icsBestand(rijen: Record<string, unknown>[]): string {
  const uit = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Avinka//Agenda-export//NL", "CALSCALE:GREGORIAN"];
  // Wanneer dit bestand is gemaakt. Sommige agenda-apps weigeren een afspraak
  // zonder dit veld.
  const nu = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  for (const r of rijen) {
    uit.push("BEGIN:VEVENT");
    uit.push(`UID:${icsTekst(String(r.id ?? r.uid ?? Math.random()))}@avinka.nl`);
    uit.push(`DTSTAMP:${nu}`);
    uit.push(`SUMMARY:${icsTekst(String(r.titel ?? ""))}`);
    if (r.hele_dag || !r.begintijd) {
      uit.push(`DTSTART;VALUE=DATE:${icsDatum(String(r.datum))}`);
      uit.push(`DTEND;VALUE=DATE:${dagErbij(String(r.tot_datum ?? r.datum))}`);
    } else {
      const t = (x: unknown) => String(x ?? "00:00").slice(0, 5).replace(":", "") + "00";
      uit.push(`DTSTART:${icsDatum(String(r.datum))}T${t(r.begintijd)}`);
      uit.push(`DTEND:${icsDatum(String(r.tot_datum ?? r.datum))}T${t(r.eindtijd ?? r.begintijd)}`);
    }
    if (r.locatie) uit.push(`LOCATION:${icsTekst(String(r.locatie))}`);
    uit.push("END:VEVENT");
  }
  uit.push("END:VCALENDAR");
  return uit.map(icsVouw).join("\r\n") + "\r\n";
}

/* ── EEN ZIP MAKEN ──────────────────────────────────────────────────────────
 * Vink je drie categorieën aan, dan zijn dat drie verschillende bestandssoorten
 * (Excel, Word, agenda). Die kun je niet in één bestand plakken, dus gaan ze in
 * een zip.
 *
 * ⚠️ BEWUST GEEN PAKKET ERVOOR. De tools gebruiken JSZip, maar die halen ze bij
 * een externe server vandaan; dat is precies wat deze pagina niet moet doen
 * (zie het feitenblad: cdnjs staat niet in onze subverwerkerslijst). En een
 * npm-pakket toevoegen voor 60 regels is duurder in onderhoud dan die 60 regels.
 *
 * We slaan de bestanden ONGECOMPRIMEERD op (methode 0). Dat mag van het
 * zip-formaat, scheelt de halve implementatie, en het gaat hier om een paar
 * tientallen kilobytes tekst. */
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function zipBestand(bestanden: { naam: string; inhoud: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const delen: Uint8Array[] = [];
  const index: { naam: Uint8Array; crc: number; lengte: number; positie: number }[] = [];
  let positie = 0;

  const kop = (grootte: number) => {
    const b = new Uint8Array(grootte);
    return { b, v: new DataView(b.buffer) };
  };

  for (const bestand of bestanden) {
    const naam = enc.encode(bestand.naam);
    const inhoud = enc.encode(bestand.inhoud);
    const crc = crc32(inhoud);

    const { b, v } = kop(30);
    v.setUint32(0, 0x04034b50, true); // "hier begint een bestand"
    v.setUint16(4, 20, true); // minimale versie om dit te lezen
    v.setUint16(6, 0x0800, true); // bestandsnamen zijn UTF-8
    v.setUint16(8, 0, true); // methode 0 = niet gecomprimeerd
    v.setUint16(10, 0, true); // tijd en datum laten we op nul; niet elk
    v.setUint16(12, 0, true); // zip-programma toont ze, en ze zeggen hier niets
    v.setUint32(14, crc, true);
    v.setUint32(18, inhoud.length, true);
    v.setUint32(22, inhoud.length, true);
    v.setUint16(26, naam.length, true);
    v.setUint16(28, 0, true);

    index.push({ naam, crc, lengte: inhoud.length, positie });
    delen.push(b, naam, inhoud);
    positie += 30 + naam.length + inhoud.length;
  }

  // De inhoudsopgave achteraan: zonder deze lijst ziet een zip-programma een
  // leeg archief, ook al staan de bestanden er gewoon in.
  const startInhoudsopgave = positie;
  for (const e of index) {
    const { b, v } = kop(46);
    v.setUint32(0, 0x02014b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(6, 20, true);
    v.setUint16(8, 0x0800, true);
    v.setUint16(10, 0, true);
    v.setUint32(16, e.crc, true);
    v.setUint32(20, e.lengte, true);
    v.setUint32(24, e.lengte, true);
    v.setUint16(28, e.naam.length, true);
    v.setUint32(42, e.positie, true);
    delen.push(b, e.naam);
    positie += 46 + e.naam.length;
  }

  const { b: eind, v } = kop(22);
  v.setUint32(0, 0x06054b50, true);
  v.setUint16(8, index.length, true);
  v.setUint16(10, index.length, true);
  v.setUint32(12, positie - startInhoudsopgave, true);
  v.setUint32(16, startInhoudsopgave, true);
  delen.push(eind);

  const totaal = delen.reduce((n, d) => n + d.length, 0);
  const uit = new Uint8Array(totaal);
  let op = 0;
  for (const d of delen) {
    uit.set(d, op);
    op += d.length;
  }
  return uit;
}

/** Word opent een HTML-bestand met de extensie .doc gewoon als document, mét
 *  koppen en alinea's. Dat scheelt een hele docx-bouwer aan de serverkant, en
 *  het is precies waar een rapporttekst heen moet: een document dat je nog
 *  bewerkt voordat je hem in ParnasSys of IEP plakt. */
function docBestand(titel: string, blokken: { kop: string; tekst: string }[]): string {
  const body = blokken
    .map(
      (b) =>
        `<h2 style="font-family:Calibri,sans-serif;font-size:14pt;">${escapeHtml(b.kop)}</h2>` +
        `<p style="font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5;">${escapeHtml(b.tekst).replace(/\r?\n/g, "<br>")}</p>`,
    )
    .join("");
  return `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(titel)}</title></head>
<body><h1 style="font-family:Calibri,sans-serif;font-size:18pt;">${escapeHtml(titel)}</h1>${body}</body></html>`;
}

// Lange vrije tekst (rapporttekst, les-inhoud) niet volledig uitschrijven, maar
// samenvatten tot een herkenbare regel + woordenaantal. De volledige inhoud staat
// in de JSON-download en in de tool zelf.
function vatSamen(s: string): string {
  const schoon = s.replace(/\s+/g, " ").trim();
  const woorden = schoon ? schoon.split(" ").length : 0;
  const kort = schoon.length > 120 ? schoon.slice(0, 120).trimEnd() + "…" : schoon;
  const telling = woorden > 25 ? ` (${woorden} woorden bewaard)` : "";
  return escapeHtml(kort) + telling;
}

// Een waarde leesbaar maken. Geeft "" terug als er niets zinnigs te tonen is.
function toonWaarde(key: string, val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "boolean") return val ? "ja" : "nee";
  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    // Lijst met leerlingen mét jongen/meisje.
    if (key === "leerlingen_data") {
      return val
        .map((l) => {
          const o = l as { naam?: string; geslacht?: string };
          const g = o.geslacht === "j" ? " (jongen)" : o.geslacht === "m" ? " (meisje)" : "";
          return escapeHtml(String(o.naam ?? "")) + g;
        })
        .join(", ");
    }
    return escapeHtml(val.map((x) => String(x)).join(", "));
  }
  if (typeof val === "object") {
    // De plattegrond-indeling is technische data; niet uitschrijven.
    if (key === "data") return "opgeslagen indeling";
    // Klein object (tellers, minuten): key: waarde-paren.
    const paren = Object.entries(val as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== "",
    );
    if (paren.length === 0) return "";
    return paren.map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(String(v))}`).join(" · ");
  }
  const s = String(val);
  // ISO-datums inkorten tot de datum.
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return escapeHtml(s.slice(0, 10));
  // Lange vrije tekst samenvatten in plaats van volledig tonen.
  if (key === "verhaal" || key === "inhoud") return vatSamen(s);
  return escapeHtml(s);
}

// Eén rij → een lijstje label/waarde.
function rijHtml(rij: Record<string, unknown>): string {
  // Een oude klas heeft alleen de kale namenlijst en nog geen leerlingen_data.
  // Dan tonen we die alsnog, anders zie je je klas helemaal niet.
  const rijkeLijst = Array.isArray(rij.leerlingen_data) && rij.leerlingen_data.length > 0;
  const items = Object.entries(rij)
    .filter(([k]) => !(VERBERG.has(k) && (k !== "leerlingen" || rijkeLijst)))
    .map(([k, v]) => [label(k), toonWaarde(k, v)] as const)
    .filter(([, w]) => w !== "");
  if (items.length === 0) return "";
  return (
    '<div class="rij">' +
    items
      .map(([l, w]) => `<div class="k">${escapeHtml(l)}</div><div class="v">${w}</div>`)
      .join("") +
    "</div>"
  );
}

/* Uitgelogd op deze pagina belanden is geen fout maar het normale geval: de
   link naar je gegevens is bruikbaar voor wie is gestopt, en die is meestal
   niet meer ingelogd. Een kale {"error":"unauthorized"} op een wit scherm is
   dan een doodlopende weg op precies het moment dat iemand een recht uitoefent
   (AVG art. 15/20). Dus: een gewone pagina met de weg terug. De JSON-variant
   houdt wél zijn JSON, want daar zit een programma aan de andere kant. */
function inlogPagina(): NextResponse {
  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Even inloggen</title>
<link rel="icon" href="/Avinka_vinkje.png">
<style>
  :root{ --ink:#1f2a37; --muted:#6b7280; --brand:#25855a; --line:#e5e7eb; --cream:#f9faf8; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--cream); color:var(--ink); display:flex; min-height:100vh;
    align-items:center; justify-content:center; padding:24px;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.6; }
  .kaart{ background:#fff; border:1px solid var(--line); border-radius:20px; padding:32px 34px; max-width:460px; }
  .merk{ display:block; height:26px; width:auto; margin:0 0 20px; }
  h1{ font-size:22px; font-weight:800; margin:0 0 10px; }
  p{ color:var(--muted); margin:0 0 20px; }
  a.knop{ display:inline-block; background:var(--brand); color:#fff; text-decoration:none;
    font-weight:700; font-size:15px; border-radius:12px; padding:12px 22px; }
  .foot{ font-size:13px; margin:20px 0 0; }
  .foot a{ color:var(--brand); font-weight:700; }
</style></head>
<body><div class="kaart">
  <img class="merk" src="/Avinka_wordmerk.png" alt="Avinka">
  <h1>Even inloggen</h1>
  <p>Om te kunnen laten zien wat we van jou bewaren, moeten we eerst zeker weten
     dat jij het bent. Log in met het adres van je Avinka-account; daarna kom je
     hier vanzelf op je eigen overzicht.</p>
  <a class="knop" href="/sign-in?volgende=%2Fapi%2Faccount%2Fexport">Inloggen</a>
  <p class="foot">Lukt het inloggen niet? Mail dan naar
     <a href="mailto:support@avinka.nl">support@avinka.nl</a>, dan sturen we je
     gegevens met de hand toe.</p>
</div></body></html>`;
  return new NextResponse(html, {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return request.nextUrl.searchParams.get("format") === "json"
      ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
      : inlogPagina();
  }

  const gegevens: Record<string, Record<string, unknown>[]> = {};
  for (const tabel of TABELLEN) {
    const { data } = await supabase.from(tabel).select("*");
    gegevens[tabel] = ((data as Record<string, unknown>[]) ?? []).map((rij) =>
      Object.fromEntries(Object.entries(rij).filter(([k]) => !GEHEIM.has(k))),
    );
  }

  const account = {
    id: user.id,
    email: user.email,
    voornaam: (user.user_metadata?.first_name as string) ?? null,
    aangemaakt: user.created_at,
  };

  // ── Eén categorie downloaden ──────────────────────────────────────────────
  // ?deel=rapporten geeft alleen die categorie terug, in het formaat dat er
  // hoort. Zo hoeft niemand een bestand met álles te openen om bij zijn
  // rapportteksten te komen.
  // Het formulier op de pagina stuurt één ?deel= per aangevinkt hokje mee.
  // ⚠️ Alleen namen uit TABELLEN worden geaccepteerd. Zonder die controle zou
  // ?deel=<wat dan ook> een tabelnaam kunnen zijn die hier niet hoort.
  const gekozen = request.nextUrl.searchParams
    .getAll("deel")
    .filter((d) => (TABELLEN as readonly string[]).includes(d) && d !== "bestanden");

  const bestandsnaam = bestandsnaamVoor;

  // Eén categorie? Dan gewoon dat bestand. Iemand die alleen zijn rapportteksten
  // wil, moet geen zip hoeven uitpakken om erbij te komen.
  if (gekozen.length === 1) {
    const { inhoud, type } = deelBestand(gekozen[0], gegevens[gekozen[0]] ?? []);
    return new NextResponse(inhoud, {
      headers: {
        "content-type": type,
        "content-disposition": `attachment; filename="${bestandsnaam(gekozen[0])}"`,
      },
    });
  }

  // Meerdere categorieën zijn meerdere bestandssoorten, dus die gaan in een zip.
  if (gekozen.length > 1) {
    const zip = zipBestand(
      gekozen.map((d) => ({
        naam: bestandsnaam(d),
        inhoud: deelBestand(d, gegevens[d] ?? []).inhoud,
      })),
    );
    // Buffer en niet de kale Uint8Array: die laatste accepteert het antwoordtype
    // niet, en een omweg via een string sloopt de bytes.
    return new NextResponse(Buffer.from(zip), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="avinka-mijn-gegevens.zip"',
      },
    });
  }

  // Machineleesbaar (voor overzetten naar een andere dienst).
  if (request.nextUrl.searchParams.get("format") === "json") {
    const payload = {
      geexporteerd_op: new Date().toISOString(),
      toelichting:
        "Een kopie van de gegevens die Avinka onder jouw account bewaart. Voor een verzoek dat hier niet in past, mail ons.",
      account,
      gegevens,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="avinka-mijn-gegevens.json"',
      },
    });
  }

  return new NextResponse(exportPaginaHtml(account, gegevens), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/* Eén categorie omzetten naar het bestand dat erbij hoort. Los van de route,
 * zodat je de uitkomst kunt bekijken zonder in te loggen — een .ics of .csv die
 * niemand ooit geopend heeft, is een belofte en geen functie. */
export function deelBestand(
  deel: string,
  rijen: Record<string, unknown>[],
): { inhoud: string; type: string } {
  let inhoud = "";
  let type = "text/plain; charset=utf-8";

  // Categorieën zonder eigen vorm worden een gewone tabel: één regel per rij,
  // één kolom per veld. De kolommen komen uit de gegevens zelf, zodat een nieuw
  // veld vanzelf meegaat en niemand deze lijst hoeft bij te werken.
  if (!MEENEMEN[deel]) {
    const kolommen = [...new Set(rijen.flatMap((r) => Object.keys(r)))].filter(
      (k) => !VERBERG.has(k),
    );
    inhoud = csvBestand(
      kolommen.map(label),
      rijen.map((r) =>
        kolommen.map((k) => {
          const w = r[k];
          if (w === null || w === undefined) return "";
          if (typeof w === "boolean") return w ? "ja" : "nee";
          // Een opgeslagen indeling (rooster, plattegrond, tellers) is geen
          // tekst. Die gaat er als JSON in: onleesbaar in Excel, maar wel
          // compleet, en dat is waar deze helft van de pagina voor is.
          if (typeof w === "object") return JSON.stringify(w);
          return String(w);
        }),
      ),
    );
    return { inhoud, type: "text/csv; charset=utf-8" };
  }

  {
    if (deel === "klassen") {
      // Eén regel per kind, niet één regel per klas: zo kun je er in Excel op
      // sorteren en hem volgend jaar opnieuw gebruiken.
      const uit: unknown[][] = [];
      for (const k of rijen) {
        const rijk = Array.isArray(k.leerlingen_data) ? k.leerlingen_data : [];
        if (rijk.length > 0) {
          for (const l of rijk as { naam?: string; geslacht?: string }[]) {
            const g = l.geslacht === "j" ? "jongen" : l.geslacht === "m" ? "meisje" : "";
            uit.push([k.naam, l.naam ?? "", g]);
          }
        } else {
          for (const naam of (k.leerlingen as string[]) ?? []) uit.push([k.naam, naam, ""]);
        }
      }
      inhoud = csvBestand(["Klas", "Leerling", "Jongen of meisje"], uit);
      type = "text/csv; charset=utf-8";
    } else if (deel === "taken") {
      inhoud = csvBestand(
        ["Taak", "Afgevinkt", "Deadline", "Hoort bij", "Wekelijks"],
        rijen.map((t) => [t.tekst, t.gedaan ? "ja" : "nee", t.deadline ?? "", t.kopje ?? "", t.wekelijks ? "ja" : "nee"]),
      );
      type = "text/csv; charset=utf-8";
    } else if (deel === "agenda_items") {
      inhoud = icsBestand(rijen);
      type = "text/calendar; charset=utf-8";
    } else if (deel === "rapporten") {
      inhoud = docBestand(
        "Mijn rapportteksten",
        rijen.map((r) => ({ kop: String(r.naam ?? ""), tekst: String(r.verhaal ?? "") })),
      );
      type = "application/msword; charset=utf-8";
    }
  }
  return { inhoud, type };
}

/* ── DE LEESBARE PAGINA ─────────────────────────────────────────────────────
 * Los van de route, zodat je hem met verzonnen gegevens kunt bekijken zonder in
 * te loggen. Zonder die mogelijkheid is dit scherm alleen te beoordelen door er
 * echt in te zitten, en dan kijkt niemand er meer naar.
 *
 * ⚠️ ALLES STAAT DICHTGEKLAPT. De eigenaar had 149 agenda-afspraken en die
 * stonden allemaal uitgeschreven onder elkaar: de pagina werd onleesbaar en je
 * vond je rapportteksten niet meer terug. Een kopje met een aantal erachter
 * vertelt in één blik wat er is; uitklappen doe je alleen waar je iets zoekt. */
export function exportPaginaHtml(
  account: { email?: string | null; voornaam?: string | null },
  gegevens: Record<string, Record<string, unknown>[]>,
): string {
  // Eén regel per categorie: titel, aantal en de downloadknop naast elkaar.
  // Een eerdere versie zette de knop ONDER de dichtgeklapte titel; dan staat er
  // een gat tussen de twee en valt de kaart uit elkaar in twee losse dingen.
  // ⚠️ De knop zit binnen <summary>, dus een klik erop zou ook de sectie
  // open- en dichtklappen. Vandaar de stopPropagation.
  // ⚠️ HET VINKHOKJE STAAT BUITEN <summary>, EN DAT IS GEEN SMAAKKWESTIE. Een
  // hokje binnen een summary klapt de sectie open zodra je hem aanvinkt: het
  // hele blok is dan de knop. Dat is alleen te onderdrukken met JavaScript, en
  // dan werkt aanvinken niet meer als dat script niet laadt. Nu staat het hokje
  // ernaast, in hetzelfde raster, en is het een gewoon formulierveld.
  const sectie = (tabel: string, inMeenemen = false) => {
    const cfg = SECTIES[tabel];
    const rijen = gegevens[tabel] ?? [];
    if (rijen.length === 0) return "";
    const mee = MEENEMEN[tabel];
    const body = rijen.map(rijHtml).filter(Boolean).join('<hr class="sep">');
    // Een categorie in dit blok zonder hokje (bestanden, want plattegronden
    // tekenen kan nog niet) krijgt tóch de lege kolom, anders staat zijn titel
    // uit de rooilijn met de rest en lijkt dat een fout.
    // Bestanden is de enige categorie zonder hokje; zie de opmerking bij
    // algemeneBestandsnaam(). Die krijgt wel de lege kolom, anders staat zijn
    // titel uit de rooilijn.
    const teKiezen = tabel !== "bestanden";
    const hokje = teKiezen
      ? `<label class="vink" title="Aanvinken om te downloaden">
           <input type="checkbox" name="deel" value="${tabel}">
           <span class="hoklabel">${escapeHtml(cfg.titel)} downloaden</span>
         </label>`
      : inMeenemen
        ? `<span class="vink" aria-hidden="true"></span>`
        : "";
    const soort = mee ? (mee.formaat === "doc" ? "Word" : mee.formaat === "csv" ? "Excel" : "Agenda") : "Excel";
    return `<section class="${teKiezen || inMeenemen ? "mee" : ""}">
      ${hokje}
      <details>
        <summary>
          <span class="tit">${escapeHtml(cfg.titel)}</span>
          <span class="telling">${rijen.length}</span>
          ${teKiezen ? `<span class="rek"></span><span class="soort">${soort}</span>` : ""}
        </summary>
        <div class="inhoud">${body}</div>
      </details>
    </section>`;
  };

  // Dezelfde knop onder allebei de blokken. Twee losse formulieren, zodat een
  // vinkje boven niet meekomt met een download onderin en andersom.
  const knopBalk = (hint: string) =>
    `<div class="balk">
       <button type="submit" class="dlknop">Download wat je hebt aangevinkt</button>
       <span class="hint">${escapeHtml(hint)}</span>
     </div>`;

  // Lege categorieën kregen elk een eigen kaart met "Je hebt hier niets
  // ingevuld" erin. Dat is een half scherm vullen met niets. Ze staan nu samen
  // op één regel: je ziet nog steeds dát we die categorie hebben, zonder dat het
  // de pagina opeet.
  const leegRegel = (tabellen: readonly string[]) => {
    const leeg = tabellen.filter((t) => (gegevens[t] ?? []).length === 0);
    if (leeg.length === 0) return "";
    const namen = leeg.map((t) => SECTIES[t].titel.replace(/^Je /, "").toLowerCase());
    const lijst =
      namen.length === 1 ? namen[0] : namen.slice(0, -1).join(", ") + " en " + namen.at(-1);
    return `<p class="niets">Hier staat niets: ${escapeHtml(lijst)}.</p>`;
  };

  const overig = TABELLEN.filter((t) => !EIGEN_WERK.includes(t));
  const secties =
    `<h2 class="groep">Meenemen</h2>` +
    `<p class="groepuitleg">Vink aan wat je wilt bewaren. Deze gegevens gaan over je klas, en die
       ruimen we 90 dagen na je laatste abonnement op.</p>` +
    // Een gewoon formulier: elk aangevinkt hokje wordt een ?deel= in de link.
    // Werkt dus ook zonder JavaScript; het script eronder maakt er alleen een
    // meelopende telling bij.
    `<form method="get" action="/api/account/export">` +
    EIGEN_WERK.map((t) => sectie(t, true)).join("") +
    knopBalk("Nog niets aangevinkt") +
    `</form>` +
    leegRegel(EIGEN_WERK) +
    `<p class="blijft"><strong>Je eigen vakwerk bewaren we gewoon voor je.</strong>
       Lesontwerpen, werkbladen, draaiboeken en je weekrooster blijven staan, ook als je stopt.
       Ze staan er nog als je terugkomt.</p>` +
    `<h2 class="groep">En dit weten we verder van je</h2>` +
    `<p class="groepuitleg">Hier kun je ook los iets van ophalen. Deze komen als Excel-tabel.</p>` +
    `<form method="get" action="/api/account/export">` +
    // ⚠️ Met de losse functienaam geeft map() de INDEX mee als tweede argument,
    // en dat is hier de vlag "zit in het meeneem-blok". Alles behalve de eerste
    // sectie kreeg daardoor een lege vinkkolom en stond ingesprongen.
    overig.map((t) => sectie(t, true)).join("") +
    knopBalk("Nog niets aangevinkt") +
    `</form>` +
    leegRegel(overig);

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wat Avinka van jou bewaart</title>
<link rel="icon" href="/Avinka_vinkje.png">
<style>
  /* brand-dark en niet brand: wit op #2f9e6e haalt 3,37:1 en dus geen AA. */
  :root{ --ink:#1f2a37; --muted:#6b7280; --brand:#2f9e6e; --brand-dark:#25855a;
         --line:#e5e7eb; --cream:#f9faf8; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--cream); color:var(--ink);
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.6; }
  .wrap{ max-width:760px; margin:0 auto; padding:40px 20px 80px; }
  .merk{ display:block; height:28px; width:auto; margin:0 0 24px; }
  h1{ font-size:28px; font-weight:800; margin:0 0 6px; }
  .meta{ color:var(--muted); font-size:14px; margin:0 0 28px; }
  section{ background:#fff; border:1px solid var(--line); border-radius:20px; padding:0; margin-bottom:10px; overflow:hidden; }
  h2{ font-size:18px; font-weight:800; margin:0 0 14px; }
  .groep{ font-size:14px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted);
    margin:32px 0 6px; }
  .groep:first-of-type{ margin-top:8px; }
  .groepuitleg{ color:var(--muted); font-size:14px; margin:0 0 14px; max-width:52ch; }
  .blijft{ background:#f1f8f4; border-radius:16px; padding:16px 20px; color:#265c42;
    font-size:15px; margin:16px 0 0; }
  .blijft strong{ color:#1c4a34; }
  summary{ list-style:none; cursor:pointer; display:flex; align-items:center; gap:12px;
    padding:16px 22px; font-weight:700; }
  summary::-webkit-details-marker{ display:none; }
  summary::before{ content:"›"; color:var(--muted); font-size:20px; line-height:1;
    transition:transform .15s; }
  details[open] summary::before{ transform:rotate(90deg); }
  summary:hover{ background:#fafbfa; }
  summary:focus-visible{ outline:3px solid var(--brand); outline-offset:-3px; }
  /* Het aantal staat direct achter de titel, niet ergens rechts. Stond het aan
     de rechterkant, dan verschoof het per regel mee met de breedte van de knop
     ernaast en sprongen de getallen alle kanten op. */
  .tit{ flex:0 1 auto; min-width:0; }
  .rek{ flex:1; }
  .telling{ color:var(--muted); font-weight:600; font-size:14px; background:var(--cream);
    border-radius:999px; padding:2px 10px; }
  .inhoud{ padding:4px 22px 20px; border-top:1px solid var(--line); }
  .soort{ color:var(--muted); font-size:13px; font-weight:600; }
  /* Sectie met een vinkhokje: hokje links, de rest ernaast. Het hokje staat
     bewust buiten <details>, zie de opmerking bij sectie(). */
  section.mee{ display:grid; grid-template-columns:auto 1fr; align-items:start; }
  .vink{ display:flex; align-items:center; padding:18px 0 18px 20px; cursor:pointer;
    min-width:40px; }
  .vink input{ width:20px; height:20px; accent-color:var(--brand-dark); cursor:pointer; margin:0; }
  .vink input:focus-visible{ outline:3px solid var(--ink); outline-offset:2px; }
  /* Voor wie het scherm voorleest: het hokje heeft een eigen naam nodig, maar
     op het scherm zou die de titel ernaast herhalen. */
  .hoklabel{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);
    white-space:nowrap; }
  .balk{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin:18px 0 0; }
  .dlknop{ font:inherit; font-size:15px; font-weight:700; cursor:pointer; border:0;
    color:#fff; background:var(--brand-dark); border-radius:14px; padding:12px 22px; }
  .dlknop:hover{ background:#1f6f4b; }
  .dlknop:focus-visible{ outline:3px solid var(--ink); outline-offset:2px; }
  .dlknop[disabled]{ background:#c9d3cd; cursor:not-allowed; }
  .hint{ color:var(--muted); font-size:14px; }
  .niets{ color:var(--muted); font-size:14px; margin:10px 4px 0; }
  /* Op een smal scherm past titel + aantal + knop niet naast elkaar; dan zakt
     de knop naar een eigen regel in plaats van de titel af te knijpen. */
  @media(max-width:560px){
    summary{ padding:14px 16px; }
    .vink{ padding:16px 0 16px 14px; }
    .dlknop{ width:100%; }
  }
  .rij{ display:grid; grid-template-columns:220px 1fr; gap:6px 18px; }
  @media(max-width:560px){ .rij{ grid-template-columns:1fr; gap:2px; } .k{ margin-top:8px; } }
  .k{ color:var(--muted); font-weight:600; font-size:14px; }
  .v{ color:var(--ink); word-break:break-word; white-space:pre-wrap; }
  .sep{ border:0; border-top:1px solid var(--line); margin:16px 0; }
  .leeg{ color:var(--muted); margin:0; }
  .print{ margin:24px 0 0; }
  .print button, .print a{ font:inherit; font-weight:700; font-size:14px; cursor:pointer;
    border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:12px;
    padding:9px 16px; text-decoration:none; display:inline-block; }
  .foot{ color:var(--muted); font-size:13px; margin-top:28px; }
</style></head>
<body><div class="wrap">
  <img class="merk" src="/Avinka_wordmerk.png" alt="Avinka">
  <h1>Wat Avinka van jou bewaart</h1>
  <p class="meta">Account: ${escapeHtml(account.email ?? "")}${
    account.voornaam ? " · " + escapeHtml(account.voornaam) : ""
  }</p>
  ${secties}
  <div class="print">
    <button onclick="window.print()">Afdrukken of opslaan als pdf</button>
    <a href="/api/account/export?format=json">Ook als bestand (JSON)</a>
  </div>
  <p class="foot">Je account verwijderen doe je in Avinka onder Instellingen.</p>
</div>
<script>
  /* Alleen een meelopende telling op de knop. Zet dit script uit en het
     formulier werkt nog steeds: de hokjes worden dan gewoon meegestuurd. */
  /* Elk blok telt zijn eigen vinkjes: een vinkje boven mag niet meekomen met
     een download onderin. */
  Array.prototype.forEach.call(document.querySelectorAll('form'), function (form) {
    var hokjes = Array.prototype.slice.call(form.querySelectorAll('input[name="deel"]'));
    var knop = form.querySelector('.dlknop');
    var hint = form.querySelector('.hint');
    if (!hokjes.length || !knop || !hint) return;
    function bij() {
      var n = hokjes.filter(function (h) { return h.checked; }).length;
      knop.disabled = n === 0;
      knop.textContent = n === 0 ? 'Download wat je hebt aangevinkt'
        : n === 1 ? 'Download 1 onderdeel' : 'Download ' + n + ' onderdelen';
      hint.textContent = n === 0 ? 'Nog niets aangevinkt'
        : n === 1 ? '' : 'Je krijgt ze samen in een zip-bestand';
    }
    hokjes.forEach(function (h) { h.addEventListener('change', bij); });
    bij();
  });
</script>
</body></html>`;

  return html;
}

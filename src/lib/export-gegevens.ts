/* ══════════════════════════════════════════════════════════════════════════
 * WAT WE VAN JOU BEWAREN — de gegevens en de bestanden
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Alles wat de exportpagina (src/app/mijn-gegevens) en de downloadroute
 * (src/app/api/account/export) samen nodig hebben: welke tabellen erin zitten,
 * hoe ze heten in gewone taal, en hoe je er een bruikbaar bestand van maakt.
 *
 * Bewust geen React en geen HTML in dit bestand: de pagina tekent, dit bestand
 * weet wat er te tekenen valt.
 * ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ DEZE LIJST MOET MEEGROEIEN. Stond lang op acht tabellen terwijl de pagina
 * beweerde "dit is alles wat we onder jouw account bewaren" — en dat was het
 * niet: het weekrooster, de agenda en de ingestuurde feedback ontbraken.
 * Zelfde soort fout als "Onbeperkt gebruik" op de prijzenpagina: een zin die
 * waar was toen hij geschreven werd en het daarna niet meer is.
 * Bouw je een tabel met gegevens van een gebruiker erin, zet hem hier dan bij
 * én geef hem een regel in SECTIES.
 *
 * ⚠️ De afscherming leunt volledig op RLS: er wordt gelezen met de sessie van
 * de bezoeker, dus hij krijgt per definitie alleen zijn eigen rijen. Zet er dus
 * nooit een tabel bij die RLS uit heeft staan — dan lekt de export alles. */
export const TABELLEN = [
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
  // ⚠️ Deze vijf hebben géén user_id maar wel een SELECT-beleid dat op de
  // ingelogde gebruiker slaat (gebruiker_a/b, auteur, eigenaar, klas_toegang).
  // Ze komen er dus net zo goed alleen voor jou uit — de afscherming zit in de
  // database, niet in een filter hier.
  "duo_koppels",
  "duo_overdracht",
  "duo_taken",
  "duo_overdracht_gelezen",
  "bestand_deling",
] as const;

/* ⚠️ GEHEIMEN GAAN NOOIT MEE.
 * - `agenda_bronnen.link_geheim` is de privélink naar iemands schoolagenda: wie
 *   die heeft, leest die agenda.
 * - `bestand_deling.token` opent een gedeeld draaiboek zónder in te loggen.
 * Die horen niet in een bestand dat per mail rondgaat of in een downloadmap
 * blijft slingeren. Dit filter grijpt vóór ÁLLE uitvoer, ook de JSON. */
const GEHEIM = new Set(["link_geheim", "token"]);

/** Geheimen eruit, vóór alles. Als losse functie zodat de proefpagina precies
 *  hetzelfde doet als de echte route — een testopstelling die het filter
 *  overslaat, laat je juist geloven dat het werkt. */
export function zonderGeheimen(rijen: Record<string, unknown>[]): Record<string, unknown>[] {
  return rijen.map((rij) =>
    Object.fromEntries(Object.entries(rij).filter(([k]) => !GEHEIM.has(k))),
  );
}

export type Gegevens = Record<string, Record<string, unknown>[]>;

/** Vriendelijke titel per categorie, plus wat er staat als hij leeg is. */
export const SECTIES: Record<string, { titel: string; leeg: string }> = {
  instellingen: { titel: "Je account en voorkeuren", leeg: "Nog geen voorkeuren ingesteld." },
  klassen: { titel: "Je klassen", leeg: "Je hebt nog geen klas ingevuld." },
  rapporten: { titel: "Concept-rapportteksten", leeg: "Geen opgeslagen concepten." },
  bestanden: { titel: "Opgeslagen bestanden en plattegronden", leeg: "Nog niets opgeslagen." },
  statistiek: { titel: "Je gebruik van Avinka", leeg: "Nog geen gebruiksgegevens." },
  taken: { titel: "Je takenlijst", leeg: "Geen taken." },
  reviews: { titel: "Je beoordeling", leeg: "Je hebt geen beoordeling achtergelaten." },
  toestemmingen: { titel: "Je akkoord op de voorwaarden", leeg: "Nog geen akkoord vastgelegd." },
  agenda_bronnen: { titel: "Je gekoppelde agenda's", leeg: "Je hebt geen agenda gekoppeld." },
  agenda_items: { titel: "Afspraken uit je agenda", leeg: "Geen afspraken opgehaald of toegevoegd." },
  basisrooster: { titel: "Je basisrooster", leeg: "Nog geen basisrooster ingevuld." },
  rooster_week: { titel: "Je weekroosters", leeg: "Nog geen week ingevuld." },
  feedback: { titel: "Feedback die je instuurde", leeg: "Je hebt geen feedback ingestuurd." },
  proef_feedback: { titel: "Je reactie na de proefperiode", leeg: "Je hebt hier niets ingevuld." },
  ai_verbruik: { titel: "Je AI-gebruik", leeg: "Nog geen AI-gebruik." },
  duo_overdracht: { titel: "Overdracht met je duo-collega", leeg: "Geen overdracht geschreven." },
  duo_taken: { titel: "Taken die je met je duo deelt", leeg: "Geen gedeelde taken." },
  duo_koppels: { titel: "Je samenwerking met een duo-collega", leeg: "Je deelt geen klas met een collega." },
  duo_overdracht_gelezen: { titel: "Wanneer je de overdracht las", leeg: "Nog niets gelezen." },
  bestand_deling: { titel: "Bestanden die je deelde", leeg: "Je hebt niets gedeeld." },
};

/* Hoe je de dingen in een categorie noemt. "2 rapportteksten" leest als iets;
 * "2 regels" leest als een database. Alleen waar het uitmaakt; de rest valt
 * terug op regel/regels. */
export const EENHEID: Record<string, [string, string]> = {
  klassen: ["klas", "klassen"],
  rapporten: ["rapporttekst", "rapportteksten"],
  taken: ["taak", "taken"],
  agenda_items: ["afspraak", "afspraken"],
  bestanden: ["bestand", "bestanden"],
  agenda_bronnen: ["agenda", "agenda's"],
  rooster_week: ["week", "weken"],
  feedback: ["bericht", "berichten"],
  duo_overdracht: ["notitie", "notities"],
  duo_taken: ["taak", "taken"],
  duo_koppels: ["samenwerking", "samenwerkingen"],
  bestand_deling: ["gedeeld bestand", "gedeelde bestanden"],
};

/* ⚠️ Deze lijst geldt voor ALLE tabellen tegelijk, dus een label moet kloppen
 * voor elke tabel die de kolom heeft. `actief` bestaat bij een klas én bij een
 * agenda; daarom het neutrale "Actief" en niet "Actieve klas". */
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
  kopje: "Hoort bij",
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
  // Duo en delen
  code: "Uitnodigingscode",
  rol: "Rol",
  uitgenodigd_email: "Uitgenodigd e-mailadres",
  gedeeld_email: "Gedeeld met",
  gelezen_op: "Gelezen op",
  // Feedback
  bericht: "Je bericht",
  pagina: "Vanaf welke pagina",
  status: "Status",
  categorie: "Categorie",
  intentie: "Wat je van plan was",
  reden: "Je toelichting",
};

export function label(sleutel: string): string {
  return LABELS[sleutel] ?? sleutel;
}

/* Velden die niets toevoegen voor een mens.
 *
 * ⚠️ `leerlingen` staat hier omdat een klas de namen TWEE KEER opslaat: de kale
 * lijst (oud) en `leerlingen_data` met jongen/meisje erbij (nieuw). Allebei
 * tonen leverde dezelfde klas twee keer onder elkaar op.
 *
 * ⚠️ De verwijzingen naar andere rijen staan er ook in: een rauwe uuid als
 * "a9318e98-5137-…" zegt een mens niets en is zonder onze database nergens toe
 * te herleiden. Alleen op de LEESBARE pagina en in de Excel-tabellen; het
 * JSON-bestand houdt ze wel, want dat is de volledige kopie. */
const VERBERG = new Set([
  "id",
  "user_id",
  "parent_id",
  "per_dag",
  "leerlingen",
  "klas_id",
  "bron_id",
  "bestand_id",
  "eigenaar",
  "auteur",
  "toegewezen_aan",
  "aangemaakt_door",
  "gebruiker_a",
  "gebruiker_b",
]);

/* ── MEENEMEN ───────────────────────────────────────────────────────────────
 * Welke categorieën kun je downloaden, en in welk formaat. De regel komt van de
 * eigenaar (8-8-2026) en is scherper dan "alles downloadbaar maken":
 *
 *   ⭐ DOWNLOADBAAR IS PRECIES WAT WIJ WEGGOOIEN.
 *
 * Rapporten, plattegronden, agenda-afspraken, je klas, je taken en alles wat
 * met je duo-collega gedeeld is verdwijnen 90 dagen na je laatste abonnement
 * (wijs_verwijder_klasdata). Die moet je mee kunnen nemen, anders ben je ze
 * kwijt. Je lesontwerpen, werkbladen, draaiboeken en je weekrooster bewaren we
 * juist voor altijd — daar hoort géén knop bij maar de zin dat we ze voor je
 * bewaren. Een knop die niet werkt leest als gijzeling; een zin leest als zorg.
 *
 * ⚠️ Het formaat is het halve werk. Een leerkracht die haar rapportteksten
 * ophaalt wil ze in Word kunnen plakken, niet in JSON kunnen lezen. */
export const MEENEMEN: Record<string, { formaat: "csv" | "ics" | "doc"; bestand: string }> = {
  klassen: { formaat: "csv", bestand: "avinka-klassenlijst.csv" },
  rapporten: { formaat: "doc", bestand: "avinka-rapportteksten.doc" },
  taken: { formaat: "csv", bestand: "avinka-takenlijst.csv" },
  agenda_items: { formaat: "ics", bestand: "avinka-agenda.ics" },
  // ⚠️ Deze twee horen hier omdat ze aan de KLAS hangen met een cascade
  // (duo_overdracht.klas_id en duo_taken.klas_id, beide "on delete cascade").
  // Wist de opruiming je klas, dan gaan ze mee — inclusief de overdracht, en dat
  // is vaak het waardevolste dat er over een groep is opgeschreven.
  duo_overdracht: { formaat: "doc", bestand: "avinka-overdracht.doc" },
  duo_taken: { formaat: "csv", bestand: "avinka-duo-taken.csv" },
};

/* Bovenaan de pagina staat wat je mee kunt nemen, daaronder de rest. Dat is de
 * volgorde waarin een leerkracht kijkt; de onderkant is er voor de wet.
 *
 * ⚠️ `bestanden` staat hier wél in maar heeft geen hokje en geen formaat.
 * Daarin zitten je lesontwerpen, werkbladen en draaiboeken, en de afspraak is
 * dat die bij ons bewaard blijven. De plattegronden erin verdwijnen wél — daar
 * hoort een tekening bij, en die kunnen we nog niet maken. Zolang dat zo is:
 * geen half werkende knop. */
export const EIGEN_WERK = [
  "klassen",
  "rapporten",
  "taken",
  "duo_overdracht",
  "duo_taken",
  "agenda_items",
  "bestanden",
];

export const OVERIG = TABELLEN.filter((t) => !EIGEN_WERK.includes(t));

/** Alles behalve `bestanden` is aan te vinken; zie de opmerking bij EIGEN_WERK. */
export function isTeKiezen(tabel: string): boolean {
  return tabel !== "bestanden";
}

export function bestandsnaamVoor(tabel: string): string {
  return MEENEMEN[tabel]?.bestand ?? `avinka-${tabel.replace(/_/g, "-")}.csv`;
}

export function formaatNaam(tabel: string): string {
  const f = MEENEMEN[tabel]?.formaat;
  return f === "doc" ? "Word" : f === "ics" ? "Agenda" : "Excel";
}

/* ── DE LEESBARE WAARDEN ─────────────────────────────────────────────────── */

const MAANDEN =
  "januari februari maart april mei juni juli augustus september oktober november december".split(" ");

/* Een datum in gewone taal. Bewust een eigen regeltje en niet nlDatum() uit
 * mail-opzeggen.ts: dat bestand hangt aan de mailstraat, en die hoort niet mee
 * te komen met een pagina die alleen gegevens laat zien. */
export function korteDatum(waarde: string): string {
  const d = new Date(waarde);
  if (Number.isNaN(d.getTime())) return waarde;
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

/* Lange vrije tekst (rapporttekst, les-inhoud) niet volledig uitschrijven maar
 * samenvatten. Het gaat hier om een overzicht; de volledige tekst zit in de
 * download en in de tool zelf. */
function vatSamen(s: string): string {
  const schoon = s.replace(/\s+/g, " ").trim();
  const woorden = schoon ? schoon.split(" ").length : 0;
  const kort = schoon.length > 120 ? schoon.slice(0, 120).trimEnd() + "…" : schoon;
  return kort + (woorden > 25 ? ` (${woorden} woorden bewaard)` : "");
}

/** Eén waarde leesbaar maken. Lege tekst = niets te tonen. */
function toonWaarde(sleutel: string, val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "boolean") return val ? "ja" : "nee";
  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    if (sleutel === "leerlingen_data") {
      return val
        .map((l) => {
          const o = l as { naam?: string; geslacht?: string };
          const g = o.geslacht === "j" ? " (jongen)" : o.geslacht === "m" ? " (meisje)" : "";
          return String(o.naam ?? "") + g;
        })
        .join(", ");
    }
    return val.map((x) => String(x)).join(", ");
  }
  if (typeof val === "object") {
    // Een opgeslagen indeling (plattegrond, rooster) is technische data.
    if (sleutel === "data") return "opgeslagen indeling";
    const paren = Object.entries(val as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== "",
    );
    if (paren.length === 0) return "";
    return paren.map(([k, v]) => `${k}: ${String(v)}`).join(" · ");
  }
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return korteDatum(s);
  if (sleutel === "verhaal" || sleutel === "inhoud" || sleutel === "tekst") return vatSamen(s);
  return s;
}

/** Eén rij → label/waarde-paren die je zo op het scherm kunt zetten. */
export function rijVelden(rij: Record<string, unknown>): { label: string; waarde: string }[] {
  // Een oude klas heeft alleen de kale namenlijst en nog geen leerlingen_data.
  // Dan tonen we die alsnog, anders zie je je klas helemaal niet.
  const rijkeLijst = Array.isArray(rij.leerlingen_data) && rij.leerlingen_data.length > 0;
  return Object.entries(rij)
    .filter(([k]) => !(VERBERG.has(k) && (k !== "leerlingen" || rijkeLijst)))
    .map(([k, v]) => ({ label: label(k), waarde: toonWaarde(k, v) }))
    .filter((p) => p.waarde !== "");
}

/** De gegevens omzetten naar wat de pagina nodig heeft: titel, telling in
 *  woorden, formaat en de preview-regels. Lege categorieën vallen weg; die
 *  worden onderaan het blok in één zin genoemd. */
export function bouwKaarten(tabellen: readonly string[], gegevens: Gegevens) {
  return tabellen
    .filter((t) => (gegevens[t] ?? []).length > 0)
    .map((t) => {
      const rijen = gegevens[t];
      const [enkel, meer] = EENHEID[t] ?? ["regel", "regels"];
      return {
        tabel: t,
        titel: SECTIES[t].titel,
        telling: `${rijen.length} ${rijen.length === 1 ? enkel : meer}`,
        formaat: isTeKiezen(t) ? formaatNaam(t) : null,
        rijen: rijen.map(rijVelden).filter((v) => v.length > 0),
      };
    });
}

/* ── DE BESTANDEN ────────────────────────────────────────────────────────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const uit = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Avinka//Agenda-export//NL",
    "CALSCALE:GREGORIAN",
  ];
  // Wanneer dit bestand is gemaakt. Sommige agenda-apps weigeren een afspraak
  // zonder dit veld.
  const nu = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  for (const r of rijen) {
    uit.push("BEGIN:VEVENT");
    uit.push(`UID:${icsTekst(String(r.id ?? r.uid ?? ""))}@avinka.nl`);
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

/** Word opent een HTML-bestand met de extensie .doc gewoon als document, mét
 *  koppen en alinea's. Dat scheelt een hele docx-bouwer aan de serverkant, en
 *  het is precies waar een rapporttekst heen moet: een document dat je nog
 *  bewerkt voordat je hem in ParnasSys of IEP plakt. */
function docBestand(titel: string, blokken: { kop: string; tekst: string }[]): string {
  const body = blokken
    .map(
      (b) =>
        `<h2 style="font-family:Calibri,sans-serif;font-size:14pt;">${escapeHtml(b.kop)}</h2>` +
        `<p style="font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5;">${escapeHtml(
          b.tekst,
        ).replace(/\r?\n/g, "<br>")}</p>`,
    )
    .join("");
  return `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(
    titel,
  )}</title></head>
<body><h1 style="font-family:Calibri,sans-serif;font-size:18pt;">${escapeHtml(titel)}</h1>${body}</body></html>`;
}

/* ── EEN ZIP MAKEN ──────────────────────────────────────────────────────────
 * Vink je drie categorieën aan, dan zijn dat drie verschillende bestandssoorten
 * (Excel, Word, agenda). Die kun je niet in één bestand plakken, dus gaan ze in
 * een zip.
 *
 * ⚠️ BEWUST GEEN PAKKET ERVOOR. De tools gebruiken JSZip, maar die halen ze bij
 * een externe server vandaan; dat is precies wat deze pagina niet moet doen
 * (cdnjs staat niet in onze subverwerkerslijst). En een npm-pakket toevoegen
 * voor 60 regels is duurder in onderhoud dan die 60 regels.
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

/** Eén categorie omzetten naar het bestand dat erbij hoort. */
export function deelBestand(
  deel: string,
  rijen: Record<string, unknown>[],
): { inhoud: string; type: string } {
  // Categorieën zonder eigen vorm worden een gewone tabel: één regel per rij,
  // één kolom per veld. De kolommen komen uit de gegevens zelf, zodat een nieuw
  // veld vanzelf meegaat en niemand een lijst hoeft bij te werken.
  if (!MEENEMEN[deel]) {
    const kolommen = [...new Set(rijen.flatMap((r) => Object.keys(r)))].filter(
      (k) => !VERBERG.has(k),
    );
    return {
      inhoud: csvBestand(
        kolommen.map(label),
        rijen.map((r) =>
          kolommen.map((k) => {
            const w = r[k];
            if (w === null || w === undefined) return "";
            if (typeof w === "boolean") return w ? "ja" : "nee";
            // Een opgeslagen indeling (rooster, tellers) is geen tekst. Die gaat
            // er als JSON in: onleesbaar in Excel, maar wel compleet, en dat is
            // waar deze helft van de pagina voor is.
            if (typeof w === "object") return JSON.stringify(w);
            return String(w);
          }),
        ),
      ),
      type: "text/csv; charset=utf-8",
    };
  }

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
    return {
      inhoud: csvBestand(["Klas", "Leerling", "Jongen of meisje"], uit),
      type: "text/csv; charset=utf-8",
    };
  }

  if (deel === "taken") {
    return {
      inhoud: csvBestand(
        ["Taak", "Afgevinkt", "Deadline", "Hoort bij", "Wekelijks"],
        rijen.map((t) => [
          t.tekst,
          t.gedaan ? "ja" : "nee",
          t.deadline ?? "",
          t.kopje ?? "",
          t.wekelijks ? "ja" : "nee",
        ]),
      ),
      type: "text/csv; charset=utf-8",
    };
  }

  if (deel === "duo_taken") {
    return {
      inhoud: csvBestand(
        ["Taak", "Afgevinkt", "Deadline"],
        rijen.map((t) => [t.tekst, t.gedaan ? "ja" : "nee", t.deadline ?? ""]),
      ),
      type: "text/csv; charset=utf-8",
    };
  }

  if (deel === "agenda_items") {
    return { inhoud: icsBestand(rijen), type: "text/calendar; charset=utf-8" };
  }

  if (deel === "rapporten") {
    return {
      inhoud: docBestand(
        "Mijn rapportteksten",
        rijen.map((r) => ({ kop: String(r.naam ?? ""), tekst: String(r.verhaal ?? "") })),
      ),
      type: "application/msword; charset=utf-8",
    };
  }

  if (deel === "duo_overdracht") {
    // Eén notitie per klas. De klasnaam hebben we hier niet (alleen klas_id),
    // dus de datum is de kop; dat is ook waar je op zoekt als je terugleest.
    return {
      inhoud: docBestand(
        "Overdracht met mijn duo-collega",
        rijen.map((r) => ({
          kop: r.bijgewerkt ? `Bijgewerkt op ${korteDatum(String(r.bijgewerkt))}` : "Overdracht",
          tekst: String(r.tekst ?? ""),
        })),
      ),
      type: "application/msword; charset=utf-8",
    };
  }

  return { inhoud: "", type: "text/plain; charset=utf-8" };
}

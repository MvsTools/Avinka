// De landelijke schoolvakanties, per schooljaar en per regio.
//
// LET OP — dit is een VANGNET, geen waarheid. Scholen mogen afwijken (een
// tweede meiweek, een eigen studieweek). Staat de vakantie in de gekoppelde
// schoolagenda van de leerkracht, dan wint die altijd. Deze lijst is er voor
// wie nog geen agenda heeft gekoppeld, zodat het jaar toch meteen klopt.
//
// ONDERHOUD: hoeft niet met de hand. Draai `node scripts/ververs-vakanties.mjs`
// en het blok tussen de GEGENEREERD-markerings hieronder wordt herschreven met
// de laatste officiële data van Rijksoverheid open data (schoolvakanties).
// Raak zelf niets aan tussen die twee regels — dat wordt overschreven.

export type Regio = "noord" | "midden" | "zuid";

export const REGIOS: { id: Regio; naam: string; uitleg: string }[] = [
  { id: "noord", naam: "Noord", uitleg: "Groningen, Friesland, Drenthe, Overijssel, Flevoland" },
  { id: "midden", naam: "Midden", uitleg: "Utrecht, Noord-Holland, Zuid-Holland, Gelderland" },
  { id: "zuid", naam: "Zuid", uitleg: "Zeeland, Noord-Brabant, Limburg" },
];

export const STANDAARD_REGIO: Regio = "midden";

export function isRegio(waarde: unknown): waarde is Regio {
  return waarde === "noord" || waarde === "midden" || waarde === "zuid";
}

export type Vakantie = {
  naam: string;
  /** Korte sleutel, handig voor kleuren en iconen: herfst, kerst, voorjaar, mei, zomer. */
  kort: string;
  /** Eerste vakantiedag. */
  van: string;
  /** Laatste vakantiedag, die telt zelf mee. */
  tot: string;
};

type PerRegio = Record<Regio, [van: string, tot: string]>;
type RuweVakantie = { naam: string; kort: string } & PerRegio;

/**
 * Per schooljaar de vijf vakanties, met de zomervakantie aan het eind. De
 * zomervakantie van het vorige schooljaar bepaalt wanneer dit schooljaar
 * begint, dus die van 2025-2026 hebben we ook nodig om 2026-2027 te kennen.
 */
// GEGENEREERD:START — laatst ververst 2026-08-07 via scripts/ververs-vakanties.mjs, schooljaren 2024-2025 t/m 2029-2030
export const SCHOOLJAREN: Record<string, RuweVakantie[]> = {
  "2024-2025": [
    {
      naam: "Herfstvakantie",
      kort: "herfst",
      noord: ["2024-10-26", "2024-11-03"],
      midden: ["2024-10-26", "2024-11-03"],
      zuid: ["2024-10-19", "2024-10-27"],
    },
    {
      naam: "Kerstvakantie",
      kort: "kerst",
      noord: ["2024-12-21", "2025-01-05"],
      midden: ["2024-12-21", "2025-01-05"],
      zuid: ["2024-12-21", "2025-01-05"],
    },
    {
      naam: "Voorjaarsvakantie",
      kort: "voorjaar",
      noord: ["2025-02-15", "2025-02-23"],
      midden: ["2025-02-22", "2025-03-02"],
      zuid: ["2025-02-22", "2025-03-02"],
    },
    {
      naam: "Meivakantie",
      kort: "mei",
      noord: ["2025-04-26", "2025-05-04"],
      midden: ["2025-04-26", "2025-05-04"],
      zuid: ["2025-04-26", "2025-05-04"],
    },
    {
      naam: "Zomervakantie",
      kort: "zomer",
      noord: ["2025-07-12", "2025-08-24"],
      midden: ["2025-07-19", "2025-08-31"],
      zuid: ["2025-07-05", "2025-08-17"],
    },
  ],
  "2025-2026": [
    {
      naam: "Herfstvakantie",
      kort: "herfst",
      noord: ["2025-10-18", "2025-10-26"],
      midden: ["2025-10-18", "2025-10-26"],
      zuid: ["2025-10-11", "2025-10-19"],
    },
    {
      naam: "Kerstvakantie",
      kort: "kerst",
      noord: ["2025-12-20", "2026-01-04"],
      midden: ["2025-12-20", "2026-01-04"],
      zuid: ["2025-12-20", "2026-01-04"],
    },
    {
      naam: "Voorjaarsvakantie",
      kort: "voorjaar",
      noord: ["2026-02-21", "2026-03-01"],
      midden: ["2026-02-14", "2026-02-22"],
      zuid: ["2026-02-14", "2026-02-22"],
    },
    {
      naam: "Meivakantie",
      kort: "mei",
      noord: ["2026-04-25", "2026-05-03"],
      midden: ["2026-04-25", "2026-05-03"],
      zuid: ["2026-04-25", "2026-05-03"],
    },
    {
      naam: "Zomervakantie",
      kort: "zomer",
      noord: ["2026-07-04", "2026-08-16"],
      midden: ["2026-07-18", "2026-08-30"],
      zuid: ["2026-07-11", "2026-08-23"],
    },
  ],
  "2026-2027": [
    {
      naam: "Herfstvakantie",
      kort: "herfst",
      noord: ["2026-10-10", "2026-10-18"],
      midden: ["2026-10-17", "2026-10-25"],
      zuid: ["2026-10-17", "2026-10-25"],
    },
    {
      naam: "Kerstvakantie",
      kort: "kerst",
      noord: ["2026-12-19", "2027-01-03"],
      midden: ["2026-12-19", "2027-01-03"],
      zuid: ["2026-12-19", "2027-01-03"],
    },
    {
      naam: "Voorjaarsvakantie",
      kort: "voorjaar",
      noord: ["2027-02-20", "2027-02-28"],
      midden: ["2027-02-20", "2027-02-28"],
      zuid: ["2027-02-13", "2027-02-21"],
    },
    {
      naam: "Meivakantie",
      kort: "mei",
      noord: ["2027-04-24", "2027-05-02"],
      midden: ["2027-04-24", "2027-05-02"],
      zuid: ["2027-04-24", "2027-05-02"],
    },
    {
      naam: "Zomervakantie",
      kort: "zomer",
      noord: ["2027-07-10", "2027-08-22"],
      midden: ["2027-07-17", "2027-08-29"],
      zuid: ["2027-07-24", "2027-09-05"],
    },
  ],
  "2027-2028": [
    {
      naam: "Herfstvakantie",
      kort: "herfst",
      noord: ["2027-10-16", "2027-10-24"],
      midden: ["2027-10-16", "2027-10-24"],
      zuid: ["2027-10-23", "2027-10-31"],
    },
    {
      naam: "Kerstvakantie",
      kort: "kerst",
      noord: ["2027-12-25", "2028-01-09"],
      midden: ["2027-12-25", "2028-01-09"],
      zuid: ["2027-12-25", "2028-01-09"],
    },
    {
      naam: "Voorjaarsvakantie",
      kort: "voorjaar",
      noord: ["2028-02-19", "2028-02-27"],
      midden: ["2028-02-26", "2028-03-05"],
      zuid: ["2028-02-26", "2028-03-05"],
    },
    {
      naam: "Meivakantie",
      kort: "mei",
      noord: ["2028-04-29", "2028-05-07"],
      midden: ["2028-04-29", "2028-05-07"],
      zuid: ["2028-04-29", "2028-05-07"],
    },
    {
      naam: "Zomervakantie",
      kort: "zomer",
      noord: ["2028-07-15", "2028-08-27"],
      midden: ["2028-07-08", "2028-08-20"],
      zuid: ["2028-07-22", "2028-09-03"],
    },
  ],
  "2028-2029": [
    {
      naam: "Herfstvakantie",
      kort: "herfst",
      noord: ["2028-10-14", "2028-10-22"],
      midden: ["2028-10-21", "2028-10-29"],
      zuid: ["2028-10-21", "2028-10-29"],
    },
    {
      naam: "Kerstvakantie",
      kort: "kerst",
      noord: ["2028-12-23", "2029-01-07"],
      midden: ["2028-12-23", "2029-01-07"],
      zuid: ["2028-12-23", "2029-01-07"],
    },
    {
      naam: "Voorjaarsvakantie",
      kort: "voorjaar",
      noord: ["2029-02-17", "2029-02-25"],
      midden: ["2029-02-17", "2029-02-25"],
      zuid: ["2029-02-10", "2029-02-18"],
    },
    {
      naam: "Meivakantie",
      kort: "mei",
      noord: ["2029-04-28", "2029-05-06"],
      midden: ["2029-04-28", "2029-05-06"],
      zuid: ["2029-04-28", "2029-05-06"],
    },
    {
      naam: "Zomervakantie",
      kort: "zomer",
      noord: ["2029-07-21", "2029-09-02"],
      midden: ["2029-07-07", "2029-08-19"],
      zuid: ["2029-07-14", "2029-08-26"],
    },
  ],
  "2029-2030": [
    {
      naam: "Herfstvakantie",
      kort: "herfst",
      noord: ["2029-10-20", "2029-10-28"],
      midden: ["2029-10-20", "2029-10-28"],
      zuid: ["2029-10-13", "2029-10-21"],
    },
    {
      naam: "Kerstvakantie",
      kort: "kerst",
      noord: ["2029-12-22", "2030-01-06"],
      midden: ["2029-12-22", "2030-01-06"],
      zuid: ["2029-12-22", "2030-01-06"],
    },
    {
      naam: "Voorjaarsvakantie",
      kort: "voorjaar",
      noord: ["2030-02-16", "2030-02-24"],
      midden: ["2030-02-23", "2030-03-03"],
      zuid: ["2030-02-23", "2030-03-03"],
    },
    {
      naam: "Meivakantie",
      kort: "mei",
      noord: ["2030-04-27", "2030-05-05"],
      midden: ["2030-04-27", "2030-05-05"],
      zuid: ["2030-04-27", "2030-05-05"],
    },
    {
      naam: "Zomervakantie",
      kort: "zomer",
      noord: ["2030-07-20", "2030-09-01"],
      midden: ["2030-07-13", "2030-08-25"],
      zuid: ["2030-07-06", "2030-08-18"],
    },
  ],
};
// GEGENEREERD:EIND

/** De schooljaren die we kennen, oudste eerst (zie SCHOOLJAREN hierboven). */
export const BEKENDE_SCHOOLJAREN = Object.keys(SCHOOLJAREN).sort();

export function vakantiesVan(schooljaarId: string, regio: Regio): Vakantie[] {
  const ruw = SCHOOLJAREN[schooljaarId];
  if (!ruw) return [];
  return ruw.map((v) => ({ naam: v.naam, kort: v.kort, van: v[regio][0], tot: v[regio][1] }));
}

/** De zomervakantie sluit het schooljaar af; daar hangt de jaargrens aan. */
export function zomervakantieVan(schooljaarId: string, regio: Regio): Vakantie | undefined {
  return vakantiesVan(schooljaarId, regio).find((v) => v.kort === "zomer");
}

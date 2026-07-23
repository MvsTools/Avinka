// De landelijke schoolvakanties, per schooljaar en per regio.
//
// LET OP — dit is een VANGNET, geen waarheid. Scholen mogen afwijken (een
// tweede meiweek, een eigen studieweek). Staat de vakantie in de gekoppelde
// schoolagenda van de leerkracht, dan wint die altijd. Deze lijst is er voor
// wie nog geen agenda heeft gekoppeld, zodat het jaar toch meteen klopt.
//
// ONDERHOUD: één keer per jaar bijwerken. De Rijksoverheid publiceert de data
// op rijksoverheid.nl/onderwerpen/schoolvakanties (overzicht per schooljaar).
// Neem de datums letterlijk over en voeg een nieuw blok toe aan SCHOOLJAREN.
// Data hieronder is opgehaald op 23-7-2026 voor 2025-2026 en 2026-2027.

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
export const SCHOOLJAREN: Record<string, RuweVakantie[]> = {
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
};

/** De schooljaren die we kennen, oudste eerst: ["2025-2026", "2026-2027"]. */
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

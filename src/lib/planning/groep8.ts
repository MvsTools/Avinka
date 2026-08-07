// Groep 8 is een ander schooljaar dan alle andere groepen.
//
// De doorstroomtoets, het voorlopig advies, het definitief advies en de
// aanmeldweek voor het voortgezet onderwijs liggen LANDELIJK vast. Ze staan
// dus niet per se in de agenda van jouw school, terwijl er wel harde
// verplichtingen aan hangen — en het is precies het jaar waarin een leerkracht
// het druk heeft.
//
// KERNPRINCIPE, net als bij de vakanties: dit is een lijstje feiten dat we
// JAARLIJKS BIJWERKEN. Geen AI, geen slimmigheid. Staat een schooljaar er niet
// in, dan tonen we niets in plaats van te gokken.
//
// Bron: Rijksoverheid, "Tijdlijn schooladvies" (opgehaald 5-8-2026):
// https://www.rijksoverheid.nl/themas/onderwijs/schooladvies-en-doorstroomtoets-basisschool
// De wet schrijft de data voor; de VO-raad publiceert ze per jaar.

/** Eén vast moment in het groep 8-jaar. */
export type Groep8Moment = {
  /** Stabiele sleutel, ook voor "één signaal per moment". */
  id: "voorlopig-advies" | "doorstroomtoets" | "definitief-advies" | "aanmeldweek";
  /** De dag waarop het speelt (bij een periode: de eerste dag). */
  datum: string;
  /** Bij een periode de laatste dag; anders gelijk aan `datum`. */
  totDatum: string;
  /**
   * Wat er speelt, in de taal van de leerkracht. Kort houden: dit komt op één
   * regel te staan met "Over 2 weken:" ervoor en een knop ernaast.
   */
  kop: string;
  /** Wat jij concreet doet — komt op je takenlijst. */
  taak: string;
  /**
   * Wat je gaat doen, voor op de knop. Net als bij de andere signalen: de knop
   * zegt de actie, niet "op mijn lijst" — dan weet je zonder klikken waar het
   * over gaat.
   */
  knop: string;
  /** Hoeveel dagen van tevoren we erover beginnen. */
  voor: number;
};

type Jaardata = {
  voorlopigAdviesVan: string;
  voorlopigAdviesTot: string;
  toetsVan: string;
  toetsTot: string;
  definitiefAdviesUiterlijk: string;
  aanmeldweekVan: string;
  aanmeldweekTot: string;
};

/**
 * ⚠️ JAARLIJKS BIJWERKEN, net als `vakanties.ts`. De data van het volgende
 * schooljaar worden meestal in het voorjaar bekendgemaakt door de VO-raad.
 */
const PER_SCHOOLJAAR: Record<string, Jaardata> = {
  // Schooljaar 2026-2027 — officieel bevestigd door Rijksoverheid (5-8-2026).
  "2026-2027": {
    voorlopigAdviesVan: "2027-01-10",
    voorlopigAdviesTot: "2027-01-31",
    toetsVan: "2027-01-25",
    toetsTot: "2027-02-12",
    definitiefAdviesUiterlijk: "2027-03-24",
    aanmeldweekVan: "2027-03-25",
    aanmeldweekTot: "2027-03-31",
  },
};

/**
 * De vaste momenten van dit schooljaar, of een lege lijst als we de data van
 * dat jaar (nog) niet hebben. Geen gok: een verkeerde datum bij een wettelijke
 * verplichting is erger dan geen datum.
 */
export function groep8Momenten(schooljaarId: string): Groep8Moment[] {
  const d = PER_SCHOOLJAAR[schooljaarId];
  if (!d) return [];
  return [
    {
      id: "voorlopig-advies",
      datum: d.voorlopigAdviesVan,
      totDatum: d.voorlopigAdviesTot,
      kop: "De voorlopige adviezen",
      taak: "Voorlopige schooladviezen opstellen en met ouders bespreken",
      knop: "Adviezen opstellen",
      // Vier weken: adviezen schrijf je niet op één avond, en ze gaan meestal
      // eerst langs de intern begeleider of de directie.
      voor: 28,
    },
    {
      id: "doorstroomtoets",
      datum: d.toetsVan,
      totDatum: d.toetsTot,
      kop: "De doorstroomtoets",
      taak: "Doorstroomtoets klaarzetten: rooster, inloggegevens en de kinderen voorbereiden",
      knop: "Toets klaarzetten",
      voor: 21,
    },
    {
      id: "definitief-advies",
      datum: d.definitiefAdviesUiterlijk,
      totDatum: d.definitiefAdviesUiterlijk,
      kop: "Het definitieve advies",
      taak: "Definitieve adviezen vaststellen — bij een hogere toetsuitslag moet je heroverwegen",
      knop: "Adviezen vaststellen",
      // Twee weken: de uitslag komt uiterlijk 15 maart en het advies moet
      // uiterlijk 24 maart de deur uit. Dat is een krappe, harde termijn.
      voor: 14,
    },
    {
      id: "aanmeldweek",
      datum: d.aanmeldweekVan,
      totDatum: d.aanmeldweekTot,
      kop: "De aanmeldweek voor het vo",
      taak: "Ouders eraan herinneren dat ze hun kind deze week aanmelden bij het vo",
      knop: "Ouders herinneren",
      voor: 10,
    },
  ];
}

/** Zit deze leerkracht (ook) voor groep 8? */
export function heeftGroep8(eigenGroepen: number[]): boolean {
  return eigenGroepen.includes(8);
}

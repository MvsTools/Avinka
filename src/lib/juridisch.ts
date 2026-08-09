// Eén bron voor de versies van de juridische documenten (voorwaarden + privacy).
// Wijzig je een document inhoudelijk, verhoog dan hier de `versie` (de datum) én de
// `weergave`-tekst. De registratie legt deze versies vast in de bewijstabel
// `toestemmingen`, zodat je later kunt aantonen wie wélke versie accepteerde
// (AVG-verantwoordingsplicht, art. 7). Zo lopen de getoonde datum op de pagina en
// de vastgelegde versie nooit uit elkaar.

/* BEIDE DOCUMENTEN GEBUMPT OP 5-8-2026: de bedrijfsgegevens (naam, adres, KvK,
   e-mailadres) staan er nu echt in, en de twee zinnen eromheen zijn daarvoor
   herschreven. Dat raakt de identiteit van de verwerkingsverantwoordelijke, dus
   het is inhoudelijk en het hoort langs de her-akkoord-pop-up.
   🔑 Ze gaan hier voor het eerst SAMEN op dezelfde datum staan, en dat is met
   opzet: allebei de documenten tonen dezelfde bedrijfsgegevens, dus een
   wijziging daarin raakt ze allebei. Bump ze in zo'n geval altijd tegelijk —
   anders krijgt de leerkracht twee pop-ups voor één wijziging. */
export const VOORWAARDEN = {
  versie: "2026-08-05", // machine-versie die we vastleggen bij akkoord
  weergave: "5 augustus 2026", // datum die op de pagina staat
};

/* ⚠️ ALLEEN PRIVACY GEBUMPT OP 8-8-2026, de voorwaarden bewust niet. De
   bewaartermijnen staan alleen in de privacyverklaring, dus twee pop-ups voor
   één wijziging zou hier onterecht zijn. Dat is de keerzijde van de regel
   hierboven: samen bumpen als het allebei raakt, apart als dat niet zo is. */
/* ⚠️ OPNIEUW ALLEEN PRIVACY, 9-8-2026. Zelfde afweging als hierboven: dit gaat
   over bewaren, en dat staat niet in de voorwaarden.
   🔑 Deze bump komt niet uit nieuw beleid maar uit een CORRECTIE. Bij het
   nalopen van wat er echt gebeurt als je je account verwijdert, bleek één
   e-mailadres bewaard te blijven (het slot tegen een tweede gratis proef,
   `proef_gebruikt`), terwijl de pagina zei dat alles weg gaat. Er verandert
   dus niets aan wat we doen — alleen aan wat we erover opschrijven. Zeg dat
   ook zo in de samenvatting hieronder; een pop-up over een correctie hoort
   niet te lezen als een nieuwe maatregel. */
export const PRIVACY = {
  versie: "2026-08-09",
  weergave: "9 augustus 2026",
};

// Korte samenvatting van wat er in de LAATSTE inhoudelijke wijziging veranderde.
// Werk deze bij zodra je hierboven een `versie` bumpt: precies deze regels ziet de
// leerkracht in de her-akkoord-pop-up. Laat leeg als er (nog) niets inhoudelijks
// is veranderd; de pop-up toont dan alleen de nette vraag om opnieuw akkoord te gaan.
/* ⚠️ De vorige samenvatting ging over de bedrijfsgegevens (bump van 5-8). Die is
   vervangen, want dit veld beschrijft steeds de LAATSTE wijziging — zo is dit
   bestand opgezet.
   🔑 Schrijf hier wat het voor de LEZER betekent, niet wat er in de code
   veranderde: precies deze zinnen ziet de leerkracht in de pop-up. En als er
   niets verandert aan wat je met zijn gegevens doet, zeg dat er dan bij —
   anders leest een verplichte pop-up als een aankondiging van iets ergs.
   ⚠️ Deze keer verandert er wél iets, en niet in het voordeel van de lezer. Dan
   is de eerlijke volgorde: eerst wát er verdwijnt, dan dat je het van tevoren
   hoort en kunt meenemen, dan wat er juist blijft. Niet andersom — beginnen met
   het goede nieuws leest als iets wegmoffelen. */
export const WIJZIGING_SAMENVATTING: string[] = [
  "We hebben twee dingen preciezer opgeschreven. Er verandert niets aan wat we met je gegevens doen.",
  "Verwijder je je account, dan verwijderen we alles. Eén ding houden we bij: dat dit e-mailadres al eens een gratis proefperiode heeft gehad. Anders zou een nieuw account steeds een nieuwe gratis week geven. Dat deden we al, maar het stond er nog niet.",
  "Technische logs (tellingen van je AI-gebruik, geen inhoud) verdwijnen nu ook echt automatisch na 24 maanden. Die termijn stond er al; de opruiming liep nog niet.",
];

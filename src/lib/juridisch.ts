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

export const PRIVACY = {
  versie: "2026-08-05",
  weergave: "5 augustus 2026",
};

// Korte samenvatting van wat er in de LAATSTE inhoudelijke wijziging veranderde.
// Werk deze bij zodra je hierboven een `versie` bumpt: precies deze regels ziet de
// leerkracht in de her-akkoord-pop-up. Laat leeg als er (nog) niets inhoudelijks
// is veranderd; de pop-up toont dan alleen de nette vraag om opnieuw akkoord te gaan.
/* ⚠️ De vorige samenvatting ging over het samen draaien van een groep met een
   collega (bump van 3-8). Die is vervangen, want dit veld beschrijft steeds de
   LAATSTE wijziging — zo is dit bestand opgezet.
   🔑 Schrijf hier wat het voor de LEZER betekent, niet wat er in de code
   veranderde: precies deze zinnen ziet de leerkracht in de pop-up. En als er
   niets verandert aan wat je met zijn gegevens doet, zeg dat er dan bij —
   anders leest een verplichte pop-up als een aankondiging van iets ergs. */
export const WIJZIGING_SAMENVATTING: string[] = [
  "In de privacyverklaring en de voorwaarden staat nu wie er achter Avinka zit: de bedrijfsnaam, het vestigingsadres en het KvK-nummer.",
  "Er staat ook een vast e-mailadres bij waar je terechtkunt met vragen over je gegevens: info@avinka.nl.",
  "Aan wat we met je gegevens doen is niets veranderd.",
];

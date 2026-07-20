// Eén bron voor de versies van de juridische documenten (voorwaarden + privacy).
// Wijzig je een document inhoudelijk, verhoog dan hier de `versie` (de datum) én de
// `weergave`-tekst. De registratie legt deze versies vast in de bewijstabel
// `toestemmingen`, zodat je later kunt aantonen wie wélke versie accepteerde
// (AVG-verantwoordingsplicht, art. 7). Zo lopen de getoonde datum op de pagina en
// de vastgelegde versie nooit uit elkaar.

export const VOORWAARDEN = {
  versie: "2026-07-20", // machine-versie die we vastleggen bij akkoord
  weergave: "20 juli 2026", // datum die op de pagina staat
};

export const PRIVACY = {
  versie: "2026-07-02",
  weergave: "2 juli 2026",
};

// Korte samenvatting van wat er in de LAATSTE inhoudelijke wijziging veranderde.
// Werk deze bij zodra je hierboven een `versie` bumpt: precies deze regels ziet de
// leerkracht in de her-akkoord-pop-up. Laat leeg als er (nog) niets inhoudelijks
// is veranderd; de pop-up toont dan alleen de nette vraag om opnieuw akkoord te gaan.
export const WIJZIGING_SAMENVATTING: string[] = [
  "We hebben opgeschreven dat een abonnement persoonlijk is en niet bedoeld is om met collega's te delen.",
  "Er geldt voortaan een redelijkheidsgrens voor het gebruik van de AI-functies. Die is ruim: normaal gebruik loopt er niet tegenaan, ook niet in een drukke rapportperiode.",
  "Je ziet je actuele stand terug in je instellingen, onder “Verbruik”.",
];

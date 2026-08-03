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
  versie: "2026-08-03",
  weergave: "3 augustus 2026",
};

// Korte samenvatting van wat er in de LAATSTE inhoudelijke wijziging veranderde.
// Werk deze bij zodra je hierboven een `versie` bumpt: precies deze regels ziet de
// leerkracht in de her-akkoord-pop-up. Laat leeg als er (nog) niets inhoudelijks
// is veranderd; de pop-up toont dan alleen de nette vraag om opnieuw akkoord te gaan.
export const WIJZIGING_SAMENVATTING: string[] = [
  "Je kunt een groep voortaan samen draaien met collega's. Deel je een groep, dan kun je elkaar een korte overdracht sturen.",
  "Zo'n bericht wordt vervangen zodra diezelfde persoon een nieuw bericht stuurt, en verdwijnt vanzelf na 30 dagen zonder wijziging. Er blijft dus geen geschiedenis staan.",
  "Wat je met een collega deelt hangt af van de rol die je hem geeft: alles, of alles behalve de rapportteksten.",
];

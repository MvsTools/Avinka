// Eén bron voor de versies van de juridische documenten (voorwaarden + privacy).
// Wijzig je een document inhoudelijk, verhoog dan hier de `versie` (de datum) én de
// `weergave`-tekst. De registratie legt deze versies vast in de bewijstabel
// `toestemmingen`, zodat je later kunt aantonen wie wélke versie accepteerde
// (AVG-verantwoordingsplicht, art. 7). Zo lopen de getoonde datum op de pagina en
// de vastgelegde versie nooit uit elkaar.

/* ⚠️ NOG NIET GEBUMPT NA DE WIJZIGING VAN 5-8, EN DAT IS EEN KEUZE.
   In allebei de documenten zijn die dag de bedrijfsgegevens ingevuld (naam,
   KvK, e-mailadres) en zijn de twee zinnen eromheen herschreven. Dat is
   inhoudelijk, dus het hoort een bump te krijgen — alleen is het vestigings-
   adres nog niet compleet: postcode en plaats ontbreken. Bumpen betekent een
   verplichte her-akkoord-pop-up voor iedereen, en die wil je niet twee keer
   binnen een week.
   ➡️ ZODRA DE POSTCODE ER STAAT: allebei de versies hieronder naar die datum
   zetten (ze zijn allebei gewijzigd), en WIJZIGING_SAMENVATTING vervangen door
   de regels die onderaan dit bestand al klaarstaan. */
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

/* Klaargezet voor de bump zodra het vestigingsadres compleet is (zie boven).
   Vervang WIJZIGING_SAMENVATTING hierboven dan door deze regels.
   ⚠️ Schrijf hier wat het voor de LEZER betekent, niet wat er in de code
   veranderde: precies deze zinnen ziet de leerkracht in de pop-up. */
export const SAMENVATTING_BEDRIJFSGEGEVENS: string[] = [
  "In de privacyverklaring en de voorwaarden staat nu wie er achter Avinka zit: de bedrijfsnaam, het vestigingsadres en het KvK-nummer.",
  "Ook staat er nu een vast e-mailadres bij waar je terechtkunt met vragen over je gegevens: info@avinka.nl.",
  "Er is inhoudelijk niets veranderd aan wat we met je gegevens doen.",
];

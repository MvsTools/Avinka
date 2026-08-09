// Het namenvangnet op de SERVER: de laatste controle vóór er iets naar de AI gaat.
//
// WAAROM DIT ER MOET ZIJN
// Op het dashboard staat: "de namen van je leerlingen blijven altijd op je eigen
// computer en gaan nooit naar de AI". Die belofte hing tot 9-8-2026 volledig aan
// één scriptje in de browser (public/avinka-masking.js) plus de maskering die
// elke tool zelf doet. Laadt dat script niet, of gaat er in een tool iets mis,
// dan gingen er namen mee en merkte niemand het. Dit is het tweede net.
//
// 🔑 HET CONTROLEERT, HET MASKEERT NIET. Dat lijkt minder, maar het is beter:
// - Deed de browserlaag zijn werk, dan staan er codes (KN-001) in de tekst en
//   ziet dit vangnet niets. Het kan dus alleen afgaan als er écht iets stuk is.
// - Daarom kan een valse treffer hier bijna niet bestaan. Heet een kind "Roos"
//   en schrijf je over een roos, dan heeft de browserlaag dat woord al door een
//   code vervangen — het komt hier nooit als "roos" aan.
// - En zelf maskeren zou een kapotte browserlaag stilletjes verbergen. Dan
//   staat er straks een net dat nooit gecontroleerd is en niemand die het weet.
//
// ⚠️ DE REGELS MOETEN GELIJK BLIJVEN MET public/avinka-masking.js: hele woorden,
// hoofdletter-ongevoelig, namen korter dan 2 tekens overslaan. Wijkt dit af, dan
// weigert de server iets wat de browser had moeten maskeren (of andersom).
// Verander je daar de matching, verander die dan hier ook.
//
// ⛔ Bewust NIET meegenomen: de schoolnaam. Die wordt in de browser wél
// gemaskeerd, maar een schoolnaam is geen gegeven over een kind en de kans op
// een vals alarm is er veel groter ("De Regenboog" in een tekst over regenbogen).
// De belofte op het scherm gaat over leerlingnamen; dáár sluit dit net op aan.

/** Regex-tekens in een naam onschadelijk maken. */
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Eén regex voor alle namen samen, of `null` als er niets te bewaken valt.
 *
 * De woordgrens valt weg als een naam met een niet-letter begint of eindigt —
 * anders zou de match daar stilletjes falen. Zelfde truc als in de browserlaag.
 */
export function namenRegex(namen: string[]): RegExp | null {
  const schoon = [...new Set(namen.map((n) => String(n ?? "").trim()).filter((n) => n.length >= 2))];
  if (!schoon.length) return null;
  const delen = schoon.map((naam) => {
    const start = /^[A-Za-zÀ-ÿ0-9]/.test(naam) ? "\\b" : "";
    const eind = /[A-Za-zÀ-ÿ0-9]$/.test(naam) ? "\\b" : "";
    return `${start}${esc(naam)}${eind}`;
  });
  return new RegExp(`(?:${delen.join("|")})`, "i");
}

/**
 * Staat er een naam uit deze klas in de tekst?
 *
 * We geven met opzet alleen `true`/`false` terug en nooit wélke naam: die zou
 * dan in een logregel of een foutmelding belanden, en dat is precies het
 * gegeven dat we proberen te beschermen.
 */
export function bevatNaam(tekst: string, re: RegExp | null): boolean {
  if (!re || !tekst) return false;
  return re.test(tekst);
}

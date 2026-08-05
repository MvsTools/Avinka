// ════════════════════════════════════════════════════════════════════════
//  E-mailadressen normaliseren + wegwerpadressen herkennen
//
//  Waarvoor: één gratis proefperiode per BRIEVENBUS, niet per schrijfwijze.
//  Zonder dit is een nieuwe gratis week een kwestie van een plusje typen.
//
//  ⚠️ DEZE REGELS STAAN OOK IN DE DATABASE (`wijs_email_norm`, zie
//  database/migratie-proef-per-brievenbus.sql). Daar zit de echte handhaving,
//  want aanmelden kan ook buiten onze eigen pagina om. Wijzig je hier iets,
//  wijzig het daar dan ook.
// ════════════════════════════════════════════════════════════════════════

// Providers die alles achter een `+` als label behandelen: jan+school@… komt
// aan in het postvak van jan@…. Bewust een LIJST en niet "alle domeinen": bij
// een schoolserver kan een plus een gewoon teken in het adres zijn, en dan zou
// je twee echte collega's op één hoop gooien.
const PLUS_IS_LABEL = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "outlook.nl",
  "hotmail.com",
  "hotmail.nl",
  "live.com",
  "live.nl",
  "msn.com",
  "icloud.com",
  "me.com",
  "fastmail.com",
  "protonmail.com",
  "proton.me",
]);

// Alleen Gmail negeert puntjes in het deel vóór de @. Bij alle andere
// providers is jan.jansen@ echt iets anders dan janjansen@ — daar mag je dus
// niets samenvoegen, anders weiger je een gratis week aan iemand die er recht
// op heeft.
const PUNTEN_TELLEN_NIET = new Set(["gmail.com", "googlemail.com"]);

/** Twee schrijfwijzen van hetzelfde postvak leveren dezelfde uitkomst op. */
export function normaliseerEmail(email: string): string {
  const schoon = (email ?? "").trim().toLowerCase();
  const apenstaart = schoon.lastIndexOf("@");
  if (apenstaart < 1) return schoon;

  let lokaal = schoon.slice(0, apenstaart);
  let domein = schoon.slice(apenstaart + 1);

  // Gmail heeft twee namen voor hetzelfde huis.
  if (domein === "googlemail.com") domein = "gmail.com";

  if (PLUS_IS_LABEL.has(domein)) lokaal = lokaal.split("+")[0];
  if (PUNTEN_TELLEN_NIET.has(domein)) lokaal = lokaal.split(".").join("");

  return `${lokaal}@${domein}`;
}

// Wegwerpadressen: postvakken die na een uur weer weg zijn. Een korte, saaie
// lijst van de bekendste — geen poging tot volledigheid, want die lijsten
// bevatten tienduizenden domeinen en verouderen per week. Dit houdt de
// gemakzuchtige poging tegen; de echte rem is "één proef per brievenbus".
const WEGWERP_DOMEINEN = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr",
  "trashmail.com",
  "trashmail.de",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "mailnesia.com",
  "fakeinbox.com",
  "spamgourmet.com",
  "mytemp.email",
  "emailondeck.com",
  "moakt.com",
  "tempr.email",
  "discard.email",
  "mohmal.com",
  "burnermail.io",
  "inboxkitten.com",
  "wegwerpmail.nl",
  "nepmail.nl",
]);

export function isWegwerpAdres(email: string): boolean {
  const domein = (email ?? "").trim().toLowerCase().split("@").pop() ?? "";
  return WEGWERP_DOMEINEN.has(domein);
}

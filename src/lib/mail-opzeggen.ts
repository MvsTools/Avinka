/* De mail dat de leerlinggegevens binnenkort opgeruimd worden.
 *
 * ⭐ TOON: dit is NADRUKKELIJK GEEN dreigmail. De boodschap is "we bewaren
 * gegevens over kinderen niet langer dan nodig, en je eigen vakwerk blijft
 * gewoon staan". Dat is eerlijker, het wint vertrouwen op precies het punt
 * waar deze markt gevoelig ligt, en het herinnert iemand er en passant aan dat
 * zijn lesontwerpen er nog liggen. Een mail die dreigt met dataverlies om
 * mensen terug te lokken, werkt bij leerkrachten averechts (besluit eigenaar
 * 8-8-2026). Schrijf hem dus nooit om naar "je raakt alles kwijt".
 *
 * Alleen tekst en opmaak; het versturen doet src/lib/mail.ts. Zelfde vorm als
 * mail-proef-verlopen.ts, zie docs/mailsjablonen.md voor waarom die er zo
 * uitziet (tabellen i.p.v. flexbox, opmaak in het element zelf, en Gmail en
 * Outlook laden geen lettertypes).
 *
 * ⚠️ MAG PAS VERSTUURD WORDEN ALS BETALINGEN_LIVE AAN STAAT. Zolang die vlag
 * uit staat verloopt er niets en houdt iedereen volledige toegang (zie
 * src/lib/abonnement.ts, heeftToegang()) — deze mail zou dan aankondigen dat
 * er iets verdwijnt terwijl er niets aan de hand is. De route
 * (src/app/api/cron/verwijder-waarschuwing/route.ts) bewaakt dat, niet dit
 * bestand.
 *
 * ⚠️ Deze mail is niet alleen beleefdheid, hij is een SLOT. De databasefunctie
 * wijs_verwijder_klasdata() weigert te wissen bij wie hem niet minstens 7 dagen
 * eerder heeft gehad. Zet de verzending dus nooit uit "omdat het toch niemand
 * raakt": dan raakt het ook niemand meer die zijn gegevens kwijtraakt. */

import { groet } from "./mail";

function veilig(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/* Bewust geen toLocaleDateString: de taak draait op een server waarvan je de
   taalinstelling niet in de hand hebt, en "13 September 2026" of "9/13/2026"
   in een Nederlandse mail is precies het soort detail dat er goedkoop uitziet. */
export function nlDatum(datum: string): string {
  const d = new Date(datum);
  if (Number.isNaN(d.getTime())) return datum;
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

export type Opzegging = {
  /* ⚠️ Vult iemand zelf in bij het aanmelden, dus onbetrouwbare invoer: in de
     HTML-versie altijd door veilig() halen. */
  voornaam: string;
  /* Sinds wanneer deze leerkracht geen abonnement meer heeft, als jjjj-mm-dd.
     ⚠️ NODIG OM NIET TE LIEGEN: deze mail gaat op dag 83, niet op dag 90. Een
     zin als "je gebruikt Avinka al 90 dagen niet meer" is op het moment van
     versturen dus onwaar. Met deze datum noemt de mail de REGEL (90 dagen) en
     de twee datums eromheen, en klopt elke zin. */
  abonnementTot: string;
  /* De datum waarop er echt gewist wordt, als jjjj-mm-dd. Komt uit
     wijs_verwijder_waarschuwing() en houdt al rekening met de respijttermijn,
     dus deze datum is waar. */
  wistOp: string;
  /* Link naar de abonnementspagina: één klik en er gebeurt niets meer.
     ⚠️ Dit is de ENIGE dashboardpagina waar deze lezer nog binnenkomt. Zodra
     BETALINGEN_LIVE aan staat stuurt de middleware iemand zonder toegang van
     élke /dashboard-pagina door naar /dashboard/abonnement (zie
     src/utils/supabase/middleware.ts). Zet hier dus nooit een link naar
     Instellingen of Bestanden in: die lopen dood op de betaalpagina. */
  link: string;
};

/* ⭐ KORT EN NIEUWSGIERIG MAKEND (keuze eigenaar 8-8-2026). Er stond eerst
   "…, je eigen werk blijft" achter, om meteen gerust te stellen. Twee redenen
   waarom dat weg is: in de lijstweergave van een postvak wordt een onderwerp
   afgekapt (op een telefoon rond de 35 tekens), dus juist het geruststellende
   deel viel weg — en los daarvan roept de korte versie de vraag op die de mail
   beantwoordt. De geruststelling staat in het groene blok in de mail zelf.
   Zelfde tekst als de H1, zodat openen voelt als doorlezen. */
export const OPZEGGING_ONDERWERP = "We ruimen je leerlinggegevens op";

export function opzeggingTekst(h: Opzegging): string {
  const datum = nlDatum(h.wistOp);
  const tot = nlDatum(h.abonnementTot);
  return [
    groet(h.voornaam),
    "",
    `Sinds ${tot} heb je geen abonnement meer op Avinka. Gegevens over kinderen bewaren wij maximaal 90 dagen, dus op ${datum} ruimen we ze op.`,
    "",
    "Je eigen werk bewaren we wel: lesontwerpen, werkbladen en draaiboeken, mocht je ze ooit nog nodig hebben.",
    "",
    `Wil je je klas houden? Pak dan je abonnement weer op: ${h.link}`,
    "",
    "Klopt er iets niet? Mail gerust naar support@avinka.nl. Ik lees alles zelf.",
    "",
    "Met vriendelijke groet,",
    "Michael van Spanje",
    "Avinka",
  ].join("\n");
}

export function opzeggingHtml(h: Opzegging): string {
  const link = veilig(h.link);
  const datum = veilig(nlDatum(h.wistOp));
  const tot = veilig(nlDatum(h.abonnementTot));
  const hoi = veilig(groet(h.voornaam));
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Plus+Jakarta+Sans:wght@400;700&display=swap');
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:'Bricolage Grotesque',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.25;color:#221c3a;">We ruimen je leerlinggegevens op</h1>
        <p style="margin:16px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">${hoi}</p>
        <p style="margin:10px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">Sinds ${tot} heb je geen abonnement meer op Avinka. Gegevens over kinderen bewaren wij maximaal 90 dagen, dus op <strong style="color:#221c3a;">${datum}</strong> ruimen we ze op.</p>
      </td></tr>
      <tr><td style="padding:20px 36px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f8f4;border-radius:14px;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0;font-size:16px;line-height:1.65;color:#265c42;"><strong>Je eigen werk blijft staan.</strong> Lesontwerpen, werkbladen en draaiboeken bewaren we voor je, mocht je ze ooit nog nodig hebben.</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="${link}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Pak je abonnement weer op</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:22px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#6b6880;">Klopt er iets niet? Mail gerust naar <a href="mailto:support@avinka.nl" style="color:#25855a;font-weight:bold;">support@avinka.nl</a>. Ik lees alles zelf.</p>
      </td></tr>
      <tr><td style="padding:24px 36px 30px;">
        <div style="border-top:1px solid #ece7e0;padding-top:16px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8798;">Werkt de knop niet? Kopieer dan deze link:<br>
            <span style="color:#25855a;word-break:break-all;">${link}</span>
          </p>
          <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#8a8798;">Avinka &middot; van to-do naar gedaan<br>Michael van Spanje</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

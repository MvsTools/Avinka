/* De mail dat de klasgegevens binnenkort verwijderd worden.
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
  voornaam: string;
  /* De datum waarop er echt gewist wordt, als jjjj-mm-dd. Komt uit
     wijs_verwijder_waarschuwing() en houdt al rekening met de respijttermijn,
     dus deze datum is waar. */
  wistOp: string;
  /* Link naar de abonnementspagina: één klik en er gebeurt niets meer. */
  link: string;
  /* Link naar Instellingen, waar de knop "download je gegevens" staat (die
     leest /api/account/export uit, de AVG-inzage die er al was).
     ⚠️ Bewust NIET rechtstreeks naar /api/account/export: die route geeft een
     kale 401 in JSON aan wie niet ingelogd is, en vanuit een mail is de kans
     juist groot dat iemand uitgelogd klikt. Via de dashboardpagina land je
     netjes op het inlogscherm. */
  downloadLink: string;
};

export const OPZEGGING_ONDERWERP = "Je klasgegevens worden binnenkort verwijderd";

export function opzeggingTekst(h: Opzegging): string {
  const datum = nlDatum(h.wistOp);
  return [
    `Je hebt al een maand geen abonnement meer op Avinka. Daarom verwijderen we op ${datum} de gegevens die bij je klas horen.`,
    "",
    "Dat gaat om je klassenlijsten, je rapporten, je bestanden, je taken en de overdracht naar een collega.",
    "",
    "Je account blijft gewoon bestaan. Kom je later terug, dan log je in met hetzelfde e-mailadres en begin je met een lege klas.",
    "",
    "Wil je dit niet? Dan heb je twee mogelijkheden:",
    "",
    `1. Pak je abonnement weer op, dan blijft alles staan: ${h.link}`,
    `2. Download je gegevens, dan heb je alles op je eigen computer: ${h.downloadLink}`,
    "",
    "Heb je hier vragen over, mail dan gerust naar support@avinka.nl. Ik lees alles zelf.",
    "",
    "Met vriendelijke groet,",
    "Michael van Spanje",
    "Avinka",
  ].join("\n");
}

export function opzeggingHtml(h: Opzegging): string {
  const link = veilig(h.link);
  const download = veilig(h.downloadLink);
  const datum = veilig(nlDatum(h.wistOp));
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Plus+Jakarta+Sans:wght@400;700&display=swap');
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:'Bricolage Grotesque',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.25;color:#221c3a;">Je klasgegevens worden verwijderd op ${datum}</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">Je hebt al een maand geen abonnement meer op Avinka. Daarom verwijderen we op ${datum} de gegevens die bij je klas horen: je klassenlijsten, je rapporten, je bestanden, je taken en de overdracht naar een collega.</p>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">Je account blijft gewoon bestaan. Kom je later terug, dan log je in met hetzelfde e-mailadres en begin je met een lege klas.</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="${link}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Pak je abonnement weer op</a>
          </td>
        </tr></table>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#6b6880;">Liever niet? <a href="${download}" style="color:#25855a;font-weight:bold;">Download dan eerst je gegevens.</a></p>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#6b6880;">Heb je hier vragen over, mail dan gerust naar <a href="mailto:support@avinka.nl" style="color:#25855a;font-weight:bold;">support@avinka.nl</a>. Ik lees alles zelf.</p>
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

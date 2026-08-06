/* De herinnering dat je proefperiode bijna afloopt.
 *
 * Alleen tekst en opmaak; het versturen doet src/lib/mail.ts. Zelfde vorm als
 * de andere mails, zie docs/mailsjablonen.md voor waarom die er zo uitziet.
 *
 * ⚠️ WAT HIER BEWUST NIET IN STAAT: wat er ná de proefperiode gebeurt. Zolang
 * BETALINGEN_LIVE uit staat verandert er namelijk niets en houdt iedereen
 * volledige toegang (zie src/lib/abonnement.ts). Een zin als "daarna sluiten
 * je tools" zou dus onwaar zijn. Ook prijzen staan er niet in: die horen op de
 * abonnementspagina, want daar zijn ze bij te werken zonder dat iemand een
 * verouderd bedrag in zijn postvak heeft staan. */

function veilig(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ProefHerinnering = {
  /* Voornaam; leeg mag, dan begint de mail gewoon met "Hallo". */
  voornaam: string;
  /* Wanneer de proef afloopt, al als leesbare datum ("donderdag 7 augustus"). */
  eindDatum: string;
  /* Link naar de abonnementspagina. */
  link: string;
};

export const PROEF_ONDERWERP = "Je proefperiode loopt bijna af";

export function proefTekst(h: ProefHerinnering): string {
  const aanhef = h.voornaam.trim() ? `Hallo ${h.voornaam.trim()},` : "Hallo,";
  return [
    aanhef,
    "",
    `Je proefperiode van Avinka loopt af op ${h.eindDatum}.`,
    "",
    "Wil je verder? Kijk dan even welk pakket bij je past:",
    h.link,
    "",
    "Nog vragen, of iets wat je mist? Mail gerust naar support@avinka.nl.",
    "Ik lees alles zelf.",
    "",
    "Met vriendelijke groet,",
    "Michael van Spanje",
    "Avinka",
  ].join("\n");
}

export function proefHtml(h: ProefHerinnering): string {
  const naam = veilig(h.voornaam.trim());
  const aanhef = naam ? `Hallo ${naam},` : "Hallo,";
  const datum = veilig(h.eindDatum);
  const link = veilig(h.link);
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#221c3a;">Je proefperiode loopt bijna af</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">${aanhef} je proefperiode van Avinka loopt af op <strong style="color:#221c3a;">${datum}</strong>.</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="${link}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Bekijk de pakketten</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#6b6880;">Nog vragen, of iets wat je mist? Mail gerust naar <a href="mailto:support@avinka.nl" style="color:#25855a;font-weight:bold;">support@avinka.nl</a>. Ik lees alles zelf.</p>
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

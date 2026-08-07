/* De mail dat je proefperiode is verlopen.
 *
 * Alleen tekst en opmaak; het versturen doet src/lib/mail.ts. Zelfde vorm als
 * mail-proef.ts (de herinnering vooraf), zie docs/mailsjablonen.md voor
 * waarom die er zo uitziet.
 *
 * ⚠️ MAG PAS VERSTUURD WORDEN ALS BETALINGEN_LIVE AAN STAAT. Zolang die vlag
 * uit staat verandert er bij het verlopen van een proef niets — iedereen
 * houdt volledige toegang (zie src/lib/abonnement.ts, heeftToegang()). Deze
 * mail zegt dat de tools op slot staan; dat mag dus alleen waar zijn op het
 * moment dat hij verstuurd wordt. Het gaten van de route
 * (src/app/api/cron/proef-verlopen/route.ts) checkt dit, niet dit bestand. */

function veilig(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ProefVerlopen = {
  /* Wordt niet meer gebruikt in de mail zelf (bewust zakelijk, geen
     "Hallo naam" — zie de eigenaar 7-8), maar blijft in dit type staan omdat
     de aanroeper 'm toch al heeft. */
  voornaam: string;
  /* Link naar de abonnementspagina. */
  link: string;
};

export const PROEF_VERLOPEN_ONDERWERP = "Je proefperiode is verlopen";

export function proefVerlopenTekst(h: ProefVerlopen): string {
  return [
    "Je proefperiode van Avinka is verlopen. Je tools staan nu op slot totdat je een pakket kiest.",
    "",
    "Kies hier het pakket dat bij je past:",
    h.link,
    "",
    "Mocht ik je nog ergens mee kunnen helpen, mail dan gerust naar support@avinka.nl.",
    "Ik lees alles zelf.",
    "",
    "Met vriendelijke groet,",
    "Michael van Spanje",
    "Avinka",
  ].join("\n");
}

export function proefVerlopenHtml(h: ProefVerlopen): string {
  const link = veilig(h.link);
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Plus+Jakarta+Sans:wght@400;700&display=swap');
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:'Bricolage Grotesque',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.25;color:#221c3a;">Je proefperiode is verlopen</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">Je proefperiode van Avinka is verlopen. Je tools staan nu op slot totdat je een pakket kiest.</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="${link}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Kies je pakket</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#6b6880;">Mocht ik je nog ergens mee kunnen helpen, mail dan gerust naar <a href="mailto:support@avinka.nl" style="color:#25855a;font-weight:bold;">support@avinka.nl</a>. Ik lees alles zelf.</p>
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

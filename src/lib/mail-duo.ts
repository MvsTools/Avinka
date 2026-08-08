/* De uitnodigingsmail voor een collega bij een groep.
 *
 * Alleen de tekst en de opmaak; het versturen doet src/lib/mail.ts.
 *
 * Dezelfde vorm als de mails die Supabase verstuurt (zie docs/mailsjablonen.md):
 * tabellen in plaats van flexbox omdat Outlook met de opmaakmotor van Word
 * rekent, alle opmaak in het element zelf omdat Gmail een style-blok wegknipt,
 * en geen logo omdat een beeldlogo bij de helft van de lezers geblokkeerd is.
 * De knop is #25855a en niet het gewone merkgroen: wit daarop haalt 4,58:1 in
 * plaats van 3,37:1. */

function veilig(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type Uitnodiging = {
  /* Voornaam van wie uitnodigt. Leeg mag: dan staat er "Een collega". */
  vanWie: string;
  klasNaam: string;
  /* De volledige link naar de instellingenpagina met de code erin. */
  link: string;
  /* Wat je straks mag. Ontbreekt hij, dan zegt de mail er niets over. */
  rol?: "volledig" | "meekijken";
};

/* 🔑 WAT JE MAG STAAT IN DE OPENINGSZIN ZELF (8-8-2026).
   Dit stond er eerst helemaal niet: de eigenaar merkte bij het testen dat hij
   pas dóórhad dat hij meekijker was toen hij op Rapporten klikte en het daar
   zag staan. Je hoort vooraf te weten waar je ja tegen zegt.
   ⚠️ Mijn eerste poging was een apart alinea'tje eronder dat opsomde wat je wel
   en niet kunt. Oordeel eigenaar: "dan heb je zo'n lap tekst eronder." Terecht.
   Uitnodigen om **mee te kijken** is iets anders dan uitnodigen om iets **samen
   te draaien** — dat verschil zit al in de zin, dus het hoeft er niet los onder.
   Het scheelt drie regels en je leest het meteen.
   ⚠️ Niet het woord "meekijken" als rolnaam noemen: dat is ons eigen jargon. */
function openingTekst(u: Uitnodiging): string {
  const wie = u.vanWie.trim() || "Een collega";
  if (u.rol === "meekijken") {
    return `${wie} draait ${u.klasNaam} en nodigt je uit om mee te kijken in Avinka.`;
  }
  return `${wie} draait ${u.klasNaam} en wil dat samen met jou doen in Avinka.`;
}

export function uitnodigingOnderwerp(u: Uitnodiging): string {
  const wie = u.vanWie.trim() || "Een collega";
  // Kort genoeg om op een telefoon niet af te breken, en het begint met de
  // naam van iemand die je waarschijnlijk kent. Dat is de reden dat je 'm opent.
  return `${wie} nodigt je uit voor ${u.klasNaam}`;
}

export function uitnodigingTekst(u: Uitnodiging): string {
  return [
    "Hallo,",
    "",
    openingTekst(u),
    "",
    u.link,
    "",
    "Heb je nog geen Avinka-account? Maak er dan één aan met dit e-mailadres.",
    "De uitnodiging is aan dit adres gekoppeld en werkt niet op een ander.",
    "",
    "Met vriendelijke groet,",
    "Avinka",
  ].join("\n");
}

export function uitnodigingHtml(u: Uitnodiging): string {
  const wie = veilig(u.vanWie.trim() || "Een collega");
  const klas = veilig(u.klasNaam);
  const link = veilig(u.link);
  // Zelfde zin als in de platte tekst, maar met de groepsnaam vet. Vandaar hier
  // een eigen regel en geen hergebruik van openingTekst().
  const opening =
    u.rol === "meekijken"
      ? `Om mee te kijken bij <strong style="color:#221c3a;">${klas}</strong> in Avinka.`
      : `Om <strong style="color:#221c3a;">${klas}</strong> samen te draaien in Avinka.`;
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Plus+Jakarta+Sans:wght@400;700&display=swap');
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:'Bricolage Grotesque',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.25;color:#221c3a;">${wie} nodigt je uit</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">${opening}</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="${link}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Uitnodiging bekijken</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#4a4458;">Heb je nog geen Avinka-account? Maak er dan één aan met <strong style="color:#221c3a;">dit e-mailadres</strong>. De uitnodiging is eraan gekoppeld en werkt niet op een ander adres.</p>
      </td></tr>
      <tr><td style="padding:24px 36px 30px;">
        <div style="border-top:1px solid #ece7e0;padding-top:16px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8798;">Werkt de knop niet? Kopieer dan deze link:<br>
            <span style="color:#25855a;word-break:break-all;">${link}</span>
          </p>
          <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#8a8798;">Avinka &middot; van to-do naar gedaan</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

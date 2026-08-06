// ════════════════════════════════════════════════════════════════════════
//  Mail versturen vanuit het platform, via Resend.
//
//  ⚠️ ALLEEN SERVER-SIDE. `RESEND_API_KEY` heeft bewust geen NEXT_PUBLIC_
//  ervoor, dus in de browser is die waarde leeg en werkt dit bestand niet.
//  Importeer het dus nooit vanuit een clientcomponent: met een verzendsleutel
//  in handen kan iedereen mail sturen die eruitziet alsof hij van jou komt.
//
//  Geen npm-pakket voor Resend: het is één HTTP-aanroep en de rest van het
//  platform praat ook rechtstreeks met Anthropic. Eén afhankelijkheid minder
//  om bij te houden.
//
//  Welke mails er zijn en waarom, staat in docs/plan-mail.md.
// ════════════════════════════════════════════════════════════════════════

/* De afzender. Het adres moet op het geverifieerde domein liggen (avinka.nl),
   de naam is wat mensen in hun inbox zien staan. */
export const AFZENDER = "Avinka <no-reply@avinka.nl>";

/* Waar een antwoord heen gaat als een mail er een verdient. no-reply is voor
   berichten waar niets op te antwoorden valt; bij de abonnementsmail hoort
   juist wél een echt adres (zie docs/plan-mail.md). */
export const SUPPORT = "support@avinka.nl";

export type MailAntwoord = { ok: true; id: string } | { ok: false; melding: string };

type MailOpdracht = {
  naar: string;
  onderwerp: string;
  /* De platte tekst. VERPLICHT, en niet als bijzaak: een mail die alleen uit
     HTML bestaat scoort slechter bij spamfilters, en sommige mensen lezen
     bewust in platte tekst. */
  tekst: string;
  /* De opgemaakte versie. Laat je 'm weg, dan gaat alleen de tekst mee — dat
     is voor een korte bevestiging vaak beter dan een opgetuigde mail. */
  html?: string;
  antwoordAan?: string;
};

export async function verstuurMail(opdracht: MailOpdracht): Promise<MailAntwoord> {
  const sleutel = process.env.RESEND_API_KEY;
  if (!sleutel) {
    // Bewust een duidelijke melding en geen stilte: een mail die niet verstuurd
    // wordt omdat een instelling ontbreekt, is precies het soort fout dat je
    // pas weken later ontdekt.
    return { ok: false, melding: "RESEND_API_KEY ontbreekt, er is niets verstuurd." };
  }

  let resp: Response;
  try {
    resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sleutel}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: AFZENDER,
        to: [opdracht.naar],
        subject: opdracht.onderwerp,
        text: opdracht.tekst,
        ...(opdracht.html ? { html: opdracht.html } : {}),
        ...(opdracht.antwoordAan ? { reply_to: opdracht.antwoordAan } : {}),
      }),
    });
  } catch {
    return { ok: false, melding: "Geen verbinding met de verzenddienst." };
  }

  if (!resp.ok) {
    // De foutmelding van Resend meenemen: die zegt bijvoorbeeld dat het domein
    // nog niet geverifieerd is, en dat wil je letterlijk kunnen lezen.
    let reden = `status ${resp.status}`;
    try {
      const e = await resp.json();
      if (e?.message) reden = String(e.message);
    } catch {
      /* geen json terug */
    }
    return { ok: false, melding: `Versturen mislukt: ${reden}` };
  }

  try {
    const data = await resp.json();
    return { ok: true, id: String(data?.id ?? "") };
  } catch {
    // Verstuurd, maar we konden het kenmerk niet lezen. Niet als fout melden:
    // de mail is de deur uit en een tweede poging zou 'm dubbel sturen.
    return { ok: true, id: "" };
  }
}

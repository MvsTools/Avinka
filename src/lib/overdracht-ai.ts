// Het AI-knopje bij de overdracht aan je collega's: "Netter maken".
//
// Je typt losse steekwoorden, de AI maakt er één leesbaar bericht van. Meer
// niet. De AI voegt geen enkel feit toe.
//
// ⚠️ Er heeft hier ook een knop "Begin voor mij" gezeten die een concept
// schreef uit het rooster, de agenda en de gedeelde taken. Die is er bewust
// weer uit gehaald, en de reden is het onthouden waard: ALLES wat het platform
// weet, kan je collega zelf opzoeken. Een overdracht gaat juist over wat er
// níét in staat — wat er anders liep, wie aandacht nodig had, wat een ouder
// zei. Een concept uit systeemgegevens leest daardoor altijd als vulling.
//
// Daarna is nog een tussenvorm geprobeerd (aantikbare kopjes onder het veld)
// en ook die is eruit: die typ je zelf net zo snel. Wat overblijft is het
// enige stuk werk dat een model hier echt uit handen neemt.
//
// Alles gaat eerst door de gedeelde maskeerlaag (zie ai-maskering.ts), dus
// voornamen van kinderen en de schoolnaam verlaten het apparaat niet.

import { haalMaskering } from "@/lib/ai-maskering";

// Een korte, taalkundige klus. Zelfde keuze als bij Oudercontact: hier hoeft
// geen zwaar model op. Draaien de betalingen live, dan zet de server alsnog het
// model van het pakket (zie lib/abonnement.ts).
const MODEL = "claude-sonnet-4-6";

const SYSTEEM = `Je helpt een leerkracht in het Nederlandse basisonderwijs met de overdracht aan de
collega's waarmee hij of zij deze groep deelt. Het bericht komt in een berichtenscherm
op het startscherm van die collega's.

De leerkracht heeft losse steekwoorden getypt. Maak daar één helder bericht van.

Regels:
- Gebruik alleen wat de leerkracht heeft opgeschreven. Verzin er niets bij: geen namen,
  geen tijden, geen gebeurtenissen, geen afloop.
- Snap je een steekwoord niet, neem het dan over zoals het er staat in plaats van te gokken.
- Heeft de leerkracht zelf een indeling gebruikt (kopjes, streepjes, regels onder
  elkaar), houd die dan aan. Zo niet, schrijf dan lopende tekst en verzin er geen
  opsomming bij.
- Schrijf in het Nederlands, in hele zinnen, hooguit vier zinnen per onderdeel.
- Geen aanhef en geen afsluiting: het staat al in een berichtenscherm met een naam erboven.
- Zakelijk vriendelijk, zoals collega's onder elkaar. Geen uitroeptekens, geen emoji.
- Neem geen medische gegevens, diagnoses of gezinssituaties op. Staat zoiets in de
  invoer, beschrijf dan alleen het gedrag dat je ziet, zonder etiket.
- Antwoord met alleen het bericht zelf: geen inleiding, geen aanhalingstekens,
  geen uitleg over wat je hebt gedaan.`;

export type AiAntwoord = { ok: true; tekst: string } | { ok: false; melding: string };

/** Van steekwoorden naar een leesbaar bericht. */
export async function maakNetter(getypt: string): Promise<AiAntwoord> {
  const mask = await haalMaskering();
  if (!mask) {
    return {
      ok: false,
      melding:
        "De privacycontrole kon niet laden, dus er is niets verstuurd. Ververs de pagina en probeer het opnieuw.",
    };
  }

  let resp: Response;
  try {
    resp = await fetch("/api/claude", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Zodat het verbruik in het admin-overzicht bij "overdracht" landt en
        // niet als onbekend. De route leest dit; anders kijkt hij naar de
        // Referer, en die wijst hier naar /dashboard.
        "x-avinka-tool": "overdracht",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: mask.apply(SYSTEEM),
        messages: [
          { role: "user", content: mask.apply(`Wat de leerkracht typte:\n${getypt}`) },
        ],
      }),
    });
  } catch {
    return { ok: false, melding: "Geen verbinding met de server. Probeer het zo nog eens." };
  }

  if (!resp.ok) {
    let melding = "Het lukte niet om je tekst uit te werken. Probeer het zo nog eens.";
    if (resp.status === 402) {
      // Het kostenplafond van dit account. De server schrijft zelf de tekst.
      try {
        const e = await resp.json();
        melding = e?.error?.message || "Je AI-tegoed voor deze maand is op.";
      } catch {
        melding = "Je AI-tegoed voor deze maand is op.";
      }
    } else if (resp.status === 429) {
      melding = "Het is even druk. Probeer het over een minuutje opnieuw.";
    } else if (resp.status === 529) {
      melding = "De AI is tijdelijk overbelast. Probeer het zo opnieuw.";
    }
    return { ok: false, melding };
  }

  let tekst = "";
  try {
    const data = await resp.json();
    tekst = (data?.content ?? [])
      .map((b: { text?: string }) => b.text ?? "")
      .join("")
      .trim();
  } catch {
    return { ok: false, melding: "Het antwoord kwam niet goed door. Probeer het zo nog eens." };
  }

  // Modellen zetten er soms toch aanhalingstekens omheen.
  if (tekst.length > 1 && tekst.startsWith('"') && tekst.endsWith('"')) {
    tekst = tekst.slice(1, -1).trim();
  }
  if (!tekst) {
    return { ok: false, melding: "Er kwam geen tekst terug. Probeer het zo nog eens." };
  }

  return { ok: true, tekst: mask.restore(tekst) };
}

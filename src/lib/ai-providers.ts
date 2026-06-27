// ════════════════════════════════════════════════════════════════════════
//  AI-aanbieders — het "stopcontact" voor de AI achter de tools.
//
//  Vandaag is er één aanbieder: Anthropic (Claude). Die werkt EXACT zoals
//  voorheen — het verzoek gaat ongewijzigd door (zodat prompt-caching blijft
//  werken) en het antwoord komt ongewijzigd terug.
//
//  Wil je er straks een andere AI bij (Mistral, OpenAI/Azure, Gemini)? Dan
//  schrijf je hieronder één blok bij (zie het SJABLOON onderaan), zet je de
//  sleutel in .env, en wijs je accounts toe via de kolom `instellingen.ai_provider`.
//  De route (/api/claude) en alle tools hoeven NIET te veranderen.
//
//  Let op: een nieuwe aanbieder is geen kwestie van "alleen een sleutel". Je
//  vult twee dingen in — hoe je zijn VERZOEK opbouwt en hoe je zijn ANTWOORD
//  terugvertaalt naar het Anthropic-berichtformaat dat de tools verwachten —
//  en je test de tools erop. Dit bestand maakt dat een afgebakend klusje op
//  één plek, in plaats van iets dat door het hele platform heen zit.
// ════════════════════════════════════════════════════════════════════════

// Gebruiksmetadata zoals de kostenlogging die verwacht (zie /api/claude).
export type GenormaliseerdVerbruik = {
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
};

export type AiAanbieder = {
  id: string;
  // Naam van de omgevingsvariabele met de geheime sleutel (in .env).
  envSleutel: string;
  // Bouwt de upstream-aanroep op uit de binnenkomende body (zoals de tool die
  // stuurt) en de sleutel. Geeft adres, headers en body terug.
  bouwVerzoek(body: unknown, sleutel: string): {
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  // Vertaalt het ruwe antwoord van de aanbieder naar het formaat dat de tools
  // verwachten (= het Anthropic-berichtformaat). Voor Anthropic is dit
  // niets-doen; een andere aanbieder zet hier zijn antwoord om.
  vertaalAntwoord(ruweTekst: string): string;
  // Haalt de gebruiksmetadata (tokens) uit het ruwe antwoord voor de
  // kostenlogging. Null als er niets te loggen valt.
  leesVerbruik(ruweTekst: string): GenormaliseerdVerbruik | null;
};

// ── Anthropic (Claude) ─────────────────────────────────────────────────────
// Exact het gedrag van vóór de aanbieder-laag: body ongewijzigd doorsturen,
// antwoord ongewijzigd teruggeven, tokens uit `usage` lezen.
const anthropic: AiAanbieder = {
  id: "anthropic",
  envSleutel: "ANTHROPIC_API_KEY",
  bouwVerzoek(body, sleutel) {
    return {
      url: "https://api.anthropic.com/v1/messages",
      headers: {
        "content-type": "application/json",
        "x-api-key": sleutel,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    };
  },
  vertaalAntwoord(ruweTekst) {
    return ruweTekst; // al in het juiste formaat — niets te vertalen
  },
  leesVerbruik(ruweTekst) {
    try {
      const parsed = JSON.parse(ruweTekst) as {
        model?: string;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          cache_creation_input_tokens?: number;
          cache_read_input_tokens?: number;
        };
      };
      const u = parsed?.usage;
      if (!u) return null;
      return {
        model: parsed?.model ?? null,
        input_tokens: u.input_tokens ?? 0,
        output_tokens: u.output_tokens ?? 0,
        cache_creation_tokens: u.cache_creation_input_tokens ?? 0,
        cache_read_tokens: u.cache_read_input_tokens ?? 0,
      };
    } catch {
      return null;
    }
  },
};

// ── Het register van aanbieders ────────────────────────────────────────────
// Nieuwe aanbieder hier registreren nadat je het blok hebt geschreven.
const AANBIEDERS: Record<string, AiAanbieder> = {
  anthropic,
  // mistral,   ← zie het SJABLOON onderaan
};

export const STANDAARD_AANBIEDER = "anthropic";

// Geeft de aanbieder bij een id; valt terug op de standaard (Claude) als het
// id leeg of onbekend is. Zo kan een verkeerde/lege waarde nooit iets breken.
export function aanbiederById(id: string | null | undefined): AiAanbieder {
  return (id && AANBIEDERS[id]) || AANBIEDERS[STANDAARD_AANBIEDER];
}

// Welke aanbieder hoort bij deze gebruiker? Geef de waarde van de kolom
// `instellingen.ai_provider` door. Leeg/onbekend → Claude. Vandaag staat die
// kolom voor iedereen leeg, dus iedereen krijgt Claude en er verandert niets.
export function aanbiederVoor(aiProviderKolom: string | null | undefined): AiAanbieder {
  return aanbiederById(aiProviderKolom);
}

// ════════════════════════════════════════════════════════════════════════
//  SJABLOON — een nieuwe aanbieder toevoegen (voorbeeld: Mistral)
//
//  1) Vul het blok hieronder in en haal het uit commentaar.
//  2) Zet MISTRAL_API_KEY in .env.
//  3) Registreer hem in AANBIEDERS (regel hierboven uit commentaar halen).
//  4) Wijs een account toe:  update instellingen set ai_provider='mistral'
//                            where user_id='...';
//  5) TEST de tools op dit model voordat je een school erop zet.
//
//  const mistral: AiAanbieder = {
//    id: "mistral",
//    envSleutel: "MISTRAL_API_KEY",
//    bouwVerzoek(body, sleutel) {
//      // Zet HIER de binnenkomende (Anthropic-vormige) body om naar het
//      // formaat van Mistral (system/messages, model-id, max_tokens, ...).
//      return {
//        url: "https://api.mistral.ai/v1/chat/completions",
//        headers: {
//          "content-type": "application/json",
//          authorization: `Bearer ${sleutel}`,
//        },
//        body: JSON.stringify(/* omgezette body */ body),
//      };
//    },
//    vertaalAntwoord(ruweTekst) {
//      // Zet HIER het Mistral-antwoord om naar het Anthropic-berichtformaat
//      // dat de tools verwachten: { content: [{ type:"text", text:"..." }] }.
//      return ruweTekst;
//    },
//    leesVerbruik(ruweTekst) {
//      // Lees HIER de tokens uit Mistral's `usage` (prompt_tokens /
//      // completion_tokens) en map ze op GenormaliseerdVerbruik.
//      return null;
//    },
//  };
// ════════════════════════════════════════════════════════════════════════

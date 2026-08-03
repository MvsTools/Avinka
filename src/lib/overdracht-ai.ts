// Het AI-knopje bij de overdracht aan je collega's.
//
// Twee situaties, één knop:
//   • je hebt iets getypt  → "Netter maken": van steekwoorden naar een bericht.
//   • het veld is leeg     → "Begin voor mij": een concept uit wat het platform
//                             van vandaag al weet (rooster en agenda).
//
// De verdeling is dezelfde als in de tools: de CODE verzamelt de feiten en
// bewaakt wat er wel en niet in mag, de AI levert alleen de taal. Daarom staat
// bij "Begin voor mij" letterlijk in de prompt dat er niets bij verzonnen mag
// worden — alles wat de AI mag noemen, staat in de regels die hieronder worden
// opgebouwd.
//
// Alles gaat eerst door de gedeelde maskeerlaag (zie ai-maskering.ts), dus
// voornamen van kinderen en de schoolnaam verlaten het apparaat niet.

import {
  dagbeeld,
  dagnaam,
  kort,
  plus,
  type PlanItem,
  type PlanningBron,
  type Soort,
} from "@/lib/planning";
import { haalMaskering } from "@/lib/ai-maskering";

// Een korte, taalkundige klus. Zelfde keuze als bij Oudercontact: hier hoeft
// geen zwaar model op. Draaien de betalingen live, dan zet de server alsnog het
// model van het pakket (zie lib/abonnement.ts).
const MODEL = "claude-sonnet-4-6";

const GEDEELD = `Je helpt een leerkracht in het Nederlandse basisonderwijs met de overdracht aan de
collega's waarmee hij of zij deze groep deelt. Het bericht komt in een berichtenscherm
op het startscherm van die collega's.

Vaste regels:
- Schrijf in het Nederlands, in hele zinnen, hooguit vier zinnen.
- Geen aanhef en geen afsluiting: het staat al in een berichtenscherm met een naam erboven.
- Zakelijk vriendelijk, zoals collega's onder elkaar. Geen uitroeptekens, geen emoji.
- Neem geen medische gegevens, diagnoses of gezinssituaties op. Staat zoiets in de
  gegevens, beschrijf dan alleen het gedrag dat je ziet, zonder etiket.
- Antwoord met alleen het bericht zelf: geen inleiding, geen aanhalingstekens,
  geen uitleg over wat je hebt gedaan.`;

const SYSTEEM_NETTER = `${GEDEELD}

De leerkracht heeft losse steekwoorden getypt. Maak daar één helder bericht van.
- Gebruik alleen wat de leerkracht heeft opgeschreven. Verzin er niets bij: geen namen,
  geen tijden, geen gebeurtenissen, geen afloop.
- Snap je een steekwoord niet, neem het dan over zoals het er staat in plaats van te gokken.
- Maak er geen opsomming met streepjes van, tenzij de leerkracht dat zelf zo deed.`;

const SYSTEEM_CONCEPT = `${GEDEELD}

Je krijgt de feiten van vandaag uit het platform. Maak daar een begin van een overdracht
van, dat de leerkracht daarna zelf aanvult.
- Gebruik alleen de feiten die je krijgt. Voeg niets toe: geen gebeurtenissen, geen
  oordelen, geen namen van kinderen, geen bijzonderheden die er niet staan.
- Schrijf nooit alsof je weet hoe de dag is verlopen. Je weet wat er gepland stond,
  meer niet.
- Laat weg wat een collega toch al weet. Meld dus nooit dat er een studiedag,
  een vakantie, een vergadering of een schoolactiviteit is: dat staat in de
  schoolagenda en weet je collega van school zelf.
- Staat er een toets, een oudergesprek of een rapportmoment tussen, begin daarmee.
  Daar hangt gedeeld werk aan; het gewone rooster komt daarna en mag kort.
- Wat morgen komt zet je aan het eind.`;

// ── De feiten van vandaag (gewone code, geen AI) ──────────────────────────

export type Dagfeiten = {
  /** De regels die als invoer naar de AI gaan. */
  regels: string[];
  /** Waar als er niets te melden valt; dan bellen we de AI niet eens. */
  leeg: boolean;
};

// De agenda weet al wat vóór soort afspraak iets is (zie agenda-herken.ts:
// "cito" en "dictee" worden een toets, "spreekavond" en "10 minuten" een
// gesprek, "studiedag" een dag zonder les).
//
// ⚠️ Maar we noemen ze niet allemaal. Een studiedag, een vergadering, een
// schoolreis of de schoolfotograaf staat in de schoolagenda en weet je collega
// dus toch al: dat in een overdracht zetten is vulling. Wat overblijft zijn de
// drie soorten waar GEDEELD WERK aan vastzit, en waar dus altijd een vervolg
// bij hoort: een toets moet nagekeken, een oudergesprek teruggekoppeld, een
// rapport samen geschreven. Op deze volgorde, belangrijkste eerst.
const AGENDA_VOLGORDE: Soort[] = ["toets", "gesprek", "rapport"];

const AGENDA_LABEL: Partial<Record<Soort, string>> = {
  toets: "Toets",
  gesprek: "Gesprekken met ouders",
  rapport: "Rapporten",
};

/** Eén afspraak als tekst. De tijd alleen waar hij iets toevoegt. */
function noem(item: PlanItem, metTijd: boolean): string {
  return metTijd && !item.heleDag && item.begin ? `${item.begin} ${item.titel}` : item.titel;
}

/** Per soort één regel, op volgorde van belang. Hooguit vijf per soort. */
function agendaRegels(items: PlanItem[], wanneer: string, metTijd: boolean): string[] {
  return AGENDA_VOLGORDE.flatMap((soort) => {
    const groep = items.filter((i) => i.soort === soort).slice(0, 5);
    if (!groep.length) return [];
    return [
      `${AGENDA_LABEL[soort]} ${wanneer}: ${groep.map((i) => noem(i, metTijd)).join(", ")}.`,
    ];
  });
}

// ⚠️ De gedeelde takenlijst zit hier BEWUST niet in. Die staat al op Start, met
// afvinken en een naam erbij, dus je collega ziet hem gewoon. En een bericht is
// een momentopname die 30 dagen blijft staan terwijl die lijst leeft: vink je
// een taak vanavond af, dan zegt de overdracht morgen nog dat hij openstaat.
// De naam van de groep staat hier bewust niet bij: het bericht komt in het
// gesprek van díé groep terecht, dus je collega weet dat al. Bovendien leverde
// het "groep Groep 6A" op zodra iemand zijn klas zelf "Groep 6" noemt.
export function feitenVanVandaag(bron: PlanningBron, vandaag: string): Dagfeiten {
  const beeld = dagbeeld(bron, vandaag);
  const regels: string[] = [`Vandaag is het ${dagnaam(vandaag)} ${kort(vandaag)}.`];

  // Pauzes en de eigen tijd ná schooltijd laten we weg: dat is geen nieuws voor
  // een collega, en het maakt het bericht alleen langer.
  const lessen = beeld.vrij
    ? []
    : beeld.blokken.filter((b) => b.soort === "les" && b.vak !== "pauze").slice(0, 12);
  const afspraken = beeld.items.filter((i) => i.soort !== "vakantie");

  const morgen = plus(vandaag, 1);
  const morgenItems = dagbeeld(bron, morgen).items.filter((i) => i.soort !== "vakantie");

  if (beeld.vrij) {
    // Wel zeggen dát er geen les was, niet waarom. Anders schrijft de AI over
    // lessen die er niet waren; en de reden (studiedag, vakantie) kent je
    // collega van school zelf.
    regels.push("Vandaag was er geen les.");
  } else if (lessen.length) {
    regels.push(
      "Op het rooster stond vandaag: " +
        lessen
          .map((b) => {
            const notitie = b.omschrijving?.trim();
            return `${b.begin} ${b.naam}${notitie ? ` (aantekening: ${notitie})` : ""}`;
          })
          .join(", ") +
        ".",
    );
  }

  const vandaagRegels = agendaRegels(afspraken, "vandaag", true);
  const morgenRegels = agendaRegels(morgenItems, `morgen (${dagnaam(morgen)})`, false);
  regels.push(...vandaagRegels, ...morgenRegels);

  // De eerste regel is alleen context. Staat er verder niets, dan valt er niets
  // te schrijven en zou de AI het gat gaan vullen.
  const leeg = !lessen.length && !vandaagRegels.length && !morgenRegels.length;
  return { regels, leeg };
}

// ── De aanroep ────────────────────────────────────────────────────────────

export type AiAntwoord = { ok: true; tekst: string } | { ok: false; melding: string };

async function roep(systeem: string, invoer: string): Promise<AiAntwoord> {
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
        system: mask.apply(systeem),
        messages: [{ role: "user", content: mask.apply(invoer) }],
      }),
    });
  } catch {
    return { ok: false, melding: "Geen verbinding met de server. Probeer het zo nog eens." };
  }

  if (!resp.ok) {
    let melding = "Het lukte niet om een voorstel te maken. Probeer het zo nog eens.";
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

/** Van steekwoorden naar een leesbaar bericht. */
export function maakNetter(getypt: string): Promise<AiAntwoord> {
  return roep(SYSTEEM_NETTER, `Wat de leerkracht typte:\n${getypt}`);
}

/** Een concept uit de feiten van vandaag. */
export function maakConcept(feiten: Dagfeiten): Promise<AiAntwoord> {
  return roep(SYSTEEM_CONCEPT, `De feiten van vandaag:\n- ${feiten.regels.join("\n- ")}`);
}

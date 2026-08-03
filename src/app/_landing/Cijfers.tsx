"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Confetti, DONKER, KOP, schaduw } from "./Wereld";

/* ── "Samen teruggewonnen": het klapbord ────────────────────────────────────
   De cijfers van de hele gemeenschap, als één apparaat op het papier tussen
   de ervaringen en de prijzen. Daar staat het omdat de polaroids het zachte
   bewijs zijn (wat mensen zéggen) en dit het harde (wat er gemeten is); samen
   vormen ze het bewijsblok vlak voor het moment dat iemand naar de prijs kijkt.

   WAAROM EEN KLAPBORD EN GEEN CIJFERBLOKJES
   Een rij "groot getal, klein label" is het meest versleten patroon van het
   web, en het staat niet voor niets op de verboden lijst in DESIGN.md. Het
   probleem is niet alleen dat het saai is: een getal dat bij het inscrollen
   van 0 naar 171 telt, leest als marketing. Bij een klapbord is de beweging
   zelf het bewijs dat er íets veranderd is, want een klep valt alleen als er
   echt een dag bij komt.

   DE EENHEID IS DE SCHOOLDAG
   Niet het uur. Uren zijn abstract; een schooldag kan elke leerkracht zich
   voorstellen. Dat is hetzelfde mechaniek waarmee Ecosia zaadjes telt in
   plaats van zoekopdrachten en The Ocean Cleanup vrachtwagenladingen in
   plaats van kilo's: eerst kiezen wát je telt in dingen, dan pas het getal.

   EERLIJKHEID
   Er staat hier nooit een verzonnen of pijnlijk laag cijfer. Elke regel heeft
   zijn eigen drempel (DREMPELS hieronder) en verschijnt pas als hij gehaald
   is; is de bovenste regel niet gehaald, dan blijft de hele sectie weg. Zo
   groeit het bord mee in plaats van dat het ooit verbouwd moet worden.
   ────────────────────────────────────────────────────────────────────────── */

/* Eén schooldag is 7,5 uur. Dat staat ook zichtbaar onder het bord: een
   teller zonder bronvermelding is een claim, met bronvermelding een cijfer. */
export const UUR_PER_SCHOOLDAG = 7.5;

/* Per regel de ondergrens waaronder we hem niet laten zien. Bewust aan de
   voorzichtige kant: liever een bord met één regel dan een regel waar
   "3 leerkrachten" op staat. Deze getallen mogen opgeschroefd worden zodra
   de proefgroep groter is. */
const DREMPELS = { dagen: 20, leerkrachten: 15, uitwerkingen: 250 };

export type Cijfers = {
  /* werkelijk bespaarde minuten over alle gebruikers heen */
  minuten: number;
  leerkrachten: number;
  uitwerkingen: number;
};

export function schooldagenUit(minuten: number) {
  return Math.floor(minuten / 60 / UUR_PER_SCHOOLDAG);
}

/* ── Eén kaartje van het bord ────────────────────────────────────────────── */

const KLEP_MS = 540;

function halfCijfer(onder: boolean): CSSProperties {
  /* Het cijfer staat op regelhoogte van de héle kaart; het onderste vlak
     schuift de tekst een halve kaart omhoog. Zo valt de knip precies op de
     naad, ook als de kaart meeschaalt met het scherm. */
  return { lineHeight: "var(--kh)", marginTop: onder ? "calc(var(--kh) / -2)" : 0 };
}

/* De naad met zijn scharnier. 🔑 De pennetjes links en rechts zijn wat het
   verschil maakt tussen "twee kaartjes" en "een mechaniek": zonder die pennen
   ziet een klapbord eruit als een kaart met een streep erdoor. Ze steken
   bewust een paar pixels buiten de kaart uit. */
function Naad() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px bg-[rgba(var(--w-schaduw-rgb,23,80,58),0.18)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 mt-px h-px bg-white/70" />
      <span className="cb-pen pointer-events-none absolute -left-[3px] top-1/2 z-30" />
      <span className="cb-pen pointer-events-none absolute -right-[3px] top-1/2 z-30" />
    </>
  );
}

function KlapKaart({ cijfer }: { cijfer: string }) {
  const [staat, setStaat] = useState({ toont: cijfer, vorig: cijfer, klapt: false, beurt: 0 });

  /* 🔑 De omslag wordt hier tijdens het RENDEREN bijgesteld, niet in een
     effect. React ondersteunt dat expliciet voor "state aanpassen als een prop
     verandert": het rendert direct opnieuw zonder de tussenstand vast te
     leggen. Deed ik het in een effect, dan kreeg elke omslag een extra
     renderronde bovenop, en dat is precies wat de regel
     react-hooks/set-state-in-effect afvangt. */
  if (staat.toont !== cijfer) {
    /* Bij prefers-reduced-motion wisselt het cijfer gewoon, zonder klep. De
       inhoud blijft dus volledig; alleen het mechaniek valt weg. */
    const stil =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStaat({ toont: cijfer, vorig: staat.toont, klapt: !stil, beurt: staat.beurt + 1 });
  }

  /* De klep opruimen. `beurt` staat in de afhankelijkheden zodat een tweede
     omslag die binnenkomt terwijl de eerste nog valt zijn eigen volle tijd
     krijgt, in plaats van te worden afgekapt door de timer van de vorige. */
  const { toont: getoond, vorig, klapt, beurt } = staat;
  useEffect(() => {
    if (!klapt) return;
    const t = setTimeout(() => setStaat((s) => ({ ...s, klapt: false })), KLEP_MS);
    return () => clearTimeout(t);
  }, [klapt, beurt]);

  const vlak =
    "cb-vlak absolute inset-x-0 overflow-hidden text-center font-display font-black tabular-nums";

  return (
    <div className="cb-kaart relative select-none" style={{ perspective: "700px" }}>
      {/* Onderhelft. ⚠️ Tijdens het klappen staat hier nog het OUDE cijfer: op
         een echt klapbord komt de nieuwe onderhelft pas tevoorschijn als de
         klep is neergevallen. Zet je hier meteen de nieuwe waarde, dan lees je
         het complete nieuwe getal al terwijl het oude nog valt. */}
      <div className={`${vlak} bottom-0 top-1/2 rounded-b-[10px]`}>
        <span style={halfCijfer(true)} className="block">
          {klapt ? vorig : getoond}
        </span>
      </div>
      {/* Bovenhelft: de nieuwe waarde staat hier al klaar, afgedekt door de
         vallende klep, zodat hij eronder vandaan komt in plaats van te
         wisselen. */}
      <div className={`${vlak} bottom-1/2 top-0 rounded-t-[10px]`}>
        <span style={halfCijfer(false)} className="block">
          {getoond}
        </span>
      </div>

      {klapt && (
        <>
          <div
            className={`${vlak} cb-val bottom-1/2 top-0 rounded-t-[10px]`}
            style={{ transformOrigin: "bottom center" }}
          >
            <span style={halfCijfer(false)} className="block">
              {vorig}
            </span>
          </div>
          <div
            className={`${vlak} cb-vang bottom-0 top-1/2 rounded-b-[10px]`}
            style={{ transformOrigin: "top center" }}
          >
            <span style={halfCijfer(true)} className="block">
              {getoond}
            </span>
          </div>
        </>
      )}

      <Naad />
    </div>
  );
}

/* ── Eén regel van het bord ──────────────────────────────────────────────── */

function Regel({ waarde, label, klein }: { waarde: number; label: string; klein?: boolean }) {
  /* De cijfers krijgen een sleutel op hun POSITIE VAN RECHTS. Doe je dat op
     de positie van links, dan verspringt bij 99 → 100 elke kaart een plek en
     klapt het hele bord om in plaats van alleen het laatste cijfer. */
  const cijfers = String(waarde).split("");
  const n = cijfers.length;

  return (
    <>
      {/* Op een smal scherm staat het label ONDER de cijfers. Ernaast paste
         het niet: "schooldagen teruggewonnen" liep dan tot voorbij de
         schermrand. Daarom lijnen de cijfers op mobiel links uit en pas vanaf
         sm rechts, waar ze samen met de labels de twee kolommen van het bord
         vormen. */}
      {/* ⚠️ aria-hidden op het hele bord, en dat is geen luiheid maar een
         reparatie. Elke kaart bevat het cijfer TWEE keer (een boven- en een
         onderhelft, plus tijdens het klappen nog eens twee kleppen), dus een
         schermlezer las "1 1 7 7 1 1 schooldagen teruggewonnen". Dat is met
         kijken niet te zien; het kwam pas boven water bij het uitlezen van de
         voorgelezen tekst. Het echte getal staat nu één keer, onzichtbaar,
         vóór het label. */}
      <div
        aria-hidden
        className={`flex items-stretch gap-[5px] justify-self-start sm:justify-self-end ${
          klein ? "cb-klein" : ""
        }`}
      >
        {cijfers.map((c, i) => (
          <KlapKaart key={n - i} cijfer={c} />
        ))}
      </div>
      <span
        className={`mb-4 self-center font-display font-black leading-tight tracking-tight sm:mb-0 ${
          klein ? "cb-klein" : ""
        }`}
        /* ⚠️ De kleine labels stonden op 75% dekking om ze te laten wijken
           voor de bovenste regel. Dat drukte het contrast naar ongeveer 3,6:1
           bij een letter van net geen 19px, en dan geldt de eis van 4,5:1 nog.
           Het verschil in gewicht komt nu alleen uit de maat en de kleur, niet
           uit doorzichtigheid. */
        style={{ color: klein ? KOP : DONKER, fontSize: "calc(var(--kh) * 0.27)" }}
      >
        <span className="sr-only">{waarde.toLocaleString("nl-NL")} </span>
        {label}
      </span>
    </>
  );
}

/* ── De sectie ───────────────────────────────────────────────────────────── */

export function WereldCijfers({ cijfers }: { cijfers: Cijfers | null }) {
  if (!cijfers) return null;

  const dagen = schooldagenUit(cijfers.minuten);
  /* Haalt de bovenste regel het niet, dan is er nog niets te vertellen en
     blijft de hele sectie weg. Geen lege kop, geen nul. */
  if (dagen < DREMPELS.dagen) return null;

  const toonLeerkrachten = cijfers.leerkrachten >= DREMPELS.leerkrachten;
  const toonUitwerkingen = cijfers.uitwerkingen >= DREMPELS.uitwerkingen;

  return (
    <section className="relative overflow-x-clip">
      {/* ⚠️ Hier heeft een achtergrondvlak gestaan, zoals bijna elke sectie er
         een heeft. Eruit gehaald na het bekijken: de rand van dat vlak liep
         precies achter de grote cijfers langs en sneed het bord doormidden.
         Dezelfde afweging als bij de tools-galerij, waar de drie verf-klodders
         zijn weggehaald: het bord is zelf het beeldelement van deze sectie, en
         een vorm erachter concurreert ermee in plaats van hem te dragen.
         De vlakken van de secties erboven en eronder lopen hier al door, dus
         er valt geen gat in het achtergrondweefsel. */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-4 lg:pb-28">
        <Confetti punten={[{ x: "94%", y: "26%", r: 4, amber: true }]} />

        <h2
          data-reveal
          className="font-display text-[clamp(1.875rem,3.4vw,2.75rem)] font-black tracking-tight"
          style={{ color: DONKER }}
        >
          Samen teruggewonnen
        </h2>

        {/* Het bord. Twee kolommen: de cijfers rechts uitgelijnd, de woorden
           links. Daardoor beginnen alle labels op dezelfde lijn en leest het
           als één bord met regels, in plaats van als losse getallen met
           losse bijschriften. */}
        <div
          data-reveal
          className="cb-bord mt-10 grid w-fit grid-cols-1 items-center gap-y-2 sm:grid-cols-[auto_auto] sm:gap-x-6 sm:gap-y-3"
        >
          <Regel waarde={dagen} label="schooldagen teruggewonnen" />
          {toonLeerkrachten && (
            <Regel klein waarde={cijfers.leerkrachten} label="leerkrachten" />
          )}
          {toonUitwerkingen && (
            <Regel klein waarde={cijfers.uitwerkingen} label="uitwerkingen gemaakt" />
          )}
        </div>

        {/* Bronvermelding. Elke geloofwaardige teller die we bekeken hebben
           heeft er een: een getal zonder herkomst is een claim. */}
        <p data-reveal className="mt-8 max-w-xl text-base leading-7 text-ink/65">
          Opgeteld uit de tijd die de tools werkelijk bespaarden, omgerekend naar
          schooldagen van {String(UUR_PER_SCHOOLDAG).replace(".", ",")} uur. Het bord loopt bij
          terwijl je kijkt.
        </p>
      </div>

      <BordStijl />
    </section>
  );
}

function BordStijl() {
  return (
    <style>{`
      /* ⚠️ --kh hoort op het BORD te staan, niet op de kaart: het woord naast
         de kaarten is een broer van de kaarten, geen kind. Stond de variabele
         op .cb-kaart, dan viel calc(var(--kh) * 0.27) daar stil terug op de
         erfelijke tekstgrootte. */
      /* Het bord stond eerst op 124px en dan besloeg het nog geen halve kolom;
         de rechterhelft van de sectie bleef leeg en dat las als onaf. Op 148px
         loopt bord plus label tot ruim driekwart van de tekstkolom, in
         hetzelfde ritme als de secties eromheen. */
      .cb-bord { --kh: clamp(78px, 11vw, 148px); }
      .cb-klein { --kh: clamp(46px, 6vw, 76px); }

      .cb-kaart {
        --kaart: var(--w-klapkaart, #fffdf8);
        height: var(--kh);
        width: calc(var(--kh) * 0.68);
        border-radius: 12px;
        box-shadow: ${schaduw(16, 30, -14, 0.35)};
      }
      .cb-kaart > div { font-size: calc(var(--kh) * 0.62); color: ${DONKER}; }
      .cb-kaart::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 12px;
        box-shadow: inset 0 0 0 1px rgba(var(--w-schaduw-rgb, 23,80,58),0.07);
        pointer-events: none;
        z-index: 30;
      }
      /* Karton vangt licht. De pagina heeft één lichtbron rechtsboven (zie
         SCHADUW_HELLING in Wereld.tsx), dus het verloop loopt die kant op;
         zonder dit is elke helft één vlakke kleur en leest de kaart als een
         rechthoek in plaats van als materiaal. */
      .cb-vlak {
        background-color: var(--kaart);
        /* Bewust licht en schaduw over de kaartkleur heen, geen tweede en
           derde kartontint: anders sluipen er kleuren het systeem in die
           nergens gedefinieerd zijn en die bij een thema niet meebewegen. */
        background-image: linear-gradient(
          158deg,
          rgba(255,255,255,0.75) 0%,
          rgba(255,255,255,0) 52%,
          rgba(var(--w-schaduw-rgb, 23,80,58), 0.05) 100%
        );
      }
      .cb-pen {
        width: 6px;
        height: 6px;
        margin-top: -3px;
        border-radius: 9999px;
        background: rgba(var(--w-schaduw-rgb, 23,80,58), 0.28);
        /* Het witte randje bovenin het pennetje is een lichtreflectie, geen
           merkkleur: het hoort bij dezelfde lichtbron rechtsboven als alle
           schaduwen op deze pagina. Daarom staat het niet in DESIGN.md en
           hoort het daar ook niet in. */
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
      }

      .cb-val {
        z-index: 25;
        animation: cbVal ${KLEP_MS / 2}ms cubic-bezier(0.45,0.05,0.75,0.4) forwards;
        backface-visibility: hidden;
      }
      .cb-vang {
        z-index: 25;
        animation: cbVang ${KLEP_MS / 2}ms cubic-bezier(0.15,0.6,0.35,1) ${KLEP_MS / 2}ms both;
        backface-visibility: hidden;
      }
      @keyframes cbVal  { from { transform: rotateX(0deg); }  to { transform: rotateX(-90deg); } }
      @keyframes cbVang { from { transform: rotateX(90deg); } to { transform: rotateX(0deg); } }

      /* 🔑 DIT verkoopt de omslag, niet de rotatie zelf. Een vlak dat van het
         licht wegdraait wordt donkerder, een vlak dat eronder vandaan komt
         licht op. Zonder deze twee lagen stond de klep bij het narekenen op
         53 graden en was er op het scherm bijna niets van te zien. */
      .cb-val::before, .cb-vang::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background: rgba(var(--w-schaduw-rgb, 23,80,58), 0.55);
      }
      .cb-val::before {
        animation: cbDonker ${KLEP_MS / 2}ms cubic-bezier(0.45,0.05,0.75,0.4) forwards;
      }
      .cb-vang::before {
        animation: cbLicht ${KLEP_MS / 2}ms cubic-bezier(0.15,0.6,0.35,1) ${KLEP_MS / 2}ms both;
      }
      @keyframes cbDonker { from { opacity: 0; }   to { opacity: 0.5; } }
      @keyframes cbLicht  { from { opacity: 0.5; } to { opacity: 0; } }

      @media (prefers-reduced-motion: reduce) {
        .cb-val, .cb-vang, .cb-val::before, .cb-vang::before { animation: none !important; }
        .cb-val, .cb-vang { display: none; }
      }
    `}</style>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Confetti, DONKER, VLAK_PAPIER, KaartVlak, schaduw } from "./Wereld";

/* ── "Samen teruggewonnen": het klapbord ────────────────────────────────────
   De cijfers van de hele gemeenschap, als één apparaat op het papier tussen
   de ervaringen en de prijzen. Daar staat het omdat de polaroids het zachte
   bewijs zijn (wat mensen zéggen) en dit het harde (wat er gemeten is); samen
   vormen ze het bewijsblok vlak voor het moment dat iemand naar de prijs kijkt.

   WAAROM EEN KLAPBORD EN GEEN CIJFERBLOKJES
   Een rij "groot getal, klein label" is het meest versleten patroon van het
   web en staat niet voor niets op de verboden lijst in DESIGN.md. Het probleem
   is niet alleen dat het saai is: een getal dat bij het inscrollen van 0 naar
   171 telt leest als marketing. Bij een klapbord is de beweging zélf het
   bewijs dat er iets veranderd is, want een klep valt alleen als er echt een
   dag bij komt.

   DE EENHEID IS DE SCHOOLDAG
   Niet het uur. Uren zijn abstract; een schooldag kan elke leerkracht zich
   voorstellen. Hetzelfde mechaniek waarmee Ecosia zaadjes telt in plaats van
   zoekopdrachten en The Ocean Cleanup vrachtwagenladingen in plaats van kilo's.

   ⚠️ DE COMPOSITIE IS HERBOUWD (tweede ronde)
   De eerste versie was drie regels onder elkaar, los op het papier. Dat was
   geen ontwerp maar een lijstje: onnodig hoog, de rechterhelft van de sectie
   bleef leeg, en de kaartjes zweefden zonder dat er een bord omheen zat. Wat
   er nu anders is en waarom:
   - er zit een KAST om de kaarten. Zonder behuizing zijn het losse kaartjes;
     mét behuizing is het een apparaat. Donkergroen, want dan springen de
     crème kleppen eruit, en dat is precies hoe een echt klapbord werkt.
     Donkere objecten zijn al onderdeel van deze pagina: de toolkaarten in de
     galerij zijn ook donker/groen/amber op papier.
   - twee regels in plaats van drie. De twee kleine getallen staan náást
     elkaar op de detailregel, zoals een vertrekbord één hoofdregel heeft en
     daaronder de details. Dat scheelt een derde van de hoogte.
   - de kop staat links, het bord rechts. De sectie gebruikt nu de volle
     breedte in plaats van een halve kolom met leegte ernaast.
   - het label bij het hoofdgetal is "schooldagen", niet "schooldagen
     teruggewonnen": dat woord staat al in de kop tien centimeter hoger.

   EERLIJKHEID
   Er staat hier nooit een verzonnen of pijnlijk laag cijfer. Elke regel heeft
   zijn eigen drempel (DREMPELS hieronder) en verschijnt pas als hij gehaald
   is; is de bovenste regel niet gehaald, dan blijft de hele sectie weg.
   ────────────────────────────────────────────────────────────────────────── */

/* Eén schooldag is 7,5 uur. Dat staat ook zichtbaar bij het bord: een teller
   zonder bronvermelding is een claim, met bronvermelding een cijfer. */
export const UUR_PER_SCHOOLDAG = 7.5;

/* Per regel de ondergrens waaronder we hem niet tonen. Bewust voorzichtig:
   liever een bord met één regel dan een regel waar "3 leerkrachten" op staat.
   Mag omhoog zodra de proefgroep groter is. */
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
   ziet een klapbord eruit als een kaart met een streep erdoor. */
function Naad() {
  return (
    <>
      <div className="cb-naad pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px" />
      <div className="cb-naad-licht pointer-events-none absolute inset-x-0 top-1/2 z-20 mt-px h-px" />
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
     leggen. In een effect kreeg elke omslag een extra renderronde bovenop, en
     dat is precies wat react-hooks/set-state-in-effect afvangt. */
  if (staat.toont !== cijfer) {
    /* Bij prefers-reduced-motion wisselt het cijfer gewoon, zonder klep. De
       inhoud blijft volledig; alleen het mechaniek valt weg. */
    const stil =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStaat({ toont: cijfer, vorig: staat.toont, klapt: !stil, beurt: staat.beurt + 1 });
  }

  /* `beurt` staat in de afhankelijkheden zodat een tweede omslag die binnenkomt
     terwijl de eerste nog valt zijn eigen volle tijd krijgt, in plaats van te
     worden afgekapt door de timer van de vorige. */
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
      <div className={`${vlak} bottom-0 top-1/2 rounded-b-[9px]`}>
        <span style={halfCijfer(true)} className="block">
          {klapt ? vorig : getoond}
        </span>
      </div>
      {/* Bovenhelft: de nieuwe waarde staat hier al klaar, afgedekt door de
         vallende klep, zodat hij eronder vandaan komt in plaats van te
         wisselen. */}
      <div className={`${vlak} bottom-1/2 top-0 rounded-t-[9px]`}>
        <span style={halfCijfer(false)} className="block">
          {getoond}
        </span>
      </div>

      {klapt && (
        <>
          <div
            className={`${vlak} cb-val bottom-1/2 top-0 rounded-t-[9px]`}
            style={{ transformOrigin: "bottom center" }}
          >
            <span style={halfCijfer(false)} className="block">
              {vorig}
            </span>
          </div>
          <div
            className={`${vlak} cb-vang bottom-0 top-1/2 rounded-b-[9px]`}
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

/* ── Eén aflezing: de kaarten plus hun woord ─────────────────────────────── */

function Aflezing({ waarde, label, klein }: { waarde: number; label: string; klein?: boolean }) {
  /* De cijfers krijgen een sleutel op hun POSITIE VAN RECHTS. Doe je dat op de
     positie van links, dan verspringt bij 99 → 100 elke kaart een plek en
     klapt het hele bord om in plaats van alleen het laatste cijfer. */
  const cijfers = String(waarde).split("");
  const n = cijfers.length;

  return (
    <div className={`flex items-center gap-3 ${klein ? "cb-klein" : ""}`}>
      {/* ⚠️ aria-hidden op de kaarten, en dat is een reparatie geen luiheid.
         Elke kaart bevat het cijfer TWEE keer (boven- en onderhelft, plus
         tijdens het klappen nog twee kleppen), dus een schermlezer las
         "1 1 7 7 1 1 schooldagen". Dat is met kijken niet te zien; het kwam
         boven water bij het uitlezen van de toegankelijkheidsboom. Het echte
         getal staat nu één keer, onzichtbaar, vóór het woord. */}
      <div aria-hidden className="flex items-stretch gap-[4px]">
        {cijfers.map((c, i) => (
          <KlapKaart key={n - i} cijfer={c} />
        ))}
      </div>
      <span
        className="cb-woord font-display font-black leading-tight tracking-tight"
        style={{ fontSize: "calc(var(--kh) * 0.3)" }}
      >
        <span className="sr-only">{waarde.toLocaleString("nl-NL")} </span>
        {label}
      </span>
    </div>
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
  const detailregel = toonLeerkrachten || toonUitwerkingen;

  return (
    <section className="relative overflow-x-clip">
      {/* 🔑 Dit vlak is bewust GROTER dan het bord en ligt eronder, niet
         ernaast. In de vorige versie stond hier een vorm waarvan de rand
         precies achter de grote cijfers langs sneed; een vorm die de inhoud
         volledig omvat geeft het bord juist iets om op te liggen en heeft
         nergens een rand die iets doorsnijdt. */}
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="kiezel"
        breedte={980}
        hoogte={520}
        style={{ right: "-14%", top: -30, transform: "rotate(-4deg)" }}
        className="-z-10 hidden lg:block"
        tel={5}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-4 lg:pb-24">
        <Confetti punten={[{ x: "4%", y: "78%", r: 4, amber: true }]} />

        {/* Kop links, bord rechts. De sectie gebruikt zo de volle breedte en
           blijft laag, in plaats van een stapel in de linkerhelft met leegte
           ernaast. */}
        <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,19rem)_1fr]">
          <div>
            <h2
              data-reveal
              className="font-display text-[clamp(1.875rem,3.4vw,2.75rem)] font-black leading-[1.05] tracking-tight [text-wrap:balance]"
              style={{ color: DONKER }}
            >
              Samen teruggewonnen
            </h2>
            {/* Bronvermelding. Elke geloofwaardige teller die we bekeken hebben
               heeft er een: een getal zonder herkomst is een claim. */}
            <p data-reveal className="mt-4 text-base leading-7 text-ink/65">
              Opgeteld uit de tijd die de tools echt bespaarden, met een schooldag
              van {String(UUR_PER_SCHOOLDAG).replace(".", ",")} uur. Het bord loopt
              bij terwijl je kijkt.
            </p>
          </div>

          {/* De kast. Een klapbord zonder behuizing is een stel losse kaartjes. */}
          <div data-reveal className="cb-kast justify-self-start lg:justify-self-end">
            <Aflezing waarde={dagen} label="schooldagen" />
            {detailregel && (
              <>
                <div aria-hidden className="my-5 h-px bg-white/[0.13]" />
                <div className="flex flex-wrap items-center gap-x-9 gap-y-4">
                  {toonLeerkrachten && (
                    <Aflezing klein waarde={cijfers.leerkrachten} label="leerkrachten" />
                  )}
                  {toonUitwerkingen && (
                    <Aflezing klein waarde={cijfers.uitwerkingen} label="uitwerkingen" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <BordStijl />
    </section>
  );
}

function BordStijl() {
  return (
    <style>{`
      /* De kast: donkergroen, zodat de crème kleppen eruit springen. Dat is
         hoe een echt klapbord werkt, en donkere objecten op papier zijn al
         onderdeel van deze pagina (de toolkaarten in de galerij).
         De lichte binnenrand bovenaan en de donkere onderin laten de kleppen
         ín de kast liggen in plaats van erop. */
      .cb-kast {
        --kh: clamp(66px, 8vw, 104px);
        background: ${DONKER};
        border-radius: 20px;
        padding: clamp(18px, 2.4vw, 30px);
        transform: rotate(-0.8deg);
        box-shadow:
          ${schaduw(30, 60, -28, 0.5)},
          inset 0 1px 0 rgba(255,255,255,0.09),
          inset 0 -22px 34px -26px rgba(0,0,0,0.75);
      }
      /* De detailregel is kleiner, maar het is hetzelfde apparaat. */
      .cb-klein { --kh: clamp(40px, 4.6vw, 58px); }

      .cb-woord { color: rgba(255,255,255,0.92); }
      .cb-klein .cb-woord { color: rgba(255,255,255,0.72); }

      .cb-kaart {
        --kaart: var(--w-klapkaart, #fdfaf1);
        height: var(--kh);
        width: calc(var(--kh) * 0.7);
        border-radius: 11px;
        /* Binnen een donkere kast hoort de schaduw van een kaart donker te
           zijn, niet het groen dat de rest van de pagina op papier gebruikt. */
        box-shadow: 0 6px 14px -6px rgba(0,0,0,0.55);
      }
      .cb-kaart > div { font-size: calc(var(--kh) * 0.64); color: ${DONKER}; }

      .cb-vlak {
        background-color: var(--kaart);
        /* Licht en schaduw over de kaartkleur heen, geen tweede en derde
           kartontint: anders sluipen er kleuren het systeem in die nergens
           gedefinieerd zijn en bij een thema niet meebewegen. */
        background-image: linear-gradient(
          158deg,
          rgba(255,255,255,0.7) 0%,
          rgba(255,255,255,0) 54%,
          rgba(0,0,0,0.05) 100%
        );
      }
      /* ⚠️ De naad stond op zwart 0,22 met een wit randje van 0,7 eronder, en
         die combinatie las als een doorhaling dwars door de cijfers in plaats
         van als de kier tussen twee kleppen. Vooral op de kleine kaarten, waar
         de lijn evenveel gewicht heeft maar het cijfer half zo groot is.
         Allebei zachter nu: je moet de kier zien, niet de streep. */
      .cb-naad { background: rgba(0,0,0,0.14); }
      .cb-naad-licht { background: rgba(255,255,255,0.45); }
      .cb-pen {
        width: 5px;
        height: 5px;
        margin-top: -2.5px;
        border-radius: 9999px;
        /* Het asje is een lichte pen tegen de donkere kast. In de vorige
           versie lag het bord op papier en was de pen juist donker; op deze
           ondergrond zou die volledig wegvallen. */
        background: rgba(255,255,255,0.34);
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
        background: rgba(0,0,0,0.6);
      }
      .cb-val::before  { animation: cbDonker ${KLEP_MS / 2}ms cubic-bezier(0.45,0.05,0.75,0.4) forwards; }
      .cb-vang::before { animation: cbLicht ${KLEP_MS / 2}ms cubic-bezier(0.15,0.6,0.35,1) ${KLEP_MS / 2}ms both; }
      @keyframes cbDonker { from { opacity: 0; }   to { opacity: 0.45; } }
      @keyframes cbLicht  { from { opacity: 0.45; } to { opacity: 0; } }

      @media (prefers-reduced-motion: reduce) {
        .cb-val, .cb-vang { display: none; }
      }
    `}</style>
  );
}

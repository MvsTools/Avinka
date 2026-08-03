"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Confetti, DONKER, VLAK_PAPIER, KaartVlak, schaduw } from "./Wereld";
import type { Cijfers } from "@/lib/cijfers";

export type { Cijfers };

/* ── "Samen teruggewonnen": het klapbord ────────────────────────────────────
   De cijfers van de hele gemeenschap, als één apparaat op het papier tussen
   de ervaringen en de prijzen. Daar staat het omdat de polaroids het zachte
   bewijs zijn (wat mensen zéggen) en dit het harde (wat er gemeten is); samen
   vormen ze het bewijsblok vlak voor het moment dat iemand naar de prijs kijkt.

   WAAROM EEN KLAPBORD EN GEEN CIJFERBLOKJES
   Een rij "groot getal, klein label" is het meest versleten patroon van het
   web en staat niet voor niets op de verboden lijst in DESIGN.md. Het probleem
   is niet alleen dat het saai is: een getal dat bij het inscrollen van 0 naar
   1.284 telt leest als marketing. Bij een klapbord is de beweging zélf het
   bewijs dat er iets veranderd is, want een klep valt alleen als er echt een
   uur bij komt.

   DE EENHEID IS HET UUR, EN DAT IS EEN CORRECTIE
   Hier stond eerst de SCHOOLDAG (bespaarde minuten gedeeld door 7,5 uur),
   omdat een dag tastbaarder is dan een uur. Dat was fout, en de eigenaar ving
   het: een schooldag is precies het deel van de dag waarin dit werk niet kán,
   want dan staan de kinderen voor je. Avinka neemt werk van NA schooltijd over
   (rapporten, oudercontact, toetsanalyse, lesvoorbereiding), dus bespaarde
   vrije tijd omrekenen naar een eenheid werktijd klopt niet.

   Overwogen als tastbaar alternatief: de avond van twee uur, gelijk aan de
   belofte "win elke week 2 uur terug". Bewust niet gedaan. Een kleinere
   eenheid maakt hetzelfde getal groter (90 uur is 12 schooldagen of 45
   avonden) en dat is precies het soort oppoetsen dat deze pagina vermijdt.
   Bovendien is "avond" een aanname over wanneer iemand dat werk doet. Het uur
   heeft geen omrekening en dus niets om over te struikelen, en het is de
   eenheid waarin de belofte op deze pagina al staat.

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
   - het label bij het hoofdgetal is kaal ("uur"), niet "uur teruggewonnen":
     dat woord staat al in de kop tien centimeter hoger.

   EERLIJKHEID
   Er staat hier nooit een verzonnen of pijnlijk laag cijfer. Elke regel heeft
   zijn eigen drempel (DREMPELS hieronder) en verschijnt pas als hij gehaald
   is; is de bovenste regel niet gehaald, dan blijft de hele sectie weg.
   ────────────────────────────────────────────────────────────────────────── */

/* Per regel de ondergrens waaronder we hem niet tonen. Bewust voorzichtig:
   liever een bord met één regel dan een regel waar "3 leerkrachten" op staat.
   Honderd uur is een eerste mijlpaal die de moeite van het vertellen waard is.
   Mag omhoog zodra de proefgroep groter is. */
const DREMPELS = { uren: 100, leerkrachten: 15, uitwerkingen: 250 };

/* Hoe vaak de browser opnieuw kijkt of er iets veranderd is. Het bord
   verspringt pas als er een heel uur bij komt, dus vaker heeft geen zin.
   De databasekant wordt hier niet zwaarder van: het antwoord komt uit een
   centrale cache van dezelfde duur (zie lib/cijfers.ts). */
const KIJK_INTERVAL_MS = 30_000;

export function urenUit(minuten: number) {
  return Math.floor(minuten / 60);
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

/* Hoeveel de kaarten krimpen naarmate het getal langer wordt. Zonder dit liep
   het bord bij 1000 leerkrachten en 100.000 uitwerkingen buiten beeld op
   mobiel (418px in een venster van 390) en groeide de kast van 230 naar 347
   pixels hoog omdat de detailregel ging wrappen.

   De wortel zorgt dat het meeschaalt zonder onleesbaar te worden: bij vijf
   cijfers staat de kaart op 78% en bij zeven op 65%. Het bord wordt dus wél
   breder bij een langer getal, alleen niet evenredig. */
function kaartSchaal(aantalCijfers: number) {
  return Math.min(1, Math.sqrt(3 / Math.max(3, aantalCijfers)));
}

function Aflezing({ waarde, label, klein }: { waarde: number; label: string; klein?: boolean }) {
  /* Het getal wordt Nederlands geschreven, mét puntjes. ⚠️ Dat ontbrak: het
     bord toonde "9412" terwijl de schermlezer "9.412" voorlas, en bij grote
     getallen werd "100000" helemaal onleesbaar. De punt is geen kaart maar
     een smal tussenstuk, want een punt op een klapkaart zou net zo goed een
     cijfer kunnen zijn dat toevallig omslaat. */
  const tekens = waarde.toLocaleString("nl-NL").split("");
  const aantalCijfers = tekens.filter((t) => t !== ".").length;
  /* De sleutel van een kaart is zijn POSITIE VAN RECHTS, hier zonder meeteller
     berekend. Met een teller die in de map werd opgehoogd klaagde de
     React-compiler terecht over een variabele die na het renderen nog
     verandert; dit is dezelfde uitkomst, maar zonder muteren. */
  const sleutelVoor = (i: number) => tekens.slice(i + 1).filter((t) => t !== ".").length + 1;

  return (
    <div
      /* flex-wrap laat het bijschrift ONDER de cijfers vallen zodra ze samen
         niet meer passen. Bij drie cijfers blijft het dus gewoon naast elkaar
         staan, en pas bij een lang getal op een smal scherm zakt het woord een
         regel. Dat werkt alleen doordat de kast een breedtegrens heeft
         (max-width hieronder); zonder die grens groeit de kast eindeloos mee
         en wrapt er nooit iets. */
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${klein ? "cb-klein" : ""}`}
      /* --kh is de kaart (krimpt met de lengte van het getal), --kb blijft de
         maat van de REGEL. Het woord hangt aan --kb, anders zou "uitwerkingen"
         bij een getal van zes cijfers mee omlaag schalen naar 8 pixels. */
      style={
        { "--kh": `calc(var(--kb) * ${kaartSchaal(aantalCijfers).toFixed(3)})` } as CSSProperties
      }
    >
      {/* ⚠️ aria-hidden op de kaarten, en dat is een reparatie geen luiheid.
         Elke kaart bevat het cijfer TWEE keer (boven- en onderhelft, plus
         tijdens het klappen nog twee kleppen), dus een schermlezer las
         "1 1 7 7 1 1 uur". Dat is met kijken niet te zien; het kwam
         boven water bij het uitlezen van de toegankelijkheidsboom. Het echte
         getal staat nu één keer, onzichtbaar, vóór het woord. */}
      <div aria-hidden className="flex items-stretch gap-[4px]">
        {tekens.map((teken, i) => {
          if (teken === ".") return <span key={`p${i}`} className="cb-punt" />;
          /* Op de positie van LINKS sleutelen zou bij 999 → 1.000 elke kaart
             een plek laten verspringen, waardoor het hele bord omklapt in
             plaats van alleen de cijfers die echt veranderen. */
          return <KlapKaart key={sleutelVoor(i)} cijfer={teken} />;
        })}
      </div>
      <span
        className="cb-woord font-display font-black leading-tight tracking-tight"
        style={{ fontSize: "calc(var(--kb) * 0.3)" }}
      >
        <span className="sr-only">{waarde.toLocaleString("nl-NL")} </span>
        {label}
      </span>
    </div>
  );
}

/* ── De sectie ───────────────────────────────────────────────────────────── */

export function WereldCijfers({
  cijfers,
  bijhouden = true,
}: {
  cijfers: Cijfers | null;
  /* false voor een voorbeeldbord: dan blijven de meegegeven cijfers staan. */
  bijhouden?: boolean;
}) {
  /* De beslissing of er iets te tonen valt staat bewust BUITEN het bord, en
     het bijhouden zit erin. Zolang er te weinig data is bestaat het bord dus
     niet, en wordt er ook niets opgehaald: geen enkel verzoek voor een sectie
     die toch verborgen is. Zodra hij er staat gaat het bijhouden vanzelf mee. */
  if (!cijfers) return null;
  if (urenUit(cijfers.minuten) < DREMPELS.uren) return null;
  return <Bord begin={cijfers} bijhouden={bijhouden} />;
}

/* ── Het bord bijhouden ──────────────────────────────────────────────────────
   Elke halve minuut opnieuw kijken of er iets veranderd is, zodat het bord
   echt meeloopt in plaats van stil te staan tot je de pagina herlaadt.

   🔑 TWEE SPAARZAAMHEDEN, want een teller die altijd doorvraagt is precies het
   soort verspilling dat dit product zegt te bestrijden:
   1. alleen als de bezoeker het bord daadwerkelijk in beeld heeft. Het staat
      onderaan een lange pagina, dus de meeste bezoekers komen er nooit; die
      veroorzaken zo geen enkel verzoek.
   2. alleen als het tabblad zichtbaar is. Een pagina die op de achtergrond
      staat te pollen kost accuduur en levert niemand iets op.
   De databasekant wordt er sowieso niet zwaarder van: het antwoord komt uit
   een gedeelde cache van 30 seconden (lib/cijfers.ts), dus of er nu één
   bezoeker kijkt of duizend, de database wordt even vaak bevraagd.
   ──────────────────────────────────────────────────────────────────────────── */
function useBijgehoudenCijfers(begin: Cijfers, bijhouden: boolean) {
  const [cijfers, setCijfers] = useState(begin);
  const anker = useRef<HTMLElement>(null);
  const inBeeld = useRef(false);

  useEffect(() => {
    const el = anker.current;
    /* Niet bijhouden bij een voorbeeldbord (?cijfers=demo en de proefpagina).
       Zonder deze uitzondering haalt het bord na een halve minuut de échte
       cijfers op, die onder de drempel liggen, en verdwijnt het voorbeeld
       waar je juist naar aan het kijken bent. */
    if (!el || !bijhouden) return;

    const kijker = new IntersectionObserver(
      ([ingang]) => {
        inBeeld.current = ingang.isIntersecting;
      },
      { rootMargin: "200px" },
    );
    kijker.observe(el);

    let gestopt = false;
    const haal = async () => {
      if (gestopt || document.hidden || !inBeeld.current) return;
      try {
        const antwoord = await fetch("/api/cijfers");
        if (!antwoord.ok || antwoord.status === 204) return;
        const nieuw = (await antwoord.json()) as Cijfers;
        if (!gestopt) setCijfers(nieuw);
      } catch {
        /* Netwerk weg of server even niet bereikbaar: het bord blijft gewoon
           op zijn laatste stand staan. Dat is een prima uitkomst. */
      }
    };

    const tik = setInterval(haal, KIJK_INTERVAL_MS);
    return () => {
      gestopt = true;
      clearInterval(tik);
      kijker.disconnect();
    };
  }, [bijhouden]);

  return { cijfers, anker };
}

function Bord({ begin, bijhouden }: { begin: Cijfers; bijhouden: boolean }) {
  const { cijfers, anker } = useBijgehoudenCijfers(begin, bijhouden);

  const uren = urenUit(cijfers.minuten);
  /* Zakt het onder de drempel (kan in de praktijk niet, maar wel als er ooit
     data wordt opgeschoond), dan verdwijnt het bord weer netjes. */
  if (uren < DREMPELS.uren) return null;

  const toonLeerkrachten = cijfers.leerkrachten >= DREMPELS.leerkrachten;
  const toonUitwerkingen = cijfers.uitwerkingen >= DREMPELS.uitwerkingen;
  const detailregel = toonLeerkrachten || toonUitwerkingen;

  return (
    <section ref={anker} className="relative overflow-x-clip">
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
            {/* Deze zin heeft er even uit gestaan omdat hij NIET WAAR was: de
               cijfers kwamen alleen uit de serverrendering, dus het bord stond
               stil zolang je op de pagina was. Hij mag terug nu het bord zich
               echt bijhoudt (useBijgehoudenCijfers hierboven). Blijf hem
               nalopen als die lus ooit sneuvelt. */}
            <p data-reveal className="mt-4 text-base leading-7 text-ink/65">
              Opgeteld uit het werk dat de tools overnemen: rapporten, oudercontact,
              toetsanalyse, lesvoorbereiding. Werk van na schooltijd. Het bord loopt
              bij zolang je hier bent.
            </p>
          </div>

          {/* De kast. Een klapbord zonder behuizing is een stel losse kaartjes. */}
          {/* min-w-0 op de rasterkolom: zonder dat mag een grid-cel niet
             krimpen onder de breedte van zijn inhoud, en dan heeft de
             max-width op de kast geen effect. */}
          <div data-reveal className="cb-kast min-w-0 justify-self-start lg:justify-self-end">
            <Aflezing waarde={uren} label="uur" />
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
        /* --kb is de maat van de regel, --kh die van de kaart. Ze zijn
           gescheiden omdat de kaart krimpt bij een langer getal en het
           bijschrift niet mee mag krimpen. */
        --kb: clamp(66px, 8vw, 104px);
        --kh: var(--kb);
        /* De kartonkleur staat op de kast en niet op de kaart, zodat ook het
           puntje tussen de duizendtallen hem kan erven. */
        --kaart: var(--w-klapkaart, #fdfaf1);
        background: ${DONKER};
        border-radius: 20px;
        /* Zonder deze grens groeit de kast met het getal mee tot buiten het
           scherm: bij 100.000 uitwerkingen was hij 418px breed in een venster
           van 390 en werd hij afgesneden. Met de grens wrapt de inhoud. */
        max-width: 100%;
        padding: clamp(18px, 2.4vw, 30px);
        transform: rotate(-0.8deg);
        box-shadow:
          ${schaduw(30, 60, -28, 0.5)},
          inset 0 1px 0 rgba(255,255,255,0.09),
          inset 0 -22px 34px -26px rgba(0,0,0,0.75);
      }
      /* De detailregel is kleiner, maar het is hetzelfde apparaat. */
      .cb-klein { --kb: clamp(40px, 4.6vw, 58px); }

      /* De duizendtalpunt: een smal tussenstuk, geen kaart. Hij zit op de
         hoogte van de kaartvoet, zoals een punt op de schrijfregel staat. */
      .cb-punt {
        position: relative;
        width: calc(var(--kh) * 0.24);
        align-self: stretch;
      }
      .cb-punt::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: calc(var(--kh) * 0.17);
        width: calc(var(--kh) * 0.1);
        height: calc(var(--kh) * 0.1);
        margin-left: calc(var(--kh) * -0.05);
        border-radius: 9999px;
        background: var(--kaart, #fdfaf1);
      }

      .cb-woord { color: rgba(255,255,255,0.92); }
      .cb-klein .cb-woord { color: rgba(255,255,255,0.72); }

      .cb-kaart {
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

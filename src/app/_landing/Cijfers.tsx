"use client";

import { useEffect, useRef, useState } from "react";
import { Confetti, DONKER, Golf, KOP, MINT, MINT_LICHT, VLAK_PAPIER, KaartVlak, schaduw } from "./Wereld";
import type { Cijfers } from "@/lib/cijfers";

export type { Cijfers };

/* ── "Het rapport van Avinka" ───────────────────────────────────────────────
   De gemeenschapscijfers op de voorpagina, tussen de ervaringen en de prijzen.
   Daar staan ze omdat de polaroids het zachte bewijs zijn (wat mensen zéggen)
   en dit het harde (wat er gemeten is); samen vormen ze het bewijsblok vlak
   vóór het moment dat iemand naar de prijs kijkt.

   HET CONCEPT
   Avinka's vlaggenschip schrijft rapporten. Hier krijgt Avinka er zelf een.
   Dat is niet alleen een grap: een rapport is een van de weinige objecten die
   van nature een rij labels met waarden vasthoudt, plus een opmerking van de
   leerkracht onderaan. De inhoud past dus in het object in plaats van ernaast
   te staan, en dat was de eis waar alle eerdere pogingen op sneuvelden
   (decoratie naast een cijfer wordt hier consequent afgekeurd).

   ⚠️ WAAROM HET GEEN KLAPBORD MEER IS
   Er heeft hier een split-flap-bord gestaan, mechanisch en netjes gebouwd. De
   eigenaar twijfelde terecht: het was een GADGET. De charme kwam uit het
   mechaniek, niet uit Avinka, en elk merk kan een klapbord neerzetten. Een
   rapport kan alleen een onderwijsproduct maken. Het klapbord staat nog in de
   geschiedenis (commit ba8fa65) mocht het ooit terug moeten.

   DE VORM: BREED EN LAAG
   Een rapport is staand papier, en dat werd te langwerpig. Dit is daarom een
   liggend vel dat de volle kolombreedte gebruikt, met de regels links en de
   opmerking rechts. Het steekt uit een mintgroen mapje, want rapporten zitten
   in een map; dat geeft in één element diepte én kleur, zonder rekwisieten.

   DE BEWEGING: HET WORDT INGEVULD
   De regels zijn voorgedrukt en meteen zichtbaar; de WAARDEN verschijnen als
   verse inkt, één voor één, daarna schrijft de opmerking zichzelf en valt de
   stempel. Dat is het enige nieuwe bewegingsnummer op deze pagina en het is
   binnen 1,4 seconde klaar. ⚠️ Niet langer maken: de stempel viel eerst pas na
   1,6 seconde en dan mist iedereen die doorscrolt het slotakkoord. Verandert er later echt een cijfer, dan gebruikt
   dat dezelfde inkt-beweging: één bewegingstaal voor het hele object.
   Het lift mee op het bestaande data-reveal-systeem, dus zonder JS of bij
   prefers-reduced-motion staat alles er gewoon.

   DE EENHEID IS HET UUR, EN DAT IS EEN CORRECTIE
   Hier stond eerst de SCHOOLDAG (minuten / 7,5 uur). Fout, en de eigenaar ving
   het: een schooldag is precies het deel van de dag waarin dit werk niet kán,
   want dan staan de kinderen voor je. Avinka neemt werk van ná schooltijd over.
   Ook overwogen en afgewezen: de avond van twee uur. Een kleinere eenheid maakt
   hetzelfde getal groter (90 uur = 12 schooldagen = 45 avonden) en dat is
   oppoetsen. Het uur heeft geen omrekening en is de eenheid waarin de belofte
   op deze pagina al staat.

   EERLIJKHEID
   Elke regel heeft een eigen drempel (DREMPELS) en verschijnt pas als die
   gehaald is; haalt de bovenste het niet, dan blijft de hele sectie weg. Er
   staat dus nooit een nul of een pijnlijk laag getal op de voorpagina.

   ⏳ BEKEND PLAFOND, BEWUST NIET NU OPGELOST
   Dit telt ALLES bij elkaar en stopt nooit. Met 2 uur per week per leerkracht:
   30 leerkrachten = 3.100 uur per jaar, 1000 leerkrachten = 104.000 per jaar.
   Na een paar jaar op schaal is het een kilometerstand en voelt niemand het
   verschil tussen 312.000 en 340.000. De oplossing als het zover is: tel de
   afgelopen 30 dagen in plaats van alles (kolom `per_dag` op `statistiek`
   heeft de data al, alleen een nieuwe SQL-functie nodig). Eigenaar heeft 3-8
   bewust gekozen dit later te doen.
   ────────────────────────────────────────────────────────────────────────── */

/* Per regel de ondergrens waaronder we hem niet tonen. Bewust voorzichtig:
   liever een rapport met één regel dan een regel waar "3 leerkrachten" op
   staat. Honderd uur is een eerste mijlpaal die het vertellen waard is. */
const DREMPELS = { uren: 100, leerkrachten: 15, uitwerkingen: 250 };

/* Hoe vaak de browser kijkt of er iets veranderd is. Het rapport verspringt
   pas als er een heel uur bij komt, dus vaker heeft geen zin. De databasekant
   wordt er niet zwaarder van: het antwoord komt uit een gedeelde cache van
   dezelfde duur (zie lib/cijfers.ts). */
const KIJK_INTERVAL_MS = 30_000;

export function urenUit(minuten: number) {
  return Math.floor(minuten / 60);
}

/* ── Het rapport bijhouden ──────────────────────────────────────────────────
   🔑 TWEE SPAARZAAMHEDEN, want een teller die altijd doorvraagt is precies het
   soort verspilling dat dit product zegt te bestrijden:
   1. alleen als het rapport in beeld is. Het staat onderaan een lange pagina,
      dus de meeste bezoekers komen er nooit en veroorzaken geen verzoek.
   2. alleen als het tabblad zichtbaar is.
   ─────────────────────────────────────────────────────────────────────────── */
function useBijgehoudenCijfers(begin: Cijfers, bijhouden: boolean) {
  /* 🔑 WAAROM ER EEN SECONDETELLER BIJ ZIT
     Het bijhouden wérkte al, maar je zag het nooit: bij weinig gebruikers
     verandert een optelsom van alles dagenlang niet, dus stond het beeld stil
     en zei "doorlopend bijgewerkt" niets. De oplossing is NIET de getallen
     laten oplopen tussen twee metingen door (dat zijn verzonnen tussenstanden
     en die horen hier niet), maar het CONTROLEREN zichtbaar maken: hoe lang
     geleden is er gekeken. Dat loopt elke seconde op en springt bij elke
     controle terug naar nul, dus er beweegt altijd iets en het is waar. */
  /* ⚠️ `bron` houdt bij welke prop-waarde we hebben overgenomen. Zonder dat
     kopieert de hook de begincijfers één keer bij het aankoppelen en kijkt hij
     daarna nooit meer naar de prop. Op de echte pagina valt dat niet op (daar
     komen de updates van binnenuit), maar op de proefpagina bleef het rapport
     doodstil staan bij elke klik. Vergelijken op WAARDE en niet op object-
     identiteit: de ouder maakt bij elke render een nieuw object, en op
     identiteit zou een onschuldige hertekening een net opgehaald cijfer
     terugzetten naar de serverwaarde. */
  const sleutelVan = (c: Cijfers) => `${c.minuten}|${c.leerkrachten}|${c.uitwerkingen}`;
  const [staat, setStaat] = useState({ cijfers: begin, bron: sleutelVan(begin) });
  if (staat.bron !== sleutelVan(begin)) setStaat({ cijfers: begin, bron: sleutelVan(begin) });
  const cijfers = staat.cijfers;

  const [seconden, setSeconden] = useState(0);
  const anker = useRef<HTMLElement>(null);
  const inBeeld = useRef(false);

  useEffect(() => {
    const el = anker.current;
    if (!el) return;

    const kijker = new IntersectionObserver(
      ([ingang]) => {
        inBeeld.current = ingang.isIntersecting;
      },
      { rootMargin: "200px" },
    );
    kijker.observe(el);

    let gestopt = false;
    const haal = async () => {
      if (gestopt) return;
      try {
        const antwoord = await fetch("/api/cijfers");
        if (!antwoord.ok || antwoord.status === 204) return;
        const nieuw = (await antwoord.json()) as Cijfers;
        /* De bron laten staan: dit komt van de server, niet van de prop. Zou
           hij meeveranderen, dan denkt de vergelijking hierboven bij de
           volgende render dat de prop is gewijzigd en springt het rapport
           terug naar de serverwaarde. */
        if (!gestopt) setStaat((s) => ({ ...s, cijfers: nieuw }));
      } catch {
        /* Netwerk weg: het rapport blijft op zijn laatste stand staan. */
      }
    };

    /* De secondeteller loopt alleen als het kaartje in beeld is en het
       tabblad zichtbaar; anders zou hij doortikken terwijl er niemand kijkt
       en niets gecontroleerd wordt. */
    const seconde = setInterval(() => {
      if (document.hidden || !inBeeld.current) return;
      setSeconden((n) => (n + 1) % Math.round(KIJK_INTERVAL_MS / 1000));
    }, 1000);

    const tik = setInterval(() => {
      if (document.hidden || !inBeeld.current) return;
      setSeconden(0);
      /* ⚠️ De KLOK loopt altijd, het OPHALEN alleen als bijhouden aanstaat.
         Bij een voorbeeldrapport (?cijfers=demo en de proefpagina) zou een
         echte controle de werkelijke cijfers ophalen, die onder de drempel
         liggen, en dan verdwijnt het voorbeeld waar je juist naar kijkt. De
         teller loopt daar dus wél door, zodat je ziet hoe het straks werkt. */
      if (bijhouden) haal();
    }, KIJK_INTERVAL_MS);

    return () => {
      gestopt = true;
      clearInterval(seconde);
      clearInterval(tik);
      kijker.disconnect();
    };
  }, [bijhouden]);

  return { cijfers, anker, seconden };
}

/* ── Eén ingevulde waarde ───────────────────────────────────────────────────
   Bij binnenkomst verschijnt hij als verse inkt. Verandert het getal later
   echt, dan doet hij precies hetzelfde: één bewegingstaal voor het object. */
function Waarde({ getal, eenheid, groot }: { getal: number; eenheid?: string; groot?: boolean }) {
  const [staat, setStaat] = useState({ toont: getal, vers: 0 });

  /* Tijdens het renderen bijstellen in plaats van in een effect: React
     ondersteunt dat voor "state aanpassen als een prop verandert", en het
     scheelt een renderronde per wijziging (react-hooks/set-state-in-effect). */
  if (staat.toont !== getal) setStaat({ toont: getal, vers: staat.vers + 1 });

  return (
    <span
      /* De sleutel verandert bij elke nieuwe waarde, zodat de inkt-animatie
         opnieuw start in plaats van alleen de tekst te verwisselen. */
      key={staat.vers}
      className={`rp-inkt tabular-nums ${groot ? "rp-groot" : "rp-klein"}`}
    >
      {staat.toont.toLocaleString("nl-NL")}
      {/* De spatie staat er echt en niet alleen als marge: zonder tekstspatie
         plakt een schermlezer het aan elkaar tot "1.284uur". */}
      {eenheid && <span className="rp-eenheid"> {eenheid}</span>}
    </span>
  );
}

/* ── De stempel ─────────────────────────────────────────────────────────────
   Het merkmoment: het vinkje, als afgedrukte stempel op het rapport. Bewust
   een drukwerk-element en geen knutselspul (punaises en plakband zijn op deze
   site expliciet afgekeurd). De inkt is doorschijnend en de ring heeft open
   plekken, want een echte stempel drukt nooit helemaal vol af. */
function Stempel() {
  /* ⚠️ Eerste versie was een strakke cirkel met een vinkje erin, en dat leest
     als een succes-icoontje uit een UI-kit: het gladste element op een vel dat
     juist gedrukt moet lijken. Wat een stempel een stempel maakt is de
     ONREGELMATIGHEID: de ring is nergens even dik, hij loopt niet rond, en de
     inkt laat gaten waar het rubber het papier niet raakte. Daarom een
     handgetekend pad in plaats van <circle>, met een ruwe rand eroverheen. */
  return (
    <svg viewBox="0 0 100 100" className="rp-stempel" aria-hidden>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* de ring, in drie ongelijke bogen met gaten ertussen */}
        <path d="M77 26c9 12 10 30 -1 42" strokeWidth="6.5" />
        <path d="M72 73c-13 11-33 12-46 3" strokeWidth="5.2" />
        <path d="M21 70C10 57 11 34 25 23c8-6 19-8 29-6" strokeWidth="7" />
        <path d="M63 19c4 1 8 3 11 5" strokeWidth="5.6" />
        {/* het vinkje, met de dikte van een rubberstempel */}
        <path d="M32 51.5l12.5 13.5L69 34" strokeWidth="10" />
      </g>
    </svg>
  );
}

/* ── De sectie ───────────────────────────────────────────────────────────── */

/* Of deze sectie iets te vertellen heeft. Landing.tsx gebruikt dit om te
   bepalen of de prijzensectie zijn eigen golf nog nodig heeft: als het
   mintveld hier al begint, zou die golf een tweede rand vlak op de eerste
   leggen. */
export function toontCijfers(cijfers: Cijfers | null) {
  return Boolean(cijfers) && urenUit(cijfers!.minuten) >= DREMPELS.uren;
}

export function WereldCijfers({
  cijfers,
  bijhouden = true,
  prijzenVolgt = true,
}: {
  cijfers: Cijfers | null;
  /* false voor een voorbeeldrapport: dan blijven de meegegeven cijfers staan. */
  bijhouden?: boolean;
  /* Komt de prijzensectie hierna? Die is óók mint, dus dan loopt het veld
     gewoon door en hoeft er onderaan niets afgesloten te worden. Staat hij uit
     (een betalende bezoeker ziet geen prijzen), dan volgt er papier en moet het
     mintveld hier zelf netjes eindigen. */
  prijzenVolgt?: boolean;
}) {
  /* De beslissing of er iets te tonen valt staat bewust BUITEN het rapport, en
     het bijhouden zit erin. Zolang er te weinig data is bestaat het rapport dus
     niet, en wordt er ook niets opgehaald: geen enkel verzoek voor een sectie
     die toch verborgen is. */
  if (!cijfers) return null;
  if (urenUit(cijfers.minuten) < DREMPELS.uren) return null;
  return <Rapport begin={cijfers} bijhouden={bijhouden} prijzenVolgt={prijzenVolgt} />;
}

/* Eén los briefje met één cijfer. Dezelfde papiersoort als het rapport, maar
   zonder kop en zonder map: het rapport is het hoofddocument, dit zijn de
   blaadjes die ernaast liggen. */
function Briefje({ getal, label }: { getal: number; label: string }) {
  /* Getal en woord in ÉÉN alinea. Als twee losse alinea's las een schermlezer
     "37" en daarna "leerkrachten" als twee losse mededelingen; de spatie
     ertussen staat er echt, anders plakken ze aan elkaar. */
  return (
    <p className="rp-briefje">
      <span className="rp-briefgetal">
        <Waarde getal={getal} />
      </span>{" "}
      <span className="rp-brieflabel">{label}</span>
    </p>
  );
}

function Rapport({
  begin,
  bijhouden,
  prijzenVolgt,
}: {
  begin: Cijfers;
  bijhouden: boolean;
  prijzenVolgt: boolean;
}) {
  const { cijfers, anker, seconden } = useBijgehoudenCijfers(begin, bijhouden);

  const uren = urenUit(cijfers.minuten);
  if (uren < DREMPELS.uren) return null;

  const toonLeerkrachten = cijfers.leerkrachten >= DREMPELS.leerkrachten;
  const toonUitwerkingen = cijfers.uitwerkingen >= DREMPELS.uitwerkingen;

  return (
    <section ref={anker} className="relative overflow-x-clip">
      {/* Twee zachte vlakken, allebei groter dan wat erop ligt en eronder,
         zodat hun rand nergens door de inhoud snijdt. Eén onder het rapport
         links en één onder de briefjes rechts: zo heeft de hele strook een
         ondergrond in plaats van alleen de linkerhelft. */}
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="kiezel"
        breedte={820}
        hoogte={400}
        style={{ left: "-12%", top: -20, transform: "rotate(4deg)" }}
        className="-z-10 hidden lg:block"
        tel={4}
      />
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="ei"
        breedte={620}
        hoogte={330}
        style={{ right: "-8%", top: 40, transform: "rotate(-6deg)" }}
        className="-z-10 hidden lg:block"
        tel={7}
      />

      {/* De golf. Deze sectie lag als enige van de staart vlak op het papier,
         zonder enige overgang, en dat is wat hem saai maakte. De mint begint
         halverwege en loopt door tot onder aan de sectie, waar hij overgaat in
         het mintveld van de prijzen. De papieren liggen dus met hun bovenkant
         op papier en met hun onderkant op mint, precies zoals de makerskaart
         dat al doet. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[54%]" aria-hidden>
        <div className="absolute inset-0" style={{ background: MINT_LICHT }} />
        <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="speels" />
        {/* Alleen afsluiten als er gewoon papier volgt. Volgen de prijzen (ook
           mint), dan loopt het veld door en zou een golf hier een naad maken. */}
        {!prijzenVolgt && <Golf kleur="var(--w-papier, #fcfbf7)" vorm="rust" hoogte="h-[70px] sm:h-[110px]" />}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-6 lg:pb-24">
        <Confetti
          punten={[
            { x: "2%", y: "22%", r: 4, amber: true },
            { x: "63%", y: "8%", r: 4 },
            { x: "95%", y: "72%", r: 5, amber: true },
          ]}
        />

        <h2 data-reveal className="rp-sectiekop">Avinka in cijfers</h2>

        {/* De papieren op het bureau: het rapport en de losse briefjes ernaast,
           elk onder een eigen hoek. Dat is wat deze hoek een statistiekenhoekje
           maakt in plaats van één kaart met een lap tekst ernaast. */}
        <div data-reveal className="rp-cluster">
          <div className="rp-map">
            <article className="rp-kaart">
              {/* Geen h2: de sectie heeft nu zijn eigen kop, en twee koppen
                 vlak boven elkaar is er een te veel. Dit is de titel van het
                 document, niet van de sectie. */}
              <p className="rp-titel">Rapport van Avinka</p>
              <div aria-hidden className="rp-lijn" />

              <p className="rp-hoofd">
                <Waarde getal={uren} eenheid="uur" groot />
              </p>
              <p className="rp-onder">teruggegeven na schooltijd</p>

              {/* De stempel valt over de rand van het kaartje heen. Dat is wat
                 hem gedrukt laat lijken in plaats van geplaatst: niemand
                 stempelt netjes binnen de lijntjes. */}
              <Stempel />
            </article>
          </div>

          {(toonLeerkrachten || toonUitwerkingen) && (
            <div className="rp-briefjes">
              {toonLeerkrachten && <Briefje getal={cijfers.leerkrachten} label="leerkrachten" />}
              {toonUitwerkingen && <Briefje getal={cijfers.uitwerkingen} label="uitwerkingen" />}
            </div>
          )}

          {/* De verantwoording, óók op papier. Als losse regel tekst naast
             drie kaartjes hoorde hij er niet bij; nu is het het vierde stuk
             papier op het bureau, met een eigen hoek. De toon is zakelijker
             dan de vorige versie ("opgebouwd uit al het toolgebruik, en het
             loopt bij zolang je hier bent") omdat dit het stuk is dat vertrouwen
             moet wekken, en daar past spreektaal slecht bij. */}
          <div className="rp-bron">
            <p className="rp-bronlabel">verantwoording</p>
            <p className="rp-brontekst">
              Gemeten bij elk stuk werk dat de tools afronden, opgeteld over alle
              gebruikers.
            </p>
            {/* De sleutel op het aantal seconden zorgt dat het stipje bij elke
               terugsprong opnieuw één keer oplicht. Bewust géén eeuwig
               kloppend bolletje: het licht alleen op als er echt gekeken is. */}
            <p className="rp-bronlive">
              <span aria-hidden key={seconden === 0 ? "puls" : "stil"} className={`rp-stip ${seconden === 0 ? "rp-puls" : ""}`} />
              bijgewerkt <span className="rp-tel">{seconden < 3 ? "zojuist" : `${seconden} s geleden`}</span>
            </p>
          </div>
        </div>
      </div>

      <RapportStijl />
    </section>
  );
}

function RapportStijl() {
  return (
    <style>{`
      /* ── de compositie ──
         ⚠️ Dit was één kaartje met een alinea ernaast, en dat was te kaal.
         Nu liggen er drie papieren naast elkaar, elk met één cijfer. Dezelfde
         drie getallen als in de vorige versie, maar als compositie in plaats
         van als lijstje in één kaart. */
      /* ⚠️ De maten zijn nagerekend, niet gegokt. Bij een tussenruimte van
         52px was rapport + briefjes + herkomst samen 1142 breed in een kolom
         van 1104, en dan wipte de herkomst naar een tweede regel onder de
         kaart terwijl rechts alles leeg bleef. Nu: 368 + 38 + 434 + 38 + 192
         = 1070 en het past. */
      .rp-sectiekop {
        margin-bottom: clamp(22px, 2.8vw, 36px);
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.03em;
        line-height: 1.05;
        font-size: clamp(1.875rem, 3.4vw, 2.75rem);
        color: ${DONKER};
      }

      .rp-cluster {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: clamp(18px, 2.4vw, 34px);
      }
      /* Naast elkaar in plaats van onder elkaar, elk op een eigen hoogte.
         Onder elkaar was het een kolom naast een kaart, en dan blijft de
         rechterhelft van de sectie leeg. */
      .rp-briefjes {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: clamp(14px, 1.8vw, 24px);
      }

      /* ── het mapje en het rapport ── */
      .rp-map {
        background: ${MINT};
        border-radius: 13px;
        transform: rotate(-1deg);
        box-shadow: ${schaduw(20, 44, -22, 0.4)};
      }
      .rp-kaart {
        position: relative;
        width: clamp(272px, 31vw, 368px);
        background: #fffefb;
        /* Een document heeft scherpere hoeken dan een UI-kaart. */
        border-radius: 5px;
        /* net uit de map geschoven, zodat er mint langs de onderkant en de
           rechterkant zichtbaar blijft: kleur en diepte uit één element */
        transform: translate(-9px, -11px) rotate(1.4deg);
        padding: clamp(20px, 2.2vw, 28px) clamp(20px, 2.4vw, 30px)
                 clamp(24px, 2.6vw, 32px);
        box-shadow: ${schaduw(14, 32, -16, 0.3)};
      }

      .rp-titel {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.025em;
        line-height: 1.15;
        font-size: clamp(1.15rem, 1.7vw, 1.35rem);
        color: ${DONKER};
      }
      /* De streep onder de kop: de enige formulierlijn die overblijft. */
      .rp-lijn {
        height: 2px;
        margin: clamp(12px, 1.4vw, 16px) 0 clamp(16px, 1.8vw, 22px);
        background: rgba(var(--w-schaduw-rgb, 23,80,58), 0.14);
      }

      .rp-hoofd {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.04em;
        line-height: 0.9;
        color: ${DONKER};
      }
      .rp-groot { font-size: clamp(2.7rem, 5vw, 3.6rem); }
      /* De eenheid hangt AAN het getal en is geen los label: als los woord
         viel "uur" na drie letters stil en bleef er een gat naast staan. */
      .rp-eenheid {
        font-size: 0.36em;
        font-weight: 800;
        letter-spacing: 0;
        margin-left: 0.1em;
        color: ${KOP};
      }
      .rp-onder {
        margin-top: clamp(8px, 1vw, 12px);
        font-size: clamp(1rem, 1.35vw, 1.1rem);
        line-height: 1.5;
        color: rgba(34, 28, 58, 0.72);
        /* ruimte vrijhouden voor de stempel rechtsonder */
        padding-right: clamp(52px, 5.4vw, 68px);
      }

      /* ── de losse briefjes ──
         Geen map eronder en geen kop: het rapport blijft het hoofddocument.
         Elk briefje heeft een eigen hoek, anders liggen ze als een tabel op
         elkaar gestapeld en is het weer een lijstje. */
      .rp-briefje {
        width: clamp(158px, 17vw, 205px);
        background: #fffefb;
        border-radius: 5px;
        padding: clamp(13px, 1.5vw, 18px) clamp(15px, 1.7vw, 20px);
        box-shadow: ${schaduw(12, 28, -14, 0.28)};
      }
      .rp-briefje:nth-child(1) { transform: rotate(-2.3deg) translateY(clamp(-26px, -2vw, -14px)); }
      .rp-briefje:nth-child(2) { transform: rotate(1.8deg) translateY(clamp(14px, 2vw, 26px)); }
      .rp-briefgetal {
        display: block;
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.035em;
        line-height: 0.95;
        color: ${DONKER};
      }
      .rp-klein { font-size: clamp(1.55rem, 2.4vw, 2rem); }
      .rp-brieflabel {
        display: block;
        margin-top: 0.3rem;
        font-size: clamp(0.9rem, 1.15vw, 1rem);
        color: rgba(34, 28, 58, 0.66);
      }

      /* ── de stempel ── */
      .rp-stempel {
        position: absolute;
        right: clamp(-18px, -1.4vw, -12px);
        bottom: clamp(-16px, -1.2vw, -11px);
        width: clamp(52px, 5.2vw, 62px);
        height: auto;
        color: var(--color-brand, #2f9e6e);
        /* doorschijnende inkt: een stempel drukt nooit helemaal vol af */
        opacity: 0.72;
        transform: rotate(-13deg);
      }

      /* ── de herkomst ──
         Eén regel met een groen stipje ervoor, dat het meelopen aanduidt.
         Bewust géén kloppend of pulserend bolletje: beweging die eeuwig
         doorgaat is op deze pagina expliciet ongewenst. */
      /* ⚠️ Breedte nagerekend: 368 (rapport) + 38 + 434 (briefjes) + 38 + 208
         = 1086 in een kolom van 1104. Wordt dit kaartje breder, dan wipt het
         naar een tweede rij en blijft rechts alles leeg. Na het verzwaren van
         de letters brak "doorlopend bijgewerkt" over twee regels; het kaartje
         is daarom iets breder en de tussenruimte iets kleiner:
         368 + 34 + 434 + 34 + 222 = 1092, past nog steeds. */
      .rp-bron {
        width: clamp(178px, 17.5vw, 222px);
        background: #fffefb;
        border-radius: 5px;
        padding: clamp(13px, 1.5vw, 17px) clamp(14px, 1.6vw, 18px);
        box-shadow: ${schaduw(12, 28, -14, 0.24)};
        /* een derde hoek, anders liggen twee papieren precies parallel */
        transform: rotate(-1.5deg);
      }
      /* De letters op dit kaartje zijn voller dan op de rest. Als lichte
         kleine tekst las het als de kleine lettertjes onderaan een formulier,
         terwijl het juist het stuk is dat vertrouwen moet wekken. Het label
         staat in de koplettertype van de pagina, net als de titel van het
         rapport, zodat het als kop van een document leest en niet als bijschrift.
         ⚠️ De kleuren zijn NIET meegegaan in het verzwaren: 0,62 en 0,80 halen
         4,6:1 en 8,3:1. Zwaarder mág lichter, maar hieronder wordt het weer
         krap bij deze lettergroottes. */
      .rp-bronlabel {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 800;
        letter-spacing: -0.01em;
        font-size: clamp(0.95rem, 1.15vw, 1.05rem);
        color: rgba(34, 28, 58, 0.62);
      }
      .rp-brontekst {
        margin-top: 0.5rem;
        font-weight: 600;
        font-size: clamp(0.95rem, 1.15vw, 1.02rem);
        line-height: 1.5;
        color: rgba(34, 28, 58, 0.8);
        text-wrap: pretty;
      }
      .rp-bronlive {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin-top: 0.75rem;
        padding-top: 0.65rem;
        border-top: 1px solid rgba(var(--w-schaduw-rgb, 23,80,58), 0.12);
        font-weight: 700;
        font-size: 0.9rem;
        color: ${KOP};
      }
      .rp-stip {
        width: 7px;
        height: 7px;
        flex: none;
        border-radius: 9999px;
        background: var(--color-brand, #2f9e6e);
        box-shadow: 0 0 0 3px rgba(47, 158, 110, 0.16);
      }
      /* Eén keer oplichten op het moment van controleren, niet eeuwig kloppen. */
      .rp-puls { animation: rpPuls 0.75s cubic-bezier(0.22, 1, 0.36, 1); }
      @keyframes rpPuls {
        0%   { box-shadow: 0 0 0 0 rgba(47, 158, 110, 0.55); }
        100% { box-shadow: 0 0 0 9px rgba(47, 158, 110, 0); }
      }
      /* De seconden staan op tabulaire cijfers: anders springt de tekst
         ernaast heen en weer bij elke tik. */
      .rp-tel { font-variant-numeric: tabular-nums; }

      /* ── de beweging: de papieren worden ingevuld ──
         Alles hangt aan .is-in van de GROEP, niet aan een reveal per element.
         🔑 De waarnemer kijkt per element en de vertraging telt vanaf het
         moment dat dát element de drempel passeert; met losse reveals starten
         elementen die in dezelfde scrollstap binnenkomen tegelijk en is de
         volgorde weg.

         ⚠️ De inhoud staat standaard gewoon zichtbaar. Eerder stond hier
         opacity nul tot de reveal-klasse kwam, en dan staat het kaartje er bij
         een haperende waarnemer mét kop maar ZONDER cijfer. Het eerste
         keyframe doet het verbergen; de papieren zitten op dat moment nog in
         hun eigen reveal, dus je ziet er niets van knipperen. */
      .anim .rp-cluster.is-in .rp-inkt {
        animation: rpInkt 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .anim .rp-cluster.is-in .rp-hoofd .rp-inkt { animation-delay: 0.16s; }
      .anim .rp-cluster.is-in .rp-briefje:nth-child(1) .rp-inkt { animation-delay: 0.34s; }
      .anim .rp-cluster.is-in .rp-briefje:nth-child(2) .rp-inkt { animation-delay: 0.46s; }
      @keyframes rpInkt {
        from { opacity: 0; transform: translateY(7px); }
        to   { opacity: 1; transform: none; }
      }

      /* De stempel valt als laatste, met de korte pop die DESIGN.md voor het
         vinkje voorschrijft: onder 300ms, vanaf ongeveer 1.2, nooit vanaf 0.
         ⚠️ Niet later zetten: wie doorscrolt mist anders het slotakkoord. */
      .anim .rp-cluster.is-in .rp-stempel {
        animation: rpStempel 0.26s cubic-bezier(0.3, 1.5, 0.5, 1) 0.66s both;
      }
      @keyframes rpStempel {
        from { opacity: 0; transform: rotate(-21deg) scale(1.3); }
        to   { opacity: 0.72; transform: rotate(-13deg) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        .rp-inkt, .rp-stempel, .rp-puls { animation: none !important; }
        .rp-inkt, .rp-stempel { opacity: 1 !important; }
        .rp-stempel { opacity: 0.72 !important; }
      }
    `}</style>
  );
}

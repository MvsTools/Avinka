"use client";

import { useEffect, useRef, useState } from "react";
import { Confetti, DONKER, KOP, MINT, VLAK_PAPIER, KaartVlak, schaduw } from "./Wereld";
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

  const anker = useRef<HTMLElement>(null);
  const inBeeld = useRef(false);

  useEffect(() => {
    const el = anker.current;
    /* Niet bijhouden bij een voorbeeldrapport (?cijfers=demo en de proefpagina).
       Zonder deze uitzondering haalt het na een halve minuut de échte cijfers
       op, die onder de drempel liggen, en verdwijnt het voorbeeld waar je juist
       naar aan het kijken bent. */
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
        /* De bron laten staan: dit komt van de server, niet van de prop. Zou
           hij meeveranderen, dan denkt de vergelijking hierboven bij de
           volgende render dat de prop is gewijzigd en springt het rapport
           terug naar de serverwaarde. */
        if (!gestopt) setStaat((s) => ({ ...s, cijfers: nieuw }));
      } catch {
        /* Netwerk weg: het rapport blijft op zijn laatste stand staan. */
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

export function WereldCijfers({
  cijfers,
  bijhouden = true,
}: {
  cijfers: Cijfers | null;
  /* false voor een voorbeeldrapport: dan blijven de meegegeven cijfers staan. */
  bijhouden?: boolean;
}) {
  /* De beslissing of er iets te tonen valt staat bewust BUITEN het rapport, en
     het bijhouden zit erin. Zolang er te weinig data is bestaat het rapport dus
     niet, en wordt er ook niets opgehaald: geen enkel verzoek voor een sectie
     die toch verborgen is. */
  if (!cijfers) return null;
  if (urenUit(cijfers.minuten) < DREMPELS.uren) return null;
  return <Rapport begin={cijfers} bijhouden={bijhouden} />;
}

function Rapport({ begin, bijhouden }: { begin: Cijfers; bijhouden: boolean }) {
  const { cijfers, anker } = useBijgehoudenCijfers(begin, bijhouden);

  const uren = urenUit(cijfers.minuten);
  if (uren < DREMPELS.uren) return null;

  const toonLeerkrachten = cijfers.leerkrachten >= DREMPELS.leerkrachten;

  return (
    <section ref={anker} className="relative overflow-x-clip">
      {/* Eén zacht vlak, groter dan het kaartje en eronder, zodat zijn rand
         nergens door de inhoud snijdt. */}
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="kiezel"
        breedte={880}
        hoogte={420}
        style={{ left: "-10%", top: -30, transform: "rotate(4deg)" }}
        className="-z-10 hidden lg:block"
        tel={4}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-6 lg:pb-24">
        <Confetti punten={[{ x: "92%", y: "22%", r: 4, amber: true }]} />

        {/* Kaartje links, de herkomst als kanttekening rechts. Twee kleine
           dingen die samen de breedte pakken, in plaats van één groot vlak. */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-14">
          <div data-reveal className="rp-map shrink-0">
            <article className="rp-kaart">
              <h2 className="rp-titel">Rapport van Avinka</h2>
              <div aria-hidden className="rp-lijn" />

              <p className="rp-hoofd">
                <Waarde getal={uren} eenheid="uur" groot />
              </p>
              <p className="rp-onder">
                teruggegeven
                {toonLeerkrachten && (
                  <>
                    {" "}
                    aan <Waarde getal={cijfers.leerkrachten} /> leerkrachten
                  </>
                )}
              </p>

              {/* De stempel valt over de rand van het kaartje heen. Dat is wat
                 hem gedrukt laat lijken in plaats van geplaatst: niemand
                 stempelt netjes binnen de lijntjes. */}
              <Stempel />
            </article>
          </div>

          <p data-reveal className="max-w-sm text-base leading-7 text-ink/65">
            Opgeteld uit het werk dat de tools overnemen: rapporten, oudercontact,
            toetsanalyse, lesvoorbereiding. Werk van na schooltijd. Het loopt bij
            zolang je hier bent.
          </p>
        </div>
      </div>

      <RapportStijl />
    </section>
  );
}

function RapportStijl() {
  return (
    <style>{`
      /* ── het mapje en het kaartje ──
         ⚠️ Dit was een vel over de volle breedte met drie regels, een
         handgeschreven opmerking en een label erboven. Te groots en te veel
         informatie: een kaartje met één zin doet hetzelfde werk. Wat eruit
         ging: de regel "uitwerkingen gemaakt" (het minst zeggende getal) en de
         opmerking van de leerkracht. Die laatste om een tweede reden: hij
         suggereerde dat een echte leerkracht dat gezegd had, en op deze pagina
         staan al verzonnen quotes die vóór livegang weg moeten. */
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

      /* ⚠️ Hier hebben twee perforatiegaatjes gestaan, om het kaartje als
         blad uit een map te laten lezen. Weggehaald na bekijken: op de rand
         van een klein kaartje, mét de mint van de map er direct achter, lees
         je geen gaten maar bobbels. Niet opnieuw proberen zonder de map te
         verplaatsen. */

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
        /* Evenwichtig afbreken: zonder dit viel "leerkrachten" als los woord
           op een tweede regel. */
        text-wrap: balance;
        /* ruimte vrijhouden voor de stempel rechtsonder */
        padding-right: clamp(52px, 5.4vw, 68px);
      }
      /* Het tweede getal staat IN de zin, niet op een eigen regel. Zo blijft
         het één mededeling in plaats van een lijstje. */
      .rp-klein {
        font-weight: 800;
        color: ${KOP};
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

      /* ── de beweging: het kaartje wordt ingevuld ──
         Alles hangt aan .is-in van de GROEP, niet aan een reveal per element.
         🔑 De waarnemer kijkt per element en de vertraging telt vanaf het
         moment dat dát element de drempel passeert; met losse reveals starten
         elementen die in dezelfde scrollstap binnenkomen tegelijk en is de
         volgorde weg.

         ⚠️ De inhoud staat standaard gewoon zichtbaar. Eerder stond hier
         opacity nul tot de reveal-klasse kwam, en dan staat het kaartje er bij
         een haperende waarnemer mét kop maar ZONDER cijfer. Het eerste
         keyframe doet het verbergen; het kaartje zit op dat moment nog in zijn
         eigen reveal, dus je ziet er niets van knipperen. */
      .anim .rp-map.is-in .rp-inkt {
        animation: rpInkt 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .anim .rp-map.is-in .rp-hoofd .rp-inkt { animation-delay: 0.16s; }
      .anim .rp-map.is-in .rp-onder .rp-inkt { animation-delay: 0.32s; }
      @keyframes rpInkt {
        from { opacity: 0; transform: translateY(7px); }
        to   { opacity: 1; transform: none; }
      }

      /* De stempel valt als laatste, met de korte pop die DESIGN.md voor het
         vinkje voorschrijft: onder 300ms, vanaf ongeveer 1.2, nooit vanaf 0.
         ⚠️ Niet later zetten: wie doorscrolt mist anders het slotakkoord. */
      .anim .rp-map.is-in .rp-stempel {
        animation: rpStempel 0.26s cubic-bezier(0.3, 1.5, 0.5, 1) 0.62s both;
      }
      @keyframes rpStempel {
        from { opacity: 0; transform: rotate(-21deg) scale(1.3); }
        to   { opacity: 0.72; transform: rotate(-13deg) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        .rp-inkt, .rp-stempel { animation: none !important; opacity: 1 !important; }
        .rp-stempel { opacity: 0.72 !important; }
      }
    `}</style>
  );
}

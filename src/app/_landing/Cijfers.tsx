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

  /* De "vakken" van het rapport. Alleen wat de drempel haalt komt op het vel;
     een rapport met één regel is beter dan een regel met een mager getal. */
  const regels: Array<{ vak: string; getal: number; eenheid?: string; groot?: boolean }> = [
    { vak: "Tijd teruggegeven", getal: uren, eenheid: "uur", groot: true },
  ];
  if (cijfers.leerkrachten >= DREMPELS.leerkrachten)
    regels.push({ vak: "Leerkrachten geholpen", getal: cijfers.leerkrachten });
  if (cijfers.uitwerkingen >= DREMPELS.uitwerkingen)
    regels.push({ vak: "Uitwerkingen gemaakt", getal: cijfers.uitwerkingen });

  return (
    <section ref={anker} className="relative overflow-x-clip">
      {/* 🔑 Dit vlak is GROTER dan het rapport en ligt eronder. Een eerdere
         versie had een vorm waarvan de rand precies door de inhoud sneed; een
         vorm die de inhoud volledig omvat geeft het vel juist iets om op te
         liggen en heeft nergens een rand die iets doorknipt. */}
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="kiezel"
        breedte={1180}
        hoogte={560}
        style={{ right: "-16%", top: -50, transform: "rotate(-3deg)" }}
        className="-z-10 hidden lg:block"
        tel={5}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-6 lg:pb-24">
        <Confetti punten={[{ x: "3%", y: "18%", r: 4, amber: true }, { x: "97%", y: "84%", r: 5 }]} />

        {/* Het mapje. Het vel schuift er met een transform net uit, zodat het
           mint langs de onderkant en de rechterkant zichtbaar blijft: één
           element dat diepte én kleur geeft, zonder er een rekwisiet bij te
           halen. */}
        <div data-reveal className="rp-map">
          <article className="rp-vel">
            <header className="rp-kop">
              <h2 className="rp-titel">Het rapport van Avinka</h2>
              {/* Bewust GEEN schooljaar: de cijfers tellen alles bij elkaar,
                 dus een periode op het vel zou een claim zijn die niet klopt. */}
              <p className="rp-periode">opgemaakt door alle leerkrachten samen</p>
            </header>

            <div className="rp-body">
              <dl className="rp-regels">
                {regels.map((r) => (
                  <div key={r.vak} className={`rp-regel ${r.groot ? "is-groot" : ""}`}>
                    <dt className="rp-vak">{r.vak}</dt>
                    {/* De stippellijn van een voorgedrukt formulier. Puur
                       decoratief, dus buiten de voorleesvolgorde. */}
                    <span aria-hidden className="rp-leider" />
                    <dd className="rp-cijfer">
                      <Waarde getal={r.getal} eenheid={r.eenheid} groot={r.groot} />
                    </dd>
                  </div>
                ))}
              </dl>

              <aside className="rp-opmerking">
                <p className="rp-oplabel">opmerking van de leerkracht</p>
                {/* Geen grapje om het grapje: dit is een claim die elders op de
                   pagina ook staat en die klopt (de tool rekent, de AI schrijft
                   alleen de taal eromheen). */}
                <p className="rp-hand">Rekent zelf. Verzint nooit een getal.</p>
                <div className="rp-stempelvak">
                  <Stempel />
                </div>
              </aside>
            </div>
          </article>
        </div>

        {/* Bronvermelding. Elke geloofwaardige teller die we bekeken hebben
           heeft er een: een getal zonder herkomst is een claim. */}
        <p data-reveal className="mt-7 max-w-2xl text-base leading-7 text-ink/65">
          Opgeteld uit het werk dat de tools overnemen: rapporten, oudercontact,
          toetsanalyse, lesvoorbereiding. Werk van na schooltijd. Het rapport
          loopt bij zolang je hier bent.
        </p>
      </div>

      <RapportStijl />
    </section>
  );
}

function RapportStijl() {
  return (
    <style>{`
      /* ── het mapje en het vel ── */
      .rp-map {
        background: ${MINT};
        border-radius: 14px;
        transform: rotate(-0.9deg);
        box-shadow: ${schaduw(26, 52, -26, 0.42)};
      }
      .rp-vel {
        background: #fffefb;
        /* Een document heeft scherpere hoeken dan een UI-kaart. Op 12px las
           dit vel als een card; op 5px als papier. */
        border-radius: 5px;
        /* ⚠️ Stond op -11/-13 en dan was de mint een groene schaduw in plaats
           van een mapje. Verder eruit geschoven, en het vel staat schever dan
           de map zodat je twee losse voorwerpen ziet en geen dubbele rand. */
        transform: translate(-22px, -26px) rotate(1.15deg);
        padding: clamp(22px, 3vw, 40px) clamp(22px, 3.4vw, 46px);
        box-shadow: ${schaduw(20, 44, -22, 0.34)};
      }

      /* ── de kop van het formulier ── */
      .rp-kop {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px 20px;
        border-bottom: 2px solid rgba(var(--w-schaduw-rgb, 23,80,58), 0.13);
        padding-bottom: clamp(14px, 1.8vw, 22px);
      }
      .rp-titel {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.03em;
        line-height: 1.05;
        font-size: clamp(1.7rem, 3.1vw, 2.6rem);
        color: ${DONKER};
      }
      /* ⚠️ Deze twee kleine labels stonden op 0,55 en 0,5 dekking. Op wit is
         dat ongeveer 3,2:1 bij een letter van 15 pixels, en daar geldt de eis
         van 4,5:1. Op 0,62 halen ze 4,7:1. Nagemeten in de browser. */
      .rp-periode {
        font-size: clamp(0.95rem, 1.3vw, 1.05rem);
        color: rgba(34, 28, 58, 0.62);
      }

      /* ── de body: regels links, opmerking rechts ── */
      .rp-body {
        display: grid;
        gap: clamp(24px, 3vw, 44px);
        padding-top: clamp(18px, 2.2vw, 28px);
      }
      @media (min-width: 900px) {
        /* Zo blijft het vel breed en laag in plaats van langwerpig: de
           opmerking staat naast de regels, niet eronder. */
        .rp-body { grid-template-columns: minmax(0, 1fr) minmax(230px, 20rem); }
      }

      /* ⚠️ De rechterkolom (handschrift + stempel) is hoger dan de regels, en
         met een vaste tussenruimte bleef er linksonder een gat van tachtig
         pixels staan. De regels verdelen zich nu over de volle hoogte. */
      .rp-regels {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: clamp(10px, 1.4vw, 18px);
        min-height: 100%;
      }
      .rp-regel { display: flex; align-items: baseline; gap: 10px; }
      .rp-vak {
        font-size: clamp(1rem, 1.45vw, 1.15rem);
        font-weight: 600;
        color: rgba(34, 28, 58, 0.78);
        white-space: nowrap;
      }
      /* De stippellijn van een voorgedrukt formulier. Hij hangt aan de
         basislijn van de tekst, niet aan het midden van de regel; anders
         zweeft hij los tussen label en cijfer. */
      .rp-leider {
        flex: 1 1 auto;
        min-width: 18px;
        border-bottom: 2px dotted rgba(34, 28, 58, 0.22);
        transform: translateY(-0.32em);
      }
      .rp-cijfer {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.035em;
        line-height: 0.95;
        color: ${DONKER};
        white-space: nowrap;
      }
      .rp-groot { font-size: clamp(2.5rem, 5.4vw, 4.1rem); }
      .rp-klein { font-size: clamp(1.5rem, 2.7vw, 2.15rem); color: ${KOP}; }
      /* De eenheid hoort BIJ het getal en is geen los label in een eigen
         kolom. Als los woord viel "uur" na drie letters stil en bleef er een
         gat rechts naast de hoofdregel staan. */
      .rp-eenheid {
        font-size: 0.4em;
        font-weight: 800;
        letter-spacing: 0;
        margin-left: 0.1em;
        color: ${KOP};
      }

      /* ── de opmerking ── */
      .rp-opmerking { position: relative; }
      @media (min-width: 900px) {
        /* 🔑 Geen streepje maar een VOUW. Een rechte lijn tussen twee kolommen
           is een tabelrand; een haarlijn met een zachte schaduw aan de ene
           kant en een lichtrand aan de andere leest als papier dat een keer
           dubbelgevouwen is geweest. Dat verkoopt het vel als vel, en het
           kost één regel meer dan een border. */
        .rp-opmerking {
          padding-left: clamp(24px, 2.8vw, 38px);
          border-left: 1px solid rgba(var(--w-schaduw-rgb, 23,80,58), 0.16);
        }
        /* ⚠️ De schaduw van de vouw MOET een los laagje zijn. Met een
           box-shadow op de kolom zelf legt de browser hem om het hele blok
           heen, en dan leest de rechterkolom als een tweede kaart bovenop het
           vel: precies de kaart-in-kaart die DESIGN.md verbiedt. Dit laagje
           ligt alleen links van de vouwlijn en dooft naar buiten uit. */
        .rp-opmerking::before {
          content: "";
          position: absolute;
          left: -15px;
          top: -14px;
          bottom: -14px;
          width: 15px;
          pointer-events: none;
          background: linear-gradient(
            to right,
            rgba(var(--w-schaduw-rgb, 23,80,58), 0) 0%,
            rgba(var(--w-schaduw-rgb, 23,80,58), 0.075) 100%
          );
        }
      }
      .rp-oplabel {
        font-size: 0.95rem;
        color: rgba(34, 28, 58, 0.62);
        margin-bottom: 0.5rem;
      }
      .rp-hand {
        font-family: var(--font-hand), cursive;
        font-size: clamp(1.35rem, 2.1vw, 1.7rem);
        line-height: 1.35;
        color: ${KOP};
        /* het schrijven: van links naar rechts vrijkomen */
        clip-path: inset(0 0 0 0);
      }
      /* Een stempel wordt ergens neergedrukt, hij staat niet netjes in een
         vakje. Deze zakt onder de tekst door en steekt links buiten de
         kolomlijn, alsof iemand hem schuin heeft aangedrukt. */
      .rp-stempelvak { margin-top: clamp(14px, 1.8vw, 22px); }
      @media (min-width: 900px) {
        .rp-stempelvak { margin-left: clamp(-46px, -3.4vw, -26px); }
      }
      .rp-stempel {
        width: clamp(58px, 6vw, 74px);
        height: auto;
        color: var(--color-brand, #2f9e6e);
        /* doorschijnende inkt: een stempel drukt nooit helemaal vol af */
        opacity: 0.7;
        transform: rotate(-13deg);
      }

      /* ── de beweging: het formulier wordt ingevuld ──
         Alles hangt aan .is-in van de GROEP (het mapje), niet aan een reveal
         per element. 🔑 De waarnemer kijkt per element en de vertraging telt
         vanaf het moment dat dát element de drempel passeert; met losse
         reveals starten elementen die in dezelfde scrollstap binnenkomen dus
         tegelijk, en dan is de volgorde weg. */
      /* ⚠️ Hier stond opacity:0 op de cijfers, het handschrift en de
         stempel zolang de reveal nog niet gestart was. Dat is precies de val
         waar de ontwerpregel voor waarschuwt: inhoud onzichtbaar maken in
         afwachting van een klasse. Start de waarnemer om wat voor reden dan
         ook niet, dan staat het vel er mét regels maar ZONDER cijfers.
         Nu staat alles standaard gewoon zichtbaar en begint de animatie pas
         op het moment dat .is-in erbij komt (het eerste keyframe zet de
         doorzichtigheid dan zelf op nul). Het vel zit op dat moment nog in
         zijn eigen reveal, dus je ziet er niets van knipperen. */
      .anim .rp-map.is-in .rp-inkt {
        animation: rpInkt 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .anim .rp-map.is-in .rp-regel:nth-child(1) .rp-inkt { animation-delay: 0.18s; }
      .anim .rp-map.is-in .rp-regel:nth-child(2) .rp-inkt { animation-delay: 0.30s; }
      .anim .rp-map.is-in .rp-regel:nth-child(3) .rp-inkt { animation-delay: 0.42s; }
      @keyframes rpInkt {
        from { opacity: 0; transform: translateY(7px); }
        to   { opacity: 1; transform: none; }
      }

      /* Het handschrift komt van links vrij, alsof het geschreven wordt. */
      .anim .rp-map.is-in .rp-hand {
        animation: rpSchrijf 0.8s cubic-bezier(0.35, 0.6, 0.25, 1) 0.54s both;
      }
      @keyframes rpSchrijf {
        from { opacity: 1; clip-path: inset(0 100% 0 0); }
        to   { opacity: 1; clip-path: inset(0 0 0 0); }
      }

      /* De stempel valt als laatste, met de korte pop die DESIGN.md voor het
         vinkje voorschrijft: onder 300ms, vanaf ongeveer 1.2, nooit vanaf 0. */
      .anim .rp-map.is-in .rp-stempel {
        animation: rpStempel 0.26s cubic-bezier(0.3, 1.5, 0.5, 1) 1.12s both;
      }
      @keyframes rpStempel {
        from { opacity: 0; transform: rotate(-21deg) scale(1.3); }
        to   { opacity: 0.7; transform: rotate(-13deg) scale(1); }
      }

      /* Een verse waarde die later binnenkomt gebruikt dezelfde inkt. Dit
         geldt ook als de reveal al geweest is, want de sleutel van het element
         verandert en de animatie start opnieuw. */
      .anim .rp-map.is-in .rp-inkt { will-change: opacity, transform; }

      @media (prefers-reduced-motion: reduce) {
        .rp-inkt, .rp-hand, .rp-stempel { animation: none !important; opacity: 1 !important; }
        .rp-stempel { opacity: 0.7 !important; }
        .rp-hand { clip-path: none !important; }
      }
    `}</style>
  );
}

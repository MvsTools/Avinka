"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Confetti, DONKER, Golf, KOP, KOP_SECTIE, MINT, MINT_LICHT, VLAK_MINT, KaartVlak, schaduw } from "./Wereld";
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

   EERLIJKHEID: DE STATUS DOET DIT WERK, NIET EEN DREMPEL
   Hier stonden DREMPELS: elke regel verscheen pas boven een ondergrens (100
   uur / 15 leerkrachten / 250 uitwerkingen) en haalde de bovenste het niet,
   dan bleef de hele sectie weg. Dat was de enige manier om te voorkomen dat er
   "3 leerkrachten" op de voorpagina stond.
   De sectie staat nu ALTIJD, en de eerlijkheid komt uit de STATUS erboven: hoe
   lang we live zijn. Een klein getal is geen zwakte meer maar een leeftijd —
   "40 leerkrachten, 6 dagen live" is sterker dan hetzelfde getal zonder
   context. ⚠️ Dat werkt alleen zolang die status er ECHT staat en klopt; laat
   het cijferblok dus nooit zonder status achter.

   ⏳ BEKEND PLAFOND, BEWUST NIET NU OPGELOST
   Dit telt ALLES bij elkaar en stopt nooit. Met 2 uur per week per leerkracht:
   30 leerkrachten = 3.100 uur per jaar, 1000 leerkrachten = 104.000 per jaar.
   Na een paar jaar op schaal is het een kilometerstand en voelt niemand het
   verschil tussen 312.000 en 340.000. De oplossing als het zover is: tel de
   afgelopen 30 dagen in plaats van alles (kolom `per_dag` op `statistiek`
   heeft de data al, alleen een nieuwe SQL-functie nodig). Eigenaar heeft 3-8
   bewust gekozen dit later te doen.
   ────────────────────────────────────────────────────────────────────────── */

/* ── 🔴 DE DAG DAT AVINKA LIVE GING ────────────────────────────────────────
   Zet hier de datum van de livegang, als "JJJJ-MM-DD". Zolang dit `null` is
   (of de datum nog in de toekomst ligt) staat er "Nog niet live".

   ⚠️ DIT IS EEN GO-LIVE-HANDELING. Vergeet je hem, dan zegt de voorpagina op
   de dag van de lancering nog steeds dat we niet live zijn. Hij staat daarom
   ook in de go-live-checklist. Eén regel, geen deploy-truc: de datum verandert
   nooit meer nadat hij één keer klopt. */
const LIVE_VANAF: string | null = null;

/* ── Hoeveel dagen zijn we live? ────────────────────────────────────────────
   🔑 DIT MOET OP DE SERVER EN IN DE BROWSER HETZELFDE UITREKENEN, anders
   klaagt React bij het aankoppelen dat de tekst niet klopt. Daarom niet
   rekenen met de klok van de bezoeker (die zit in Tokio of op een verkeerd
   gezette laptop) maar met de kalender van Amsterdam: beide kanten vragen
   dezelfde tijdzone om de datum van vandaag en vergelijken twee kale
   datumstrings. Die geven allebei hetzelfde antwoord, waar de bezoeker ook zit.

   Rekenen in hele dagen op de UTC-middernacht van beide datums, zodat de
   zomertijd er niet tussendoor fietst (23- en 25-uursdagen). */
function dagenLive(vanaf: string | null, nu: Date = new Date()): number | null {
  if (!vanaf) return null;
  const vandaag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(nu);
  const dagnummer = (datum: string) => Math.floor(Date.parse(`${datum}T00:00:00Z`) / 86_400_000);
  const verschil = dagnummer(vandaag) - dagnummer(vanaf);
  return Number.isNaN(verschil) ? null : verschil;
}

/* De status in woorden. Bewust kort en zonder uitroepteken: het is een
   statusregel op een rapport, geen aankondiging. */
function statusTekst(dagen: number | null) {
  if (dagen === null || dagen < 0) return "Nog niet live";
  if (dagen === 0) return "Vandaag live gegaan";
  if (dagen === 1) return "1 dag live";
  return `${dagen.toLocaleString("nl-NL")} dagen live`;
}

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

/* ── Eén cijfer dat kan doorrollen ──────────────────────────────────────────
   Verandert dit cijfer, dan schuift het oude eruit en het nieuwe erin. Alleen
   het cijfer dat écht verandert beweegt; bij 1.284 → 1.285 rolt dus alleen de
   laatste. Dat is wat een scorebord doet en het is de enige eerlijke manier om
   beweging te tonen: we verzinnen geen tussenstanden, we laten zien dat er iets
   verspringt op het moment dat het verspringt. */
const ROL_MS = 460;

function Rol({ teken }: { teken: string }) {
  const [staat, setStaat] = useState({ toont: teken, vorig: teken, rolt: false, beurt: 0 });

  /* Tijdens het renderen bijstellen in plaats van in een effect: React
     ondersteunt dat voor "state aanpassen als een prop verandert" en het
     scheelt een renderronde (react-hooks/set-state-in-effect). */
  if (staat.toont !== teken) {
    const stil =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStaat({ toont: teken, vorig: staat.toont, rolt: !stil, beurt: staat.beurt + 1 });
  }

  const { toont, vorig, rolt, beurt } = staat;
  useEffect(() => {
    if (!rolt) return;
    const t = setTimeout(() => setStaat((s) => ({ ...s, rolt: false })), ROL_MS);
    return () => clearTimeout(t);
  }, [rolt, beurt]);

  return (
    <span className="rp-rol">
      {rolt && <span className="rp-rol-uit">{vorig}</span>}
      <span className={rolt ? "rp-rol-in" : undefined}>{toont}</span>
    </span>
  );
}

/* ── Eén waarde op het bord ─────────────────────────────────────────────────
   Bij binnenkomst verschijnt hij als verse inkt; daarna rolt hij per cijfer.
   ELK cijfer krijgt een vakje, op alle drie de kaartjes. Eerst had alleen het
   grote getal ze, om de rangorde te bewaren, maar dan is het geen scorebord
   maar één kaartje met een trucje. De rangorde komt nu uit de MAAT en de
   KLEUR van de kaartjes, niet uit het weglaten van de vakjes. */
/* Hoeveel de cijfers krimpen naarmate het getal langer wordt. Tot en met vier
   cijfers verandert er niets; daarboven een wortel, zodat het kaartje wel
   meegroeit maar niet het hele cluster uit elkaar duwt en de cijfers leesbaar
   blijven (5 cijfers = 89%, 7 cijfers = 76%). */
function cijferSchaal(aantalCijfers: number) {
  return aantalCijfers <= 4 ? 1 : Math.max(0.72, Math.sqrt(4 / aantalCijfers));
}

function Waarde({ getal, eenheid, groot }: { getal: number; eenheid?: string; groot?: boolean }) {
  const geschreven = getal.toLocaleString("nl-NL");
  const tekens = geschreven.split("");
  const aantalCijfers = tekens.filter((t) => t !== ".").length;
  /* De sleutel is de POSITIE VAN RECHTS. Op de positie van links zou bij
     999 → 1.000 elke kaart een plek verspringen en rolt het hele getal om in
     plaats van alleen de cijfers die echt veranderen. */
  const sleutelVoor = (i: number) => tekens.slice(i + 1).filter((t) => t !== ".").length + 1;

  return (
    <span
      className={`rp-inkt ${groot ? "rp-groot" : "rp-klein"}`}
      style={{ "--schaal": cijferSchaal(aantalCijfers).toFixed(3) } as CSSProperties}
    >
      {/* Het getal één keer, leesbaar, voor de schermlezer. De losse cijfers
         hieronder staan op aria-hidden: die zouden anders als "1 punt 2 8 4"
         worden voorgelezen. */}
      <span className="sr-only">
        {geschreven}
        {eenheid ? ` ${eenheid}` : ""}
      </span>
      <span aria-hidden className="rp-rij">
        {tekens.map((teken, i) =>
          teken === "." ? (
            /* De duizendtalpunt is geen vakje: een punt in een cijfervakje kan
               net zo goed een cijfer zijn dat toevallig omrolt. */
            <span key={`p${i}`} className="rp-punt" />
          ) : (
            <span key={sleutelVoor(i)} className="rp-cel">
              <Rol teken={teken} />
            </span>
          ),
        )}
        {eenheid && <span className="rp-eenheid">{eenheid}</span>}
      </span>
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
  /* De enige reden om de sectie helemaal weg te laten: er is geen data. Dat is
     een storing (de database antwoordde niet), geen ontwerpkeuze — een
     landingspagina die stukloopt op een teller is erger dan een zonder teller.
     Kleine getallen zijn géén reden meer om weg te blijven; die krijgen hun
     context van de status. */
  if (!cijfers) return null;
  return <Rapport begin={cijfers} bijhouden={bijhouden} />;
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
}: {
  begin: Cijfers;
  bijhouden: boolean;
}) {
  const { cijfers, anker, seconden } = useBijgehoudenCijfers(begin, bijhouden);

  const uren = urenUit(cijfers.minuten);
  const dagen = dagenLive(LIVE_VANAF);
  const isLive = dagen !== null && dagen >= 0;

  return (
    <section ref={anker} className="relative overflow-x-clip">
      {/* ⚠️ HIER STONDEN TWEE ACHTERGRONDVLAKKEN, EN DIE MOESTEN WEG.
         De mintlaag hieronder is ONDOORZICHTIG vanaf 40% van de sectie: hij
         vult zijn hele vak met mint en legt daar een papieren golf overheen.
         Alles wat erachter ligt wordt daardoor op die grens kaarsrecht
         afgesneden, en dat is precies wat er met het vlak rechtsboven
         gebeurde: het liep van 40 tot 370 pixel en werd op 197 pixel
         doormidden geknipt.

         🔑 REGEL: een achtergrondvorm en een gekleurd veld in dezelfde sectie
         gaan niet samen, tenzij de vorm BOVEN het veld ligt in de tint van dat
         veld. Alternatief uit de aantekeningen is multiply met #f5f8f5, maar
         dat is eerder afgekeurd als te aanwezig.

         Ze zijn hier gewoon weg. De sectie heeft ze niet nodig: er liggen vier
         gekleurde kaartjes en een golf, en die pale vlakken maakten de golf
         juist slechter leesbaar omdat mint en papier maar een paar procent
         schelen. */}

      {/* ⚠️ DE GOLF VIEL WEG, EN DIT IS WAAROM.
         Het mintvlak liep van 48% tot de sectiegrens: 219 pixels. De golf zelf
         is 210 pixels hoog, dus er bleef 9 pixel mint over. De dalen van de
         golf reikten daardoor tot vlak boven de sectiegrens en het laatste
         stuk was over de volle breedte papier; pas ná de grens begon de mint
         van de prijzen. Resultaat: een kaarsrechte lijn op de sectierand in
         plaats van een golf. Nagemeten met een kleurscan op drie x-posities.
         🔑 REGEL: een golf heeft ALTIJD een flinke laag van zijn eigen kleur
         onder zich nodig, anders knipt de sectiegrens hem af.

         ⚠️ EN HET MOET ÉÉN DOORLOPEND VELD ZIJN. Eerst begon de mint
         halverwege deze sectie, en dan is het een bandje: erboven papier,
         eronder mint. Dat leest als decoratie in plaats van als overgang.
         Het mintveld loopt nu van de bovenrand van deze sectie onafgebroken
         door de prijzen heen tot aan de veelgestelde vragen: één golf erin,
         één golf eruit (die laatste zit in PrijzenVragen).

         🔑 DE GOLF STEEKT BOVEN DE SECTIE UIT, en dat is de enige manier om
         het veld al bij de bovenrand te laten beginnen. Golf tekent zijn
         papieren kam namelijk IN de bovenkant van het mintvak; zit dat vak
         binnen de sectie, dan begint de mint pas onder die kam en heb je weer
         een bandje. Met een negatieve top valt de kam in de ruimte erboven en
         loopt de mint door tot de rand. Het vlak dat daar uit de
         ervaringen-sectie hangt wordt dan door de GOLF afgesneden in plaats
         van door een rechte sectiegrens, en zo hoort het op deze pagina. */}
      <div
        /* ⚠️ Hoe ver hij omhoog mag steken is een MEETKWESTIE, geen smaak: de
           papieren band van de golf valt in de ervaringen-sectie en mag de
           polaroids daar niet raken. Op 768px kwam de onderrand van een
           polaroid tot vlak op de kam; deze waarden houden op elke gemeten
           breedte lucht (390, 600, 768, 900, 1100, 1280, 1440). */
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[-115px] sm:top-[-175px]"
        aria-hidden
      >
        <div className="absolute inset-0" style={{ background: MINT_LICHT }} />

        {/* Dit vlak kwam uit de ervaringen-sectie, waar het dwars door de
           polaroids van Kim en Eva heen liep. Hier hoort het: het staat
           BOVEN de mint maar ONDER de golf, dus de golf snijdt het precies op
           de mintrand af en je ziet een vorm die onder het veld vandaan komt
           in plaats van een snede. Exact dezelfde ingreep als het vlak
           linksboven bij "Veilig omgaan met AI".
           🔑 De volgorde in deze laag is dus de hele truc: mint, dan het vlak,
           dan de golf. Staat het vlak ná de golf, dan ligt het eroverheen. */}
        <KaartVlak
          kleur={VLAK_MINT}
          vorm="koepel"
          breedte={660}
          hoogte={370}
          style={{ right: "-13%", top: 55, transform: "rotate(5deg)" }}
          className="hidden lg:block"
          tel={4}
        />
        {/* Telefoonversie: zelfde vorm en kant, ongeveer half zo groot. Ook hier
           staat het vlak VÓÓR de golf in dezelfde laag; daardoor snijdt de golf
           hem op de mintrand af in plaats van dat hij eroverheen ligt. */}
        <KaartVlak
          kleur={VLAK_MINT}
          vorm="koepel"
          breedte={350}
          hoogte={195}
          style={{ right: "-30%", top: 36, transform: "rotate(5deg)" }}
          className="lg:hidden"
          tel={4}
        />

        {/* Vorm "zacht": een rustige dubbele deining die links en rechts op
           dezelfde hoogte begint en eindigt. Hij was als enige nog ongebruikt,
           en dat is geen toeval maar beleid: elke overgang op deze pagina
           heeft zijn eigen golfvorm, anders leest de decoratie als een
           sjabloon. "speels" stond hier eerst, maar dat is de golf van de
           polaroids een sectie hoger, én hij loopt zo schuin weg dat hij bij
           deze hoogte als een schuine streep las in plaats van als een golf. */}
        <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="zacht" hoogte="h-[145px] sm:h-[230px]" />
        {/* ⚠️ Deze sectie sluit ALTIJD zelf af, ook als de prijzen (ook mint)
           hierna komen. Eerder liep het mintveld dan gewoon door tot in de
           prijzensectie — één ononderbroken band die "Avinka in cijfers" en
           "Eén vast bedrag" tot één grote vlek samensmolt, terwijl het
           inhoudelijk twee aparte secties zijn. De twee mintvelden krijgen nu
           allebei hun eigen golf: dicht hier, en de prijzen openen zelf weer
           met hun eigen entree (zie zonderTopgolf in PrijzenVragen.tsx, dat
           om dezelfde reden is teruggedraaid). */}
        <Golf kleur="var(--w-papier, #fcfbf7)" vorm="rust" hoogte="h-[70px] sm:h-[110px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 pt-10 lg:pb-32 lg:pt-12">
        {/* ⚠️ HET AMBERSTIPJE OP 2%/22% LAG BOVENOP HET LEVENDE STIPJE, EN DAT
           WAS GEEN TOEVAL. Het .rp-stip-hartslagje stond ooit los in een
           pilletje op het rapport en is pas later naar de "bijgewerkt"-regel
           verhuisd (zie de aantekening bij die regel hieronder) — regelrecht
           naar de plek waar dit decoratieve punt al stond. Twee ronde puntjes
           vlak op elkaar, allebei linksboven, lazen als één vieze vlek.
           Het punt staat nu in de LINKSONDERHOEK, in de vaste padding-bottom
           van dit blok (pb-28/pb-32, dus altijd 112/128px lege ruimte ná het
           rapport-cluster, op elke breedte). Dat is geen schatting op basis
           van hoe hoog het cluster wordt — het is een garantie: die padding
           blijft leeg, ook als het cluster meegroeit met grotere cijfers.
           Meteen ook de hoek die tot nu toe leeg bleef terwijl rechtsonder al
           een punt stond (95%/72%, verderop). */}
        <Confetti
          punten={[
            { x: "2%", y: "95%", r: 4, amber: true },
            /* Dit punt stond op y=8%, vlak naast de kop op x=63%. De kop is
               groot (tot 2,75rem) en "Avinka in cijfers" kan op een smal
               scherm als 390px al een flink deel van de kolombreedte vullen,
               dus was niet met zekerheid te zeggen dat de tekst daar nooit tot
               x=63% reikt. Zelfde garantie als hierboven: in de padding VÓÓR
               de kop (dezelfde 40/48px) staat op geen enkele breedte tekst,
               dus dat scheelt het giswerk. */
            { x: "63%", y: "2%", r: 4 },
            /* Dit punt lag al vrij en blijft staan. Op de volle 1104px
               kolombreedte eindigt het rapport-cluster rond 1092px (zie de
               nagerekende breedtes verderop in dit bestand), dus 95%
               (≈1094px) valt net ná de kaartjes. Op mobiel staan de kaartjes
               nooit breder dan de smalste kaart plus wat lucht, dus ook daar
               blijft rechts ruimte over. Groeien de kaartjes verder mee met
               grotere cijfers, dan wipt het cluster naar een nieuwe rij
               (bestaande regel, zie de breedte-aantekening bij .rp-bron) in
               plaats van dit stipje te bereiken. */
            { x: "95%", y: "72%", r: 5, amber: true },
          ]}
        />

        {/* Kop links, de stand van het bijwerken rechts: de plek waar je op
           een dashboard kijkt of iets nog actueel is. */}
        {/* ⚠️ "bijgewerkt" stond helemaal rechts naast de kop, ver van het
           enige dat bijgewerkt wordt. Het hoort bij het rapport, dus staat het
           nu er vlak boven: kop, dan de stand, dan de papieren. */}
        <h2 data-reveal className={`${KOP_SECTIE} rp-sectiekop`}>Avinka in cijfers</h2>
        {/* 🔑 HET STIPJE HOORT HIER, BIJ HET WOORD "BIJGEWERKT".
           Het zat eerst in een pilletje "live" op het rapport zelf, en dat
           botste zodra de statuspil erbij kwam: twee keer het woord live vlak
           naast elkaar, met twee verschillende betekenissen (de CIJFERS lopen
           bij ↔ het PRODUCT is live). Het stipje gaat over het bijhouden, dus
           het staat nu op de regel die daarover gaat, en het woord "live" is
           vrijgemaakt voor de status. Twee lagen blijven: een rustige hartslag
           ("dit staat aan") en een felle tik op het moment van een controle. */}
        <p data-reveal className="rp-bijgewerkt">
          <span
            aria-hidden
            key={seconden === 0 ? "puls" : "stil"}
            className={`rp-stip rp-klopt ${seconden === 0 ? "rp-puls" : ""}`}
          />
          bijgewerkt <span className="rp-tel">{seconden < 3 ? "zojuist" : `${seconden} s geleden`}</span>
        </p>

        {/* De papieren op het bureau: het rapport en de losse briefjes ernaast,
           elk onder een eigen hoek. Dat is wat deze hoek een statistiekenhoekje
           maakt in plaats van één kaart met een lap tekst ernaast. */}
        <div data-reveal className="rp-cluster">
          <article className="rp-kaart">
              {/* Geen h2: de sectie heeft nu zijn eigen kop, en twee koppen
                 vlak boven elkaar is er een te veel. Dit is de titel van het
                 document, niet van de sectie. */}
              <div className="rp-kop">
                <p className="rp-titel">Rapport van Avinka</p>
                {/* ── DE STATUS ──────────────────────────────────────────────
                   Hoe lang Avinka bestaat, op het document waar de cijfers op
                   staan. Dat is de plek waar hij zijn werk doet: hij zegt niet
                   "kijk eens hoeveel", maar "kijk eens hoeveel, in zó korte
                   tijd". Op een rapport is een periode bovendien een normaal
                   veld — het staat er niet bij als mededeling maar als kopje.
                   Vóór de lancering is het een eerlijke waarschuwing dat deze
                   getallen van de bouwers zelf komen. */}
                <span className={`rp-status ${isLive ? "rp-status-live" : "rp-status-nog"}`}>
                  {statusTekst(dagen)}
                </span>
              </div>
              <div aria-hidden className="rp-lijn" />

              <p className="rp-hoofd">
                <Waarde getal={uren} eenheid="uur" groot />
              </p>
              {/* ⚠️ Twee eerdere versies: "teruggegeven na schooltijd" (las
                 stroef) en "bespaard op werk na schooltijd" (te omslachtig).
                 "Administratie" is het woord waar een leerkracht meteen iets
                 bij voelt, en het dekt precies wat de tools overnemen. Dat het
                 om werk van ná schooltijd gaat zit er nu impliciet in: dáár
                 doe je je administratie. */}
              <p className="rp-onder">administratie bespaard</p>

              {/* De stempel valt over de rand van het kaartje heen. Dat is wat
                 hem gedrukt laat lijken in plaats van geplaatst: niemand
                 stempelt netjes binnen de lijntjes. */}
            <Stempel />
          </article>

          <div className="rp-briefjes">
            <Briefje getal={cijfers.leerkrachten} label="leerkrachten" />
            <Briefje getal={cijfers.uitwerkingen} label="keer afgevinkt" />
          </div>

          {/* De verantwoording, óók op papier. Als losse regel tekst naast
             drie kaartjes hoorde hij er niet bij; nu is het het vierde stuk
             papier op het bureau, met een eigen hoek. De toon is zakelijker
             dan de vorige versie ("opgebouwd uit al het toolgebruik, en het
             loopt bij zolang je hier bent") omdat dit het stuk is dat vertrouwen
             moet wekken, en daar past spreektaal slecht bij. */}
          <div className="rp-bron">
            {/* ⚠️ Hier stond het kopje "verantwoording". Eruit: het woord is
               ambtelijk en het kaartje heeft geen titel nodig, want de zin
               zelf vertelt al wat het is. */}
            <p className="rp-brontekst">
              Gemeten bij elk stuk werk dat de tools afronden, opgeteld over alle
              gebruikers.
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
      /* ⚠️ DE BREEDTES ZIJN NAGEREKEND EN MOETEN NAGEREKEND BLIJVEN. Alles
         samen moet onder de 1104 van de tekstkolom blijven, anders wipt de
         uitleg naar een tweede rij onder de kaart en blijft rechts alles leeg.
         Dat is al twee keer gebeurd: één keer met te veel tussenruimte, en één
         keer toen de kaartjes met hun getal mee gingen groeien (373 + 469 +
         222 + 2x34 = 1132). Nu: 373 + 30 + 447 + 30 + 205 = 1085.
         🔑 Meet bij een wijziging hier het AANTAL RIJEN, niet alleen de
         breedtes — die tellen op zonder dat je het ziet. */
      .rp-bijgewerkt {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin-top: 0.45rem;
        margin-bottom: clamp(18px, 2.2vw, 28px);
        font-size: clamp(0.9rem, 1.15vw, 1rem);
        font-weight: 600;
        color: rgba(34, 28, 58, 0.62);
      }

      /* ⚠️ De maat staat NIET meer hier maar in KOP_SECTIE (Wereld.tsx): deze
         kop stond op clamp(1,875rem, 3,4vw, 2,75rem) = 44px en was daarmee
         12px kleiner dan de meeste andere sectiekoppen. Hier blijft alleen de
         kleur; de klasse wordt naast KOP_SECTIE gezet. */
      .rp-sectiekop { color: ${DONKER}; }

      .rp-cluster {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: clamp(16px, 2.1vw, 30px);
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

      /* ── DE KAARTJES ─────────────────────────────────────────────────────
         ⚠️ Het waren rechthoekige documenten met scherpe hoeken en een harde
         schaduw, en dat is precies waarom ze niet bij de site pasten. De
         kaartvorm van deze wereld is groot en rond (KAART in Wereld.tsx:
         2,5rem radius met een grote zachte groengetinte schaduw) en de
         achtergrondvormen zijn blobs met ONGELIJKE radii. Vier keer dezelfde
         witte rechthoek is dus geen verzameling maar een tabel.

         Wat er nu gebeurt:
         - elk kaartje heeft zijn EIGEN ongelijke radius, dus geen twee
           dezelfde vorm. Dat is het blob-idioom van de pagina.
         - elk kaartje heeft zijn EIGEN kleur uit het palet: wit voor het
           hoofddocument, mint, donkergroen en crème. Samen een verzameling in
           plaats van vier kopieën. Donkere kaarten zijn al onderdeel van deze
           pagina (de toolkaarten in de galerij).
         - de schaduw is die van de wereld: groot, zacht en groengetint, in
           plaats van de strakke UI-schaduw die er stond.
         ─────────────────────────────────────────────────────────────────── */
      .rp-kaart, .rp-briefje, .rp-bron {
        position: relative;
        box-shadow: ${schaduw(34, 74, -44, 0.5)};
        transform: rotate(var(--hoek, 0deg)) translateY(var(--lift, 0px));
        transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
          box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
      }
      /* 🔑 Ga je er met de muis over, dan gaat het kaartje rechter liggen en
         komt het omhoog: je pakt het op. Hoek en hoogte staan in variabelen
         zodat de hover ze kan bijstellen zonder ze te overschrijven. Dezelfde
         beweging als de toolkaarten in de galerij, dus geen nieuw idioom. */
      .rp-kaart:hover, .rp-briefje:hover, .rp-bron:hover {
        transform: rotate(calc(var(--hoek, 0deg) * 0.3))
          translateY(calc(var(--lift, 0px) - 6px));
        box-shadow: ${schaduw(44, 92, -44, 0.55)};
      }

      /* het hoofddocument */
      /* ⚠️ Dit stond op een VASTE breedte, en dan groeit een langer getal
         gewoon zijn kaartje uit. Nagemeten: "9.412" liep er nu al 23 pixel
         overheen en "100.000" zou er 108 overheen lopen. Met een minimum in
         plaats van een vaste maat groeit het kaartje mee. */
      .rp-kaart {
        --hoek: -1.2deg;
        min-width: clamp(272px, 31vw, 368px);
        background: #ffffff;
        border-radius: 2.6rem 1.5rem 2.4rem 1.7rem;
        padding: clamp(24px, 2.6vw, 34px) clamp(24px, 2.8vw, 36px)
                 clamp(28px, 3vw, 38px);
      }
      /* Wrap staat aan omdat de status een langere tekst kan krijgen dan het
         oude pilletje "live": op het smalste kaartje (272px) zou de titel
         anders over twee regels worden geknepen om de status naast zich te
         houden. Nu zakt de status er netjes onder. */
      .rp-kop {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px 10px;
      }
      /* ── de status ──
         Het kopje van het rapport: hoe lang dit product bestaat. Twee standen,
         want ze zeggen iets anders. LIVE is een mededeling in de huiskleur;
         NOG NIET LIVE is een voorbehoud, en die krijgt amber — op deze pagina
         is amber al de kleur van "let op / dit nog niet" (zie de iconen bij
         "Veilig omgaan met AI"). Zo hoeft er geen woord bij om te zeggen dat
         het een andere soort mededeling is.
         Contrast nagerekend op het witte kaartje: het amberwasje wordt #fdf0d8
         en met deze inkt is dat 5,4:1, ruim boven de 4,5 die deze maat vraagt. */
      .rp-status {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        flex: none;
        padding: 0.2rem 0.6rem 0.24rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        font-variant-numeric: tabular-nums;
      }
      /* 0,16 en niet de 0,12 van het oude pilletje: naast het amberwasje van de
         andere stand las het groen als een half zichtbaar label, en dan zou de
         status zwaarder wegen naarmate het slechtere nieuws is. Beide standen
         even aanwezig. Nagerekend op wit: 5,6:1. */
      .rp-status-live {
        background: rgba(47, 158, 110, 0.16);
        color: ${KOP};
      }
      .rp-status-nog {
        background: rgba(245, 158, 11, 0.16);
        color: #8a5206;
      }
      .rp-titel {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.025em;
        line-height: 1.15;
        font-size: clamp(1.15rem, 1.7vw, 1.35rem);
        color: ${DONKER};
      }
      .rp-lijn {
        height: 2px;
        margin: clamp(14px, 1.6vw, 18px) 0 clamp(16px, 1.8vw, 22px);
        background: rgba(var(--w-schaduw-rgb, 23,80,58), 0.14);
      }
      .rp-hoofd {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.04em;
        line-height: 0.9;
        color: ${DONKER};
      }
      /* 🔑 Meegroeien is niet genoeg: bij zes cijfers wordt het kaartje zó
         breed dat het het cluster uit elkaar duwt. Vanaf VIJF cijfers krimpt
         de letter daarom mee, met een wortel zodat het nooit onleesbaar wordt
         (5 cijfers = 89%, 7 cijfers = 76%). Onder de vijf verandert er niets. */
      .rp-groot { font-size: calc(clamp(2.5rem, 4.6vw, 3.3rem) * var(--schaal, 1)); }

      /* ── het scorebord ───────────────────────────────────────────────────
         Elk cijfer in een eigen vakje, op alle drie de kaartjes. Dat is wat
         een aflezing onderscheidt van een stuk tekst: je ziet dat er posities
         zijn die kunnen verspringen, ook als ze op dit moment stilstaan. */
      .rp-rij { display: inline-flex; align-items: baseline; gap: 0.06em; }
      .rp-cel {
        display: inline-flex;
        justify-content: center;
        padding: 0.1em 0.14em 0.12em;
        border-radius: 0.28em;
        background: rgba(47, 158, 110, 0.09);
      }
      /* Het vakje moet op elke kaartkleur leesbaar blijven, dus het is per
         kaart een andere tint: donkerder op mint, lichter op donkergroen. Eén
         vaste kleur zou op het donkere kaartje verdwijnen. */
      .rp-briefje:nth-child(1) .rp-cel { background: rgba(var(--w-schaduw-rgb, 23,80,58), 0.1); }
      .rp-briefje:nth-child(2) .rp-cel { background: rgba(255, 255, 255, 0.11); }
      /* De duizendtalpunt krijgt bewust geen vakje: een punt in een
         cijfervakje kan net zo goed een cijfer zijn dat toevallig omrolt. */
      .rp-punt {
        position: relative;
        width: 0.26em;
        align-self: stretch;
      }
      .rp-punt::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 0.18em;
        width: 0.11em;
        height: 0.11em;
        margin-left: -0.055em;
        border-radius: 9999px;
        background: currentColor;
      }

      /* ── het doorrollen ──
         Alleen het cijfer dat écht verandert beweegt: bij 1.284 → 1.285 rolt
         de laatste en staan de andere stil. Dat is het verschil tussen een
         aflezing en een animatie: er beweegt precies zoveel als er gebeurt. */
      .rp-rol {
        position: relative;
        display: inline-block;
        overflow: hidden;
        font-variant-numeric: tabular-nums;
      }
      .rp-rol > span { display: block; }
      .rp-rol-uit {
        position: absolute;
        inset: 0;
        animation: rpRolUit ${ROL_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      .rp-rol-in { animation: rpRolIn ${ROL_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes rpRolUit {
        from { transform: translateY(0); opacity: 1; }
        to   { transform: translateY(-108%); opacity: 0; }
      }
      @keyframes rpRolIn {
        from { transform: translateY(108%); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }
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
        font-size: clamp(1rem, 1.35vw, 1.12rem);
        font-weight: 600;
        line-height: 1.45;
        color: rgba(34, 28, 58, 0.8);
        /* Evenwichtig afbreken: zonder dit viel "schooltijd" als los woord op
           een tweede regel. */
        text-wrap: balance;
        /* ruimte vrijhouden voor de stempel rechtsonder */
        padding-right: clamp(52px, 5.4vw, 68px);
      }

      /* ── de twee losse cijfers, elk een eigen kleur en vorm ── */
      /* ⚠️ De inhoud stond links terwijl het kaartje een MINIMUM-breedte heeft.
         Bij een kort getal als "37" bleef er dan rechts een gat staan en hing
         alles scheef in het vlak. Op een scorebord-tegel hoort het getal
         gecentreerd; het rapport en de uitleg blijven links, want dat zijn
         documenten en die lees je van links naar rechts. */
      .rp-briefje {
        min-width: clamp(150px, 15vw, 185px);
        padding: clamp(16px, 1.9vw, 22px) clamp(18px, 2vw, 24px);
        text-align: center;
      }
      .rp-briefje:nth-child(1) {
        --hoek: -2.6deg;
        --lift: clamp(-30px, -2.4vw, -16px);
        background: ${MINT};
        border-radius: 1.5rem 2.3rem 1.4rem 2.1rem;
      }
      .rp-briefje:nth-child(2) {
        --hoek: 2.1deg;
        --lift: clamp(16px, 2.2vw, 28px);
        background: ${DONKER};
        border-radius: 2.2rem 1.4rem 2.2rem 1.5rem;
      }
      .rp-briefgetal {
        display: block;
        font-family: var(--font-display), Georgia, serif;
        font-weight: 900;
        letter-spacing: -0.035em;
        line-height: 0.95;
        color: ${DONKER};
      }
      .rp-klein { font-size: calc(clamp(2.05rem, 3.1vw, 2.8rem) * var(--schaal, 1)); }
      .rp-brieflabel {
        display: block;
        margin-top: 0.15rem;
        font-size: clamp(0.95rem, 1.2vw, 1.05rem);
        font-weight: 700;
        letter-spacing: -0.005em;
        color: ${KOP};
      }
      /* Op het donkere kaartje draait de inkt om. */
      .rp-briefje:nth-child(2) .rp-briefgetal { color: #fdf9f0; }
      .rp-briefje:nth-child(2) .rp-brieflabel { color: rgba(255, 255, 255, 0.72); }
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
        --hoek: -1.8deg;
        width: clamp(172px, 16vw, 205px);
        /* crème: de vierde kleur van de verzameling */
        background: var(--color-cream, #fbf6ee);
        border-radius: 2rem 1.4rem 2.2rem 1.3rem;
        padding: clamp(17px, 1.9vw, 22px) clamp(18px, 2vw, 24px);
        box-shadow: ${schaduw(12, 28, -14, 0.24)};
        /* een derde hoek, anders liggen twee papieren precies parallel */
        --hoek: -1.5deg;
      }
      /* De letters op dit kaartje zijn voller dan op de rest. Als lichte
         kleine tekst las het als de kleine lettertjes onderaan een formulier,
         terwijl het juist het stuk is dat vertrouwen moet wekken. Het label
         staat in de koplettertype van de pagina, net als de titel van het
         rapport, zodat het als kop van een document leest en niet als bijschrift.
         ⚠️ De kleuren zijn NIET meegegaan in het verzwaren: 0,62 en 0,80 halen
         4,6:1 en 8,3:1. Zwaarder mág lichter, maar hieronder wordt het weer
         krap bij deze lettergroottes. */
      /* ⚠️ Hier stond een amberkleurige kantlijn, als de rode marge van
         schoolpapier. Eruit op verzoek: op een crème kaartje met blobvorm las
         hij als een losse streep in plaats van als papierdetail. */

      /* ⚠️ OP EEN TELEFOON OVER DE VOLLE BREEDTE. De vaste breedte hierboven
         (172-205px) hoort bij een breed bureau, waar dit het vierde losse
         papiertje tussen de andere is. Onder elkaar geplaatst wordt datzelfde
         briefje het enige smalle ding onderaan, met een half scherm leegte
         ernaast - de eigenaar: "valt een beetje buiten de boot".
         🔑 Het bleef opvallen omdat de rest van het bord op een telefoon WEL
         meeschaalt: de andere drie vullen de kolom, dit briefje niet. Een vaste
         breedte tussen meeschalende buren valt altijd op, ook als de maat op
         zichzelf klopt. Kijk bij zo'n los element dus niet naar het element maar
         naar wat ernaast staat.
         De hoek en de crèmekleur blijven: die maken er papier van, en dat is
         precies wat het moet zijn. Alleen de breedte volgt nu de kolom.
         (GEEN BACKTICKS in dit commentaar - dit stijlblok staat in een
         template-string.) */
      @media (max-width: 639px) {
        .rp-bron { width: 100%; }
      }

      .rp-bronlabel {
        font-family: var(--font-display), Georgia, serif;
        font-weight: 800;
        letter-spacing: -0.01em;
        font-size: clamp(0.95rem, 1.15vw, 1.05rem);
        /* 0,62 gaf op wit 4,63:1, maar dit kaartje is crème en dat is net
           donkerder: daar zakte hetzelfde label naar 4,52 en dat is te dicht
           op de grens van 4,5. Op 0,66 zit er weer marge in. */
        color: rgba(34, 28, 58, 0.66);
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
      /* ⚠️ Eerder klopte dit stipje alleen op het moment van een controle, en
         dat is precies één keer per halve minuut: je ziet het nooit en dan
         zegt "live" niets. Nu twee lagen. De HARTSLAG loopt door zolang het
         kaartje in beeld is en zegt "dit staat aan"; de TIK springt er
         bovenop op het moment dat er echt gekeken is.
         Dit is de enige doorlopende beweging op de pagina, en hij verdient
         het: een live-teken dat stilstaat is een leugen. Bij
         prefers-reduced-motion valt hij weg en blijft het stipje gewoon staan. */
      .rp-klopt { animation: rpKlop 2.2s cubic-bezier(0.4, 0, 0.3, 1) infinite; }
      @keyframes rpKlop {
        0%        { box-shadow: 0 0 0 0 rgba(47, 158, 110, 0.45); }
        55%, 100% { box-shadow: 0 0 0 8px rgba(47, 158, 110, 0); }
      }
      /* De tik bij een controle: korter en feller, en hij wint van de
         hartslag omdat hij later in het stijlblad staat. */
      .rp-puls { animation: rpPuls 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
      @keyframes rpPuls {
        0%   { box-shadow: 0 0 0 0 rgba(47, 158, 110, 0.7); transform: scale(1.5); }
        100% { box-shadow: 0 0 0 12px rgba(47, 158, 110, 0); transform: scale(1); }
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
        /* Het oppakken vervalt; de schaduw mag wel meebewegen, dat is geen
           verplaatsing. */
        .rp-kaart, .rp-briefje, .rp-bron { transition: box-shadow 0.4s ease; }
        .rp-kaart:hover, .rp-briefje:hover, .rp-bron:hover {
          transform: rotate(var(--hoek, 0deg)) translateY(var(--lift, 0px));
        }
        .rp-inkt, .rp-stempel, .rp-puls, .rp-klopt,
        .rp-rol-uit, .rp-rol-in { animation: none !important; }
        /* zonder animatie mag het oude cijfer niet blijven hangen */
        .rp-rol-uit { display: none !important; }
        .rp-inkt, .rp-stempel { opacity: 1 !important; }
        .rp-stempel { opacity: 0.72 !important; }
      }
    `}</style>
  );
}

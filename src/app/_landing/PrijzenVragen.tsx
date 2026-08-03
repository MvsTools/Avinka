"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PLANNEN, PROEF_DAGEN, planById, prijsTekst, type PlanId } from "@/lib/abonnement";
import {
  BlobKnop,
  Confetti,
  DONKER,
  Golf,
  KAART,
  KaartVlak,
  KOP,
  MINT_LICHT,
  RUIS_OP_PAPIER,
  VLAK_MINT,
  VLAK_PAPIER,
} from "./Wereld";

/* ── Prijzen en vragen in de taal van /nieuw5 ────────────────────────────────
   Deze twee secties kwamen nog uit de oude opzet: gecentreerde koppen en
   witte doosjes met randjes, precies het generieke SaaS-recept. Ze zijn hier
   opnieuw opgebouwd uit de bouwstenen van de wereld.

   Belangrijk: de gedeelde `components/Prijzen.tsx` blijft ongemoeid, want die
   hangt óók onder de echte landing (src/app/page.tsx). Wat je hier ziet is een
   eigen versie voor /nieuw5; de inhoud (pakketten, prijzen, voordelen) komt
   nog steeds uit dezelfde ene bron, lib/abonnement.

   Waarom deze twee samen in één bestand: ze vormen samen het ritme van de
   staart van de pagina. Vóór deze verbouwing lagen maker, ervaringen, prijzen
   én vragen allemaal op hetzelfde gespikkelde papier — vier secties en zo'n
   3700 pixels dezelfde ondergrond tot aan het donkere slot. Prijzen is nu een
   eigen mintveld (zwaar, met kaarten) en de vragen zijn juist het lichtste
   blok van de pagina (geen kaders, alleen haarlijnen). Zwaar, dan licht, dan
   het donkere slot. ───────────────────────────────────────────────────────── */

/* Het merkvinkje in een zacht groen schijfje: hetzelfde gebaar als de vinkjes
   op de toolkaarten en in de film, maar klein genoeg voor een opsomming. */
function Vinkje() {
  return (
    <span
      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/12"
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="var(--color-brand, #2f9e6e)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

/* ── 1. Prijzen ────────────────────────────────────────────────────────────
   ⚠️ DE PRIJZEN STAAN ER ALTIJD, VOOR IEDEREEN.
   Hier stond eerst: wie al betaalt hoeft geen prijzen te zien, dus dan valt de
   hele sectie weg. Dat was rommelig — de pagina veranderde van vorm zonder dat
   je begreep waarom, en wie wilde overstappen kon dat vanaf de voorpagina
   nergens meer zien. De sectie past zich nu aan in plaats van te verdwijnen.

   Vijf standen, allemaal met dezelfde drie kaarten:
     niet ingelogd        → alles kiesbaar ("Probeer gratis")
     proef (of verlopen)  → idem; je moet nog kiezen
     Start               → Start grijs, "Upgrade naar Compleet" / "naar Pro"
     Compleet            → Start + Compleet grijs, "Upgrade naar Pro"
     Pro                 → alle drie grijs; je bent er al

   De rangorde start → compleet → pro is de enige aanname hier: een pakket
   lager dan het jouwe zit al ín het jouwe ("Alles van Start", "Alles van
   Compleet"), dus dat is geen keuze meer maar iets wat je al hebt. Verandert
   die volgorde ooit, dan verandert RANG mee. ────────────────────────────── */

/* De volgorde waarin de pakketten op elkaar stapelen. Bewust niet de index in
   PLANNEN: die staat toevallig in dezelfde volgorde, maar dat is een
   presentatiekeuze en geen afspraak. */
const RANG: Record<PlanId, number> = { start: 0, compleet: 1, pro: 2 };

/* De naam zoals hij op de kaart staat, uit dezelfde ene bron. Niet zelf
   "Start"/"Compleet"/"Pro" intikken: dan lopen de kaart en de zin uit elkaar
   zodra een pakket ooit anders gaat heten. */
function naamVan(plan: PlanId) {
  return planById(plan)?.naam ?? plan;
}

type KaartStand =
  | { soort: "kiesbaar" }
  | { soort: "huidig" }
  | { soort: "inbegrepen" }
  | { soort: "upgrade" };

function standVoor(plan: PlanId, huidigPlan: PlanId | null): KaartStand {
  if (!huidigPlan) return { soort: "kiesbaar" };
  if (plan === huidigPlan) return { soort: "huidig" };
  return RANG[plan] < RANG[huidigPlan] ? { soort: "inbegrepen" } : { soort: "upgrade" };
}

/* ── Waar het mintveld ophoudt ─────────────────────────────────────────────
   De golf moet vlak onder de €5,99 landen. Dat punt is in CSS niet uit te
   drukken: hoe ver het boven de onderkant van de sectie ligt verschilt per
   breedte (de kaarten wikkelen anders en stapelen onder 640px) en per bezoeker
   (de introzin erboven is korter of langer). Vaste pixelwaarden per breekpunt
   heb ik geprobeerd — die klopten op 1440 en zaten er op 390 ruim duizend
   pixels naast, en ze verlopen stilletjes zodra er één zin bij komt.
   Daarom wordt het één keer gemeten en opnieuw bij elke maatverandering.

   ⚠️ De ResizeObserver vuurt zelf al af direct na observe(), dus de eerste
   meting komt daar ook vandaan. Geen setState synchroon in het effect. */
/* Hoever de onderkant van de laag bóven het bedrag moet liggen, zodat de golf
   zelf er nét ONDER valt. De golf is 92px hoog (op élke breedte gelijk, anders
   verschuift dit punt mee); zijn rand ligt gemiddeld 30px boven de onderkant
   van de laag en deint ±9. Met 45 komt de rand dus 6 tot 24 pixels onder het
   bedrag uit — ruim vóór de eerste opsommingsregel, die nog eens zo'n 30px
   lager begint. Verander je de golfhoogte, herbereken dan dit getal. */
const GOLF_MARGE = 45;

function useVeldTotHetBedrag() {
  const sectie = useRef<HTMLElement>(null);
  const bedrag = useRef<HTMLSpanElement>(null);
  const [veldBodem, setVeldBodem] = useState<number | null>(null);

  useEffect(() => {
    const s = sectie.current;
    const b = bedrag.current;
    if (!s || !b) return;
    const kijker = new ResizeObserver(() => {
      /* ⚠️ Met getBoundingClientRect() ging dit mis: de kaarten komen binnen
         met een scroll-reveal, en zolang die transform loopt zit het bedrag
         tientallen pixels van zijn eigen plek. offsetTop/offsetHeight kijken
         naar de layout en trekken zich van transforms niets aan, dus die
         geven het rustpunt — ook als er op dat moment nog iets beweegt. */
      let y = 0;
      for (let n: HTMLElement | null = b; n && n !== s; n = n.offsetParent as HTMLElement | null) {
        y += n.offsetTop;
      }
      setVeldBodem(s.offsetHeight - (y + b.offsetHeight) - GOLF_MARGE);
    });
    kijker.observe(s);
    return () => kijker.disconnect();
  }, []);

  return { sectie, bedrag, veldBodem };
}

export function WereldPrijzen({
  zonderTopgolf = false,
  huidigPlan = null,
}: {
  zonderTopgolf?: boolean;
  /* Het betaalde pakket dat deze bezoeker nú heeft, of null: uitgelogd, in de
     proef, of verlopen. Alleen dit bepaalt welke kaarten dichtgaan. */
  huidigPlan?: PlanId | null;
}) {
  // false = maandelijks, true = per schooljaar (juli en augustus gratis)
  const [jaar, setJaar] = useState(false);
  const { sectie, bedrag, veldBodem } = useVeldTotHetBedrag();

  return (
    <section ref={sectie} id="prijzen" className="relative overflow-hidden">
      {/* ── Het mintveld loopt tot halverwege de kaarten ─────────────────────
         Het veld vulde eerst de hele sectie én liep door tot in de vragen, en
         dat werd één lange baan van ruim tweeduizend pixels. Nu stopt hij vlak
         onder de €5,99: de kaarten komen met hun bovenkant uit het veld en
         staan met hun onderkant op papier, net als de makerskaart hogerop.

         🔑 Waar hij precies stopt wordt gemeten, niet vastgezet — zie
         useVeldTotHetBedrag hierboven. De waarden in de klasse zijn alleen de
         schatting voor het allereerste beeld, vóór die meting binnen is; ze
         mogen er dus best een stukje naast zitten. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 bottom-[1619px] overflow-hidden sm:bottom-[607px] lg:bottom-[541px]"
        style={veldBodem == null ? undefined : { bottom: veldBodem }}
        aria-hidden
      >
        <div className="absolute inset-0" style={{ background: MINT_LICHT }} />

        {/* Twee zachte vlakken tint-op-tint: één links achter de kop, één
           rechts op de rand. Bewust in de zachtste tint — hier staan al drie
           kaarten, dus de achtergrond hoeft alleen de hoeken te dragen.
           Ze staan binnen deze laag en vóór de golf, zodat de golf ze op de
           kleurrand afsnijdt in plaats van dat ze het papier in steken. */}
        <KaartVlak
          kleur={VLAK_MINT}
          vorm="wig"
          breedte={780}
          hoogte={340}
          style={{ left: "-14%", top: 150, transform: "rotate(-5deg)" }}
          className="hidden lg:block"
          tel={2}
        />
        <KaartVlak
          kleur={VLAK_MINT}
          vorm="ei"
          breedte={620}
          hoogte={360}
          style={{ right: "-10%", bottom: -120, transform: "rotate(7deg)" }}
          className="hidden lg:block"
          tel={5}
        />

        {/* ⚠️ Deze golf MOET vlak zijn. Hij moet landen in het gat tussen de
           prijs en de eerste opsommingsregel, en dat is maar zo'n 32px hoog;
           `ribbel` deint 36px en sneed dus dwars door het bedrag. `rust` deint
           26px en past precies. */}
        {/* De 92 staat er voluit en niet als variabele: Tailwind leest de
           klassennamen uit de broncode, dus een samengestelde naam levert geen
           CSS op en de golf zou onzichtbaar zijn. Zie GOLF_MARGE hierboven —
           die twee getallen horen bij elkaar. */}
        <Golf kleur="var(--w-papier, #fcfbf7)" vorm="rust" hoogte="h-[92px]" />
      </div>

      {/* Rustige entree van bovenaf. Andere vorm dan de golf hieronder: twee
         keer dezelfde maakt van het veld een gestempelde band.
         ⚠️ Hij vervalt als de cijfersectie hierboven al in mint eindigt: dan
         zou hij een papieren strook tussen twee mintvelden tekenen, en dat
         leest als een naad. Landing.tsx bepaalt dat. */}
      {!zonderTopgolf && (
        <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="hapMidden" hoogte="h-[70px] sm:h-[120px]" />
      )}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 pt-24 lg:pb-32 lg:pt-28">
        {/* Over de hele strook van de kaartenrij tot en met de prijzen lag geen
           enkel stipje meer, terwijl ze bovenin de pagina juist dicht bij
           elkaar staan. Twee is hier genoeg. */}
        <Confetti punten={[{ x: "-2%", y: "6%", r: 4, amber: true }, { x: "99%", y: "62%", r: 5 }]} />
        {/* De kop staat links op de tekstkolom en de schakelaar rechts op
           dezelfde regel: één balk in plaats van drie gecentreerde blokken
           onder elkaar. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          {/* Hier stond "en wat kost het" in handschrift boven de kop. Weg:
             dat opstapje stond in zes van de negen secties en werd daarmee
             een sjabloon in plaats van een signatuur — en boven een kop die
             letterlijk over het bedrag gaat, voegde het niets toe. */}
          <div className="max-w-2xl">
            <h2
              data-reveal
              className="font-display text-[clamp(2.25rem,4.4vw,3.5rem)] font-black leading-[1.02] tracking-tight [text-wrap:balance]"
              style={{ color: DONKER }}
            >
              {/* ⚠️ Hier stond "Onbeperkt gebruik." Dat is niet waar: er zit een
                 verbruiksplafond op een account, als slot tegen misbruik en
                 accountdelen. De gedeelde components/Prijzen.tsx is daar op
                 383de45 al voor gecorrigeerd; deze kopie was meegekomen met de
                 oude tekst en is bij het overzetten naar de echte voorpagina
                 blijven staan. Beloof geen onbeperktheid die er niet is. */}
              Eén vast bedrag. Geen verrassingen.
            </h2>
            {/* Wie al betaalt heeft niets aan een uitnodiging om te beginnen;
               die wil weten waar hij staat en wat de stap omhoog is. Alleen
               deze twee regels verschillen per stand — de kop, de kaarten en
               de schakelaar blijven voor iedereen hetzelfde. */}
            {huidigPlan ? (
              <p data-reveal className="mt-5 text-lg leading-8 text-ink/75">
                Je hebt {naamVan(huidigPlan)}.{" "}
                {huidigPlan === "pro"
                  ? "Dat is het volledige pakket; hieronder zie je wat erin zit."
                  : "Wil je meer, dan stap je hieronder over. Je betaalt dan het verschil vanaf de volgende maand."}
              </p>
            ) : (
              <p data-reveal className="mt-5 text-lg leading-8 text-ink/75">
                Je begint met {PROEF_DAGEN} dagen gratis proberen, zonder
                betaalgegevens. Daarna kies je het abonnement dat bij je past.
              </p>
            )}
            {/* De derde plek waar de belofte van bovenaan de pagina landt: op
               het moment dat iemand naar het bedrag kijkt. Bewust gekoppeld
               aan Compleet (€9,99) en niet aan Start — dat is één tool, dus
               daar zouden die twee uur niet kloppen.
               Vervalt zodra iemand al betaalt: dan is het geen belofte meer
               maar een verkoopregel aan een bestaande klant. */}
            {!huidigPlan && (
              <p data-reveal className="mt-4 text-lg font-bold" style={{ color: KOP }}>
                Elke week zo&apos;n 2 uur terug, voor minder dan een tientje per maand.
              </p>
            )}
          </div>

          {/* Bij Pro valt er niets meer te kiezen — geen enkele kaart is nog
             een aanbod — en dan is een maand/schooljaar-schakelaar een knop
             die niets doet. Weg ermee; bij Start en Compleet bepaalt hij wél
             hoe je de upgrade afrekent en blijft hij staan. */}
          {huidigPlan !== "pro" && <Schakelaar jaar={jaar} setJaar={setJaar} />}
        </div>

        <div className="mt-14 grid items-stretch gap-6 sm:grid-cols-3 lg:gap-7">
          {PLANNEN.map((plan, i) => {
            const stand = standVoor(plan.id, huidigPlan);
            /* Dicht = je hebt dit al, of het zit al in wat je hebt. Dan is de
               kaart geen aanbod meer maar informatie. */
            const dicht = stand.soort === "huidig" || stand.soort === "inbegrepen";
            /* De held-uitlichting (chip + blob) hangt puur aan `plan.held`,
               niet aan `dicht`. Die twee eerder wél aan elkaar knopen gaf een
               kaart die van uiterlijk verschilde per bezoeker — precies wat
               niet de bedoeling is: de kaart blijft in alle standen identiek,
               alleen de knop onderin verandert. */
            const uitgelicht = Boolean(plan.held);
            /* Blijft er nog maar één stap over (Compleet-klant die alleen naar
               Pro kan), dan is dat de enige actie op de pagina en verdient hij
               het volle gewicht, ook al is Pro niet de held. */
            const enigeUpgrade =
              stand.soort === "upgrade" &&
              PLANNEN.filter((p) => standVoor(p.id, huidigPlan).soort === "upgrade").length === 1;

            return (
            <div
              key={plan.id}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}
              className={`relative ${plan.held ? "sm:-my-5" : ""}`}
            >
              {/* Hier stond een uitvergrote kaartvorm achter de held (MINT,
                 -inset-x-7/-inset-y-6). Die moest weg: de held wordt nu alleen
                 nog aangewezen door de chip en zijn iets grotere kaart. */}

              {/* ⚠️ De kaart zelf blijft ALTIJD hetzelfde — wit, dezelfde
                 tekstkleuren, geen "grijs geworden"-behandeling. Dat is
                 bewust: het pakket dat je al hebt verandert niet van kleur
                 omdat je het al hebt, en drie kaarten die per bezoeker een
                 andere ondergrond krijgen lezen sneller als drie verschillende
                 dingen dan als dezelfde tabel in een andere stand. Alleen de
                 knop onderin verandert; zie daar. */}
              <div className={`relative flex h-full flex-col p-8 ${plan.held ? "sm:py-11" : ""} ${KAART}`}>
                {/* De chip staat naast de naam en niet als sticker over de
                   bovenrand: zo blijft de namenrij van de drie kaarten op
                   dezelfde lijn en leest het als deel van de kaart. */}
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-black tracking-tight" style={{ color: DONKER }}>
                    {plan.naam}
                  </h3>
                  {uitgelicht && (
                    <span
                      className="shrink-0 bg-accent px-3 py-1 text-[0.6875rem] font-black uppercase tracking-wide text-ink"
                      style={{ borderRadius: "0.9rem 0.6rem 1rem 0.7rem" }}
                    >
                      Meest gekozen
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink/55">{plan.tagline}</p>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span
                    /* Het eerste bedrag (€5,99) is het ankerpunt waar de golf
                       van het mintveld op wordt afgeregeld. Zie
                       useVeldTotHetBedrag bovenaan dit bestand. */
                    ref={i === 0 ? bedrag : undefined}
                    className="font-display text-[3.25rem] font-black leading-none tracking-tight text-ink"
                  >
                    {prijsTekst(plan.prijsMaand)}
                  </span>
                  <span className="text-ink/50">p/m</span>
                </p>
                {/* Vaste hoogte, ook als de regel er niet staat: anders
                   springen de drie kaarten los van elkaar zodra je schakelt. */}
                <p className="mt-2 min-h-[1.5rem] text-sm font-semibold" style={{ color: KOP }}>
                  {jaar ? "Juli en augustus gratis" : ""}
                </p>

                <ul className="mt-6 flex-1 space-y-3.5">
                  {plan.voordelen.map((punt) => (
                    <li key={punt} className="flex gap-3 leading-7 text-ink/80">
                      <Vinkje />
                      <span>{punt}</span>
                    </li>
                  ))}
                </ul>

                {/* Alleen dít verandert er als je al betaalt: de rest van de
                   kaart blijft precies zoals hij is. */}
                {dicht ? (
                  /* Geen knop maar een strook: er valt niets te klikken, en
                     iets wat eruitziet als een knop maar niets doet is erger
                     dan geen knop. Zelfde hoogte als een kleine BlobKnop, dus
                     de drie kaarten blijven op één lijn eindigen. Zachte tint
                     in plaats van wit, zodat hij zich van een echte knop
                     onderscheidt zonder dat de rest van de kaart meeverandert. */
                  <p
                    className="blobknop mt-8 flex w-full items-center justify-center gap-2.5 px-5 py-3.5 text-center text-base font-bold"
                    style={{ background: "var(--w-vlak-veld, #e3efe7)", color: DONKER }}
                  >
                    <Vinkje />
                    {stand.soort === "huidig" ? "Je huidige abonnement" : "Zit hier al in"}
                  </p>
                ) : (
                  <BlobKnop
                    /* Overstappen gebeurt in het dashboard, waar de betaling
                       en de opzegtermijn staan; de voorpagina stuurt er alleen
                       naartoe. Nieuwe bezoekers gaan naar het aanmelden. */
                    href={
                      stand.soort === "upgrade"
                        ? /* wijzig=1 klapt de pakketten daar meteen open (anders
                             sta je op een scherm waar je eerst "Wijzig" moet
                             zoeken) en vorm= neemt de maand/schooljaar-keuze
                             van hierboven mee, zodat je 'm niet twee keer maakt. */
                          `/dashboard/abonnement?wijzig=1&vorm=${jaar ? "jaar" : "maand"}`
                        : jaar
                          ? "/sign-up?plan=jaar"
                          : "/sign-up?plan=maand"
                    }
                    variant={uitgelicht || enigeUpgrade ? "vol" : "licht"}
                    maat="klein"
                    className="mt-8 w-full"
                  >
                    {stand.soort === "upgrade" ? `Upgrade naar ${plan.naam}` : "Probeer gratis"}
                  </BlobKnop>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* ink/55 haalde 3,63:1 op het mintveld en dat is onder de AA-grens
           van 4,5 voor tekst van deze grootte. */}
        <p className="mt-12 text-sm text-ink/70">
          {jaar
            ? "Per schooljaar: je betaalt gewoon maandelijks, maar juli en augustus zijn gratis."
            : "Alle abonnementen zijn maandelijks opzegbaar."}
        </p>
      </div>

      {/* Hier stond de afsluitende golf van deze sectie. Die is niet meer
         nodig: het mintveld eindigt nu al halverwege de kaarten, met zijn
         eigen golf, en alles daaronder is gewoon papier. */}
    </section>
  );
}

/* De maand/schooljaar-keuze in de vorm van de wereld: geen strak pilletje maar
   dezelfde ongelijke rondingen als de klodder-knop. */
function Schakelaar({ jaar, setJaar }: { jaar: boolean; setJaar: (v: boolean) => void }) {
  const knop = (actief: boolean) =>
    `blobknop px-5 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${
      /* brand-dark en niet brand: wit op #2f9e6e haalt maar 3,37:1 en dit
         label is 14px, dus het moet naar 4,5. Zelfde keuze als de
         markeersectie hierboven op de pagina. */
      actief
        ? "bg-brand-dark text-white shadow-[-4px_10px_20px_-12px_rgba(23,80,58,0.7)]"
        : "text-ink/70 hover:text-ink"
    }`;

  return (
    <div
      data-reveal
      className="inline-flex shrink-0 bg-white p-1 shadow-[-8px_20px_44px_-30px_rgba(23,80,58,0.55)] ring-1 ring-ink/[0.05]"
      style={{ borderRadius: "1.6rem 1.1rem 1.7rem 1.2rem" }}
    >
      <button type="button" onClick={() => setJaar(false)} className={knop(!jaar)} aria-pressed={!jaar}>
        Maandelijks
      </button>
      <button type="button" onClick={() => setJaar(true)} className={knop(jaar)} aria-pressed={jaar}>
        Per schooljaar
      </button>
    </div>
  );
}

/* ── 2. Veelgestelde vragen ──────────────────────────────────────────────────
   Geen witte doosjes meer. De vragen zijn een lijst op het papier, gescheiden
   door haarlijnen: rust komt hier uit minder vormgevingsgewicht, niet uit
   dingen wegstoppen. De rij zelf is de knop, over de volle breedte, zodat je
   nergens precies hoeft te mikken. ────────────────────────────────────────── */

type Vraag = { vraag: string; antwoord: string };

export function WereldVragen({ items }: { items: Vraag[] }) {
  // Meerdere tegelijk open mag: dit is een naslaglijst, geen quiz.
  const [open, setOpen] = useState<string[]>([]);
  const [meer, setMeer] = useState(false);

  const wissel = (vraag: string) =>
    setOpen((oud) => (oud.includes(vraag) ? oud.filter((v) => v !== vraag) : [...oud, vraag]));

  /* Vijf staan er open in plaats van vier: de ChatGPT-vraag is erbij gekomen
     en die hoort zichtbaar te zijn zonder eerst te moeten uitklappen — het is
     de vraag die iedereen in de lerarenkamer stelt. */
  const eerste = items.slice(0, 5);
  const rest = items.slice(5);

  return (
    <section id="vragen" className="relative overflow-hidden scroll-mt-16">
      {/* Hier lag een mintbaan die doorliep tot voorbij de eerste vraag. Die
         is eruit: samen met het veld bij de prijzen en de cijfers werd het één
         baan van ruim tweeduizend pixels, en dat was te veel van hetzelfde.
         Het veld stopt nu halverwege de prijskaarten; deze sectie is weer
         helemaal papier. */}
      {/* De rechterhelft blijft leeg omdat de lijst links staat; daar ligt het
         vlak dat die hoek draagt. Het stond eerst breder en hoger, waardoor
         de rand er precies door de open/dicht-knopjes heen liep; nu blijft
         hij rechts van de lijst. */}
      {/* Papier (vragensectie): uit sinds de opruiming, zie RUIS_OP_PAPIER. */}
      {RUIS_OP_PAPIER && (
        <KaartVlak
          kleur={VLAK_PAPIER}
          vorm="schelp"
          breedte={620}
          hoogte={420}
          style={{ right: "-16%", top: 260, transform: "rotate(6deg)" }}
          className="hidden lg:block"
          tel={3}
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-28 pt-24 lg:pb-32">
        <div className="max-w-3xl">
          {/* Papier: uit sinds de opruiming. */}
          {RUIS_OP_PAPIER && (
            <Confetti punten={[{ x: "-3%", y: "2%", r: 4, amber: true }]} />
          )}
          {/* Ook hier het handgeschreven opstapje ("nog iets te vragen") weg:
             het herhaalde alleen de kop eronder. */}
          <h2
            data-reveal
            className="font-display text-[clamp(2.25rem,4.4vw,3.5rem)] font-black leading-[1.02] tracking-tight"
            style={{ color: DONKER }}
          >
            Veelgestelde vragen
          </h2>

          <div data-reveal className="mt-12 border-t border-ink/10">
            {eerste.map((item) => (
              <Rij
                key={item.vraag}
                item={item}
                open={open.includes(item.vraag)}
                opWissel={() => wissel(item.vraag)}
              />
            ))}

            {meer &&
              rest.map((item) => (
                <Rij
                  key={item.vraag}
                  item={item}
                  open={open.includes(item.vraag)}
                  opWissel={() => wissel(item.vraag)}
                />
              ))}
          </div>

          {!meer && (
            <button
              type="button"
              onClick={() => setMeer(true)}
              className="mt-7 rounded-lg text-base font-bold text-brand-dark underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              Bekijk de andere {rest.length} vragen
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Rij({ item, open, opWissel }: { item: Vraag; open: boolean; opWissel: () => void }) {
  return (
    <div className="border-b border-ink/10">
      <button
        type="button"
        onClick={opWissel}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-6 py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        <span className="font-display text-lg font-black tracking-tight text-ink sm:text-xl">
          {item.vraag}
        </span>
        {/* Eén streep die rechtop gaat staan of gaat liggen: open of dicht is
           daarmee van een afstand te zien, zonder een tweede vorm. */}
        <span
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            open ? "bg-brand text-white" : "bg-brand/10 text-brand-dark group-hover:bg-brand/20"
          }`}
          aria-hidden
        >
          <span className="absolute h-[2.5px] w-3.5 rounded-full bg-current" />
          <span
            className={`absolute h-[2.5px] w-3.5 rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
              open ? "rotate-0" : "rotate-90"
            }`}
          />
        </span>
      </button>

      {/* 0fr → 1fr laat de hoogte zichzelf uitrekenen, dus het antwoord mag
         elke lengte hebben zonder dat we hier een hoogte hoeven te weten. */}
      <div
        className="grid transition-[grid-template-rows] duration-400 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {/* max-w houdt de regellengte leesbaar: over de volle rijbreedte
             werden het regels van zo'n honderd tekens. */}
          <p className="max-w-2xl pb-7 pr-4 text-lg leading-8 text-ink/70">{item.antwoord}</p>
        </div>
      </div>
    </div>
  );
}

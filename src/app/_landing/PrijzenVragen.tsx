"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PLANNEN, PROEF_DAGEN, planById, prijsTekst, type PlanId } from "@/lib/abonnement";
import {
  BlobKnop,
  Confetti,
  DONKER,
  Golf,
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

/* ── Waar het mintveld begint ──────────────────────────────────────────────
   Begon eerst bovenaan de sectie, en dat zat te dicht op de afsluitende golf
   van de cijfersectie erboven — twee golven vlak na elkaar. Het veld begint
   nu pas halverwege de eerste kaart (gemeten, om dezelfde reden als eerder:
   vaste pixelwaarden kloppen niet op elke breedte en bij elke introtekst).
   Het veld loopt vanaf dat punt door tot het einde van de sectie én verder
   de vragensectie in (zie mintBoven bij WereldVragen) — dat sluit pas af bij
   de eerste vraag. */
function useVeldVanafHalveKaart() {
  const sectie = useRef<HTMLElement>(null);
  const kaart = useRef<HTMLDivElement>(null);
  const [veldTop, setVeldTop] = useState<number | null>(null);

  useEffect(() => {
    const s = sectie.current;
    const k = kaart.current;
    if (!s || !k) return;
    const kijker = new ResizeObserver(() => {
      let y = 0;
      for (let n: HTMLElement | null = k; n && n !== s; n = n.offsetParent as HTMLElement | null) {
        y += n.offsetTop;
      }
      setVeldTop(y + k.offsetHeight / 2);
    });
    kijker.observe(s);
    return () => kijker.disconnect();
  }, []);

  return { sectie, kaart, veldTop };
}

export function WereldPrijzen({
  huidigPlan = null,
}: {
  /* Het betaalde pakket dat deze bezoeker nú heeft, of null: uitgelogd, in de
     proef, of verlopen. Alleen dit bepaalt welke kaarten dichtgaan. */
  huidigPlan?: PlanId | null;
}) {
  // false = maandelijks, true = per schooljaar (juli en augustus gratis)
  const [jaar, setJaar] = useState(false);
  const { sectie, kaart, veldTop } = useVeldVanafHalveKaart();

  return (
    <section ref={sectie} id="prijzen" className="relative overflow-hidden">
      {/* ── Het mintveld begint halverwege de eerste kaart ───────────────────
         Kop en introtekst staan op papier, met genoeg lucht na de afsluitende
         golf van de cijfersectie hierboven. Het veld loopt vanaf hier door tot
         het eind van de sectie én verder de vragensectie in — dat sluit pas af
         bij de eerste vraag (zie mintBoven bij WereldVragen).

         🔑 Waar het precies begint wordt gemeten — zie useVeldVanafHalveKaart
         hierboven. De waarden in de klasse zijn alleen de schatting voor het
         allereerste beeld, vóór die meting binnen is. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 top-[520px] overflow-hidden sm:top-[460px] lg:top-[400px]"
        style={veldTop == null ? undefined : { top: veldTop }}
        aria-hidden
      >
        <div className="absolute inset-0" style={{ background: MINT_LICHT }} />

        {/* Het vlak op de BOVENRAND van dit mintveld — exact hetzelfde
           principe als het vlak linksboven bij "Veilig omgaan met AI": een
           negatieve top laat het boven de rand uitsteken, en de flip-golf
           hieronder snijdt hem precies op de kleurgrens af. Je ziet dus geen
           snede maar een vorm die onder het veld vandaan komt.
           🔑 De volgorde in deze laag IS de ingreep: mint, dan het vlak,
           dan de golf. Staat het vlak ná de golf, dan ligt het eroverheen.
           ⚠️ De laag heeft overflow-hidden, dus het deel boven de rand wordt
           weggeknipt; wat je overhoudt is precies de vorm onder de golf. */}
        <KaartVlak
          kleur={VLAK_MINT}
          vorm="koepel"
          breedte={700}
          hoogte={330}
          style={{ left: "-14%", top: -60, transform: "rotate(-6deg)" }}
          className="hidden lg:block"
          tel={2}
        />

        {/* De entree van dit veld: papier dat van bovenaf in de mint hapt.
           Zit nu HIER (op de meethoogte) in plaats van los bovenaan de
           sectie, want het veld begint pas halverwege de eerste kaart. */}
        <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="hapMidden" hoogte="h-[70px] sm:h-[120px]" />
      </div>

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
            {/* Dezelfde geruststelling als onderaan deze sectie, maar dan
               vóórdat iemand door de drie kaarten hoeft te lezen om 'm te
               vinden. Altijd dezelfde zin, ongeacht maand/schooljaar of
               huidigPlan — de nuance per schooljaar staat al onderin.
               ⚠️ ink/60 haalde hier maar 4,23:1 op het mintveld, net onder de
               AA-grens van 4,5 voor 14px-tekst. Zelfde ink/70 als onderin. */}
            <p data-reveal className="mt-4 text-sm text-ink/70">
              Alle abonnementen zijn maandelijks opzegbaar.
            </p>
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
            /* "Meest gekozen" is een AANRADER, en die hoort niet meer op je
               scherm te staan zodra je 'm al gevolgd bent. Heb je Compleet of
               Pro, dan verdwijnt de chip op de Compleet-kaart; heb je Start
               (of ben je uitgelogd/in de proef), dan blijft hij staan, want
               dan is het nog een zinnig advies. */
            const uitgelicht = Boolean(plan.held) && (!huidigPlan || RANG[huidigPlan] < RANG[plan.id]);
            /* Blijft er nog maar één stap over (Compleet-klant die alleen naar
               Pro kan), dan is dat de enige actie op de pagina en verdient hij
               het volle gewicht, ook al is Pro niet de held. */
            const enigeUpgrade =
              stand.soort === "upgrade" &&
              PLANNEN.filter((p) => standVoor(p.id, huidigPlan).soort === "upgrade").length === 1;

            return (
            <div
              key={plan.id}
              /* Start (i===0) is het ankerpunt waarop useVeldVanafHalveKaart
                 zijn hoogte meet: de eerste kaart, niet de held, want die
                 heeft een eigen (grotere) maat die niet elke kaart deelt. */
              ref={i === 0 ? kaart : undefined}
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
              {/* ⚠️ Niet de gedeelde KAART-stijl hier: die schaduw (blur 80,
                 rgba(23,80,58,0.55) — een verzadigd donkergroen) klopt op een
                 brede kolom, maar deze kaarten staan op mobiel maar 15-24px
                 van de schermrand. Dan wordt de schaduw zélf het randje dat
                 nooit naar het bijna-witte papier terugkeert: de achtergrond
                 eronder is allang cream, maar de vage groene gloed eromheen
                 overtuigt je van het tegendeel. Dezelfde kleur, wel de kleinere
                 schaduw die ook de Schakelaar hier verderop gebruikt. */}
              <div
                className={`relative flex h-full flex-col p-8 ${plan.held ? "sm:py-11" : ""} rounded-[var(--w-kaart-radius,2.5rem)] bg-white shadow-[-8px_20px_44px_-30px_rgba(23,80,58,0.55)] ring-1 ring-ink/[0.04]`}
              >
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
                  <span className="font-display text-[3.25rem] font-black leading-none tracking-tight text-ink">
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
                     dan geen knop. Twee teksten, met opzet niet dezelfde:
                     - "huidig" is DIT pakket — dat is niet hetzelfde bericht
                       als "inbegrepen" (een lager pakket dat toevallig al in
                       je hogere pakket zit), en allebei "zit hier al in"
                       noemen wist dat verschil weg. */
                  <p
                    className="blobknop mt-8 flex w-full items-center justify-center gap-2.5 px-5 py-3.5 text-center text-base font-bold"
                    style={{ background: "var(--w-vlak-veld, #e3efe7)", color: DONKER }}
                  >
                    {stand.soort === "huidig" ? "Actief" : "Inbegrepen"}
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

        {/* "Alle abonnementen zijn maandelijks opzegbaar" staat nu al bovenin
           (vóór de kaarten); die hoeft hier niet nogmaals. De schooljaar-
           uitleg is wél nieuwe informatie en blijft dus staan, alleen als de
           schakelaar op "Per schooljaar" staat. */}
        {jaar && (
          <p className="mt-12 text-sm text-ink/70">
            Per schooljaar: je betaalt gewoon maandelijks, maar juli en augustus zijn gratis.
          </p>
        )}
      </div>

      {/* Geen afsluitende golf hier: het mintveld loopt door tot het eind van
         deze sectie en verder de vragensectie in, die het pas afsluit bij de
         eerste vraag (mintBoven). */}
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

export function WereldVragen({ items, mintBoven = false }: { items: Vraag[]; mintBoven?: boolean }) {
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
      {/* ── Het mintveld van de prijzen loopt hier doorheen ──────────────────
         Het veld eindigde precies op de sectiegrens, en dan valt de kop
         "Veelgestelde vragen" meteen op kaal papier: de golf zat zó ver van
         de eerste vraag dat de staart van de pagina in tweeën brak. Nu loopt
         de mint door tot voorbij de eerste vraag en pas dáár komt de golf.
         De hoogte is met opzet in pixels en niet in procenten: de sectie
         wordt hoger zodra iemand een vraag openklapt of "Bekijk de andere 5
         vragen" gebruikt, en met een percentage zou de golf dan mee naar
         beneden zakken. */}
      {mintBoven && (
        <div
          /* De hoogte is op de PIXEL afgeregeld: de golf moet in het gat vallen
             tussen de haarlijn onder vraag 1 en de tekst van vraag 2. Op 370px
             sneed hij precies door het plusje van vraag 2. */
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[355px] overflow-hidden sm:h-[310px] lg:h-[355px]"
          aria-hidden
        >
          <div className="absolute inset-0" style={{ background: MINT_LICHT }} />

          {/* ⚠️ Hier stond een vlak linksboven, en dat hoort hier NIET.
             Dit is de ONDERKANT van het mintveld: alles wat hier hangt wordt
             door de afsluitende golf afgekapt, en dat las telkens als een
             willekeurige knip onderin de sectie. Een vlak op een golfrand
             hoort aan de BOVENkant van een veld te zitten, waar het onder de
             kleurrand vandaan lijkt te komen (zoals bij "Veilig omgaan met
             AI"). Het is daarom verhuisd naar de bovenrand van dit mintveld
             — dat is halverwege de prijskaarten, zie WereldPrijzen. */}

          {/* Rechtsonder: hier blijft de mint juist diep staan, dus dit vlak
             steekt onderuit de sectie en wordt pas op de allerlaatste rand
             afgekapt. */}
          <KaartVlak
            kleur={VLAK_MINT}
            vorm="schelp"
            breedte={620}
            hoogte={340}
            style={{ right: "-12%", bottom: -70, transform: "rotate(6deg)" }}
            className="hidden lg:block"
            tel={2}
          />

          {/* ⚠️ Niet "zwaai": die golf zat als een randje ONDERAAN het vak
             (h-70/110px in een vak van 310-355px) en kon dus alleen een
             beetje op en neer deinen. Om de grens van rechts helemaal tot
             BOVEN de eerste vraag te laten klimmen, moet de golf het VOLLE
             vak beslaan — vandaar dezelfde hoogte als de container zelf. */}
          <Golf
            kleur="var(--w-papier, #fcfbf7)"
            vorm="stijging"
            hoogte="h-[355px] sm:h-[310px] lg:h-[355px]"
          />
        </div>
      )}

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

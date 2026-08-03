"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { PLANNEN, PROEF_DAGEN, prijsTekst } from "@/lib/abonnement";
import {
  BlobKnop,
  Confetti,
  DONKER,
  Golf,
  KAART,
  KaartVlak,
  KOP,
  MINT,
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

/* ── 1. Prijzen ──────────────────────────────────────────────────────────── */

export function WereldPrijzen({
  zonderTopgolf = false,
  zonderOndergolf = false,
}: { zonderTopgolf?: boolean; zonderOndergolf?: boolean }) {
  // false = maandelijks, true = per schooljaar (juli en augustus gratis)
  const [jaar, setJaar] = useState(false);

  return (
    <section id="prijzen" className="relative overflow-hidden" style={{ background: MINT_LICHT }}>
      {/* Rustige entree: deze golf is bijna vlak, want de sectie hierboven
         eindigt al druk. De uitgang mag wél bewegen.
         ⚠️ Hij vervalt als de cijfersectie hierboven al in mint eindigt: dan
         zou hij een papieren strook tussen twee mintvelden tekenen, en dat
         leest als een naad. Landing.tsx bepaalt dat. */}
      {!zonderTopgolf && (
        <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="rust" hoogte="h-[70px] sm:h-[120px]" />
      )}

      {/* Twee zachte vlakken tint-op-tint: één links achter de kop, één rechts
         laag onder de kaarten. Bewust in de zachtste tint — hier staan al drie
         witte kaarten, dus de achtergrond hoeft alleen de hoeken te dragen. */}
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="wig"
        breedte={780}
        hoogte={340}
        style={{ left: "-14%", top: 150, transform: "rotate(-5deg)" }}
        className="z-[6] hidden lg:block"
        tel={2}
      />
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="ei"
        breedte={620}
        hoogte={360}
        style={{ right: "-10%", bottom: 60, transform: "rotate(7deg)" }}
        className="z-[6] hidden lg:block"
        tel={5}
      />

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
            <p data-reveal className="mt-5 text-lg leading-8 text-ink/75">
              Je begint met {PROEF_DAGEN} dagen gratis proberen, zonder
              betaalgegevens. Daarna kies je het abonnement dat bij je past.
            </p>
            {/* De derde plek waar de belofte van bovenaan de pagina landt: op
               het moment dat iemand naar het bedrag kijkt. Bewust gekoppeld
               aan Compleet (€9,99) en niet aan Start — dat is één tool, dus
               daar zouden die twee uur niet kloppen. */}
            <p data-reveal className="mt-4 text-lg font-bold" style={{ color: KOP }}>
              Elke week zo&apos;n 2 uur terug, voor minder dan een tientje per maand.
            </p>
          </div>

          <Schakelaar jaar={jaar} setJaar={setJaar} />
        </div>

        <div className="mt-14 grid items-stretch gap-6 sm:grid-cols-3 lg:gap-7">
          {PLANNEN.map((plan, i) => (
            <div
              key={plan.id}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}
              className={`relative ${plan.held ? "sm:-my-5" : ""}`}
            >
              {/* De held wordt niet met een randje aangewezen maar met de
                 vorm van de site zelf: een uitvergrote kaartvorm die er
                 onderuit steekt, zoals de vlakken elders op de pagina. In de
                 zachte tint (VLAK_MINT) scheelde die nog geen 4% met het veld
                 en zag je hem simpelweg niet; MINT is de tint die hiervoor
                 bedoeld is — diep genoeg om als spot te lezen, en hij ligt
                 achter een witte kaart en niet onder tekst. */}
              {plan.held && (
                <span
                  className="pointer-events-none absolute -inset-x-7 -inset-y-6 -z-10 hidden sm:block"
                  style={{
                    background: MINT,
                    borderRadius: "38% 62% 46% 54% / 63% 37% 62% 38%",
                    transform: "rotate(-3deg)",
                  }}
                  aria-hidden
                />
              )}

              <div
                className={`${KAART} relative flex h-full flex-col p-8 ${plan.held ? "sm:py-11" : ""}`}
              >
                {/* De chip staat naast de naam en niet als sticker over de
                   bovenrand: zo blijft de namenrij van de drie kaarten op
                   dezelfde lijn en leest het als deel van de kaart. */}
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-black tracking-tight" style={{ color: DONKER }}>
                    {plan.naam}
                  </h3>
                  {plan.held && (
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

                <BlobKnop
                  href={jaar ? "/sign-up?plan=jaar" : "/sign-up?plan=maand"}
                  variant={plan.held ? "vol" : "licht"}
                  maat="klein"
                  className="mt-8 w-full"
                >
                  Probeer gratis
                </BlobKnop>
              </div>
            </div>
          ))}
        </div>

        {/* ink/55 haalde 3,63:1 op het mintveld en dat is onder de AA-grens
           van 4,5 voor tekst van deze grootte. */}
        <p className="mt-12 text-sm text-ink/70">
          {jaar
            ? "Per schooljaar: je betaalt gewoon maandelijks, maar juli en augustus zijn gratis."
            : "Alle abonnementen zijn maandelijks opzegbaar."}
        </p>
      </div>

      {/* ⚠️ Vervalt als de vragensectie hieronder het mintveld overneemt: dan
         loopt het veld door tot voorbij de eerste vraag en ligt de golf dáár.
         Twee golven vlak na elkaar zou een papieren band tussen twee
         mintvelden tekenen. Landing.tsx bepaalt dat. */}
      {!zonderOndergolf && <Golf kleur="var(--w-papier, #fcfbf7)" vorm="ribbel" />}
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

          {/* Linksonder op de rand, tegenover het vlak dat in de cijfersectie
             rechtsboven hangt: samen omlijsten ze de staart van het veld.
             Hij duikt de golf in, dus het papier van de golf snijdt hem op de
             kleurrand af — zelfde ingreep als overal elders. */}
          <KaartVlak
            kleur={VLAK_MINT}
            vorm="koepel"
            breedte={700}
            hoogte={330}
            style={{ left: "-15%", bottom: -90, transform: "rotate(-6deg)" }}
            className="hidden lg:block"
            tel={5}
          />

          <Golf kleur="var(--w-papier, #fcfbf7)" vorm="ribbel" hoogte="h-[70px] sm:h-[110px]" />
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

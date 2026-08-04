"use client";

import { DONKER, KOP, MINT, MINT_DIEP, schaduw } from "../_landing/Wereld";

/* Twee blobvormen uit Wereld.tsx. Die staan daar in VLAKVORMEN, maar dat is
   bewust niet geëxporteerd — en ik ga een gedeeld bestand niet openbreken
   voor een proefpagina die straks weer weg is. Zelfde variabelen, zelfde
   terugvalwaarden; wijzigt de tokenlaag, dan wijzigen deze mee. */
const VORM_EI = "var(--w-vorm-ei, 72% 28% 58% 42% / 44% 56% 42% 58%)";
const VORM_KIEZEL = "var(--w-vorm-kiezel, 38% 62% 46% 54% / 63% 37% 62% 38%)";

/* ── DRIE VARIANTEN VOOR HET MAKERSBLOK ────────────────────────────────────
   Tijdelijke proefpagina (/maker-proef). Weghalen zodra de eigenaar heeft
   gekozen; de gekozen variant verhuist dan naar WereldMaker in Wereld.tsx.

   De opdracht: "een leuk profiel waarin je mij leert kennen, maar wel een
   officiële SaaS". De referentieronde leverde geen winnaar op — PostHog kwam
   het dichtst in de buurt maar is een hele pagina, en hier moet het één blok
   in een lopende pagina zijn. Dus: drie eigen vormen, met dezelfde inhoud.

   ⚠️ WAT IK NIET WEET, STAAT TUSSEN [ HAAKJES ]. Ik verzin geen feiten over
   een echt persoon. Die haakjes zijn de plekken waar de eigenaar één woord
   moet invullen; dáár zit trouwens ook precies de charme van variant A.
   ────────────────────────────────────────────────────────────────────────── */

/* De foto in de organische vorm met het mintvlak dat er schuin onderuit
   steekt. Dat detail is het enige uit de huidige kaart dat alle drie de
   varianten houden: het is het enige stukje eigen vormtaal dat er al zat. */
function Portret({ bestand, maat = 96 }: { bestand?: string; maat?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: maat, height: maat }}>
      <span
        className="absolute -bottom-2.5 -left-3 -right-0.5 -top-0.5"
        style={{ background: MINT, borderRadius: VORM_KIEZEL, rotate: "-9deg" }}
        aria-hidden
      />
      <span
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        style={{ background: MINT_DIEP, borderRadius: VORM_EI, rotate: "3deg" }}
      >
        {bestand ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/${bestand}`} alt="Michael van Spanje" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-xl font-black" style={{ color: DONKER }}>
            MvS
          </span>
        )}
      </span>
    </div>
  );
}

function Kaart({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full max-w-[44rem] border-2 px-7 py-7 sm:px-9 sm:py-8"
      style={{
        background: "var(--w-kaart-warm, #fffdf9)",
        borderRadius: "2.2rem 1.6rem 2.4rem 1.8rem / 1.8rem 2.4rem 1.6rem 2.2rem",
        borderColor: "var(--w-kaart-rand, #d4e5dc)",
        boxShadow: schaduw(20, 44, -24, 0.5),
        rotate: "-0.6deg",
      }}
    >
      {children}
    </div>
  );
}

/* ── A · HET PASJE ─────────────────────────────────────────────────────────
   Portret en naam links, en daarnaast een rijtje HARDE FEITEN. De gedachte:
   een profiel wordt niet leuk van vormgeving maar van dingen die je nog niet
   wist. Vier regels feit zeggen meer over de mens dan drie alinea's over
   motivatie, en ze zijn controleerbaar — dat is precies wat het zakelijk
   houdt. De laatste regel is de belangrijkste voor een eenmanszaak: er zit
   geen supportafdeling tussen. */
export function VariantPasje({ foto }: { foto?: string }) {
  const feiten = [
    ["Voor de klas", "groep [ ? ]"],
    ["Bouwt Avinka sinds", "[ jaar ]"],
    ["Antwoordt op je mail", "ikzelf"],
    ["Werkt aan Avinka", "[ x ] dagen per week"],
  ];

  return (
    <Kaart>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* 40 was te smal: "Michael van Spanje" brak daar over twee regels en
           dan kijk je naar de regelval in plaats van naar de vorm. */}
        <div className="flex items-center gap-5 sm:w-48 sm:flex-col sm:items-start sm:gap-4">
          <Portret bestand={foto} />
          <div>
            <h3
              className="font-display text-lg font-black leading-tight tracking-tight"
              style={{ color: DONKER }}
            >
              Michael van Spanje
            </h3>
            <p className="mt-0.5 text-sm leading-snug text-ink/70">Leerkracht &amp; maker</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-lg leading-tight [text-wrap:balance]"
            style={{ fontFamily: "var(--font-hand)", color: KOP }}
          >
            van een leerkracht, voor leerkrachten
          </p>

          {/* De feiten als een korte lijst met haarlijnen ertussen. Geen
             doosjes: dat is de vormtaal van de pagina (de vragenlijst doet
             het net zo). */}
          <dl className="mt-4">
            {feiten.map(([label, waarde], i) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 py-2"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(23,80,58,0.12)" }}
              >
                <dt className="text-sm text-ink/65">{label}</dt>
                <dd className="text-base font-semibold" style={{ color: KOP }}>
                  {waarde}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-base leading-7 text-ink/75">
            Daarom bouw ik Avinka: die tijd hoort bij je leerlingen te liggen, niet bij het
            papierwerk.
          </p>
        </div>
      </div>
    </Kaart>
  );
}

/* ── B · DRIE VRAGEN ───────────────────────────────────────────────────────
   Een mini-interview. De vragen staan in het handschrift dat de pagina al
   heeft, de antwoorden in gewone tekst — zo hoor je twee stemmen en hoeft er
   geen enkel versiersel bij. De inhoud is exact de tekst die er nu staat,
   alleen opgeknipt: een vraag ervoor maakt van een mededeling een gesprek. */
export function VariantVragen({ foto }: { foto?: string }) {
  const gesprek = [
    ["Wie ben jij?", "Michael. Ik sta zelf voor de klas, in groep [ ? ]."],
    [
      "Waarom bouw je dit?",
      "Omdat ik weet hoeveel tijd rapporten, analyses en verslagen kosten. Die tijd hoort bij je leerlingen te liggen, niet bij het papierwerk.",
    ],
    ["Wie helpt me als er iets is?", "Ik. Je mailt met de maker, niet met een afdeling."],
  ];

  return (
    <Kaart>
      <div className="flex items-center gap-4">
        <Portret bestand={foto} maat={72} />
        <div>
          <h3
            className="font-display text-lg font-black leading-tight tracking-tight"
            style={{ color: DONKER }}
          >
            Michael van Spanje
          </h3>
          <p className="mt-0.5 text-sm leading-snug text-ink/70">Leerkracht &amp; maker van Avinka</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {gesprek.map(([vraag, antwoord]) => (
          <div key={vraag}>
            <p className="text-lg leading-tight" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
              {vraag}
            </p>
            <p className="mt-1 text-base leading-7 text-ink/75">{antwoord}</p>
          </div>
        ))}
      </div>
    </Kaart>
  );
}

/* ── C · TWEE PETTEN ───────────────────────────────────────────────────────
   Het enige concept dat alleen bij déze maker kan: hij is allebei. Links de
   leerkracht, rechts de bouwer, met het portret op de naad ertussen. Dat is
   geen decoratie maar het argument zelf — het is precies de reden waarom je
   dit product zou vertrouwen.
   ⚠️ Dit is de variant die het meest van een tweede foto zou profiteren (een
   echte in het lokaal), zoals bij Transistor. Nu doet één portret het werk. */
export function VariantTweePetten({ foto }: { foto?: string }) {
  return (
    <Kaart>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-7">
        <div className="flex-1">
          <p className="text-lg leading-tight" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
            voor de klas
          </p>
          <p className="mt-2 text-base leading-7 text-ink/75">
            Ik geef zelf les en weet hoeveel tijd rapporten, analyses en verslagen kosten — en
            wanneer ze af moeten zijn.
          </p>
        </div>

        {/* Het portret zit op de naad: hij is de verbinding tussen de twee
           kolommen, niet een plaatje naast de tekst. */}
        {/* Vaste breedte en één maat kleiner: op 88px brak de naam hier over
           twee regels en werd de middenkolom een propje. */}
        <div className="flex w-full shrink-0 flex-row items-center gap-4 sm:w-36 sm:flex-col sm:justify-center">
          <Portret bestand={foto} maat={88} />
          <h3
            className="font-display text-sm font-black leading-tight tracking-tight sm:text-center"
            style={{ color: DONKER }}
          >
            Michael van Spanje
          </h3>
        </div>

        <div className="flex-1">
          <p className="text-lg leading-tight" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
            achter de laptop
          </p>
          <p className="mt-2 text-base leading-7 text-ink/75">
            Daarom bouw ik Avinka. Die tijd hoort bij je leerlingen te liggen, niet bij het
            papierwerk.
          </p>
        </div>
      </div>
    </Kaart>
  );
}

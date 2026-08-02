"use client";

import type { ReactNode } from "react";
import { ToolRail, FAQ } from "../nieuw5/Vierde";
import { PIJN, WereldMaker, WereldSlot, BlobKnop } from "../nieuw5/Wereld";
import { WereldPolaroids } from "../nieuw5/Polaroids";
import { WereldPrivacy } from "../nieuw5/Privacy";
import { WereldPrijzen, WereldVragen } from "../nieuw5/PrijzenVragen";

/* ── OPZET B · BAAN ─────────────────────────────────────────────────────────
   Zelfde teksten, andere manier van weergeven.

   Het uitgangspunt: de pagina is geen stapel velden meer maar één route naar
   beneden. Er loopt een doorlopende lijn door de hele pagina met een halte per
   onderdeel; de blokken hangen er om beurten links en rechts aan. Je leest de
   pagina daardoor als een weg die je aflegt, niet als hoofdstukken die op
   elkaar volgen.

   De achtergrond is volledig omgegooid. Waar /nieuw5 organische vlakken achter
   de secties heeft, liggen hier enorme, dunne CIRKELBOGEN die dwars door de
   sectiegrenzen heen lopen — banen, geen vlekken. Ze staan tint-op-tint en
   raken de tekst nooit. De oude blob-taal is via de tokens uitgezet (zie de
   route), dus er is geen enkel component voor aangepast.

   Verder anders dan het origineel: geen golf-overgangen en geen kleurvelden,
   maar één doorlopende ondergrond waarop de route het ritme maakt.

   De teksten zijn letterlijk overgenomen. ──────────────────────────────── */

/* De bogen: vier enorme cirkels die elkaar overlappen en over de volle hoogte
   van de pagina doorlopen. Omdat ze veel groter zijn dan het scherm zie je
   alleen stukken baan — dat leest als beweging in plaats van als vorm. */
function Bogen() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute left-1/2 top-0 h-full w-[300%] -translate-x-1/2 lg:w-[160%]"
        viewBox="0 0 1000 4000"
        preserveAspectRatio="none"
        fill="none"
      >
        <g stroke="var(--w-baan, #cfe0d6)" strokeWidth="2">
          <circle cx="120" cy="520" r="620" />
          <circle cx="880" cy="1180" r="760" />
          <circle cx="180" cy="2050" r="700" />
          <circle cx="820" cy="2900" r="820" />
          <circle cx="300" cy="3600" r="560" />
        </g>
        <g fill="var(--w-baan-vlak, #e4efe8)">
          <circle cx="905" cy="700" r="120" />
          <circle cx="90" cy="1620" r="86" />
          <circle cx="930" cy="2450" r="140" />
          <circle cx="70" cy="3250" r="100" />
        </g>
      </svg>
    </div>
  );
}

/* Een halte op de route: het bolletje op de lijn met het nummer ernaast. */
function Halte({ nummer, kant }: { nummer: string; kant: "links" | "rechts" }) {
  return (
    <span
      className={`absolute top-0 hidden -translate-x-1/2 lg:flex lg:items-center lg:gap-3 ${
        kant === "links" ? "left-1/2 flex-row" : "left-1/2 flex-row-reverse"
      }`}
      aria-hidden
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fbf9f4] ring-2 ring-brand">
        <span className="h-2 w-2 rounded-full bg-brand" />
      </span>
      <span className="font-display text-xs font-black tabular-nums text-ink/35">{nummer}</span>
    </span>
  );
}

/* Een blok aan de route. `kant` bepaalt of het links of rechts van de lijn
   hangt; op mobiel valt alles gewoon onder elkaar. */
function Etappe({
  nummer,
  kant,
  children,
  vol = false,
}: {
  nummer: string;
  kant: "links" | "rechts";
  children: ReactNode;
  vol?: boolean;
}) {
  return (
    <section className="relative">
      <Halte nummer={nummer} kant={kant} />
      {vol ? (
        <div className="pt-16">{children}</div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-16 lg:pb-24">
          <div className={`lg:w-[46%] ${kant === "rechts" ? "lg:ml-auto lg:pl-4" : "lg:pr-4"}`}>
            {children}
          </div>
        </div>
      )}
    </section>
  );
}

export default function BaanBody({ fotoBestand }: { fotoBestand?: string }) {
  return (
    <main id="verder" className="relative z-10 scroll-mt-16 bg-[#fbf9f4]">
      <Bogen />

      {/* de route zelf: één doorlopende lijn over de volle hoogte */}
      <span
        className="pointer-events-none absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-ink/12 lg:block"
        aria-hidden
      />

      <div className="relative">
        <Etappe nummer="01" kant="links">
          <h2
            data-reveal
            className="font-display text-[clamp(2rem,3.6vw,3rem)] font-black leading-[1.03] tracking-tight text-ink"
          >
            Herken je dit?
          </h2>
          <p
            data-reveal
            className="mt-4 text-xl leading-snug text-ink/60"
            style={{ fontFamily: "var(--font-hand)" }}
          >
            Het hoort bij het werk,
            <br />
            maar het kan slimmer, sneller en efficiënter
          </p>
          <div data-reveal className="mt-9 space-y-5">
            {PIJN.map((p) => (
              <div
                key={p.titel}
                className="rounded-l-[2rem] rounded-r-md border border-ink/10 bg-white/80 p-6 backdrop-blur-sm"
              >
                <h3 className="font-display text-xl font-black tracking-tight text-ink">{p.titel}</h3>
                <p className="mt-2 leading-7 text-ink/70">{p.tekst}</p>
              </div>
            ))}
          </div>
        </Etappe>

        <Etappe nummer="02" kant="rechts">
          <h2
            data-reveal
            className="font-display text-[clamp(2rem,3.6vw,3rem)] font-black leading-[1.03] tracking-tight text-ink [text-wrap:balance]"
          >
            De slimme werkplek voor leerkrachten in het basisonderwijs
          </h2>
          <p data-reveal className="mt-6 text-[1.375rem] font-semibold leading-9 text-brand-dark">
            Avinka brengt de hulpmiddelen voor je schoolwerk samen in één omgeving.
          </p>
          <p data-reveal className="mt-4 text-lg leading-8 text-ink/70">
            Je geeft aan wat je nodig hebt en Avinka helpt je met de uitwerking, zodat terugkerende
            taken minder tijd kosten en je werk overzichtelijk blijft.
          </p>
          <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BlobKnop href="/sign-up" className="w-full sm:w-auto">
              Probeer Avinka gratis
            </BlobKnop>
            <BlobKnop href="#tools" variant="licht" className="w-full sm:w-auto">
              Bekijk de tools
            </BlobKnop>
          </div>
        </Etappe>

        <Etappe nummer="03" kant="links" vol>
          <div id="tools" className="scroll-mt-20 pb-8 pt-4">
            <ToolRail />
          </div>
        </Etappe>

        {/* De drie stappen liggen ÓP de route: elk bolletje is een stap. Dat is
           de plek waar de metafoor van deze opzet het meest oplevert. */}
        <Etappe nummer="04" kant="rechts" vol>
          <div className="mx-auto w-full max-w-4xl px-6 pb-8">
            <h2
              data-reveal
              className="text-center font-display text-[clamp(2rem,3.6vw,3rem)] font-black tracking-tight text-ink"
            >
              Zo werkt het
            </h2>
            <ol data-reveal className="relative mt-12 space-y-10">
              {[
                {
                  titel: "Kies wat je nodig hebt",
                  tekst:
                    "Je pakt een tool en geeft in een paar velden door wat je wilt: een leerdoel, een toetsoverzicht of een paar steekwoorden over een leerling.",
                },
                {
                  titel: "Avinka doet het voorwerk",
                  tekst:
                    "Je krijgt een complete uitwerking terug, opgebouwd zoals het hoort. De tool rekent zelf; de AI schrijft alleen de tekst eromheen.",
                },
                {
                  titel: "Jij leest na en past aan",
                  tekst:
                    "Jij houdt het laatste woord. Daarna print je het, download je het als document of bewaar je het bij je eigen bestanden.",
                },
              ].map((s, i) => (
                <li key={s.titel} className="relative flex gap-6 lg:justify-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand font-display text-lg font-black text-white shadow-lg shadow-brand/25">
                    {i + 1}
                  </span>
                  <div className="lg:w-[26rem]">
                    <h3 className="font-display text-xl font-black tracking-tight text-ink">
                      {s.titel}
                    </h3>
                    <p className="mt-2 leading-7 text-ink/70">{s.tekst}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Etappe>

        <Etappe nummer="05" kant="links" vol>
          <WereldPrivacy />
        </Etappe>

        <Etappe nummer="06" kant="rechts" vol>
          <WereldMaker fotoBestand={fotoBestand} />
        </Etappe>

        <Etappe nummer="07" kant="links" vol>
          <WereldPolaroids />
        </Etappe>

        <Etappe nummer="08" kant="rechts" vol>
          <WereldPrijzen />
        </Etappe>

        <Etappe nummer="09" kant="links" vol>
          <WereldVragen items={FAQ} />
        </Etappe>
      </div>

      <div className="relative">
        <WereldSlot />
      </div>
    </main>
  );
}

"use client";

import type { CSSProperties, ReactNode } from "react";
import { ToolRail } from "../nieuw5/Vierde";
import { FAQ } from "../nieuw5/Vierde";
import { PIJN, WereldMaker, WereldSlot, BlobKnop } from "../nieuw5/Wereld";
import { WereldPolaroids } from "../nieuw5/Polaroids";
import { WereldPrivacy } from "../nieuw5/Privacy";
import { WereldPrijzen, WereldVragen } from "../nieuw5/PrijzenVragen";

/* ── OPZET A · RASTER ───────────────────────────────────────────────────────
   Zelfde teksten, andere manier van weergeven.

   Het uitgangspunt: de achtergrond is geen decoratie meer maar de STRUCTUUR
   zelf. Op /nieuw5 drijven er organische vlakken achter de secties; hier ligt
   er een doorlopend kolommenraster over de hele pagina, en alles klikt daarop
   vast. De blob-taal is volledig uitgezet (zie de tokens in de route): de
   achtergrondvlakken en silhouetten krijgen dezelfde kleur als hun ondergrond
   en verdwijnen daarmee, zonder dat er ook maar één component is aangeraakt.

   Wat er verder anders is dan het origineel:
   - elke sectie krijgt een nummer en een kantlijnlabel, als een naslagwerk
   - geen golf-overgangen tussen velden, maar zware horizontale regels
   - koppen staan in de kantlijn naast de inhoud in plaats van erboven
   - geen zachte diepte: geen schaduw, wel echte lijnen
   - accenten zijn massieve blokjes die op het raster vallen, geen klodders

   De teksten zijn letterlijk overgenomen. ──────────────────────────────── */

/* Het raster zelf: twaalf verticale haarlijnen die de hele pagina door lopen,
   plus een heel lichte horizontale liniatuur. Ligt vast achter de inhoud, dus
   het schuift niet mee en blijft over alle secties heen doorlopen — dat is
   precies wat het samenhang geeft. */
function Raster() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(22,32,58,0.045) 0 1px, transparent 1px 40px)",
        }}
      />
      <div className="mx-auto h-full w-full max-w-[86rem] px-6">
        <div className="grid h-full grid-cols-4 lg:grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`h-full border-l border-ink/[0.07] ${i >= 4 ? "hidden lg:block" : ""} ${
                i === 11 ? "border-r" : ""
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Een massief blokje dat op een rasterkruising valt. Vervangt de klodders:
   zelfde rol (een klein accent dat de pagina leven geeft), maar strak en
   rechthoekig in plaats van organisch. */
function Blokje({ style, kleur = "var(--color-brand)" }: { style: CSSProperties; kleur?: string }) {
  return (
    <span
      className="pointer-events-none absolute hidden lg:block"
      style={{ background: kleur, ...style }}
      aria-hidden
    />
  );
}

/* Elke sectie opent met een zware regel, een nummer en een label in de
   kantlijn. Dat geeft de pagina de rust van een naslagwerk: je weet altijd
   waar je bent en hoeveel er nog komt. */
function Blok({
  nummer,
  label,
  children,
  vol = false,
}: {
  nummer: string;
  label: string;
  children: ReactNode;
  vol?: boolean;
}) {
  return (
    <section className="relative border-t-2 border-ink/85">
      <div className={vol ? "" : "mx-auto w-full max-w-[86rem] px-6"}>
        <div className={vol ? "mx-auto w-full max-w-[86rem] px-6" : ""}>
          <div className="flex items-baseline gap-4 pt-5">
            <span className="font-display text-sm font-black tabular-nums text-ink">{nummer}</span>
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ink/45">
              {label}
            </span>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

/* Kop in de kantlijn, inhoud ernaast: het omgekeerde van het origineel, waar
   elke kop bovenaan zijn sectie staat. */
function Kolommen({ kop, hand, children }: { kop: ReactNode; hand?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-x-10 gap-y-8 pb-20 pt-10 lg:grid-cols-12 lg:pb-28 lg:pt-14">
      <div className="lg:col-span-4">
        <h2
          data-reveal
          className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-black leading-[1.05] tracking-tight text-ink [text-wrap:balance] lg:sticky lg:top-28"
        >
          {kop}
        </h2>
        {hand && (
          <p
            data-reveal
            className="mt-4 text-xl leading-snug text-ink/60 lg:sticky lg:top-52"
            style={{ fontFamily: "var(--font-hand)" }}
          >
            {hand}
          </p>
        )}
      </div>
      <div className="lg:col-span-8">{children}</div>
    </div>
  );
}

export default function RasterBody({ fotoBestand }: { fotoBestand?: string }) {
  return (
    <main id="verder" className="relative z-10 scroll-mt-16 bg-[#f7f5f0]">
      <Raster />

      <div className="relative">
        {/* 1 · de herkenning: genummerde regels in plaats van zwevende kaarten */}
        <Blok nummer="01" label="Herkenning">
          <Kolommen
            kop={
              <>
                Herken
                <br />
                je dit?
              </>
            }
            hand={
              <>
                Het hoort bij het werk,
                <br />
                maar het kan slimmer, sneller en efficiënter
              </>
            }
          >
            <Blokje style={{ right: "4%", top: 40, width: 40, height: 40, background: "var(--color-accent)" }} />
            <ul data-reveal className="border-t border-ink/15">
              {PIJN.map((p, i) => (
                <li key={p.titel} className="grid gap-x-8 border-b border-ink/15 py-7 sm:grid-cols-[3rem_1fr]">
                  <span className="font-display text-2xl font-black tabular-nums text-ink/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-black tracking-tight text-ink">{p.titel}</h3>
                    <p className="mt-2 max-w-2xl text-lg leading-8 text-ink/70">{p.tekst}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Kolommen>
        </Blok>

        {/* 2 · wat het is: de uitleg krijgt de volle kolombreedte */}
        <Blok nummer="02" label="Wat Avinka is">
          <div className="grid gap-x-10 gap-y-10 pb-20 pt-10 lg:grid-cols-12 lg:pb-28 lg:pt-14">
            <div className="lg:col-span-7">
              <h2
                data-reveal
                className="font-display text-[clamp(2rem,4vw,3.25rem)] font-black leading-[1.02] tracking-tight text-ink [text-wrap:balance]"
              >
                De slimme werkplek voor leerkrachten in het basisonderwijs
              </h2>
              <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
                <BlobKnop href="/sign-up" className="w-full sm:w-auto">
                  Probeer Avinka gratis
                </BlobKnop>
                <BlobKnop href="#tools" variant="licht" className="w-full sm:w-auto">
                  Bekijk de tools
                </BlobKnop>
              </div>
            </div>
            <div className="lg:col-span-5">
              <Blokje style={{ left: "-2%", bottom: 20, width: 28, height: 28 }} />
              <p
                data-reveal
                className="border-l-2 border-ink pl-6 text-[1.375rem] font-semibold leading-9 text-ink"
              >
                Avinka brengt de hulpmiddelen voor je schoolwerk samen in één omgeving.
              </p>
              <p data-reveal className="mt-5 pl-6 text-lg leading-8 text-ink/70">
                Je geeft aan wat je nodig hebt en Avinka helpt je met de uitwerking, zodat
                terugkerende taken minder tijd kosten en je werk overzichtelijk blijft.
              </p>
            </div>
          </div>
        </Blok>

        {/* 3 · de tools: de rij blijft, de omlijsting is nieuw */}
        <Blok nummer="03" label="De tools" vol>
          <div id="tools" className="scroll-mt-20 pb-16">
            <ToolRail />
          </div>
        </Blok>

        {/* 4 · zo werkt het: drie kolommen met zware nummers op het raster */}
        <Blok nummer="04" label="Werkwijze">
          <div className="pb-20 pt-10 lg:pb-28 lg:pt-14">
            <h2
              data-reveal
              className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-black tracking-tight text-ink"
            >
              Zo werkt het
            </h2>
            <div data-reveal className="mt-10 grid gap-px bg-ink/15 sm:grid-cols-3">
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
                <div key={s.titel} className="bg-[#f7f5f0] p-7">
                  <span className="font-display text-5xl font-black leading-none tabular-nums text-ink/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 font-display text-xl font-black tracking-tight text-ink">
                    {s.titel}
                  </h3>
                  <p className="mt-2.5 text-base leading-7 text-ink/70">{s.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </Blok>

        {/* 5–7 · de drie stukken met eigen beeldwerk houden hun opbouw, maar
           staan hier zonder golf-overgang en zonder achtergrondvlakken */}
        <Blok nummer="05" label="Privacy" vol>
          <WereldPrivacy />
        </Blok>

        <Blok nummer="06" label="De maker" vol>
          <WereldMaker fotoBestand={fotoBestand} />
        </Blok>

        <Blok nummer="07" label="Ervaringen" vol>
          <WereldPolaroids />
        </Blok>

        <Blok nummer="08" label="Prijzen" vol>
          <WereldPrijzen />
        </Blok>

        <Blok nummer="09" label="Vragen" vol>
          <WereldVragen items={FAQ} />
        </Blok>
      </div>

      <Blok nummer="10" label="Beginnen" vol>
        <WereldSlot />
      </Blok>

    </main>
  );
}

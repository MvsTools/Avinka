"use client";

import { useState } from "react";
import {
  bereikTekst,
  dagbeeld,
  maandagVan,
  plus,
  rasterGrenzen,
  volledig,
  weeknummer,
} from "@/lib/planning";
import type { Dagbeeld, PlanningBron } from "@/lib/planning";
import { ETIKET } from "./schooljaar-stijl";
import SchooljaarDagkaart from "./SchooljaarDagkaart";
import RoosterOvernemen from "./RoosterOvernemen";

// De Week-laag: je basisrooster in een concrete week.
//
// AFSPRAAK (docs/planning-mijn-schooljaar.md §3.6): agenda en rooster lopen niet
// door elkaar. Boven elke dag een smal agenda-strookje, de lessen in het raster
// eronder, en na-schooltijd apart. Een vakantie of studiedag vult het rooster
// niet maar wist het.

const DAGNAMEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag"];

/** "08:30" → 510 */
function minuten(tijd: string): number {
  const [u, m] = tijd.split(":").map(Number);
  return u * 60 + (m || 0);
}

/** 510 → "08:30" */
function tijdTekst(m: number): string {
  const u = Math.floor(m / 60);
  const rest = Math.round(m % 60);
  return `${String(u).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function SchooljaarWeek({
  bron,
  vandaag,
  groepen,
}: {
  bron: PlanningBron;
  vandaag: string;
  groepen: number[];
}) {
  const { schooljaar } = bron;
  const binnenJaar = vandaag >= schooljaar.start && vandaag <= schooljaar.eind;
  const [maandag, setMaandag] = useState(() =>
    maandagVan(binnenJaar ? vandaag : schooljaar.start),
  );
  const [dagkaart, setDagkaart] = useState<string | null>(null);

  const dagen = [0, 1, 2, 3, 4].map((n) => dagbeeld(bron, plus(maandag, n)));
  const heeftRooster = bron.blokken.length > 0;
  const grenzen = rasterGrenzen(bron.blokken);
  const rasterBegin = minuten(grenzen.begin);
  const rasterEind = minuten(grenzen.eind);
  const hoogte = Math.max(1, rasterEind - rasterBegin);

  const verschuif = (weken: number) => setMaandag((m) => plus(m, weken * 7));
  const opDezeWeek = maandag === maandagVan(binnenJaar ? vandaag : schooljaar.start);

  return (
    <div className="flex flex-col gap-4">
      {dagkaart && (
        <SchooljaarDagkaart
          beeld={dagbeeld(bron, dagkaart)}
          groepen={groepen}
          sluit={() => setDagkaart(null)}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => verschuif(-1)}
            aria-label="Vorige week"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => verschuif(1)}
            aria-label="Volgende week"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h3 className="text-lg font-bold text-ink">Week {weeknummer(maandag)}</h3>
        <span className="text-sm text-ink/55">{bereikTekst(maandag, plus(maandag, 4))}</span>
        {!opDezeWeek && (
          <button
            onClick={() => setMaandag(maandagVan(binnenJaar ? vandaag : schooljaar.start))}
            className="text-sm font-bold text-brand-dark underline-offset-4 hover:underline"
          >
            Naar deze week
          </button>
        )}
      </div>

      {!heeftRooster ? (
        // Voor een afgelopen jaar heeft het geen zin om een rooster te maken of
        // over te nemen; daar valt niets meer aan te plannen.
        schooljaar.afgesloten ? (
          <p className="rounded-3xl border border-black/5 bg-white px-6 py-8 text-ink/60 shadow-sm">
            Voor dit schooljaar is geen rooster bewaard.
          </p>
        ) : (
          <RoosterOvernemen schooljaar={schooljaar.id} />
        )
      ) : (
        <Weekraster
          dagen={dagen}
          vandaag={vandaag}
          rasterBegin={rasterBegin}
          hoogte={hoogte}
          opendag={setDagkaart}
        />
      )}
    </div>
  );
}

function Weekraster({
  dagen,
  vandaag,
  rasterBegin,
  hoogte,
  opendag,
}: {
  dagen: Dagbeeld[];
  vandaag: string;
  rasterBegin: number;
  hoogte: number;
  opendag: (datum: string) => void;
}) {
  // Iets meer dan één pixel per minuut: een blok van 45 minuten wordt ~56 hoog.
  // Net genoeg dat een kort blok (dagopening, pauze: 15 min) zijn naam nog kwijt
  // kan zonder dat de tekst onderaan wegvalt.
  const PX = 1.25;

  // De blokken tonen zelf geen tijd (dat werd te druk). In plaats daarvan de
  // vertrouwde tijdbalk met alle hele uren, plus de schoolbegin- en eindtijd als
  // extra ankers (tenzij die al op een heel uur vallen). De hulplijnen door de
  // dagen lopen op de hele uren mee.
  const y = (m: number) => (m - rasterBegin) * PX + 8;
  const rasterTot = rasterBegin + hoogte;
  const uren: number[] = [];
  for (let m = Math.ceil(rasterBegin / 60) * 60; m <= rasterTot; m += 60) uren.push(m);
  const ankers: number[] = [];
  if (rasterBegin % 60 !== 0) ankers.push(rasterBegin);
  if (rasterTot % 60 !== 0) ankers.push(rasterTot);
  const tijdstippen = [...uren, ...ankers].sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[46rem] overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        {/* Dagkoppen */}
        <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] border-b border-black/5">
          <div />
          {dagen.map((d) => (
            <button
              key={d.datum}
              onClick={() => opendag(d.datum)}
              className={
                "border-l border-black/5 px-2 py-2 text-left transition-colors hover:bg-cream/60 " +
                (d.datum === vandaag ? "bg-brand-soft/60" : "")
              }
            >
              <span className="block text-sm font-bold text-ink">
                {DAGNAMEN[d.weekdag]}
              </span>
              <span className="block text-xs text-ink/50">{volledig(d.datum).split(" ")[1]} {volledig(d.datum).split(" ")[2]}</span>
            </button>
          ))}
        </div>

        {/* Agenda-strookje: wat er die dag speelt, los van je rooster. */}
        <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] border-b border-black/5 bg-cream/40">
          <div className="px-1 py-1.5 text-right text-xs font-semibold leading-tight text-ink/35">
            agenda
          </div>
          {dagen.map((d) => {
            const items = d.items.filter((i) => i.soort !== "vakantie");
            return (
              <div key={d.datum} className="min-h-[2.25rem] border-l border-black/5 p-1">
                {d.vakantie && (
                  <span className="block truncate rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-bold text-brand-dark">
                    {d.vakantie.naam}
                  </span>
                )}
                {items.slice(0, 2).map((i) => (
                  <span
                    key={i.id}
                    title={i.titel + (i.begin ? `, ${i.begin}` : "")}
                    className={
                      "mt-0.5 block truncate rounded-md px-1.5 py-0.5 text-xs font-bold " +
                      ETIKET[i.soort].stijl
                    }
                  >
                    {i.titel}
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="mt-0.5 block px-1.5 text-xs font-bold text-ink/45">
                    en nog {items.length - 2}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Het lesrooster */}
        <div
          className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]"
          style={{ height: hoogte * PX + 16 }}
        >
          <div className="relative">
            {tijdstippen.map((m) => (
              <span
                key={m}
                className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-ink/45"
                style={{ top: y(m) }}
              >
                {tijdTekst(m)}
              </span>
            ))}
          </div>

          {dagen.map((d) => (
            <div key={d.datum} className="relative border-l border-black/5">
              {!d.vrij &&
                uren
                  .filter((m) => m !== rasterBegin && m !== rasterTot)
                  .map((m) => (
                    <div
                      key={"lijn" + m}
                      className="pointer-events-none absolute inset-x-0 border-t border-black/[0.06]"
                      style={{ top: y(m) }}
                    />
                  ))}
              {d.vrij ? (
                <div className="absolute inset-0 flex items-start justify-center bg-[repeating-linear-gradient(135deg,rgba(0,0,0,0.03)_0_6px,transparent_6px_12px)] pt-4">
                  <span className="rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-ink/50">
                    {d.vrijReden === "weekend"
                      ? "Weekend"
                      : d.vakantie
                        ? "Vakantie"
                        : "Geen les"}
                  </span>
                </div>
              ) : (
                d.blokken
                  .filter((b) => b.soort === "les")
                  .map((b) => {
                    const top = (minuten(b.begin) - rasterBegin) * PX + 8;
                    const h = Math.max(17, (minuten(b.eind) - minuten(b.begin)) * PX - 2);
                    return (
                      <div
                        key={b.id}
                        title={`${b.naam} ${b.begin}–${b.eind}`}
                        className="absolute left-1 right-1 flex items-baseline gap-1.5 overflow-hidden rounded-lg border border-black/5 bg-cream/70 px-1.5 py-px"
                        style={{ top, height: h, background: b.kleur?.bg }}
                      >
                        <span
                          className="min-w-0 flex-1 truncate text-xs font-bold leading-tight"
                          style={{ color: b.kleur?.tekst }}
                        >
                          {b.naam}
                        </span>
                        {/* De begintijd op het blok zelf: klein, gedempt en rechts,
                            zoals in volwassen agenda's. Zo lees je 'm zonder de
                            hulplijnen nodig te hebben. */}
                        <span
                          className="shrink-0 text-xs leading-tight tabular-nums opacity-60"
                          style={{ color: b.kleur?.tekst }}
                        >
                          {b.begin}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          ))}
        </div>

        {/* Na schooltijd: je eigen tijd, en waar de gesprekken uit je agenda thuishoren. */}
        <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] border-t border-black/5 bg-cream/30">
          <div className="px-1 py-2 text-right text-xs font-semibold leading-tight text-ink/35">
            na school
          </div>
          {dagen.map((d) => {
            const taken = d.vrij ? [] : d.blokken.filter((b) => b.soort === "taak");
            const naSchool = d.items.filter(
              (i) => !i.heleDag && i.begin && minuten(i.begin) >= 13 * 60,
            );
            return (
              <div key={d.datum} className="min-h-[3rem] border-l border-black/5 p-1">
                {taken.map((b) => (
                  <span
                    key={b.id}
                    className="mb-0.5 block truncate rounded-lg border border-dashed border-black/15 px-1.5 py-0.5 text-xs font-semibold text-ink/60"
                  >
                    {b.naam}
                  </span>
                ))}
                {naSchool.map((i) => (
                  <span
                    key={i.id}
                    title={`${i.titel}, ${i.begin}${i.eind ? ` tot ${i.eind}` : ""}`}
                    className={
                      "mb-0.5 block truncate rounded-md px-1.5 py-0.5 text-xs font-bold " +
                      ETIKET[i.soort].stijl
                    }
                  >
                    {i.begin} {i.titel}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



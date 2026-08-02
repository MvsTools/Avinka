"use client";

import { useState } from "react";
import { dagbeeld, dagnaam, kort, komendeItems, randKleur, verschil } from "@/lib/planning";
import type { PlanningBron, PlanItem } from "@/lib/planning";
import { STIP } from "./schooljaar-stijl";
import { Kaartvenster, Afspraakregel, Dagstatus } from "./SchooljaarDagkaart";

// De rij bovenaan Start (fase 3, "de lesdag"): de datum, hoeveel weken het nog
// is tot de volgende vakantie, en wat er vandaag speelt (agenda + taken met
// een deadline vandaag). Rekent met dezelfde `dagbeeld` als Mijn schooljaar,
// dus het klopt altijd met wat je daar ziet. Kleur volgt de betekenis: de
// vakantietegel krijgt dezelfde groentint als een vakantie overal in Mijn
// schooljaar, en elke afspraak zijn eigen STIP-kleur — geen kleur zonder reden.
//
// Elk vakje is een knop die verder inzoomt: je lesrooster van vandaag, de
// periode waar je in zit, of je hele agenda — met dezelfde onderdelen
// (`Kaartvenster`, `Afspraakregel`, `Dagstatus`) als de dagkaart in Mijn
// schooljaar zelf, zodat het er hetzelfde uitziet.

// "Over X weken" reken je vanaf vandaag, niet vanaf het begin van het jaar
// (zelfde afweging als in SchooljaarView: anders klopt het niet als het
// schooljaar zelf nog moet beginnen).
const wekenVanafNu = (vandaag: string, datum: string) =>
  Math.max(1, Math.round(verschil(vandaag, datum) / 7));

const hoofdletter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Vandaag", "Morgen" of gewoon de datum — voor de kopjes in de agendalijst. */
function dagLabel(datum: string, vandaag: string): string {
  if (datum === vandaag) return "Vandaag";
  const morgen = new Date(datum + "T12:00:00Z");
  morgen.setUTCDate(morgen.getUTCDate() - 1);
  if (morgen.toISOString().slice(0, 10) === vandaag) return "Morgen";
  return `${hoofdletter(dagnaam(datum))} ${kort(datum)}`;
}

/** Dezelfde reeks items achter elkaar op één dag houden we bij elkaar, zodat
 *  de agendalijst per dag een eigen kopje krijgt. `komendeItems` levert de
 *  items al op datum gesorteerd aan. */
function perDag(items: PlanItem[]): { datum: string; items: PlanItem[] }[] {
  const groepen: { datum: string; items: PlanItem[] }[] = [];
  for (const item of items) {
    const laatste = groepen.at(-1);
    if (laatste && laatste.datum === item.datum) laatste.items.push(item);
    else groepen.push({ datum: item.datum, items: [item] });
  }
  return groepen;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" strokeLinecap="round" />
      <path d="M8 13.5h2.5M8 17h2.5M14 13.5h2M14 17h2" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4.5" />
      <path
        d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5M18.4 18.4l-1.5-1.5M7.1 7.1L5.6 5.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AgendaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M6 10a6 6 0 0 1 12 0c0 3.2 1 4.8 1.5 5.5h-15C5 14.8 6 13.2 6 10Z" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

/** Eén tegel: icoon-badge + label boven, eigen inhoud eronder, ingesprongen
 *  onder het icoon zodat de inhoud een vaste, rustige linkerlijn houdt. Klik
 *  erop en er gaat een paneel open met meer over dat onderwerp. */
function Tegel({
  icon,
  badge,
  label,
  labelKleur = "text-ink/40",
  achtergrond = "border-black/5 bg-white",
  onClick,
  children,
}: {
  icon: React.ReactNode;
  badge: string;
  label: string;
  labelKleur?: string;
  achtergrond?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-3xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " +
        achtergrond
      }
    >
      <div className="flex items-center gap-3">
        <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + badge}>{icon}</span>
        <p className={"text-xs font-bold uppercase tracking-wider " + labelKleur}>{label}</p>
      </div>
      <div className="mt-2 pl-[52px]">{children}</div>
    </button>
  );
}

export default function VandaagRij({
  bron,
  vandaag,
  groepen = [],
}: {
  bron: PlanningBron;
  vandaag: string;
  groepen?: number[];
}) {
  const { schooljaar } = bron;
  const beeld = dagbeeld(bron, vandaag);
  const [open, setOpen] = useState<"dag" | "periode" | "agenda" | null>(null);
  // Welke rooster-blokken in "Je lesdag" opengeklapt staan, voor wie er een
  // eigen aantekening bij heeft staan (zie omschrijving in de bewerkstand).
  const [uitgeklapt, setUitgeklapt] = useState<Set<string>>(new Set());
  const toggleBlok = (id: string) =>
    setUitgeklapt((s) => {
      const nieuw = new Set(s);
      if (nieuw.has(id)) nieuw.delete(id);
      else nieuw.add(id);
      return nieuw;
    });

  const datumKlein =
    beeld.vrijReden === "vakantie"
      ? (beeld.vakantie?.naam ?? "Vakantie")
      : beeld.vrijReden === "vrije dag"
        ? "Geen les"
        : beeld.startweek
          ? "Startweek"
          : undefined;

  // Zit je er middenin, dan tellen we niet af maar laten we zien tot wanneer.
  // Nog niet begonnen? Dan zoeken we vanaf de eerste schooldag, anders vind je
  // de vakantie waar je middenin zit als "de volgende".
  const peil = vandaag < schooljaar.start ? schooljaar.start : vandaag;
  const volgendeVakantie = schooljaar.vakanties.find((v) => v.van > peil);

  const afspraken = beeld.items.filter((i) => i.soort !== "vakantie");
  const takenVandaag = beeld.taken.filter((t) => !t.gedaan);
  const regels = [
    ...afspraken.map((i) => ({ soort: "afspraak" as const, item: i })),
    ...takenVandaag.map((t) => ({ soort: "taak" as const, item: t })),
  ];

  // Hetzelfde weken-getal als op de vakantietegel: dezelfde vakantie, dus geen
  // twee verschillende antwoorden op "hoe lang nog".
  const periodeWeken = beeld.periode?.eindigtMet ? wekenVanafNu(vandaag, beeld.periode.eindigtMet.van) : undefined;

  const komend = komendeItems(bron, vandaag).filter((i) => i.soort !== "vakantie");

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tegel
          icon={<CalendarIcon className="h-5 w-5" />}
          badge="bg-ink/[0.06] text-ink/70"
          label="Vandaag"
          onClick={() => setOpen("dag")}
        >
          <p className="text-lg font-bold leading-tight text-ink">
            {hoofdletter(dagnaam(vandaag))} {kort(vandaag)}
          </p>
          {datumKlein && <p className="mt-0.5 text-sm text-ink/60">{datumKlein}</p>}
        </Tegel>

        <Tegel
          icon={<SunIcon className="h-5 w-5" />}
          badge="bg-brand text-white"
          label={beeld.vakantie ? "Vakantie" : "Volgende vakantie"}
          labelKleur="text-brand-dark"
          achtergrond="border-brand/15 bg-brand-soft"
          onClick={() => setOpen("periode")}
        >
          {beeld.vakantie ? (
            <p className="text-lg font-bold leading-tight text-ink">Tot en met {kort(beeld.vakantie.tot)}</p>
          ) : (
            <>
              <p className="text-lg font-bold leading-tight text-ink">
                {volgendeVakantie ? volgendeVakantie.naam : "Geen meer dit jaar"}
              </p>
              {volgendeVakantie && (
                <p className="mt-0.5 text-sm text-ink/60">Over {wekenVanafNu(vandaag, volgendeVakantie.van)} weken</p>
              )}
            </>
          )}
        </Tegel>

        <Tegel
          icon={<AgendaIcon className="h-5 w-5" />}
          badge="bg-ink/[0.06] text-ink/70"
          label="Deze dag"
          onClick={() => setOpen("agenda")}
        >
          {regels.length ? (
            <>
              <p className="truncate text-lg font-bold leading-tight text-ink">
                {regels[0].soort === "afspraak" ? regels[0].item.titel : regels[0].item.tekst}
              </p>
              <p className="mt-0.5 text-sm text-ink/60">
                {regels[0].soort === "afspraak" && !regels[0].item.heleDag && regels[0].item.begin
                  ? regels[0].item.begin
                  : "Vandaag"}
              </p>
              {regels.length > 1 && (
                <ul className="mt-2 flex flex-col gap-1 border-t border-black/5 pt-2">
                  {regels.slice(1, 4).map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ink/70">
                      {r.soort === "afspraak" ? (
                        <span aria-hidden className={"h-2 w-2 shrink-0 rounded-full " + STIP[r.item.soort]} />
                      ) : (
                        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink/30" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {r.soort === "afspraak" ? r.item.titel : r.item.tekst}
                      </span>
                    </li>
                  ))}
                  {regels.length > 4 && <li className="text-sm text-ink/50">+ {regels.length - 4} meer</li>}
                </ul>
              )}
            </>
          ) : (
            <p className="text-lg font-bold leading-tight text-ink">Niets gepland</p>
          )}
        </Tegel>
      </div>

      {open === "dag" && (
        <Kaartvenster titel="Je lesdag" sluit={() => setOpen(null)}>
          <Dagstatus beeld={beeld} />
          {!beeld.vrij &&
            (beeld.blokken.length ? (
              <ul className="mt-4 flex flex-col gap-2">
                {beeld.blokken.map((blok) => {
                  const heeftNotitie = Boolean(blok.omschrijving?.trim());
                  const blokOpen = uitgeklapt.has(blok.id);
                  const swatch = (
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        background: blok.kleur?.bg,
                        boxShadow: `inset 0 0 0 1px ${randKleur(blok.kleur?.bg)}`,
                      }}
                    />
                  );
                  return (
                    <li key={blok.id} className="rounded-2xl border border-black/5 bg-cream/40">
                      {heeftNotitie ? (
                        <button
                          type="button"
                          onClick={() => toggleBlok(blok.id)}
                          aria-expanded={blokOpen}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left"
                        >
                          {swatch}
                          <span className="min-w-0 flex-1 truncate font-semibold text-ink">{blok.naam}</span>
                          <span className="shrink-0 text-sm tabular-nums text-ink/55">
                            {blok.begin}–{blok.eind}
                          </span>
                          <svg
                            viewBox="0 0 24 24"
                            className={
                              "h-4 w-4 shrink-0 text-ink/35 transition-transform " + (blokOpen ? "rotate-180" : "")
                            }
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3">
                          {swatch}
                          <span className="min-w-0 flex-1 truncate font-semibold text-ink">{blok.naam}</span>
                          <span className="shrink-0 text-sm tabular-nums text-ink/55">
                            {blok.begin}–{blok.eind}
                          </span>
                        </div>
                      )}
                      {heeftNotitie && blokOpen && (
                        <p className="border-t border-black/5 px-4 py-3 text-sm leading-6 text-ink/70">
                          {blok.omschrijving}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-ink/60">
                Je hebt nog geen basisrooster gemaakt. Zet dat in Mijn schooljaar klaar, dan staat je lesdag hier
                voortaan meteen.
              </p>
            ))}
        </Kaartvenster>
      )}

      {open === "periode" && (
        <Kaartvenster titel={beeld.periode ? beeld.periode.naam : "Periode"} sluit={() => setOpen(null)}>
          {beeld.periode ? (
            <>
              <p className="mt-4 text-ink/70">{hoofdletter(beeld.periode.omschrijving)}.</p>
              {periodeWeken !== undefined && (
                <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 font-semibold text-ink">
                  Nog {periodeWeken} {periodeWeken === 1 ? "schoolweek" : "schoolweken"} te gaan
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-ink/60">Voor nu geen actieve periode.</p>
          )}
        </Kaartvenster>
      )}

      {open === "agenda" && (
        <Kaartvenster titel="Je agenda" sluit={() => setOpen(null)}>
          {komend.length ? (
            <div className="mt-4 flex flex-col gap-4">
              {perDag(komend).map((dag) => (
                <div key={dag.datum}>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{dagLabel(dag.datum, vandaag)}</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {dag.items.map((item) => (
                      <Afspraakregel key={item.id} item={item} groepen={groepen} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-ink/60">Geen afspraken de komende tijd.</p>
          )}
        </Kaartvenster>
      )}
    </>
  );
}

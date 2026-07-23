"use client";

import Link from "next/link";
import { useState } from "react";
import {
  bereikTekst,
  filterVoorMij,
  dagbeeld,
  kort,
  maandagVan,
  plus,
  schoolweken,
  telDubbelingen,
  zijkantLabel,
  verschil,
  volledig,
  weekdag,
} from "@/lib/planning";
import type { AgendaBron, Periode, PlanItem, PlanningBron } from "@/lib/planning";
import SchooljaarMaand from "./SchooljaarMaand";
import AgendaKoppelen from "./AgendaKoppelen";
import { ETIKET } from "./schooljaar-stijl";
import SchooljaarDagkaart from "./SchooljaarDagkaart";

// Mijn schooljaar, laag 1: je jaar op een rij. De weekplanning en je lesdag
// komen hier straks als eigen tabbladen bij; de gegevens eronder zijn al
// dezelfde (zie src/lib/planning).

type JaarKeuze = { id: string; label: string; afgesloten: boolean };

export default function SchooljaarView({
  bron: volledigeBron,
  jaren,
  vandaag,
  agendas,
  mijnGroepen,
}: {
  bron: PlanningBron;
  jaren: JaarKeuze[];
  vandaag: string;
  agendas: AgendaBron[];
  mijnGroepen: number[];
}) {
  const [tab, setTab] = useState<"jaar" | "agendas">(agendas.length ? "jaar" : "agendas");
  const [weergave, setWeergave] = useState<"lijst" | "maand">("lijst");
  const [alleenMijne, setAlleenMijne] = useState(false);

  // Een schoolagenda staat vol met dingen van andere groepen en oproepen aan
  // ouders. Standaard tonen we ze gewoon, alleen rustiger: gedempt en met een
  // merkje. Verbergen is te riskant, want bij groep 8 hoort soms iets waar de
  // hele school bij is. Wie het tóch strak wil, zet "Alleen mijn afspraken" aan.
  const zeef = filterVoorMij(volledigeBron.items, mijnGroepen);
  const opzij = zeef.andereGroep + zeef.ouderoproep;
  const bron = alleenMijne ? { ...volledigeBron, items: zeef.voorMij } : volledigeBron;

  const { schooljaar, items } = bron;
  const loopt = vandaag >= schooljaar.start && vandaag <= schooljaar.eind;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold text-ink">Mijn schooljaar</h1>

        {jaren.length > 1 && (
          <div className="flex items-center gap-1 rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
            {jaren.map((j) => (
              <Link
                key={j.id}
                href={`/dashboard/schooljaar?jaar=${j.id}`}
                scroll={false}
                className={
                  "rounded-xl px-3.5 py-1.5 text-sm font-bold transition-colors " +
                  (j.id === schooljaar.id
                    ? "bg-brand-dark text-white"
                    : "text-ink/55 hover:text-ink")
                }
              >
                {j.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {schooljaar.afgesloten && (
        <p className="rounded-2xl border-l-[3px] border-ink/20 bg-white px-5 py-4 text-ink/75 shadow-sm">
          Dit schooljaar is afgelopen. Je kunt hier terugkijken, aanpassen kan niet meer.
        </p>
      )}

      {/* Twee tabbladen. De rest van de lagen (periode, week, je lesdag) komt
          hier straks bij zodra ze gebouwd zijn. */}
      <div className="flex items-center gap-1 self-start rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
        {(
          [
            ["jaar", "Je jaar"],
            ["agendas", agendas.length ? `Agenda's (${agendas.length})` : "Agenda koppelen"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              "rounded-xl px-4 py-1.5 text-sm font-bold transition-colors " +
              (tab === id ? "bg-brand-dark text-white" : "text-ink/55 hover:text-ink")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "agendas" ? (
        <AgendaKoppelen agendas={agendas} />
      ) : (
        <>
          {agendas.length === 0 && (
            <div className="rounded-2xl border-l-[3px] border-brand bg-brand-soft/70 px-5 py-4">
              <p className="leading-7 text-ink/85">
                Dit jaar staat er nu op de landelijke vakantiedata. Koppel de agenda van je school
                en je ziet jouw eigen vakanties, studiedagen en gesprekavonden. Scholen wijken
                namelijk vaak af van de landelijke datums.
              </p>
              <button
                onClick={() => setTab("agendas")}
                className="mt-3 rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
              >
                Agenda koppelen
              </button>
            </div>
          )}

          <Feiten bron={bron} vandaag={vandaag} loopt={loopt} />

          {telDubbelingen(items) > 0 && (
            <p className="text-sm text-ink/55">
              {telDubbelingen(items)} afspraken stonden in meer dan één agenda. Die tel ik één keer.
            </p>
          )}

          {/* Het feiten-blok hierboven blijft in elke weergave staan; deze regel
              bepaalt alleen wat daaronder komt. Rechts: het filter en de schuif. */}
          <div className="flex flex-wrap justify-end gap-2">
            {opzij > 0 && (
              <button
                onClick={() => setAlleenMijne(!alleenMijne)}
                aria-pressed={alleenMijne}
                title="Afspraken van andere groepen en oproepen aan ouders even verbergen"
                className={
                  "rounded-2xl border px-4 py-2 text-sm font-bold shadow-sm transition-colors " +
                  (alleenMijne
                    ? "border-transparent bg-brand-dark text-white"
                    : "border-black/5 bg-white text-ink/55 hover:text-ink")
                }
              >
                Alleen mijn afspraken
              </button>
            )}
            <WeergaveKnop weergave={weergave} zet={setWeergave} />
          </div>

          {weergave === "maand" ? (
            <SchooljaarMaand bron={bron} vandaag={vandaag} groepen={mijnGroepen} />
          ) : (
            <Jaarlijst bron={bron} vandaag={vandaag} groepen={mijnGroepen} />
          )}
        </>
      )}
    </div>
  );
}

/**
 * De weergave-schuif, rechtsboven: lijst of maand. Een schuivend bolletje onder
 * twee icoontjes, zodat je in één oogopslag ziet welke kant aan staat en er met
 * één tik tussen wisselt.
 */
function WeergaveKnop({
  weergave,
  zet,
}: {
  weergave: "lijst" | "maand";
  zet: (w: "lijst" | "maand") => void;
}) {
  return (
    <div
      role="group"
      aria-label="Weergave"
      className="relative flex items-center rounded-2xl border border-black/5 bg-white p-1 shadow-sm"
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 w-10 rounded-xl bg-brand-dark transition-transform duration-200 ease-out"
        style={{ transform: weergave === "maand" ? "translateX(100%)" : "translateX(0)" }}
      />
      {(
        [
          ["lijst", "Lijst"],
          ["maand", "Maand"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          onClick={() => zet(id)}
          aria-pressed={weergave === id}
          title={label}
          className={
            "relative z-10 flex h-8 w-10 items-center justify-center rounded-xl transition-colors " +
            (weergave === id ? "text-white" : "text-ink/45 hover:text-ink")
          }
        >
          <span className="sr-only">{label}</span>
          {id === "lijst" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M8 6h12M8 12h12M8 18h12" />
              <path d="M4 6h.01M4 12h.01M4 18h.01" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
              <path d="M3.5 9h17M8 3v3M16 3v3" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

/** De drie dingen waar een leerkracht echt naar zoekt. Meteen leesbaar. */
function Feiten({
  bron,
  vandaag,
  loopt,
}: {
  bron: PlanningBron;
  vandaag: string;
  loopt: boolean;
}) {
  const { schooljaar, periodes, items } = bron;
  const nogNietBegonnen = vandaag < schooljaar.start;
  const voorbij = vandaag > schooljaar.eind;

  // "over X weken" reken je vanaf vandaag, niet vanaf het begin van het jaar.
  // Anders zegt hij midden in de zomervakantie "volgende vakantie over 7 weken"
  // terwijl het schooljaar zelf nog moet beginnen.
  const wekenVanafNu = (datum: string) => Math.max(1, Math.round(verschil(vandaag, datum) / 7));

  // Een afgelopen jaar heeft geen "hierna" meer. Dan een korte terugblik in
  // plaats van een volgende-vakantie die nergens meer op slaat.
  if (voorbij) {
    const echt = items.filter((i) => !i.dubbelVan);
    return (
      <FeitenRij
        feiten={[
          {
            label: "Vakanties",
            groot: `${schooljaar.vakanties.length}`,
            klein: "dit schooljaar",
          },
          {
            label: "Dagen zonder les",
            groot: `${new Set(echt.filter((i) => i.soort === "vrij").map((i) => i.datum)).size}`,
            klein: "studiedagen en vrije dagen",
          },
          {
            label: "Afspraken",
            groot: `${echt.filter((i) => i.soort !== "vakantie" && i.soort !== "vrij").length}`,
            klein: "gesprekken, toetsen, activiteiten",
          },
        ]}
      />
    );
  }

  // Vanaf welk moment kijken we vooruit: bij een lopend jaar vandaag, bij een
  // jaar dat nog moet beginnen de eerste schooldag.
  const peil = nogNietBegonnen ? schooljaar.start : vandaag;
  const vakantie = schooljaar.vakanties.find((v) => v.van > peil);
  const vrijeDag = items.find(
    (i) => !i.dubbelVan && i.soort === "vrij" && i.datum >= peil && i.datum <= schooljaar.eind,
  );
  const periode = periodes.find((p) => peil >= p.van && peil <= p.tot);

  const perWeek = new Map<string, number>();
  for (const i of items) {
    if (i.dubbelVan || i.datum < peil || i.datum > schooljaar.eind) continue;
    if (i.soort === "vakantie" || i.soort === "vrij") continue;
    perWeek.set(maandagVan(i.datum), (perWeek.get(maandagVan(i.datum)) ?? 0) + 1);
  }
  const drukste = [...perWeek.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  // Zit je nog in de zomervakantie, dan is het eerste dat telt: wanneer begint
  // het weer. Loopt het jaar, dan kijk je naar de volgende vakantie.
  const feiten = nogNietBegonnen
    ? [
        {
          label: "Schooljaar begint",
          groot: volledig(schooljaar.start).replace(/ \d{4}$/, ""),
          klein: `over ${wekenVanafNu(schooljaar.start)} weken`,
        },
        {
          label: "Eerste vakantie",
          groot: vakantie ? vakantie.naam : "—",
          klein: vakantie ? `over ${wekenVanafNu(vakantie.van)} weken` : "",
        },
        {
          label: "Eerste dag zonder les",
          groot: vrijeDag ? volledig(vrijeDag.datum).replace(/ \d{4}$/, "") : "nog niet bekend",
          klein: vrijeDag ? vrijeDag.titel : "studiedagen staan in je schoolagenda",
        },
      ]
    : [
        {
          label: "Volgende vakantie",
          groot: vakantie ? vakantie.naam : "geen meer dit jaar",
          klein: vakantie ? `over ${wekenVanafNu(vakantie.van)} weken` : "",
        },
        {
          label: "Volgende dag zonder les",
          groot: vrijeDag ? volledig(vrijeDag.datum).replace(/ \d{4}$/, "") : "nog niet bekend",
          klein: vrijeDag ? vrijeDag.titel : "studiedagen staan in je schoolagenda",
        },
        {
          label: "Drukste week hierna",
          groot: drukste ? bereikTekst(drukste[0], plus(drukste[0], 4)) : "nog rustig",
          klein: drukste ? `${drukste[1]} dingen in die week` : "",
        },
      ];

  return (
    <div className="flex flex-col gap-4">
      {loopt && periode && (
        <p className="text-ink/70">
          Je zit in {periode.naam.toLowerCase()}, week{" "}
          {schoolweken(periode.van, vandaag)} van {periode.weken}. Nog{" "}
          {Math.max(0, periode.weken - schoolweken(periode.van, vandaag))} weken tot de{" "}
          {periode.eindigtMet?.naam.toLowerCase() ?? "vakantie"}.
        </p>
      )}
      <FeitenRij feiten={feiten} />
    </div>
  );
}

function FeitenRij({
  feiten,
}: {
  feiten: { label: string; groot: string; klein: string }[];
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-3xl border border-black/5 bg-black/5 shadow-sm sm:grid-cols-3">
      {feiten.map((f) => (
        <div key={f.label} className="bg-white px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{f.label}</p>
          <p className="mt-1.5 text-lg font-bold leading-tight text-ink">{f.groot}</p>
          {f.klein && <p className="mt-0.5 text-sm text-ink/55">{f.klein}</p>}
        </div>
      ))}
    </div>
  );
}

/** Het jaar als lijst: blokken werk, met de vakanties ertussen. */
function Jaarlijst({
  bron,
  vandaag,
  groepen,
}: {
  bron: PlanningBron;
  vandaag: string;
  groepen: number[];
}) {
  const { schooljaar, periodes, items } = bron;
  const [open, setOpen] = useState<number[]>([]);
  const [dag, setDag] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {dag && (
        <SchooljaarDagkaart beeld={dagbeeld(bron, dag)} groepen={groepen} sluit={() => setDag(null)} />
      )}

      {/* De startweek staat vóór het eerste blok: je bent er al, de kinderen
          nog niet. Eigen warme tint, geen vakantiekleur. */}
      <button
        onClick={() => setDag(schooljaar.startweek.van)}
        className="flex flex-wrap items-baseline gap-x-3 rounded-2xl border-l-[3px] border-amber-300 bg-accent-soft/70 px-5 py-3.5 text-left transition-colors hover:bg-accent-soft"
      >
        <span className="font-bold text-ink/80">Startweek</span>
        <span className="text-sm text-ink/55">
          {bereikTekst(schooljaar.startweek.van, schooljaar.startweek.tot)}
        </span>
      </button>

      {periodes.map((periode) => (
        <Blok
          key={periode.nummer}
          periode={periode}
          bron={bron}
          vandaag={vandaag}
          toonDag={setDag}
          groepen={groepen}
          open={open.includes(periode.nummer)}
          zetOpen={() =>
            setOpen((o) =>
              o.includes(periode.nummer)
                ? o.filter((n) => n !== periode.nummer)
                : [...o, periode.nummer],
            )
          }
        />
      ))}

      {!periodes.length && (
        <p className="rounded-3xl border border-black/5 bg-white px-5 py-6 text-ink/60 shadow-sm">
          Voor dit schooljaar kennen we de vakanties nog niet.
        </p>
      )}

      <p className="text-sm text-ink/50">
        {items.filter((i) => !i.dubbelVan).length} afspraken in {schooljaar.label}.
      </p>
    </div>
  );
}

function Blok({
  periode,
  bron,
  vandaag,
  toonDag,
  groepen,
  open,
  zetOpen,
}: {
  periode: Periode;
  bron: PlanningBron;
  vandaag: string;
  toonDag: (datum: string) => void;
  groepen: number[];
  open: boolean;
  zetOpen: () => void;
}) {
  const items = bron.items.filter(
    (i) => !i.dubbelVan && i.datum >= periode.van && i.datum <= periode.tot && i.soort !== "vakantie",
  );
  const voorbij = periode.tot < vandaag;
  const bezig = periode.van <= vandaag && vandaag <= periode.tot;
  // Wat achter je ligt staat dichtgeklapt: je opent de pagina in de periode
  // waar je nú in zit.
  const uitgeklapt = !voorbij || open;
  const vakantie = periode.eindigtMet;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={
          "overflow-hidden rounded-3xl border bg-white shadow-sm " +
          (bezig ? "border-brand/40" : "border-black/5")
        }
      >
        <button
          onClick={zetOpen}
          disabled={!voorbij}
          aria-expanded={uitgeklapt}
          className={
            "flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-4 text-left " +
            (voorbij ? "hover:bg-cream/60" : "cursor-default")
          }
        >
          <span className="font-bold text-ink">{periode.naam}</span>
          <span className="text-sm text-ink/55">
            {bereikTekst(periode.van, periode.tot)}, {periode.weken} weken
          </span>
          {bezig && (
            <span className="rounded-lg bg-brand-dark px-2 py-0.5 text-xs font-bold text-white">
              hier zit je nu
            </span>
          )}
          {voorbij && (
            <span className="ml-auto text-sm font-semibold text-ink/40">
              {uitgeklapt ? "verbergen" : `${items.length} momenten, afgerond`}
            </span>
          )}
        </button>

        {uitgeklapt && (
          <ul className="px-5 pb-4">
            {!items.length && (
              <li className="py-3 text-sm text-ink/50">
                Niets in deze periode. Wat je zelf plant komt hier ook te staan.
              </li>
            )}
            {items.map((item, n) => {
              const vorige = items[n - 1];
              const hierIsVandaag =
                bezig && item.datum >= vandaag && (!vorige || vorige.datum < vandaag);
              return (
                <div key={item.id}>
                  {hierIsVandaag && (
                    <li className="flex items-center gap-3 py-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                        vandaag
                      </span>
                      <span className="h-px flex-1 bg-brand/35" />
                    </li>
                  )}
                  <Regel item={item} vandaag={vandaag} toonDag={toonDag} groepen={groepen} />
                </div>
              );
            })}
          </ul>
        )}
      </div>

      {vakantie && (
        <div className="flex flex-wrap items-baseline gap-x-3 rounded-2xl border-l-[3px] border-brand/30 bg-sand px-5 py-3.5">
          <span className="font-bold text-ink/80">{vakantie.naam}</span>
          <span className="text-sm text-ink/55">
            {kort(vakantie.van)} tot en met {kort(vakantie.tot)}
          </span>
          <span className="ml-auto text-sm font-semibold text-ink/45">
            {verschil(vakantie.van, vakantie.tot) + 1} dagen vrij
          </span>
        </div>
      )}
    </div>
  );
}

function Regel({
  item,
  vandaag,
  toonDag,
  groepen,
}: {
  item: PlanItem;
  vandaag: string;
  toonDag: (datum: string) => void;
  groepen: number[];
}) {
  const geweest = (item.totDatum || item.datum) < vandaag;
  const et = ETIKET[item.soort];
  // Gaat dit waarschijnlijk niet over jou, dan blijft het staan maar rustiger:
  // je moet het kunnen zien zonder dat het je lijst overneemt.
  const zijkant = zijkantLabel(item, groepen);
  return (
    <li
      className={
        "border-t border-black/5 first:border-t-0 " +
        (geweest ? "opacity-45 " : zijkant ? "opacity-60 " : "")
      }
    >
      {/* De hele regel is aanklikbaar: dan komt het kaartje van die dag naar
          voren met alles wat er die dag staat, en hoe laat. */}
      <button
        onClick={() => toonDag(item.datum)}
        className="-mx-2 flex w-[calc(100%+1rem)] flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl px-2 py-3 text-left transition-colors hover:bg-cream/70"
      >
        <span className="w-[5.5rem] shrink-0 text-sm font-bold tabular-nums text-ink/55">
          {dagKort(item.datum)}
          {item.totDatum > item.datum ? "…" : ""}
        </span>
        <span className="font-semibold text-ink">{item.titel}</span>
        {item.begin && (
          <span className="text-sm text-ink/50">
            {item.begin}
            {item.eind ? ` tot ${item.eind}` : ""}
          </span>
        )}
        <span className={"rounded-lg px-2 py-0.5 text-xs font-bold " + et.stijl}>{et.woord}</span>
        {zijkant && (
          <span className="rounded-lg border border-black/10 px-2 py-0.5 text-xs font-semibold text-ink/45">
            {zijkant}
          </span>
        )}
        {item.tijdvakken > 1 && (
          <span className="text-sm text-ink/45">{item.tijdvakken} tijdvakken</span>
        )}
      </button>
    </li>
  );
}

/** "wo 25 nov" */
function dagKort(iso: string): string {
  return `${["ma", "di", "wo", "do", "vr", "za", "zo"][weekdag(iso)]} ${kort(iso)}`;
}

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
  const [toonAlles, setToonAlles] = useState(false);

  // Een schoolagenda staat vol met dingen van andere groepen en oproepen aan
  // ouders. Die tonen we gewoon, alleen rustiger: gedempt en met een merkje.
  // Verbergen is te riskant, want bij groep 8 hoort soms iets waar de hele
  // school bij is. Wie het tóch strak wil, zet het filter zelf aan.
  const zeef = filterVoorMij(volledigeBron.items, mijnGroepen);
  const opzij = zeef.andereGroep + zeef.ouderoproep;
  const bron = toonAlles ? { ...volledigeBron, items: zeef.voorMij } : volledigeBron;

  const { schooljaar, items } = bron;
  const loopt = vandaag >= schooljaar.start && vandaag <= schooljaar.eind;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Mijn schooljaar</h1>
          <p className="mt-2 max-w-xl text-lg text-ink/70">
            Je hele jaar op een rij: vakanties, studiedagen, rapporten en gesprekken. Koppel de
            agenda van je school en hij vult zichzelf.
          </p>
        </div>

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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
              {(["lijst", "maand"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWeergave(w)}
                  className={
                    "rounded-xl px-4 py-1.5 text-sm font-bold transition-colors " +
                    (weergave === w ? "bg-brand-dark text-white" : "text-ink/55 hover:text-ink")
                  }
                >
                  {w === "lijst" ? "Lijst" : "Maand"}
                </button>
              ))}
            </div>
            {telDubbelingen(items) > 0 && (
              <p className="text-sm text-ink/55">
                {telDubbelingen(items)} afspraken stonden in meer dan één agenda. Die tel ik één
                keer.
              </p>
            )}
          </div>

          {opzij > 0 && (
            <p className="text-sm text-ink/55">
              {toonAlles ? (
                <>
                  {opzij} afspraken van andere groepen en oproepen aan ouders staan nu niet in je
                  jaar.
                </>
              ) : (
                <>
                  {opzij} afspraken gaan waarschijnlijk niet over jou. Die staan er gedempt bij, met
                  een merkje, zodat je ze wel ziet.
                </>
              )}{" "}
              <button
                onClick={() => setToonAlles(!toonAlles)}
                className="font-bold text-brand-dark underline-offset-4 hover:underline"
              >
                {toonAlles ? "Toon ze toch" : "Alleen wat van mij is"}
              </button>
            </p>
          )}

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
  const peil = loopt ? vandaag : schooljaar.start;

  const vakantie = schooljaar.vakanties.find((v) => v.van > peil);
  const vrijeDag = items.find(
    (i) => !i.dubbelVan && i.soort === "vrij" && i.datum >= peil && i.datum <= schooljaar.eind,
  );
  const periode = periodes.find((p) => peil >= p.van && peil <= p.tot);

  // De drukste week die nog komt: waar de meeste afspraken op één week vallen.
  const perWeek = new Map<string, number>();
  for (const i of items) {
    if (i.dubbelVan || i.datum < peil || i.datum > schooljaar.eind) continue;
    if (i.soort === "vakantie" || i.soort === "vrij") continue;
    const week = maandagVan(i.datum);
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
  }
  const drukste = [...perWeek.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  const feiten = [
    {
      label: "Volgende vakantie",
      groot: vakantie ? vakantie.naam : "geen meer dit jaar",
      klein: vakantie ? `over ${Math.max(1, Math.round(verschil(peil, vakantie.van) / 7))} weken` : "",
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
      <div className="grid gap-px overflow-hidden rounded-3xl border border-black/5 bg-black/5 shadow-sm sm:grid-cols-3">
        {feiten.map((f) => (
          <div key={f.label} className="bg-white px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{f.label}</p>
            <p className="mt-1.5 text-lg font-bold leading-tight text-ink">{f.groot}</p>
            {f.klein && <p className="mt-0.5 text-sm text-ink/55">{f.klein}</p>}
          </div>
        ))}
      </div>
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
        <div className="flex flex-wrap items-baseline gap-x-3 rounded-2xl bg-sand px-5 py-3.5">
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

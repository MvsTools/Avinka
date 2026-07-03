"use client";

import { Fragment, useEffect, useState } from "react";
import {
  getStatistiek,
  getMinuten,
  getPerDag,
  getCommunityStats,
  getStreak,
  type Tellers,
  type PerDag,
  type CommunityStats,
} from "@/lib/db";
import Logo from "@/components/Logo";
import { amsterdamDatum, huidigeMijlpaal, volgendeMijlpaal } from "@/lib/streak";
import { TIJD_DEFS } from "@/lib/tijdwinst";

// Label, icoon, kleur en terugvalwaarde per actie-soort komen uit de centrale
// tijdwinst-bron (src/lib/tijdwinst.ts), zodat alles op één plek staat.
const DEFS = TIJD_DEFS;

// De hoofdtools en welke actie-soorten (subtools) eronder vallen. In de tabel tonen
// we de hoofdtool met het OPGETELDE cijfer van z'n subtools; de subtools staan achter
// een inklapmenu (ze tellen wél individueel mee). Zo blijft het overzichtelijk als er
// meer tools/subtools bijkomen.
const HOOFDTOOLS: { id: string; label: string; icon: string }[] = [
  { id: "toetsanalyse", label: "Toetsanalyse", icon: "📊" },
  { id: "rapporten", label: "Rapporten", icon: "📝" },
  { id: "oudercontact", label: "Oudercontact", icon: "💬" },
  { id: "plattegrond", label: "Plattegrond", icon: "🪑" },
  { id: "lesontwerp", label: "Lesontwerp", icon: "📓" },
];
const SUB_NAAR_HOOFD: Record<string, string> = {
  analyse: "toetsanalyse",
  rapport: "rapporten",
  gesprek: "oudercontact",
  weekbericht: "oudercontact",
  nieuwsbrief: "oudercontact",
  bericht: "oudercontact",
  brief: "oudercontact",
  uitnodiging: "oudercontact",
  plattegrond: "plattegrond",
  lesontwerp: "lesontwerp",
};

// Periodekiezer voor de grote teller: hoeveel tijd bespaarde je per X.
type Periode = "vandaag" | "week" | "maand" | "schooljaar";
const PERIODEN: { id: Periode; label: string }[] = [
  { id: "vandaag", label: "Vandaag" },
  { id: "week", label: "Afgelopen 7 dagen" },
  { id: "maand", label: "Afgelopen 30 dagen" },
  { id: "schooljaar", label: "Dit schooljaar" },
];

function isoDatum(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Eerste dag (YYYY-MM-DD) van de gekozen periode, t.o.v. vandaag. Week en maand
// zijn voortschrijdende vensters (laatste 7 resp. 30 dagen, incl. vandaag) zodat
// week altijd binnen maand valt — een kalenderweek kan namelijk vóór de 1e van de
// maand beginnen, waardoor "week" groter kon lijken dan "maand". Het schooljaar
// loopt van 1 augustus tot en met 31 juli.
function periodeStart(periode: Periode, vandaag: string): string {
  if (periode === "vandaag") return vandaag;
  const d = new Date(vandaag + "T00:00:00");
  if (periode === "week") {
    const van = new Date(d);
    van.setDate(d.getDate() - 6); // afgelopen 7 dagen, incl. vandaag
    return isoDatum(van);
  }
  if (periode === "maand") {
    const van = new Date(d);
    van.setDate(d.getDate() - 29); // afgelopen 30 dagen, incl. vandaag
    return isoDatum(van);
  }
  const jaar = d.getMonth() + 1 >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${jaar}-08-01`;
}

// Tel minuten + acties uit per_dag binnen de periode (t/m vandaag).
function periodeSom(perDag: PerDag, periode: Periode, vandaag: string): { m: number; n: number } {
  const start = periodeStart(periode, vandaag);
  let m = 0;
  let n = 0;
  for (const [dag, v] of Object.entries(perDag)) {
    if (dag >= start && dag <= vandaag) {
      m += v?.m ?? 0;
      n += v?.n ?? 0;
    }
  }
  return { m, n };
}

// Leesbare tijd. Onder een dag: "X uur Y min". Vanaf een dag schakelt 'ie over op
// dagen ("X d Y u Z min") zodat een groot community-totaal niet "872 uur" wordt.
function tijdTekst(min: number): string {
  const totaal = Math.max(0, Math.round(min));
  if (totaal < 60) return `${totaal} min`;
  const totU = Math.floor(totaal / 60);
  const m = totaal % 60;
  if (totU < 24) return m > 0 ? `${totU} uur ${m} min` : `${totU} uur`;
  const d = Math.floor(totU / 24);
  const u = totU % 24;
  let s = `${d} d`;
  if (u > 0) s += ` ${u} u`;
  if (m > 0) s += ` ${m} min`;
  return s;
}

export default function StatistiekenView() {
  const [tellers, setTellers] = useState<Tellers | null>(null);
  const [minuten, setMinuten] = useState<Tellers>({});
  const [perDag, setPerDag] = useState<PerDag>({});
  const [periode, setPeriode] = useState<Periode>("schooljaar");
  const [comm, setComm] = useState<CommunityStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [record, setRecord] = useState(0);
  const [openTools, setOpenTools] = useState<Set<string>>(new Set());
  const toggleTool = (id: string) =>
    setOpenTools((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  useEffect(() => {
    getStatistiek().then(setTellers);
    getMinuten().then(setMinuten);
    getPerDag().then(setPerDag);
    getCommunityStats().then(setComm);
    getStreak().then((s) => {
      setStreak(s.streak);
      setRecord(s.record);
    });
  }, []);

  if (!tellers) return null;

  const aantal = (s: string) => tellers[s] ?? 0;

  // Adaptieve bespaarde minuten per soort: het opgetelde echte getal, met een
  // terugval op aantal × vaste waarde voor (oude) tellingen zonder opgeslagen tijd.
  const minVan = (d: (typeof DEFS)[number]) =>
    minuten[d.sleutel] ?? aantal(d.sleutel) * d.vast;
  const commMinVan = (d: (typeof DEFS)[number]) =>
    comm ? (comm.somMinuten[d.sleutel] ?? (comm.som[d.sleutel] ?? 0) * d.vast) : 0;

  const totaalMin = DEFS.reduce((s, d) => s + minVan(d), 0);
  const totaalActies = DEFS.reduce((s, d) => s + aantal(d.sleutel), 0);

  // Tijd + acties voor de gekozen periode (uit per_dag). Voor "dit schooljaar"
  // vallen we terug op het lifetime-totaal als per_dag nog niet gevuld is (bv. de
  // backfill is nog niet gedraaid), zodat de hero nooit onterecht op nul staat.
  const vandaagIso = amsterdamDatum(new Date());
  const som = periodeSom(perDag, periode, vandaagIso);
  const heroMin = periode === "schooljaar" && som.m === 0 ? totaalMin : som.m;
  const heroActies = periode === "schooljaar" && som.n === 0 ? totaalActies : som.n;
  const communityMin = comm ? DEFS.reduce((s, d) => s + commMinVan(d), 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Grote teller: tijd bespaard + streak-vlam */}
      <div className="relative rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white shadow-lg sm:p-10">
        {/* decoratie-cirkels, netjes binnen het vak geclipt */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/5" />
        </div>
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold uppercase tracking-wider text-white/70">
              ⏱️ Tijd bespaard met Avinka
            </p>
            {/* Subtiele periodekiezer: hoeveel tijd bespaarde je per vandaag/week/maand/schooljaar */}
            <div className="mt-3 inline-flex flex-wrap gap-1 rounded-full bg-white/10 p-1">
              {PERIODEN.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriode(p.id)}
                  className={
                    "rounded-full px-3 py-1 text-xs font-semibold transition " +
                    (periode === p.id
                      ? "bg-white text-brand shadow-sm"
                      : "text-white/70 hover:text-white")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
            <TijdTeller minuten={heroMin} />
            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
              {totaalActies === 0 ? (
                <>Zodra je de tools gebruikt, telt je bespaarde tijd hier vanzelf op.</>
              ) : heroActies > 0 ? (
                <>
                  Geschat op basis van <strong>{heroActies}</strong>{" "}
                  {heroActies === 1 ? "actie" : "acties"} met de tools.
                </>
              ) : (
                <>In deze periode nog geen tijd bespaard.</>
              )}
            </p>
          </div>
          <StreakVlam streak={streak} record={record} />
        </div>
      </div>

      {/* Highlight-kaartjes: meest gebruikte tool · productiefste dag · hoogste streak */}
      <Highlights tellers={tellers} streak={streak} record={record} perDag={perDag} vandaag={vandaagIso} />

      {/* Volledige tabel: per hoofdtool, met subtools achter een inklapmenu */}
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/45">
              <th className="px-5 py-3 font-semibold">Wat</th>
              <th className="px-3 py-3 text-right font-semibold">Aantal</th>
              <th className="px-5 py-3 text-right font-semibold">Tijd bespaard</th>
            </tr>
          </thead>
          <tbody>
            {HOOFDTOOLS.map((h) => {
              const subs = DEFS.filter((d) => SUB_NAAR_HOOFD[d.sleutel] === h.id);
              const n = subs.reduce((s, d) => s + aantal(d.sleutel), 0);
              const min = subs.reduce((s, d) => s + minVan(d), 0);
              const uitklapbaar = subs.length > 1;
              const isOpen = openTools.has(h.id);
              return (
                <Fragment key={h.id}>
                  <tr className="border-b border-black/5">
                    <td className="px-5 py-3 font-medium text-ink">
                      {uitklapbaar ? (
                        <button
                          type="button"
                          onClick={() => toggleTool(h.id)}
                          className="flex items-center gap-2 text-left transition hover:text-brand"
                        >
                          <span className={"text-xs text-ink/40 transition " + (isOpen ? "rotate-90" : "")}>▸</span>
                          <span>{h.icon}</span>
                          {h.label}
                        </button>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="w-3" />
                          <span>{h.icon}</span>
                          {h.label}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-ink">{n}</td>
                    <td className="px-5 py-3 text-right text-ink/70">{tijdTekst(min)}</td>
                  </tr>
                  {uitklapbaar &&
                    isOpen &&
                    subs.map((d) => (
                      <tr key={d.sleutel} className="border-b border-black/5 bg-cream/30 text-ink/70">
                        <td className="py-2.5 pl-12 pr-5">{d.label}</td>
                        <td className="px-3 py-2.5 text-right">{aantal(d.sleutel)}</td>
                        <td className="px-5 py-2.5 text-right">{tijdTekst(minVan(d))}</td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
            <tr className="bg-cream/50 font-bold">
              <td className="px-5 py-3 text-ink">Totaal</td>
              <td className="px-3 py-3 text-right text-ink">{totaalActies}</td>
              <td className="px-5 py-3 text-right text-brand">{tijdTekst(totaalMin)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Avinka in cijfers: community-brede statistieken (onderaan — eerst je eigen cijfers) */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="flex items-center gap-1.5 text-xl font-bold text-ink">
          <Logo className="h-[18px] w-auto" />
          <span>in cijfers</span>
        </h2>
        {comm ? (
          <>
            <p className="mt-1 text-sm text-ink/60">
              Zie hoeveel tijd leerkrachten samen besparen met Avinka.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <CijferCel icon="⏱️" waarde={tijdTekst(communityMin)} label="totaal bespaard" />
              <CijferCel
                icon="👥"
                waarde={`${comm.gebruikers}`}
                label={comm.gebruikers === 1 ? "leerkracht" : "leerkrachten"}
              />
              <CijferCel
                icon="📈"
                waarde={comm.actieveWeken >= 5 ? tijdTekst(comm.gemActieveWeek) : "—"}
                label="gemiddeld per week"
              />
              <CijferCel
                icon="🔥"
                waarde={
                  comm.hoogsteStreak > 0
                    ? `${comm.hoogsteStreak} ${comm.hoogsteStreak === 1 ? "dag" : "dagen"}`
                    : "—"
                }
                label="hoogste streak"
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink/55">
            De gemeenschapscijfers verschijnen zodra ze beschikbaar zijn.
          </p>
        )}
      </div>

    </div>
  );
}

// Drie compacte highlight-kaartjes: Meest gebruikte tool · Productiefste dag · Hoogste streak.
// Werkt ook netjes bij weinig data. Tools/streak uit de lifetime-tellers; productiefste
// dag uit per_dag (met de 1-augustus-backfill uitgesloten zodat het een échte dag toont).
function Highlights({
  tellers,
  streak,
  record,
  perDag,
  vandaag,
}: {
  tellers: Tellers;
  streak: number;
  record: number;
  perDag: PerDag;
  vandaag: string;
}) {
  // Hoogste streak ooit: telt de lopende streak meteen mee zodra die het opgeslagen
  // record passeert; na verbreken blijft hij op het record staan tot een nieuwe hoger wordt.
  const hoogsteStreak = Math.max(streak, record);
  // Meest gebruikte tool: het soort met de hoogste teller.
  let beste: (typeof DEFS)[number] | null = null;
  let besteN = 0;
  for (const d of DEFS) {
    const n = tellers[d.sleutel] ?? 0;
    if (n > besteN) {
      besteN = n;
      beste = d;
    }
  }

  // Productiefste dag: dag met de meeste bespaarde minuten. De 1-augustus-bucket
  // (eenmalige backfill van het oude totaal) slaan we over zodat het een échte dag is.
  const backfillDag = periodeStart("schooljaar", vandaag);
  let topIso = "";
  let topMin = 0;
  for (const [dag, v] of Object.entries(perDag)) {
    if (dag === backfillDag) continue;
    const mv = v?.m ?? 0;
    if (mv > topMin) {
      topMin = mv;
      topIso = dag;
    }
  }
  const topDatum = topIso
    ? new Date(topIso + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })
    : null;

  const kaarten = [
    {
      icon: beste?.icon ?? "🧰",
      label: "Meest gebruikt",
      waarde: beste ? beste.kort : "—",
      sub: besteN > 0 ? `${besteN} keer gebruikt` : "nog niks gebruikt",
    },
    {
      icon: "🏆",
      label: "Beste dag",
      waarde: topMin > 0 ? tijdTekst(topMin) : "—",
      sub: topDatum ?? "nog geen activiteit",
    },
    {
      icon: "🔥",
      label: "Hoogste streak",
      waarde: hoogsteStreak > 0 ? `${hoogsteStreak} ${hoogsteStreak === 1 ? "dag" : "dagen"}` : "—",
      sub: hoogsteStreak > 0 ? "je langste reeks ooit" : "nog geen reeks",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {kaarten.map((k) => (
        <div key={k.label} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 text-lg font-bold text-ink/80">
            <span className="text-xl" aria-hidden>
              {k.icon}
            </span>
            {k.label}
          </div>
          <p className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink">{k.waarde}</p>
          <p className="mt-1 text-sm text-ink/55">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

// Duolingo-achtige vlam met je streak (opeenvolgende werkdagen actief).
function StreakVlam({ streak, record }: { streak: number; record: number }) {
  const dood = streak === 0;
  const mijlpaal = huidigeMijlpaal(streak);
  const volgende = volgendeMijlpaal(streak);
  return (
    <div className="flex shrink-0 flex-col items-center text-center sm:-my-6">
      <div className="relative h-40 w-36 sm:-mt-10">
        <svg
          viewBox="0 0 24 24"
          className="h-full w-full [filter:drop-shadow(0_6px_10px_rgba(0,0,0,0.3))]"
          aria-hidden
        >
          <defs>
            {/* Echte vuurkleur: gloeiend goud onderin → oranje → vuurrood bovenin */}
            <linearGradient id="vlamkleur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff3d00" />
              <stop offset="45%" stopColor="#ff9100" />
              <stop offset="100%" stopColor="#ffd000" />
            </linearGradient>
            <linearGradient id="vlamkern" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff9100" />
              <stop offset="100%" stopColor="#fff3a0" />
            </linearGradient>
          </defs>
          <path
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
            fill={dood ? "rgba(255,255,255,0.18)" : "url(#vlamkleur)"}
          />
          {!dood && (
            <path
              d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
              fill="url(#vlamkern)"
              transform="translate(12 15) scale(0.55) translate(-12 -15)"
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center pt-4 font-serif text-4xl font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.35)]">
          {streak}
        </span>
      </div>
      <p className="mt-1 text-base font-semibold text-white">
        {dood
          ? "Start je streak!"
          : `${streak} ${streak === 1 ? "dag" : "dagen"} op rij`}
      </p>
      {mijlpaal ? (
        <span className="mt-2 rounded-full bg-white/20 px-3.5 py-1 text-sm font-bold text-white">
          {mijlpaal.emoji} {mijlpaal.titel}
        </span>
      ) : volgende ? (
        <span className="mt-2 text-xs text-white/75">
          Nog {volgende.vanaf - streak} tot {volgende.emoji} {volgende.titel}
        </span>
      ) : null}
      {record > streak && record > 0 && (
        <p className="mt-1.5 text-xs text-white/55">Record: {record}</p>
      )}
    </div>
  );
}

// Compacte community-cijfercel: icoon, groot getal, klein label. Past in een rooster naast elkaar.
function CijferCel({ icon, waarde, label }: { icon: string; waarde: string; label: string }) {
  return (
    <div className="rounded-2xl bg-brand p-4 text-white">
      <p className="text-base" aria-hidden>
        {icon}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold leading-none">{waarde}</p>
      <p className="mt-1.5 text-sm text-white/80">{label}</p>
    </div>
  );
}

// Grote teller die soepel naar het eindgetal telt en netjes als uur/min toont.
function TijdTeller({ minuten }: { minuten: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let begin = 0;
    const duur = 900;
    function stap(t: number) {
      if (!begin) begin = t;
      const p = Math.min(1, (t - begin) / duur);
      setN(Math.round(minuten * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(stap);
    }
    raf = requestAnimationFrame(stap);
    return () => cancelAnimationFrame(raf);
  }, [minuten]);

  const dagen = Math.floor(n / 1440);
  const uren = Math.floor((n % 1440) / 60);
  const restMin = n % 60;
  const klein = "text-2xl font-normal sm:text-3xl";
  return (
    <div className="mt-2 font-serif text-5xl font-semibold leading-none sm:text-6xl">
      {dagen > 0 ? (
        // Vanaf een dag: dagen + uren (minuten weglaten, blijft kort en leesbaar).
        <>
          {dagen}
          <span className={klein}> d</span>
          {uren > 0 && (
            <>
              {" "}
              {uren}
              <span className={klein}> u</span>
            </>
          )}
        </>
      ) : uren > 0 ? (
        <>
          {uren}
          <span className={klein}> uur</span>
          {restMin > 0 && (
            <>
              {" "}
              {restMin}
              <span className={klein}> min</span>
            </>
          )}
        </>
      ) : (
        <>
          {restMin}
          <span className={klein}> min</span>
        </>
      )}
    </div>
  );
}

"use client";

import { Fragment, useState } from "react";

/**
 * SCHETS (niet in het dashboard opgenomen, niets geregistreerd, geen database).
 * Doel: laten zien hoe "Mijn schooljaar" eruit gaat zien voordat we het echt bouwen.
 * Twee schermen: het koppelen van een agenda, en je jaar op een rij.
 *
 * Weghalen = deze map verwijderen. Er hangt niets aan vast.
 *
 * De vakantiedatums hieronder zijn echt: opgehaald uit de open data van de
 * Rijksoverheid (schooljaar 2026-2027, regio midden). De rest is nagemaakt op
 * de verhoudingen uit een echte Parro-agenda.
 */

// ---------------------------------------------------------------- gegevens

const START = "2026-08-31"; // eerste schooldag
const EIND = "2027-07-16"; // laatste schooldag
const VANDAAG = "2026-11-12"; // vaste demodag, zodat je ziet hoe het jaar zich vult

type Vakantie = { naam: string; kort: string; van: string; tot: string };
const VAKANTIES: Vakantie[] = [
  { naam: "Herfstvakantie", kort: "herfst", van: "2026-10-17", tot: "2026-10-25" },
  { naam: "Kerstvakantie", kort: "kerst", van: "2026-12-19", tot: "2027-01-03" },
  { naam: "Voorjaarsvakantie", kort: "voorjaar", van: "2027-02-20", tot: "2027-02-28" },
  { naam: "Meivakantie", kort: "mei", van: "2027-04-24", tot: "2027-05-02" },
];

type Soort = "studiedag" | "rapport" | "gesprek" | "vergadering" | "activiteit";
type Item = { datum: string; soort: Soort; wat: string; tijd?: string; tool?: string };

const ITEMS: Item[] = [
  { datum: "2026-09-10", soort: "vergadering", wat: "Teamvergadering", tijd: "16:00" },
  { datum: "2026-09-22", soort: "gesprek", wat: "Startgesprekken", tijd: "18:00 tot 21:00", tool: "Oudercontact" },
  { datum: "2026-09-30", soort: "studiedag", wat: "Studiedag, alle groepen vrij" },
  { datum: "2026-10-08", soort: "vergadering", wat: "Bouwoverleg", tijd: "16:00" },
  { datum: "2026-11-11", soort: "studiedag", wat: "Studiedag, alle groepen vrij" },
  { datum: "2026-11-19", soort: "vergadering", wat: "Teamvergadering", tijd: "16:00" },
  { datum: "2026-11-25", soort: "rapport", wat: "Rapporten mee naar huis", tool: "Rapporten" },
  { datum: "2026-11-30", soort: "gesprek", wat: "Oudergesprekken", tijd: "18:00 tot 21:00", tool: "Oudercontact" },
  { datum: "2026-12-02", soort: "gesprek", wat: "Oudergesprekken", tijd: "18:00 tot 21:00", tool: "Oudercontact" },
  { datum: "2026-12-17", soort: "activiteit", wat: "Kerstviering" },
  { datum: "2027-01-18", soort: "activiteit", wat: "Toetsweken beginnen", tool: "Toetsanalyse" },
  { datum: "2027-01-27", soort: "studiedag", wat: "Studiedag, alle groepen vrij" },
  { datum: "2027-02-04", soort: "vergadering", wat: "Teamvergadering", tijd: "16:00" },
  { datum: "2027-02-10", soort: "rapport", wat: "Rapporten mee naar huis", tool: "Rapporten" },
  { datum: "2027-02-15", soort: "gesprek", wat: "Oudergesprekken", tijd: "18:00 tot 21:00", tool: "Oudercontact" },
  { datum: "2027-02-17", soort: "gesprek", wat: "Oudergesprekken", tijd: "18:00 tot 21:00", tool: "Oudercontact" },
  { datum: "2027-03-17", soort: "studiedag", wat: "Studiedag, alle groepen vrij" },
  { datum: "2027-03-25", soort: "vergadering", wat: "Teamvergadering", tijd: "16:00" },
  { datum: "2027-04-16", soort: "activiteit", wat: "Koningsspelen" },
  { datum: "2027-05-19", soort: "studiedag", wat: "Studiedag, alle groepen vrij" },
  { datum: "2027-05-28", soort: "activiteit", wat: "Sportdag" },
  { datum: "2027-06-07", soort: "activiteit", wat: "Toetsweken beginnen", tool: "Toetsanalyse" },
  { datum: "2027-06-11", soort: "activiteit", wat: "Schoolreis", tool: "Draaiboek" },
  { datum: "2027-06-23", soort: "studiedag", wat: "Studiedag, alle groepen vrij" },
  { datum: "2027-06-28", soort: "gesprek", wat: "Eindgesprekken", tijd: "18:00 tot 21:00", tool: "Oudercontact" },
  { datum: "2027-07-07", soort: "rapport", wat: "Rapporten mee naar huis", tool: "Rapporten" },
  { datum: "2027-07-13", soort: "activiteit", wat: "Musical groep 8" },
];

// Hoe druk elke week voelt (0 tot 1). In het echte scherm rekent de code dit uit
// het aantal items plus je eigen geplande uren na schooltijd.
const DRUKTE_PIEKEN: Record<string, number> = {
  "2026-08-31": 0.75, // startweek
  "2026-09-07": 0.5,
  "2026-09-14": 0.7,
  "2026-09-21": 0.6,
  "2026-09-28": 0.45,
  "2026-10-05": 0.4,
  "2026-10-12": 0.5,
  "2026-10-26": 0.35,
  "2026-11-02": 0.45,
  "2026-11-09": 0.55,
  "2026-11-16": 0.8,
  "2026-11-23": 0.95, // rapporten
  "2026-11-30": 1.0, // rapporten plus gesprekken
  "2026-12-07": 0.5,
  "2026-12-14": 0.65,
  "2027-01-04": 0.4,
  "2027-01-11": 0.5,
  "2027-01-18": 0.8,
  "2027-01-25": 0.85,
  "2027-02-01": 0.7,
  "2027-02-08": 0.95,
  "2027-02-15": 0.9,
  "2027-03-01": 0.4,
  "2027-03-08": 0.45,
  "2027-03-15": 0.5,
  "2027-03-22": 0.45,
  "2027-03-29": 0.4,
  "2027-04-05": 0.45,
  "2027-04-12": 0.5,
  "2027-04-19": 0.4,
  "2027-05-03": 0.35,
  "2027-05-10": 0.45,
  "2027-05-17": 0.5,
  "2027-05-24": 0.55,
  "2027-05-31": 0.6,
  "2027-06-07": 0.8,
  "2027-06-14": 0.75,
  "2027-06-21": 0.7,
  "2027-06-28": 0.85,
  "2027-07-05": 0.9,
  "2027-07-12": 0.6,
};

// ---------------------------------------------------------------- datumwerk

// Alles in UTC rekenen. Deden we dit met de lokale tijd, dan schuift elke
// berekening in de zomertijd een dag op en klopt de weektelling niet meer.
function dag(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}
function dagen(a: string, b: string): number {
  return Math.round((dag(b).getTime() - dag(a).getTime()) / 86400000);
}
function plus(iso: string, n: number): string {
  return new Date(dag(iso).getTime() + n * 86400000).toISOString().slice(0, 10);
}
/** Maandag van de week waarin deze datum valt. */
function maandag(iso: string): string {
  return plus(iso, -((dag(iso).getUTCDay() + 6) % 7));
}
const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
function kort(iso: string): string {
  const d = dag(iso);
  return `${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]}`;
}
function lang(iso: string): string {
  const d = dag(iso);
  return `${DAGEN[d.getUTCDay()]} ${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]}`;
}
function inVakantie(iso: string): Vakantie | undefined {
  return VAKANTIES.find((v) => iso >= v.van && iso <= v.tot);
}

// ------------------------------------------------------- je jaar op een rij

/** Elk moment krijgt een woord, niet alleen een kleur. */
const ETIKET: Record<Soort, { woord: string; stijl: string }> = {
  studiedag: { woord: "Vrije dag", stijl: "bg-brand-soft text-brand-dark" },
  rapport: { woord: "Rapporten", stijl: "bg-accent-soft text-amber-800" },
  gesprek: { woord: "Gesprekken", stijl: "border border-brand/35 bg-white text-brand-dark" },
  vergadering: { woord: "Vergadering", stijl: "bg-cream text-ink/60" },
  activiteit: { woord: "Activiteit", stijl: "bg-cream text-ink/60" },
};

/** "wo 25 nov" */
function dagKort(iso: string): string {
  const d = dag(iso);
  return `${DAGEN[d.getUTCDay()].slice(0, 2)} ${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]}`;
}

const MAANDVOL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];
function datumVol(iso: string): string {
  const d = dag(iso);
  return `${DAGEN[d.getUTCDay()]} ${d.getUTCDate()} ${MAANDVOL[d.getUTCMonth()]}`;
}

// ------------------------------------------------------------ maandweergave

const WEEKDAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** Het weeknummer zoals scholen en methodes het gebruiken (ISO). */
function weeknummer(iso: string): number {
  const d = dag(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // donderdag van die week
  const eersteDonderdag = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  eersteDonderdag.setUTCDate(
    eersteDonderdag.getUTCDate() - ((eersteDonderdag.getUTCDay() + 6) % 7) + 3,
  );
  return 1 + Math.round((d.getTime() - eersteDonderdag.getTime()) / 604800000);
}

/** Kleur van het stipje in de compacte (telefoon) weergave. */
const STIP: Record<Soort, string> = {
  studiedag: "bg-brand-dark",
  rapport: "bg-amber-500",
  gesprek: "border-2 border-brand-dark",
  vergadering: "bg-ink/40",
  activiteit: "bg-ink/40",
};

function Maandweergave() {
  const [eerste, setEerste] = useState(VANDAAG.slice(0, 7) + "-01");
  const [gekozen, setGekozen] = useState<string | null>(null);

  const jaar = Number(eerste.slice(0, 4));
  const maand = Number(eerste.slice(5, 7)) - 1;
  const aantalDagen = new Date(Date.UTC(jaar, maand + 1, 0)).getUTCDate();
  const laatste = `${eerste.slice(0, 7)}-${String(aantalDagen).padStart(2, "0")}`;

  // Het rooster begint altijd op een maandag en loopt door tot de week
  // waarin de laatste dag van de maand valt.
  const rasterStart = maandag(eerste);
  const rijen = Math.ceil((dagen(rasterStart, laatste) + 1) / 7);
  const cellen = Array.from({ length: rijen * 7 }, (_, i) => plus(rasterStart, i));

  const verschuif = (n: number) => {
    const d = new Date(Date.UTC(jaar, maand + n, 1));
    setEerste(d.toISOString().slice(0, 10));
  };
  const kanTerug = eerste > START.slice(0, 7) + "-01";
  const kanVooruit = eerste < EIND.slice(0, 7) + "-01";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-ink">
          {MAANDVOL[maand]} {jaar}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => verschuif(-1)}
            disabled={!kanTerug}
            aria-label="Vorige maand"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96] disabled:opacity-35"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => verschuif(1)}
            disabled={!kanVooruit}
            aria-label="Volgende maand"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96] disabled:opacity-35"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        {eerste !== VANDAAG.slice(0, 7) + "-01" && (
          <button
            onClick={() => setEerste(VANDAAG.slice(0, 7) + "-01")}
            className="text-sm font-bold text-brand-dark underline-offset-4 hover:underline"
          >
            Naar vandaag
          </button>
        )}
        <p className="ml-auto text-sm text-ink/50">Groen betekent vrij</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] border-b border-black/5">
          <div className="px-1 py-2 text-center text-xs font-bold uppercase tracking-wider text-ink/30">
            wk
          </div>
          {WEEKDAGEN.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-ink/40">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[2.6rem_repeat(7,minmax(0,1fr))]">
          {cellen.map((datum, i) => {
            const weekcel =
              i % 7 === 0 ? (
                <div
                  key={"wk" + datum}
                  className="flex min-h-[92px] items-start justify-center border-b border-r border-black/5 bg-cream/50 pt-2 text-xs font-bold tabular-nums text-ink/35"
                >
                  {weeknummer(datum)}
                </div>
              ) : null;
            const d = dag(datum);
            const dezeMaand = datum.slice(0, 7) === eerste.slice(0, 7);
            const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
            const vak = inVakantie(datum);
            const items = ITEMS.filter((it) => it.datum === datum);
            const studiedag = items.some((it) => it.soort === "studiedag");
            const vrij = !!vak || studiedag;
            const isVandaag = datum === VANDAAG;
            const eersteVakantiedag = vak && (vak.van === datum || d.getUTCDay() === 1);

            return (
              <Fragment key={datum}>
              {weekcel}
              <button
                onClick={() => setGekozen(gekozen === datum ? null : datum)}
                aria-label={`${datumVol(datum)}${items.length ? `, ${items.length} afspraken` : ""}`}
                className={
                  "min-h-[58px] border-b border-r border-black/5 p-1 text-left sm:min-h-[92px] sm:p-1.5 " +
                  (i % 7 === 6 ? "border-r-0 " : "") +
                  (!dezeMaand ? "opacity-35 " : "") +
                  (gekozen === datum ? "ring-2 ring-inset ring-brand " : "") +
                  (vrij ? "bg-brand-soft " : weekend ? "bg-cream/70 " : "bg-white ")
                }
              >
                <span
                  className={
                    "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold tabular-nums " +
                    (isVandaag
                      ? "bg-brand-dark text-white"
                      : weekend && !vrij
                        ? "text-ink/35"
                        : "text-ink/70")
                  }
                >
                  {d.getUTCDate()}
                </span>

                {eersteVakantiedag && dezeMaand && (
                  <p className="mt-0.5 hidden truncate text-[11px] font-bold leading-tight text-brand-dark sm:block">
                    {vak.naam}
                  </p>
                )}

                {/* Op een laptop de hele naam, op een telefoon stipjes. Zeven
                    kolommen met tekst passen daar simpelweg niet. */}
                <span className="mt-1 hidden flex-col gap-1 sm:flex">
                  {items.map((it) => (
                    <span
                      key={it.wat}
                      title={it.wat + (it.tijd ? `, ${it.tijd}` : "")}
                      className={
                        "truncate rounded-md px-1.5 py-0.5 text-[11px] font-bold leading-snug " +
                        (it.soort === "studiedag"
                          ? "bg-white/70 text-brand-dark"
                          : ETIKET[it.soort].stijl)
                      }
                    >
                      {it.soort === "studiedag" ? "Studiedag" : it.wat}
                    </span>
                  ))}
                </span>
                <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                  {items.map((it) => (
                    <span
                      key={it.wat}
                      className={"h-1.5 w-1.5 rounded-full " + STIP[it.soort]}
                    />
                  ))}
                </span>
              </button>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Tik een dag aan en je ziet wat er staat. Op een telefoon is dit de
          manier om bij de details te komen, op een laptop een snelle blik. */}
      {gekozen && (
        <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-bold text-ink">{datumVol(gekozen)}</p>
            <button
              onClick={() => setGekozen(null)}
              className="text-sm font-semibold text-ink/50 hover:text-ink"
            >
              Sluiten
            </button>
          </div>
          {inVakantie(gekozen) && (
            <p className="mt-1 font-semibold text-brand-dark">
              {inVakantie(gekozen)!.naam}, je bent vrij
            </p>
          )}
          <ul className="mt-1">
            {ITEMS.filter((it) => it.datum === gekozen).map((it) => (
              <Regel key={it.wat} item={it} />
            ))}
          </ul>
          {!inVakantie(gekozen) && !ITEMS.some((it) => it.datum === gekozen) && (
            <p className="mt-1 text-sm text-ink/55">
              Niets bijzonders deze dag. Een gewone lesdag dus.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type Blok = { nr: number; van: string; tot: string };
type Stuk = { soort: "blok"; blok: Blok } | { soort: "vakantie"; vakantie: Vakantie };

function bouwStukken(): Stuk[] {
  const uit: Stuk[] = [];
  let cursor = START;
  let nr = 1;
  for (const v of VAKANTIES) {
    uit.push({ soort: "blok", blok: { nr: nr++, van: cursor, tot: plus(v.van, -1) } });
    uit.push({ soort: "vakantie", vakantie: v });
    cursor = plus(v.tot, 1);
  }
  uit.push({ soort: "blok", blok: { nr: nr, van: cursor, tot: EIND } });
  return uit;
}

function Regel({ item }: { item: Item }) {
  const geweest = item.datum < VANDAAG;
  const et = ETIKET[item.soort];
  return (
    <li
      className={
        "flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-black/5 py-3 first:border-t-0 " +
        (geweest ? "opacity-45" : "")
      }
    >
      <span className="w-[5.5rem] shrink-0 text-sm font-bold tabular-nums text-ink/55">
        {dagKort(item.datum)}
      </span>
      <span className="font-semibold text-ink">{item.wat}</span>
      {item.tijd && <span className="text-sm text-ink/50">{item.tijd}</span>}
      <span className={"rounded-lg px-2 py-0.5 text-xs font-bold " + et.stijl}>{et.woord}</span>
      {item.tool && !geweest && (
        <button className="ml-auto shrink-0 text-sm font-bold text-brand-dark underline-offset-4 hover:underline">
          {item.tool} openen
        </button>
      )}
    </li>
  );
}

function Jaaroverzicht() {
  const stukken = bouwStukken();

  // Blokken die helemaal achter je liggen staan dichtgeklapt. Je opent de
  // pagina dus midden in de periode waar je nú in zit.
  const [open, setOpen] = useState<number[]>([]);
  const [weergave, setWeergave] = useState<"lijst" | "maand">("lijst");

  const weken = (() => {
    let n = 0;
    let d = maandag(START);
    while (d <= EIND) {
      if (!inVakantie(plus(d, 2))) n++;
      d = plus(d, 7);
    }
    return n;
  })();
  const nu = (() => {
    let n = 0;
    let d = maandag(START);
    while (d <= VANDAAG) {
      if (!inVakantie(plus(d, 2))) n++;
      d = plus(d, 7);
    }
    return n;
  })();

  const volgendeVakantie = VAKANTIES.find((v) => v.van > VANDAAG)!;
  const volgendeStudiedag = ITEMS.find((i) => i.soort === "studiedag" && i.datum >= VANDAAG);
  const drukste = Object.entries(DRUKTE_PIEKEN)
    .filter(([ma]) => ma > VANDAAG)
    .sort((a, b) => b[1] - a[1])[0];

  const feiten = [
    {
      label: "Volgende vakantie",
      groot: volgendeVakantie.naam,
      klein: `over ${Math.round(dagen(VANDAAG, volgendeVakantie.van) / 7)} weken`,
    },
    {
      label: "Volgende studiedag",
      groot: volgendeStudiedag ? datumVol(volgendeStudiedag.datum) : "geen meer dit jaar",
      klein: volgendeStudiedag ? "alle groepen vrij" : "",
    },
    {
      label: "Drukste week hierna",
      groot: drukste ? `${kort(drukste[0])} tot ${kort(plus(drukste[0], 4))}` : "",
      klein: "rapporten en gesprekken",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Schooljaar 2026 tot 2027
          </h2>
          <p className="mt-1.5 text-ink/70">
            Je zit in week {nu} van {weken}.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
          {["Jaar", "Week", "Vandaag"].map((t, i) => (
            <span
              key={t}
              className={
                "rounded-xl px-3.5 py-1.5 text-sm font-bold " +
                (i === 0 ? "bg-brand-dark text-white" : "text-ink/55")
              }
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* De drie dingen waar een leerkracht echt naar zoekt. Meteen leesbaar. */}
      <div className="grid gap-px overflow-hidden rounded-3xl border border-black/5 bg-black/5 shadow-sm sm:grid-cols-3">
        {feiten.map((f) => (
          <div key={f.label} className="bg-white px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{f.label}</p>
            <p className="mt-1.5 text-lg font-bold leading-tight text-ink">{f.groot}</p>
            {f.klein && <p className="mt-0.5 text-sm text-ink/55">{f.klein}</p>}
          </div>
        ))}
      </div>

      {/* Het meedenken. Geen chatvenster, gewoon een notitie. */}
      <div className="rounded-2xl border-l-[3px] border-brand bg-brand-soft/70 px-5 py-4">
        <p className="leading-7 text-ink/85">
          Over twee weken gaan de rapporten mee, en diezelfde week staan de
          oudergesprekken. Dat wordt je drukste week van dit najaar.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]">
            Zet twee avonden vrij
          </button>
          <button className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition-transform duration-150 active:scale-[0.97]">
            Niet nodig
          </button>
        </div>
      </div>

      {/* Zelfde gegevens, twee manieren van kijken. De keuze blijft staan. */}
      <div className="flex items-center gap-1 self-start rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
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

      {weergave === "maand" && <Maandweergave />}

      <div className={weergave === "lijst" ? "" : "hidden"}>
        <h3 className="text-lg font-bold text-ink">Je jaar op een rij</h3>

        <div className="mt-4 flex flex-col gap-4">
          {stukken.map((s) => {
            if (s.soort === "vakantie") {
              const v = s.vakantie;
              const aantal = dagen(v.van, v.tot) + 1;
              return (
                <div
                  key={v.naam}
                  className="flex flex-wrap items-baseline gap-x-3 rounded-2xl bg-sand px-5 py-3.5"
                >
                  <span className="font-bold text-ink/80">{v.naam}</span>
                  <span className="text-sm text-ink/55">
                    {kort(v.van)} tot en met {kort(v.tot)}
                  </span>
                  <span className="ml-auto text-sm font-semibold text-ink/45">
                    {aantal} dagen vrij
                  </span>
                </div>
              );
            }

            const b = s.blok;
            const items = ITEMS.filter((i) => i.datum >= b.van && i.datum <= b.tot);
            const voorbij = b.tot < VANDAAG;
            const bezig = b.van <= VANDAAG && VANDAAG <= b.tot;
            const uitgeklapt = !voorbij || open.includes(b.nr);
            const wekenInBlok = Math.round((dagen(b.van, b.tot) + 1) / 7);

            return (
              <div
                key={"blok" + b.nr}
                className={
                  "overflow-hidden rounded-3xl border bg-white shadow-sm " +
                  (bezig ? "border-brand/40" : "border-black/5")
                }
              >
                <button
                  onClick={() =>
                    setOpen((o) => (o.includes(b.nr) ? o.filter((n) => n !== b.nr) : [...o, b.nr]))
                  }
                  disabled={!voorbij}
                  aria-expanded={uitgeklapt}
                  className={
                    "flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-4 text-left " +
                    (voorbij ? "hover:bg-cream/60" : "cursor-default")
                  }
                >
                  <span className="font-bold text-ink">Blok {b.nr}</span>
                  <span className="text-sm text-ink/55">
                    {kort(b.van)} tot {kort(b.tot)}, {wekenInBlok} weken
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
                    {items.length === 0 && (
                      <li className="py-3 text-sm text-ink/50">
                        Nog niets in deze periode. Wat je zelf plant komt hier ook te staan.
                      </li>
                    )}
                    {items.map((it, n) => {
                      const vorige = items[n - 1];
                      const toonVandaag =
                        bezig &&
                        it.datum >= VANDAAG &&
                        (!vorige || vorige.datum < VANDAAG);
                      return (
                        <div key={it.datum + it.wat}>
                          {toonVandaag && (
                            <li className="flex items-center gap-3 py-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                                vandaag
                              </span>
                              <span className="h-px flex-1 bg-brand/35" />
                            </li>
                          )}
                          <Regel item={it} />
                        </div>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------- koppelen

type Bron = { id: string; naam: string; regel: string; stappen: string[] };
const BRONNEN: Bron[] = [
  {
    id: "parro",
    naam: "Parro",
    regel: "De agenda die je school met ouders deelt",
    stappen: [
      "Ga naar talk.parro.com en log in",
      "Klik op Instellingen",
      "Klik op Agenda koppelen en daarna op Aan de slag",
      "Klik op de link om hem te kopiëren",
    ],
  },
  {
    id: "socialschools",
    naam: "Social Schools",
    regel: "Zelfde idee, andere schoolapp",
    stappen: [
      "Ga naar app.socialschools.eu en log in",
      "Open het tabblad Agenda",
      "Klik rechtsboven op Abonneren",
      "Klik op de link om hem te kopiëren",
    ],
  },
  {
    id: "outlook",
    naam: "Outlook of Teams",
    regel: "Je vergaderingen en werkafspraken. Teams zit hierbij in",
    stappen: [
      "Open Outlook in de browser",
      "Ga naar Instellingen, dan Agenda, dan Gedeelde agenda's",
      "Kies je agenda onder Een agenda publiceren",
      "Kopieer de ICS-link",
    ],
  },
  {
    id: "bestand",
    naam: "Een agendabestand",
    regel: "Lukt koppelen niet? Sleep hier een .ics-bestand naartoe",
    stappen: [
      "Open de agenda die je wilt gebruiken",
      "Kies exporteren of opslaan als",
      "Bewaar het .ics-bestand op je computer",
      "Sleep het hier naartoe",
    ],
  },
];

type Telling = { soort: string; woord: string; aantal: number; slots?: number; vrij: boolean };
type Uitslag = {
  naam: string | null;
  aantal: number;
  blokken: number;
  van: string | null;
  tot: string | null;
  telling: Telling[];
};

function Koppelen() {
  const [open, setOpen] = useState<string | null>("parro");
  const [link, setLink] = useState("");
  const [bezig, setBezig] = useState(false);
  const [uitslag, setUitslag] = useState<Uitslag | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  async function controleer() {
    setBezig(true);
    setFout(null);
    setUitslag(null);
    try {
      const antwoord = await fetch("/api/agenda/controleer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link }),
      });
      const data = await antwoord.json();
      if (!antwoord.ok) setFout(data.fout || "Er ging iets mis.");
      else setUitslag(data);
    } catch {
      setFout("We konden de agenda niet bereiken. Probeer het zo nog eens.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Waar staat de agenda van je school?
        </h2>
        <p className="mt-1.5 max-w-xl leading-7 text-ink/70">
          Plak één link en je hele schooljaar staat er. Studiedagen, rapporten,
          gesprekken. Je mag er zoveel toevoegen als je wilt, want bij de meeste
          scholen staat niet alles op één plek.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        {BRONNEN.map((b, i) => {
          const uit = open === b.id;
          return (
            <div key={b.id} className={i > 0 ? "border-t border-black/5" : ""}>
              <button
                onClick={() => {
                  setOpen(uit ? null : b.id);
                  setUitslag(null);
                  setFout(null);
                }}
                aria-expanded={uit}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-cream/60"
              >
                <span
                  className={
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors " +
                    (uit ? "bg-brand-soft" : "bg-cream")
                  }
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25855a" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                    <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{b.naam}</span>
                  <span className="block text-sm text-ink/60">{b.regel}</span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={"shrink-0 text-ink/30 transition-transform duration-200 " + (uit ? "rotate-90" : "")}
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Openklappen zonder springen: grid-rows van 0 naar 1 */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: uit ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pl-20">
                    <ol className="flex flex-col gap-1.5 text-sm text-ink/70">
                      {b.stappen.map((s, n) => (
                        <li key={n} className="flex gap-2.5">
                          <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-ink/50">
                            {n + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ol>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <input
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !bezig && controleer()}
                        className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream/50 px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink/35 focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,158,110,0.18)]"
                        placeholder="Plak hier je link"
                        aria-label={`Agendalink van ${b.naam}`}
                      />
                      <button
                        onClick={controleer}
                        disabled={bezig}
                        className="rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
                      >
                        {bezig ? "Even kijken…" : "Controleren"}
                      </button>
                    </div>

                    {fout && (
                      <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        {fout}
                      </p>
                    )}

                    {uitslag && (
                      <div className="mt-4 rounded-2xl bg-brand-soft/70 px-4 py-4">
                        <p className="font-bold text-ink">
                          Gelukt. {uitslag.aantal} afspraken gevonden
                          {uitslag.van && uitslag.tot
                            ? `, van ${kort(uitslag.van)} ${uitslag.van.slice(0, 4)} tot ${kort(uitslag.tot)} ${uitslag.tot.slice(0, 4)}`
                            : ""}
                          .
                        </p>
                        <ul className="mt-2.5 flex flex-col gap-1 text-sm text-ink/75">
                          {uitslag.telling.map((t) => (
                            <li key={t.soort}>
                              <strong className="font-bold text-ink">{t.aantal}</strong>{" "}
                              {t.woord}
                              {t.slots ? ` (${t.slots} losse tijdvakken, samengevouwen per dag)` : ""}
                              {t.vrij ? ", die zet ik meteen op vrij" : ""}
                              {t.soort === "overig" ? ", die ken ik niet en laat ik staan zoals ze zijn" : ""}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-sm font-semibold text-ink/70">
                          Wat wil je hiervan overnemen?
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {["Alles", "Alleen hele dagen", "Alleen wat Avinka herkent"].map((k, n) => (
                            <span
                              key={k}
                              className={
                                "rounded-xl px-3.5 py-1.5 text-sm font-semibold " +
                                (n === 0
                                  ? "bg-brand-dark text-white"
                                  : "border border-black/10 bg-white text-ink/70")
                              }
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="max-w-xl text-sm leading-6 text-ink/55">
        Zo'n link is een sleutel tot jouw agenda. Hij staat versleuteld in je
        eigen account, alleen jij kunt erbij, en je kunt hem met één klik
        intrekken. Namen van kinderen worden afgeschermd voordat er iets wordt
        bewaard.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- pagina

export default function JaarSchets() {
  const [beeld, setBeeld] = useState<"lint" | "koppel">("lint");

  return (
    <div className="min-h-dvh bg-cream">
      {/* Alleen om te bekijken, hoort straks niet in het echte scherm */}
      <div className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-ink/40">
            Schets
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setBeeld("koppel")}
              className={
                "rounded-lg px-3 py-1 text-sm font-semibold transition-colors " +
                (beeld === "koppel" ? "bg-ink text-cream" : "text-ink/55 hover:text-ink")
              }
            >
              1. Koppelen
            </button>
            <button
              onClick={() => setBeeld("lint")}
              className={
                "rounded-lg px-3 py-1 text-sm font-semibold transition-colors " +
                (beeld === "lint" ? "bg-ink text-cream" : "text-ink/55 hover:text-ink")
              }
            >
              2. Je jaar
            </button>
          </div>
          <span className="ml-auto hidden text-xs text-ink/40 sm:block">
            demodag: donderdag 12 november 2026
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {beeld === "lint" ? <Jaaroverzicht /> : <Koppelen />}
      </div>
    </div>
  );
}

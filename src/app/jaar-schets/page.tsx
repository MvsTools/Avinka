"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * SCHETS (niet in het dashboard opgenomen, niets geregistreerd, geen database).
 * Doel: laten zien hoe "Mijn schooljaar" eruit gaat zien voordat we het echt bouwen.
 * Twee schermen: het koppelen van een agenda, en het jaarlint zelf.
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

// ---------------------------------------------------------------- het lint

const BREEDTE = 1000;
const HOOGTE = 108;
const BASIS = 52; // de hartlijn van de draad
const DUN = 1.4; // halve dikte in een rustige week
const DIK = 11.5; // halve dikte in de drukste week

function Jaarlint() {
  const totaal = dagen(START, EIND);
  const x = (iso: string) => (dagen(START, iso) / totaal) * BREEDTE;
  const vandaagX = x(VANDAAG);

  // Weken van het schooljaar, met hun druktewaarde.
  const weken = useMemo(() => {
    const lijst: { ma: string; druk: number; vakantie: boolean }[] = [];
    let d = maandag(START);
    while (d <= EIND) {
      lijst.push({
        ma: d,
        druk: DRUKTE_PIEKEN[d] ?? 0,
        vakantie: !!inVakantie(plus(d, 2)),
      });
      d = plus(d, 7);
    }
    return lijst;
  }, [totaal]);

  // De draad. Eén doorlopende streek die aanzwelt waar het druk wordt en
  // dun blijft in een rustige week. Bij een vakantie breekt hij af: dat gat
  // is de adempauze. De uiteinden lopen taps toe, als een echte penstreek.
  const draden = (() => {
    const paden: string[] = [];
    let run: { ma: string; druk: number }[] = [];

    const vloei = (p: { x: number; y: number }[]) => {
      let d = "";
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i];
        const b = p[i + 1];
        const mx = ((a.x + b.x) / 2).toFixed(1);
        d += ` C ${mx} ${a.y.toFixed(1)}, ${mx} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      return d;
    };

    const sluit = () => {
      if (run.length === 0) return;
      const punten = [
        { px: x(run[0].ma), h: DUN * 0.55 },
        ...run.map((w) => ({ px: x(plus(w.ma, 2)), h: DUN + w.druk * (DIK - DUN) })),
        { px: x(plus(run[run.length - 1].ma, 4)), h: DUN * 0.55 },
      ];
      const boven = punten.map((p) => ({ x: p.px, y: BASIS - p.h }));
      const onder = [...punten].reverse().map((p) => ({ x: p.px, y: BASIS + p.h }));
      paden.push(
        `M ${boven[0].x.toFixed(1)} ${boven[0].y.toFixed(1)}` +
          vloei(boven) +
          ` L ${onder[0].x.toFixed(1)} ${onder[0].y.toFixed(1)}` +
          vloei(onder) +
          " Z",
      );
      run = [];
    };

    for (const w of weken) {
      if (w.vakantie) sluit();
      else run.push(w);
    }
    sluit();
    return paden;
  })();

  // Maandlabels onder de lijn.
  const maandLabels = (() => {
    const uit: { px: number; naam: string }[] = [];
    const d = dag(START);
    d.setDate(1);
    for (let i = 0; i < 12; i++) {
      d.setMonth(d.getMonth() + 1);
      const iso = d.toISOString().slice(0, 10);
      if (iso > START && iso < EIND) uit.push({ px: x(iso), naam: MAANDEN[d.getMonth()] });
    }
    return uit;
  })();

  // Intekenen bij het eerste bezoek van deze sessie. Daarna meteen scherp,
  // want dit scherm zie je elke dag en dan is wachten op een animatie irritant.
  const [getekend, setGetekend] = useState(true);
  useEffect(() => {
    const rust = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rust || sessionStorage.getItem("avinka-lint-getekend")) return;
    setGetekend(false);
    sessionStorage.setItem("avinka-lint-getekend", "1");
    const t = setTimeout(() => setGetekend(true), 40);
    return () => clearTimeout(t);
  }, []);

  const [actief, setActief] = useState<Item | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const komend = ITEMS.filter((i) => i.datum >= VANDAAG).slice(0, 4);
  const schoolweken = weken.filter((w) => !w.vakantie).length;
  const geweest = weken.filter((w) => !w.vakantie && w.ma <= VANDAAG).length;
  const volgendeVakantie = VAKANTIES.find((v) => v.van > VANDAAG);
  const wekenTot = volgendeVakantie ? Math.round(dagen(VANDAAG, volgendeVakantie.van) / 7) : 0;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Schooljaar 2026 tot 2027
          </h2>
          <p className="mt-1.5 text-ink/70">
            Week {geweest} van {schoolweken}.{" "}
            {volgendeVakantie && (
              <>
                Nog {wekenTot} weken tot de {volgendeVakantie.naam.toLowerCase()}.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
          {["Jaar", "Week", "Vandaag"].map((t, i) => (
            <span
              key={t}
              className={
                "rounded-xl px-3.5 py-1.5 text-sm font-bold transition-colors " +
                (i === 0 ? "bg-brand-dark text-white" : "text-ink/55")
              }
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Het lint */}
      {/* Op een telefoon zou het hele jaar tot postzegelformaat krimpen, dus
          daar schuift de strook zelf horizontaal. De pagina blijft stilstaan. */}
      <div ref={wrap} className="relative -mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:overflow-visible sm:px-0">
        <svg
          viewBox={`0 0 ${BREEDTE} ${HOOGTE}`}
          className="w-full min-w-[860px]"
          style={{ overflow: "visible" }}
          role="img"
          aria-label="Tijdlijn van het schooljaar met vakanties, studiedagen en drukke periodes"
        >
          <defs>
            <clipPath id="tot-vandaag">
              <rect x={0} y={0} width={vandaagX} height={HOOGTE} />
            </clipPath>
          </defs>

          {/* Vakanties krijgen geen eigen vorm. Het gat in de draad ís de
              vakantie: even niets. Alleen een naam erboven. */}
          {VAKANTIES.map((v) => (
            <text
              key={v.naam}
              x={(x(v.van) + x(plus(v.tot, 1))) / 2}
              y={BASIS - 16}
              textAnchor="middle"
              className="fill-ink/40"
              style={{ fontSize: 11, letterSpacing: 0.2 }}
            >
              {v.kort}
            </text>
          ))}

          {/* Het hele jaar, nog niet geleefd */}
          {draden.map((d, i) => (
            <path key={i} d={d} fill="rgba(34,28,58,0.10)" />
          ))}

          {/* Wat geweest is, in groene inkt. Dit deel groeit mee met het jaar. */}
          <g
            style={{
              clipPath: getekend ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 900ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            <g clipPath="url(#tot-vandaag)">
              {draden.map((d, i) => (
                <path key={i} d={d} fill="#2f9e6e" />
              ))}
            </g>
          </g>

          {/* Maanden, rustig eronder */}
          {maandLabels.map((m) => (
            <text
              key={m.naam + m.px}
              x={m.px}
              y={BASIS + 32}
              textAnchor="middle"
              className="fill-ink/35"
              style={{ fontSize: 11, letterSpacing: 1.2 }}
            >
              {m.naam}
            </text>
          ))}

          {/* De momenten zelf, op de lijn */}
          {ITEMS.map((it) => {
            const px = x(it.datum);
            const aan = actief?.datum === it.datum && actief?.wat === it.wat;
            const geweestAl = it.datum <= VANDAAG;
            const kleur = geweestAl ? "#25855a" : "rgba(34,28,58,0.35)";
            return (
              <g
                key={it.datum + it.wat}
                tabIndex={0}
                role="button"
                aria-label={`${it.wat}, ${lang(it.datum)}`}
                onMouseEnter={() => setActief(it)}
                onMouseLeave={() => setActief(null)}
                onFocus={() => setActief(it)}
                onBlur={() => setActief(null)}
                style={{ cursor: "pointer", outline: "none" }}
                className="[&:focus-visible>*:first-child]:opacity-100"
              >
                {/* onzichtbaar groter raakvlak plus focusring */}
                <circle cx={px} cy={BASIS} r={13} fill="transparent" />
                <circle
                  cx={px}
                  cy={BASIS}
                  r={11}
                  fill="none"
                  stroke="#2f9e6e"
                  strokeWidth={2}
                  className="opacity-0"
                />
                {it.soort === "studiedag" && (
                  <line
                    x1={px}
                    y1={BASIS - 7}
                    x2={px}
                    y2={BASIS + 7}
                    stroke={geweestAl ? "#25855a" : "rgba(34,28,58,0.4)"}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                )}
                {it.soort === "rapport" && (
                  <circle cx={px} cy={BASIS} r={aan ? 5.5 : 4.5} fill="#f59e0b" style={{ transition: "r 150ms" }} />
                )}
                {it.soort === "gesprek" && (
                  <circle cx={px} cy={BASIS} r={aan ? 5.5 : 4.5} fill="#fbf6ee" stroke={kleur} strokeWidth={2.5} style={{ transition: "r 150ms" }} />
                )}
                {it.soort === "vergadering" && <circle cx={px} cy={BASIS} r={2.6} fill={kleur} />}
                {it.soort === "activiteit" && (
                  <circle cx={px} cy={BASIS} r={aan ? 4.5 : 3.5} fill={kleur} style={{ transition: "r 150ms" }} />
                )}
              </g>
            );
          })}

          {/* Vandaag */}
          <line
            x1={vandaagX}
            y1={14}
            x2={vandaagX}
            y2={BASIS + 16}
            stroke="#25855a"
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.5}
          />
          <circle cx={vandaagX} cy={BASIS} r={6.5} fill="#fbf6ee" />
          <circle cx={vandaagX} cy={BASIS} r={4.5} fill="#25855a" />
          <text
            x={vandaagX}
            y={9}
            textAnchor="middle"
            className="fill-brand-dark"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}
          >
            vandaag
          </text>
        </svg>

        {/* Wat je aanwijst */}
        {actief && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-2xl border border-black/5 bg-white px-3.5 py-2.5 shadow-lg"
            style={{
              left: `${(x(actief.datum) / BREEDTE) * 100}%`,
              top: "calc(100% - 34px)",
              transformOrigin: "top center",
              animation: "lintPop 150ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            <p className="text-sm font-bold text-ink">{actief.wat}</p>
            <p className="mt-0.5 text-xs text-ink/60">
              {lang(actief.datum)}
              {actief.tijd ? `, ${actief.tijd}` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Uitleg van de tekens, want kleur alleen is niet genoeg */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink/55">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-0.5 rounded bg-brand-dark" /> studiedag
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" /> rapporten
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-brand-dark" /> gesprekken
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink/40" /> vergadering
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded bg-sand" /> vakantie
        </span>
      </div>

      {/* Het vooruitkijken. Geen chatvenster, gewoon een notitie op papier. */}
      <div className="rounded-2xl border-l-[3px] border-brand bg-brand-soft/70 px-5 py-4">
        <p className="leading-7 text-ink/85">
          Over twee weken gaan de rapporten mee, en diezelfde week staan de
          oudergesprekken. Dat wordt de drukste week van je najaar.
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

      {/* Wat eraan komt */}
      <div>
        <h3 className="text-lg font-bold text-ink">Hierna</h3>
        <ul className="mt-3 border-l border-black/10 pl-5">
          {komend.map((it) => (
            <li key={it.datum + it.wat} className="relative py-3 last:pb-0">
              <span className="absolute -left-[23px] top-[18px] h-2 w-2 rounded-full bg-brand ring-4 ring-cream" />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="w-16 shrink-0 text-sm font-bold tabular-nums text-ink/45">
                  {kort(it.datum)}
                </span>
                <span className="font-semibold text-ink">{it.wat}</span>
                {it.tijd && <span className="text-sm text-ink/50">{it.tijd}</span>}
                {it.tool && (
                  <span className="ml-auto text-sm font-bold text-brand-dark">
                    {it.tool} openen
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes lintPop {
          from { opacity: 0; transform: translate(-50%, -4px) scale(0.96); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="lintPop"] { animation: none !important; }
        }
      `}</style>
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

function Koppelen() {
  const [open, setOpen] = useState<string | null>("parro");
  const [gevonden, setGevonden] = useState(false);
  const [bezig, setBezig] = useState(false);

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
                  setGevonden(false);
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
                        className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream/50 px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink/35 focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,158,110,0.18)]"
                        placeholder="Plak hier je link"
                        aria-label={`Agendalink van ${b.naam}`}
                      />
                      <button
                        onClick={() => {
                          setBezig(true);
                          setTimeout(() => {
                            setBezig(false);
                            setGevonden(true);
                          }, 700);
                        }}
                        className="rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
                      >
                        {bezig ? "Kijken…" : "Controleren"}
                      </button>
                    </div>

                    {gevonden && (
                      <div className="mt-4 rounded-2xl bg-brand-soft/70 px-4 py-4">
                        <p className="font-bold text-ink">
                          Gelukt. 174 afspraken gevonden, tot september volgend jaar.
                        </p>
                        <ul className="mt-2.5 flex flex-col gap-1 text-sm text-ink/75">
                          <li>7 studiedagen, die zet ik meteen op vrij</li>
                          <li>3 keer rapporten mee</li>
                          <li>82 gespreksmomenten, samengevouwen tot 4 avonden</li>
                          <li>5 vergaderingen</li>
                          <li>48 losse afspraken die ik niet herken, die blijven gewoon staan</li>
                        </ul>
                        <p className="mt-3 text-sm font-semibold text-ink/70">Wat wil je hiervan overnemen?</p>
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
              2. Het jaarlint
            </button>
          </div>
          <span className="ml-auto hidden text-xs text-ink/40 sm:block">
            demodag: donderdag 12 november 2026
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {beeld === "lint" ? <Jaarlint /> : <Koppelen />}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  getStatistiek,
  getMinuten,
  getCommunityStats,
  getStreak,
  type Tellers,
  type CommunityStats,
} from "@/lib/db";
import { huidigeMijlpaal, volgendeMijlpaal } from "@/lib/streak";
import { TIJD_DEFS } from "@/lib/tijdwinst";

// Label, icoon, kleur en terugvalwaarde per actie-soort komen uit de centrale
// tijdwinst-bron (src/lib/tijdwinst.ts), zodat alles op één plek staat.
const DEFS = TIJD_DEFS;

function tijdTekst(min: number): string {
  const u = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (u > 0) return m > 0 ? `${u} uur ${m} min` : `${u} uur`;
  return `${m} min`;
}

export default function StatistiekenView() {
  const [tellers, setTellers] = useState<Tellers | null>(null);
  const [minuten, setMinuten] = useState<Tellers>({});
  const [comm, setComm] = useState<CommunityStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [record, setRecord] = useState(0);

  useEffect(() => {
    getStatistiek().then(setTellers);
    getMinuten().then(setMinuten);
    getCommunityStats().then(setComm);
    getStreak().then((s) => {
      setStreak(s.streak);
      setRecord(s.record);
    });
  }, []);

  if (!tellers) return null;

  const aantal = (s: string) => tellers[s] ?? 0;
  const gemiddeld = (s: string) =>
    comm && comm.gebruikers > 0 ? (comm.som[s] ?? 0) / comm.gebruikers : 0;

  // Adaptieve bespaarde minuten per soort: het opgetelde echte getal, met een
  // terugval op aantal × vaste waarde voor (oude) tellingen zonder opgeslagen tijd.
  const minVan = (d: (typeof DEFS)[number]) =>
    minuten[d.sleutel] ?? aantal(d.sleutel) * d.vast;
  const commMinVan = (d: (typeof DEFS)[number]) =>
    comm ? (comm.somMinuten[d.sleutel] ?? (comm.som[d.sleutel] ?? 0) * d.vast) : 0;

  const totaalMin = DEFS.reduce((s, d) => s + minVan(d), 0);
  const totaalActies = DEFS.reduce((s, d) => s + aantal(d.sleutel), 0);
  const communityMin = comm ? DEFS.reduce((s, d) => s + commMinVan(d), 0) : 0;
  const gemMin = comm && comm.gebruikers > 0 ? communityMin / comm.gebruikers : 0;

  // Schaal voor de balken
  const maxBar = Math.max(
    1,
    ...DEFS.map((d) => Math.max(aantal(d.sleutel), gemiddeld(d.sleutel))),
  );
  const actieveDefs = DEFS.filter((d) => aantal(d.sleutel) > 0 || gemiddeld(d.sleutel) > 0);
  const verdict = gemMin <= 0 ? "" : totaalMin >= gemMin ? "boven" : "onder";

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
            <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
              ⏱️ Tijd bespaard met Avinka
            </p>
            <TijdTeller minuten={totaalMin} />
            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
              {totaalActies > 0 ? (
                <>
                  Geschat op basis van <strong>{totaalActies}</strong>{" "}
                  {totaalActies === 1 ? "actie" : "acties"} met de tools — tijd die je
                  terugkrijgt voor je klas.
                </>
              ) : (
                <>Zodra je de tools gebruikt, telt je bespaarde tijd hier vanzelf op.</>
              )}
            </p>
          </div>
          <StreakVlam streak={streak} record={record} />
        </div>
      </div>

      {/* Balkgrafiek: jouw acties, met het gemiddelde als streepje */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">Jouw acties</h2>
          {comm && comm.gebruikers > 1 && (
            <span className="flex items-center gap-1.5 text-xs text-ink/55">
              <span className="inline-block h-3 w-0.5 bg-ink/40" /> = gemiddelde Avinka-gebruiker
            </span>
          )}
        </div>
        {actieveDefs.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-black/15 bg-cream/50 px-4 py-8 text-center text-sm text-ink/55">
            Nog niets te zien — gebruik een tool en je grafiek vult zich vanzelf.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3.5">
            {actieveDefs.map((d) => {
              const n = aantal(d.sleutel);
              const g = gemiddeld(d.sleutel);
              return (
                <div key={d.sleutel} className="flex items-center gap-3">
                  <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium text-ink/70 sm:w-32">
                    <span>{d.icon}</span>
                    <span className="truncate">{d.kort}</span>
                  </span>
                  <div className="relative h-3.5 flex-1 rounded-full bg-cream">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{ width: `${(n / maxBar) * 100}%`, background: d.kleur }}
                    />
                    {comm && comm.gebruikers > 1 && g > 0 && (
                      <div
                        className="absolute -inset-y-1 w-0.5 rounded bg-ink/40"
                        style={{ left: `${Math.min(100, (g / maxBar) * 100)}%` }}
                        title={`Gemiddeld: ${g.toFixed(1)}`}
                      />
                    )}
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-bold text-ink">{n}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vergelijking met de gemeenschap */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-ink">Jij &amp; de Avinka-gemeenschap</h2>
        {comm ? (
          <>
            <p className="mt-1 text-sm text-ink/65">
              Samen bespaarden <strong>{comm.gebruikers}</strong>{" "}
              {comm.gebruikers === 1 ? "leerkracht" : "leerkrachten"} al{" "}
              <strong>{tijdTekst(communityMin)}</strong> met Avinka.
              {comm.gebruikers <= 3 && " Je hoort bij de eerste pioniers ✨"}
            </p>
            {comm.gebruikers > 1 && (
              <div className="mt-5 flex flex-col gap-3">
                <VergBalk label="Jij" minuten={totaalMin} max={Math.max(totaalMin, gemMin, 1)} kleur="#2f9e6e" />
                <VergBalk label="Gemiddeld" minuten={gemMin} max={Math.max(totaalMin, gemMin, 1)} kleur="#c7c9f0" />
                {verdict && (
                  <p className="mt-1 text-sm font-semibold text-ink/75">
                    {verdict === "boven"
                      ? "💪 Je bespaart meer tijd dan de gemiddelde Avinka-gebruiker."
                      : "Je bent goed op weg — de gemiddelde gebruiker zit iets hoger."}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-ink/55">
            De vergelijking met andere gebruikers verschijnt zodra de gemeenschapscijfers
            beschikbaar zijn.
          </p>
        )}
      </div>

      {/* Volledige tabel */}
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/45">
              <th className="px-5 py-3 font-semibold">Wat</th>
              <th className="px-3 py-3 text-right font-semibold">Aantal</th>
              <th className="px-3 py-3 text-right font-semibold">Tijd bespaard</th>
              {comm && comm.gebruikers > 1 && (
                <th className="px-5 py-3 text-right font-semibold">Gemiddeld</th>
              )}
            </tr>
          </thead>
          <tbody>
            {DEFS.map((d) => (
              <tr key={d.sleutel} className="border-b border-black/5 last:border-0">
                <td className="px-5 py-3 font-medium text-ink">
                  <span className="mr-1.5">{d.icon}</span>
                  {d.label}
                </td>
                <td className="px-3 py-3 text-right font-bold text-ink">{aantal(d.sleutel)}</td>
                <td className="px-3 py-3 text-right text-ink/70">
                  {tijdTekst(minVan(d))}
                </td>
                {comm && comm.gebruikers > 1 && (
                  <td className="px-5 py-3 text-right text-ink/50">{gemiddeld(d.sleutel).toFixed(1)}</td>
                )}
              </tr>
            ))}
            <tr className="bg-cream/50 font-bold">
              <td className="px-5 py-3 text-ink">Totaal</td>
              <td className="px-3 py-3 text-right text-ink">{totaalActies}</td>
              <td className="px-3 py-3 text-right text-brand">{tijdTekst(totaalMin)}</td>
              {comm && comm.gebruikers > 1 && (
                <td className="px-5 py-3 text-right text-ink/50">{tijdTekst(gemMin)}</td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink/45">
        De tellers lopen vanzelf op terwijl je de tools gebruikt en blijven staan. Vergelijkingen
        tonen alleen gemiddelden van de hele groep — nooit gegevens van een andere gebruiker.
        Tijdsbesparing is een richtlijn, geen exacte meting.
      </p>
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

function VergBalk({
  label,
  minuten,
  max,
  kleur,
}: {
  label: string;
  minuten: number;
  max: number;
  kleur: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm font-semibold text-ink/70">{label}</span>
      <div className="h-4 flex-1 rounded-full bg-cream">
        <div
          className="flex h-full items-center justify-end rounded-full px-2 text-[11px] font-bold text-white transition-all"
          style={{ width: `${Math.max(8, (minuten / max) * 100)}%`, background: kleur }}
        >
          {tijdTekst(minuten)}
        </div>
      </div>
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

  const uren = Math.floor(n / 60);
  const rest = n % 60;
  return (
    <div className="mt-2 font-serif text-5xl font-semibold leading-none sm:text-6xl">
      {uren > 0 ? (
        <>
          {uren}
          <span className="text-2xl font-normal sm:text-3xl"> uur</span>
          {rest > 0 && (
            <>
              {" "}
              {rest}
              <span className="text-2xl font-normal sm:text-3xl"> min</span>
            </>
          )}
        </>
      ) : (
        <>
          {rest}
          <span className="text-2xl font-normal sm:text-3xl"> min</span>
        </>
      )}
    </div>
  );
}

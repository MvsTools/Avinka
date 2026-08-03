"use client";

import { useEffect, useState } from "react";
import {
  getOfMaakRefCode,
  getAantalVerwijzingen,
  getAantalVerwijzingenProef,
  getMijnReview,
  slaReviewOp,
  getStreak,
  getAbonnement,
} from "@/lib/db";
import { STREAK_MIJLPALEN } from "@/lib/streak";

// Beloningsladder op basis van het aantal mensen dat zich via jouw uitnodiging aanmeldt.
type Beloning = { vanaf: number; emoji: string; reward: string };
const BELONINGEN: Beloning[] = [
  { vanaf: 1, emoji: "🎁", reward: "25% korting volgende maand" },
  { vanaf: 3, emoji: "🎉", reward: "50% korting volgende maand" },
  { vanaf: 5, emoji: "💎", reward: "1 maand gratis" },
  { vanaf: 10, emoji: "👑", reward: "3 maanden gratis" },
];

// Aantal hele maanden sinds je lid werd (voor het jubileum-cadeau).
function maandenSinds(iso: string): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  if (isNaN(start)) return 0;
  const maandMs = 1000 * 60 * 60 * 24 * 30.44;
  return Math.max(0, Math.floor((Date.now() - start) / maandMs));
}

type ReviewData = { sterren: number; tekst: string; magTonen: boolean };

export default function BeloningenView({ lidSinds }: { lidSinds: string }) {
  // ── Aanbrengen ──
  const [refCode, setRefCode] = useState<string | null>(null);
  const [aantal, setAantal] = useState(0);
  const [proefAantal, setProefAantal] = useState(0);
  const [link, setLink] = useState("");
  const [gekopieerd, setGekopieerd] = useState(false);

  // ── Streak ── (record = hoogst ooit bereikte streak, streak_max; dat telt
  // voor de beloning, niet de actuele streak — anders zou een gebroken en
  // opnieuw opgebouwde streak steeds opnieuw kunnen "verdienen".)
  const [streakRecord, setStreakRecord] = useState(0);

  // Jaarklanten krijgen via het schooljaar-abonnement al "zomer gratis"
  // (2 maanden) — het jubileum-cadeau (ook 1 maand gratis) stapelt daar niet
  // bovenop en geldt dus alleen voor maandklanten (zie abonnementen-tiers).
  const [abonVorm, setAbonVorm] = useState<"maand" | "jaar" | null>(null);

  // ── Review ──
  const [review, setReview] = useState<ReviewData | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [sterren, setSterren] = useState(5);
  const [tekst, setTekst] = useState("");
  const [magTonen, setMagTonen] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  useEffect(() => {
    getOfMaakRefCode().then(async (code) => {
      setRefCode(code);
      if (code) {
        setLink(`${window.location.origin}/sign-up?ref=${code}`);
        setAantal(await getAantalVerwijzingen(code));
        setProefAantal(await getAantalVerwijzingenProef(code));
      }
    });
    getMijnReview().then((r) => {
      if (r) {
        setReview(r);
        setSterren(r.sterren || 5);
        setTekst(r.tekst);
        setMagTonen(r.magTonen);
      }
    });
    getStreak().then((s) => setStreakRecord(s.record));
    getAbonnement().then((a) => setAbonVorm(a.vorm));
  }, []);

  async function kopieer() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      /* niets */
    }
  }

  async function deel() {
    if (!link) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Avinka — tools voor leerkrachten",
          text: "Ik werk met Avinka en bespaar er flink wat tijd mee. Probeer het ook!",
          url: link,
        });
        return;
      } catch {
        /* afgebroken — val terug op kopiëren */
      }
    }
    kopieer();
  }

  async function verstuurReview() {
    setFout("");
    if (!tekst.trim()) {
      setFout("Schrijf even een paar woorden over je ervaring.");
      return;
    }
    setBezig(true);
    const ok = await slaReviewOp(sterren, tekst.trim(), magTonen);
    setBezig(false);
    if (!ok) {
      setFout("Opslaan lukte niet. Probeer het zo nog eens.");
      return;
    }
    setReview({ sterren, tekst: tekst.trim(), magTonen });
    setReviewOpen(false);
  }

  const maanden = maandenSinds(lidSinds);
  const jubileumDoel = 12;

  // Eerstvolgende nog niet behaalde aanbreng-mijlpaal (voor het zinnetje bovenin).
  const volgendeMijlpaal = BELONINGEN.find((b) => aantal < b.vanaf);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Held: jouw uitnodigingslink + teller ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white shadow-lg sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/5" />
        <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
          🎁 Nodig collega&apos;s uit
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="Je link wordt klaargezet…"
            className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm text-white placeholder-white/60 outline-none backdrop-blur"
          />
          <button
            onClick={kopieer}
            disabled={!link}
            className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand shadow-sm transition hover:bg-white/90 disabled:opacity-50"
          >
            {gekopieerd ? "✓ Gekopieerd" : "Kopieer link"}
          </button>
          <button
            onClick={deel}
            disabled={!link}
            className="shrink-0 rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Delen
          </button>
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-serif text-5xl font-semibold leading-none">{aantal}</span>
          <span className="text-sm text-white/80">
            {aantal === 1 ? "leerkracht met abonnement" : "leerkrachten met abonnement"} via jouw link
          </span>
        </div>
        {proefAantal > 0 && (
          <p className="mt-2 text-sm text-white/80">
            {proefAantal === 1
              ? "1 collega proeft Avinka nu"
              : `${proefAantal} collega's proberen Avinka nu`}
          </p>
        )}
        <p className="mt-2 text-xs text-white/60">
          Een uitnodiging telt zodra je collega een betaald abonnement neemt.
        </p>
      </div>

      {/* ── Eén beloningenkaart: alles met laadbalkjes ── */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">Jouw beloningen</h2>
          {volgendeMijlpaal && refCode && (
            <span className="text-sm font-semibold text-brand">
              Nog {volgendeMijlpaal.vanaf - aantal}{" "}
              {volgendeMijlpaal.vanaf - aantal === 1 ? "abonnement" : "abonnementen"} tot{" "}
              {volgendeMijlpaal.emoji} {volgendeMijlpaal.reward}
            </span>
          )}
        </div>

        {/* Groep: aanbrengen */}
        <SubKop>Voor het uitnodigen van collega&apos;s</SubKop>
        <div className="divide-y divide-black/5">
          {BELONINGEN.map((b) => (
            <Rij
              key={b.vanaf}
              emoji={b.emoji}
              titel={`${b.vanaf} ${b.vanaf === 1 ? "aanmelding" : "aanmeldingen"}`}
              reward={b.reward}
              waarde={aantal}
              doel={b.vanaf}
              behaald={aantal >= b.vanaf}
              rechts={
                aantal >= b.vanaf ? (
                  <span className="text-emerald-600">Behaald ✓</span>
                ) : (
                  <span className="text-ink/50">
                    {aantal}/{b.vanaf}
                  </span>
                )
              }
            />
          ))}
        </div>

        {/* Groep: streak */}
        <SubKop>Voor je streak</SubKop>
        <div className="divide-y divide-black/5">
          {STREAK_MIJLPALEN.map((m) => (
            <Rij
              key={m.vanaf}
              emoji={m.emoji}
              titel={`${m.vanaf} dagen op rij — ${m.titel}`}
              reward={m.reward}
              waarde={streakRecord}
              doel={m.vanaf}
              behaald={streakRecord >= m.vanaf}
              rechts={
                streakRecord >= m.vanaf ? (
                  <span className="text-emerald-600">Behaald ✓</span>
                ) : (
                  <span className="text-ink/50">
                    {streakRecord}/{m.vanaf}
                  </span>
                )
              }
            />
          ))}
        </div>

        {/* Groep: overige beloningen */}
        <SubKop>Andere manieren om te sparen</SubKop>
        <div className="divide-y divide-black/5">
          {/* Review */}
          <Rij
            emoji="⭐"
            titel="Schrijf een review"
            reward="25% korting volgende maand"
            waarde={review ? 1 : 0}
            doel={1}
            behaald={!!review}
            rechts={
              review ? (
                <button
                  onClick={() => setReviewOpen((v) => !v)}
                  className="text-brand hover:underline"
                >
                  Aanpassen
                </button>
              ) : (
                <button
                  onClick={() => setReviewOpen((v) => !v)}
                  className="text-brand hover:underline"
                >
                  {reviewOpen ? "Sluiten" : "Schrijven"}
                </button>
              )
            }
          >
            {review && !reviewOpen && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Sterren waarde={review.sterren} />
                  <span className="text-sm font-semibold text-emerald-600">Bedankt! ✓</span>
                </div>
                {review.tekst && (
                  <p className="mt-2 text-sm italic leading-6 text-ink/75">“{review.tekst}”</p>
                )}
                <p className="mt-2 text-xs text-ink/50">
                  {review.magTonen
                    ? "Je gaf toestemming om dit (met je voornaam) op de website te tonen."
                    : "Je review wordt niet openbaar getoond."}
                </p>
              </div>
            )}

            {reviewOpen && (
              <div className="mt-3 rounded-2xl border border-black/10 bg-cream/40 p-4">
                <p className="text-sm leading-6 text-ink/65">
                  Help andere leerkrachten met een eerlijke ervaring. Met jouw toestemming
                  gebruiken we 'm (met je voornaam) op de website.
                </p>
                <div className="mt-3">
                  <SterrenKiezer waarde={sterren} onKies={setSterren} />
                </div>
                <textarea
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  rows={3}
                  placeholder="Bijvoorbeeld: “Ik bespaar elke week zeker een uur met de weekberichten.”"
                  className="mt-3 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand/40"
                />
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={magTonen}
                    onChange={(e) => setMagTonen(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                  />
                  <span>Avinka mag mijn review (met mijn voornaam) op de website tonen.</span>
                </label>
                {fout && <p className="mt-2 text-sm font-semibold text-rose-600">{fout}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={verstuurReview}
                    disabled={bezig}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {bezig ? "Versturen…" : review ? "Opslaan" : "Versturen"}
                  </button>
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </Rij>

          {/* Jubileum — alleen voor maandklanten: het jaarabonnement geeft al
              "zomer gratis", dus dit stapelt daar niet bovenop. */}
          {abonVorm !== "jaar" && (
            <Rij
              emoji="🎂"
              titel="Een jaar trouw lid"
              reward="1 maand gratis"
              waarde={maanden}
              doel={jubileumDoel}
              behaald={maanden >= jubileumDoel}
              rechts={
                maanden >= jubileumDoel ? (
                  <span className="text-emerald-600">Behaald ✓</span>
                ) : (
                  <span className="text-ink/50">{maanden}/12 mnd</span>
                )
              }
            />
          )}
        </div>
      </div>

      <p className="text-xs text-ink/45">
        Beloningen worden verrekend zodra de abonnementen live gaan (betalen via iDEAL). Tot die
        tijd zie je vast wat je hebt opgebouwd.
      </p>
    </div>
  );
}

/* Subkopje binnen de beloningenkaart */
function SubKop({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wide text-ink/45 first:mt-4">
      {children}
    </p>
  );
}

/* Eén beloningsregel met laadbalkje. children = optionele uitklap eronder. */
function Rij({
  emoji,
  titel,
  reward,
  waarde,
  doel,
  behaald,
  rechts,
  children,
}: {
  emoji: string;
  titel: string;
  reward: string;
  waarde: number;
  doel: number;
  behaald: boolean;
  rechts: React.ReactNode;
  children?: React.ReactNode;
}) {
  const pct = doel > 0 ? Math.min(100, (waarde / doel) * 100) : 0;
  return (
    <div className={`-mx-3 rounded-2xl px-3 py-3.5 ${behaald ? "bg-emerald-50/60" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="relative inline-flex shrink-0">
          <span className={`text-2xl ${behaald || pct > 0 ? "" : "opacity-40 grayscale"}`}>
            {emoji}
          </span>
          {behaald && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth="4" aria-hidden>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={`text-sm font-bold ${behaald ? "text-ink/55 line-through" : "text-ink"}`}>
              {titel}
            </span>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
              {reward}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold">{rechts}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cream">
        <div
          className={`h-full rounded-full transition-all ${
            behaald ? "bg-emerald-400" : "bg-gradient-to-r from-brand to-brand-dark"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {children}
    </div>
  );
}

/* Sterren-weergave en -kiezer voor de review */
function Sterren({ waarde }: { waarde: number }) {
  return (
    <span className="text-lg leading-none text-amber-400" aria-label={`${waarde} van 5 sterren`}>
      {"★".repeat(waarde)}
      <span className="text-ink/20">{"★".repeat(Math.max(0, 5 - waarde))}</span>
    </span>
  );
}

function SterrenKiezer({ waarde, onKies }: { waarde: number; onKies: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onKies(n)}
          aria-label={`${n} ${n === 1 ? "ster" : "sterren"}`}
          className={`text-2xl leading-none transition ${
            n <= waarde ? "text-amber-400" : "text-ink/20 hover:text-amber-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

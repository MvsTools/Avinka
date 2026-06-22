"use client";

import { useState } from "react";
import { saveFeedback, type FeedbackSoort } from "@/lib/db";

// De Feedback-module met twee tabbladen: "Feedback geven" (probleem/compliment/
// anders over iets bestaands) en "Een idee delen" (wensen, nieuwe functies, een
// nieuwe tool). Beide werken in twee stappen: kies een onderwerp → vul in.
// Alles landt in dezelfde feedback-tabel; een idee krijgt soort 'idee'.

type Onderwerp = {
  slug: string; // tool-slug; "" = algemeen, "nieuwe-tool" = wens voor een nieuwe tool
  naam: string;
  sub: string;
  emoji: string;
  tint: string;
};

const TOOLS: Onderwerp[] = [
  { slug: "toetswijs", naam: "Toetsanalyse", sub: "IEP en Cito", emoji: "📊", tint: "bg-sky-100" },
  { slug: "rapportwijs", naam: "Rapporten", sub: "Rapportteksten", emoji: "📝", tint: "bg-violet-100" },
  { slug: "ouderwijs", naam: "Oudercontact", sub: "Oudercommunicatie", emoji: "✉️", tint: "bg-rose-100" },
  { slug: "plattegrondwijs", naam: "Plattegrond", sub: "Klasplattegrond", emoji: "🪑", tint: "bg-amber-100" },
];

const FEEDBACK_ONDERWERPEN: Onderwerp[] = [
  ...TOOLS,
  { slug: "", naam: "Het platform algemeen", sub: "Account, abonnement of de website", emoji: "✨", tint: "bg-slate-100" },
];

const IDEE_ONDERWERPEN: Onderwerp[] = [
  ...TOOLS,
  { slug: "nieuwe-tool", naam: "Een nieuwe tool", sub: "Een tool die je nu mist", emoji: "✨", tint: "bg-emerald-100" },
  { slug: "", naam: "Iets anders", sub: "Een idee voor het platform", emoji: "🧩", tint: "bg-slate-100" },
];

const FEEDBACK_CATS: Record<string, string[]> = {
  toetswijs: ["Analyse klopt niet", "Mist een vak of onderdeel", "Upload/inlezen ging mis", "Te ingewikkeld", "Snelheid", "Iets anders"],
  rapportwijs: ["Toon of stijl klopt niet", "Feitelijk onjuist", "Te lang of te kort", "Mist een onderdeel", "Snelheid", "Iets anders"],
  ouderwijs: ["Toon of stijl klopt niet", "Mist informatie", "Niet wat ik bedoelde", "Opmaak of lay-out", "Iets anders"],
  plattegrondwijs: ["Slepen of plaatsen werkt niet", "Mist een functie", "Opslaan of laden", "Weergave", "Iets anders"],
  "": ["Account of inloggen", "Abonnement of prijs", "De website", "Een tool", "Iets anders"],
};

const IDEE_TOOL_CATS = ["Nieuwe functie", "Verbetering van iets bestaands", "Meer tijdwinst", "Makkelijker te gebruiken", "Iets anders"];
const IDEE_CATS: Record<string, string[]> = {
  "nieuwe-tool": [], // alleen tekst: vertel welke tool je mist
  "": ["Een nieuwe tool", "Iets aan het platform", "Iets anders"],
};
function ideeCats(slug: string): string[] {
  return IDEE_CATS[slug] ?? IDEE_TOOL_CATS;
}

const FEEDBACK_SOORTEN: { key: FeedbackSoort; emoji: string; label: string }[] = [
  { key: "probleem", emoji: "🐞", label: "Probleem" },
  { key: "compliment", emoji: "💛", label: "Compliment" },
  { key: "anders", emoji: "💬", label: "Anders" },
];

const PLACEHOLDER: Record<FeedbackSoort, string> = {
  idee: "Wat zou je graag willen kunnen? Beschrijf je idee.",
  probleem: "Wat ging er mis? Beschrijf zo goed mogelijk wat er gebeurde.",
  compliment: "Wat bevalt je goed? Leuk om te horen!",
  anders: "Schrijf hier je bericht…",
};

type Modus = "feedback" | "idee";

export default function FeedbackModule() {
  const [modus, setModus] = useState<Modus>("feedback");
  const [gekozen, setGekozen] = useState<Onderwerp | null>(null);
  const [soort, setSoort] = useState<FeedbackSoort>("probleem");
  const [categorie, setCategorie] = useState("");
  const [bericht, setBericht] = useState("");
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState(false);

  const isIdee = modus === "idee";

  function leeg() {
    setSoort("probleem");
    setCategorie("");
    setBericht("");
  }

  function wisselModus(m: Modus) {
    if (m === modus) return;
    setModus(m);
    setGekozen(null);
    setKlaar(false);
    leeg();
  }

  function kies(o: Onderwerp) {
    setGekozen(o);
    leeg();
  }

  function opnieuw() {
    setKlaar(false);
    setGekozen(null);
    leeg();
  }

  async function verstuur() {
    if (!gekozen) return;
    if (!bericht.trim() && !categorie) return;
    setBezig(true);
    const echteSoort: FeedbackSoort = isIdee ? "idee" : soort;
    const ok = await saveFeedback(echteSoort, bericht, "/dashboard/feedback", categorie, gekozen.slug);
    setBezig(false);
    if (ok) setKlaar(true);
  }

  const onderwerpen = isIdee ? IDEE_ONDERWERPEN : FEEDBACK_ONDERWERPEN;

  return (
    <div>
      {/* Tabbladen */}
      <div className="mb-5 inline-flex rounded-full bg-cream p-1">
        <Tab actief={!isIdee} onClick={() => wisselModus("feedback")}>
          💬 Feedback geven
        </Tab>
        <Tab actief={isIdee} onClick={() => wisselModus("idee")}>
          💡 Een idee delen
        </Tab>
      </div>

      {klaar ? (
        <div className="rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-4xl">
            {isIdee ? "💡" : "✓"}
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold text-ink">
            {isIdee ? "Bedankt voor je idee!" : "Bedankt, we hebben het ontvangen!"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-ink/65">
            Jouw input maakt Avinka elke week een stukje beter. We lezen alles zelf.
          </p>
          <button
            onClick={opnieuw}
            className="mt-6 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Nog iets delen
          </button>
        </div>
      ) : !gekozen ? (
        // ── Stap 1: kies een onderwerp ──────────────────────────────────────
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-ink">
            {isIdee ? "Waar gaat je idee over?" : "Waar wil je feedback op geven?"}
          </h2>
          <p className="mt-1 text-ink/60">
            {isIdee
              ? "Kies een tool, een nieuwe tool of iets anders."
              : "Kies een tool of het platform in het algemeen."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {onderwerpen.map((o) => (
              <button
                key={(o.slug || "algemeen") + o.naam}
                type="button"
                onClick={() => kies(o)}
                className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:border-brand/40 hover:shadow-sm"
              >
                <span className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl " + o.tint}>
                  {o.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{o.naam}</span>
                  <span className="block truncate text-sm text-ink/55">{o.sub}</span>
                </span>
                <span className="text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-brand">→</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // ── Stap 2: het formulier ───────────────────────────────────────────
        <FormStap
          isIdee={isIdee}
          gekozen={gekozen}
          soort={soort}
          setSoort={setSoort}
          categorie={categorie}
          setCategorie={setCategorie}
          bericht={bericht}
          setBericht={setBericht}
          bezig={bezig}
          terug={() => setGekozen(null)}
          verstuur={verstuur}
        />
      )}
    </div>
  );
}

function FormStap({
  isIdee,
  gekozen,
  soort,
  setSoort,
  categorie,
  setCategorie,
  bericht,
  setBericht,
  bezig,
  terug,
  verstuur,
}: {
  isIdee: boolean;
  gekozen: Onderwerp;
  soort: FeedbackSoort;
  setSoort: (s: FeedbackSoort) => void;
  categorie: string;
  setCategorie: (c: string) => void;
  bericht: string;
  setBericht: (b: string) => void;
  bezig: boolean;
  terug: () => void;
  verstuur: () => void;
}) {
  const cats = isIdee ? ideeCats(gekozen.slug) : FEEDBACK_CATS[gekozen.slug] ?? FEEDBACK_CATS[""];
  const kanVersturen = !!bericht.trim() || !!categorie;
  const placeholder =
    isIdee && gekozen.slug === "nieuwe-tool"
      ? "Welke tool mis je? En waar zou het je bij helpen?"
      : isIdee
        ? PLACEHOLDER.idee
        : PLACEHOLDER[soort];

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <button onClick={terug} className="text-sm font-semibold text-ink/50 transition hover:text-ink">
        ← Ander onderwerp
      </button>

      <div className="mt-4 flex items-center gap-3">
        <span className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl " + gekozen.tint}>
          {gekozen.emoji}
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">
            {isIdee ? `Jouw idee voor ${gekozen.naam}` : `Feedback over ${gekozen.naam}`}
          </h2>
          <p className="text-sm text-ink/55">{gekozen.sub}</p>
        </div>
      </div>

      {/* Soort — alleen bij gewone feedback (een idee ís het soort) */}
      {!isIdee && (
        <div className="mt-6 flex flex-wrap gap-2">
          {FEEDBACK_SOORTEN.map((s) => {
            const aan = soort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSoort(s.key)}
                className={
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition " +
                  (aan ? "border-brand bg-brand-soft text-brand" : "border-black/10 text-ink/70 hover:border-black/25")
                }
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Categorie */}
      {cats.length > 0 && (
        <>
          <p className={(isIdee ? "mt-6" : "mt-5") + " text-xs font-bold text-ink/55"}>
            {isIdee ? "Wat voor idee is het?" : "Waar gaat het over?"}{" "}
            <span className="font-semibold text-ink/35">(optioneel)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cats.map((c) => {
              const aan = categorie === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategorie(aan ? "" : c)}
                  className={
                    "rounded-full border px-3 py-1.5 text-sm font-semibold transition " +
                    (aan ? "border-brand bg-brand-soft text-brand" : "border-black/10 text-ink/70 hover:border-black/25")
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        </>
      )}

      <textarea
        value={bericht}
        onChange={(e) => setBericht(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="mt-4 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-ink/45">Schrijf gerust over je werk, niet over leerlingen.</p>
        <button
          onClick={verstuur}
          disabled={bezig || !kanVersturen}
          className="shrink-0 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {bezig ? "Versturen…" : isIdee ? "Idee versturen" : "Versturen"}
        </button>
      </div>
    </div>
  );
}

function Tab({ actief, onClick, children }: { actief: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-4 py-2 text-sm font-bold transition " +
        (actief ? "bg-white text-ink shadow-sm" : "text-ink/55 hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

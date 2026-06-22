"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getKlassen, getStatistiek, getVoorkeuren } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";

// Onboarding-checklist voor nieuwe leerkrachten. Drie stappen die zichzelf
// afvinken zodra je ze doet (op basis van je echte gegevens). Weg te klikken;
// blijft daarna weg. De "weggeklikt"-vlag staat PER ACCOUNT in de browser-opslag
// (sleutel + user-id), zodat een nieuw account op dezelfde computer niet de stand
// van een ander account erft.
const STORAGE_PREFIX = "avinka_onboarding_dismissed_";

type Stap = {
  sleutel: "klas" | "voorkeuren" | "tool";
  titel: string;
  tekst: string;
  actie: { label: string; href: string };
};

const STAPPEN: Stap[] = [
  {
    sleutel: "klas",
    titel: "Zet je klas op",
    tekst: "Voeg je groep en namen toe. Dan vullen de tools alvast naam en groep voor je in.",
    actie: { label: "Klas opzetten", href: "/dashboard/mijn-klas" },
  },
  {
    sleutel: "voorkeuren",
    titel: "Stel je voorkeuren in",
    tekst: "Je schoolnaam, vaste groep en de toon van de teksten. Dat scheelt je later typen.",
    actie: { label: "Voorkeuren instellen", href: "/dashboard/instellingen" },
  },
  {
    sleutel: "tool",
    titel: "Probeer een tool",
    tekst: "Kies hieronder een tool en maak je eerste rapport, bericht of analyse.",
    actie: { label: "Naar de tools", href: "#tools" },
  },
];

export default function OnboardingCard() {
  // null = nog onbekend (wachten op account + opslag); voorkomt knipperen.
  const [sleutel, setSleutel] = useState<string | null>(null);
  const [verborgen, setVerborgen] = useState<boolean | null>(null);
  const [staat, setStaat] = useState<Record<Stap["sleutel"], boolean> | null>(null);

  // Bepaal de per-account opslagsleutel en lees of het al weggeklikt is.
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      const key = STORAGE_PREFIX + (data.user?.id ?? "anon");
      setSleutel(key);
      try {
        setVerborgen(localStorage.getItem(key) === "1");
      } catch {
        setVerborgen(false);
      }
    });
  }, []);

  useEffect(() => {
    if (verborgen !== false || !sleutel) return; // alleen ophalen als de kaart echt zichtbaar is
    Promise.all([getKlassen(), getVoorkeuren(), getStatistiek()]).then(
      ([klassen, voork, tellers]) => {
        const s = {
          klas: klassen.some((k) => k.leerlingen.length > 0),
          voorkeuren:
            !!voork && (voork.schoolnaam.trim() !== "" || voork.standaardgroep.trim() !== ""),
          tool: Object.values(tellers).reduce((a, b) => a + b, 0) > 0,
        };
        // Heb je alles al gedaan? Dan heb je geen onboarding nodig: stil
        // verbergen en niet meer tonen. Zo zie je het kaartje alleen zolang er
        // echt iets te doen is.
        if (s.klas && s.voorkeuren && s.tool) {
          try {
            localStorage.setItem(sleutel, "1");
          } catch {
            /* geen opslag */
          }
          setVerborgen(true);
          return;
        }
        setStaat(s);
      },
    );
  }, [verborgen, sleutel]);

  function sluit() {
    try {
      if (sleutel) localStorage.setItem(sleutel, "1");
    } catch {
      /* geen opslag */
    }
    setVerborgen(true);
  }

  if (verborgen !== false) return null;
  if (!staat) {
    return <div className="h-44 animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }

  const gedaan = STAPPEN.filter((s) => staat[s.sleutel]).length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <button
        onClick={sluit}
        aria-label="Sluiten"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-black/5 hover:text-ink"
      >
        ✕
      </button>

      <h2 className="pr-10 font-serif text-2xl font-semibold text-ink">
        Welkom bij Avinka! Zo kom je snel op gang
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(gedaan / STAPPEN.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-semibold text-ink/55">
          {gedaan} van {STAPPEN.length} gedaan
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {STAPPEN.map((s, i) => {
          const done = staat[s.sleutel];
          return (
            <div
              key={s.sleutel}
              className={
                "flex items-center gap-4 rounded-2xl border p-4 transition " +
                (done ? "border-emerald-200 bg-emerald-50/50" : "border-black/10 bg-white")
              }
            >
              <span
                className={
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold " +
                  (done ? "bg-emerald-500 text-white" : "bg-cream text-ink/60")
                }
              >
                {done ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={"font-bold " + (done ? "text-ink/50" : "text-ink")}>{s.titel}</p>
                {!done && <p className="mt-0.5 text-sm leading-6 text-ink/60">{s.tekst}</p>}
              </div>
              {done ? (
                <span className="shrink-0 text-sm font-bold text-emerald-600">Gedaan</span>
              ) : s.actie.href.startsWith("#") ? (
                <a
                  href={s.actie.href}
                  className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  {s.actie.label}
                </a>
              ) : (
                <Link
                  href={s.actie.href}
                  className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  {s.actie.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={sluit}
        className="mt-4 text-sm font-semibold text-ink/45 transition hover:text-ink"
      >
        Liever eerst zelf rondkijken? Sluit dit kaartje.
      </button>
    </div>
  );
}

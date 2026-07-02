"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getKlassen, getVoorkeuren } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";

// Slank "startklaar"-strookje voor nieuwe leerkrachten. Nudget de twee dingen die
// de tools slimmer maken: je klas opzetten en je voorkeuren instellen. De tags zijn
// eerst wit; zodra je een stap doet, worden ze groen met een vinkje (afvinken past
// bij Avinka). Zijn beide klaar, dan verdwijnt het strookje. Weg te klikken; blijft
// daarna weg. De "weggeklikt"-vlag staat PER ACCOUNT (sleutel + user-id), zodat een
// nieuw account op dezelfde computer niet de stand van een ander erft.
const STORAGE_PREFIX = "avinka_onboarding_dismissed_";

type Stap = {
  sleutel: "klas" | "voorkeuren";
  label: string;
  klaar: string;
  href: string;
};

const STAPPEN: Stap[] = [
  { sleutel: "klas", label: "Klas opzetten", klaar: "Klas staat klaar", href: "/dashboard/mijn-klas" },
  {
    sleutel: "voorkeuren",
    label: "Voorkeuren instellen",
    klaar: "Voorkeuren ingesteld",
    href: "/dashboard/instellingen",
  },
];

export default function OnboardingCard() {
  const [sleutel, setSleutel] = useState<string | null>(null);
  const [verborgen, setVerborgen] = useState<boolean | null>(null);
  const [staat, setStaat] = useState<Record<Stap["sleutel"], boolean> | null>(null);

  // Per-account opslagsleutel bepalen en lezen of het al weggeklikt is.
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
    if (verborgen !== false || !sleutel) return;
    Promise.all([getKlassen(), getVoorkeuren()]).then(([klassen, voork]) => {
      const s = {
        klas: klassen.some((k) => k.leerlingen.length > 0),
        voorkeuren:
          !!voork && (voork.schoolnaam.trim() !== "" || voork.standaardgroep.trim() !== ""),
      };
      // Alles al gedaan? Dan stil verbergen en niet meer tonen.
      if (s.klas && s.voorkeuren) {
        try {
          localStorage.setItem(sleutel, "1");
        } catch {
          /* geen opslag */
        }
        setVerborgen(true);
        return;
      }
      setStaat(s);
    });
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
    return <div className="h-16 animate-pulse rounded-2xl bg-white/60" />;
  }

  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-brand/30 bg-brand-soft px-5 py-4 pl-6 shadow-md sm:flex-row sm:items-center sm:justify-between">
      {/* Groene accentbalk links, zodat het strookje opvalt. */}
      <span className="absolute inset-y-0 left-0 w-1.5 bg-brand" aria-hidden />

      <div className="pr-6">
        <p className="font-bold text-ink">Nog even startklaar maken</p>
        <p className="text-sm leading-6 text-ink/60">
          Zet je klas op en stel je voorkeuren in. Dan vullen de tools alvast naam, groep en
          toon voor je in.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        {STAPPEN.map((s) =>
          staat[s.sleutel] ? (
            <span
              key={s.sleutel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm"
            >
              ✓ {s.klaar}
            </span>
          ) : (
            <Link
              key={s.sleutel}
              href={s.href}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:border-brand/40 hover:text-brand"
            >
              {s.label}
            </Link>
          ),
        )}
      </div>

      <button
        onClick={sluit}
        aria-label="Verbergen"
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-ink/35 transition hover:bg-black/5 hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}

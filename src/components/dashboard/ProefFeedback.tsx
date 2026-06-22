"use client";

import { useEffect, useState } from "react";
import { getAbonnement, getProefFeedback, saveProefFeedback, type ProefIntentie } from "@/lib/db";
import { BETALINGEN_LIVE, proefLoopt, proefDagenResterend } from "@/lib/abonnement";

// Korte intentie-vraag aan het eind van de proef (≤2 dagen te gaan). Eén keer:
// is 'm beantwoord, dan komt 'ie nooit meer. Weggeklikt = deze sessie niet meer.
const SESSIE_WEG = "avinka_proeffb_weg";

// Snelle keuzes per soort antwoord — één tik scheelt de drempel van typen.
const CATS: Record<"twijfel" | "nee", string[]> = {
  twijfel: [
    "Prijs",
    "Wil het eerst beter proberen",
    "Kwam er te weinig aan toe",
    "Mis nog een functie",
    "Twijfel of het bij mijn werk past",
    "Anders",
  ],
  nee: [
    "Te duur",
    "Gebruik het te weinig",
    "Past niet bij mijn werk",
    "Mis een functie die ik nodig heb",
    "Vond het te weinig toevoegen",
    "Anders",
  ],
};

export default function ProefFeedback() {
  const [open, setOpen] = useState(false);
  const [stap, setStap] = useState<"vraag" | "reden" | "dank">("vraag");
  const [keuze, setKeuze] = useState<ProefIntentie>("twijfel");
  const [categorie, setCategorie] = useState("");
  const [reden, setReden] = useState("");
  const [dank, setDank] = useState("");
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!BETALINGEN_LIVE) return; // alleen bij echte proefperiodes
    if (sessionStorage.getItem(SESSIE_WEG)) return;
    getAbonnement().then(async (ab) => {
      if (!proefLoopt(ab) || proefDagenResterend(ab) > 2) return;
      const al = await getProefFeedback();
      if (!al) setOpen(true);
    });
  }, []);

  if (!open) return null;

  function sluit() {
    try {
      sessionStorage.setItem(SESSIE_WEG, "1");
    } catch {
      /* niets */
    }
    setOpen(false);
  }

  async function kiesZeker() {
    setBezig(true);
    await saveProefFeedback("zeker", "", "");
    setBezig(false);
    setDank("Fijn om te horen dat het bevalt! 💛");
    setStap("dank");
  }

  function kiesReden(k: ProefIntentie) {
    setKeuze(k);
    setCategorie("");
    setReden("");
    setStap("reden");
  }

  async function verstuurReden() {
    setBezig(true);
    await saveProefFeedback(keuze, categorie, reden.trim());
    setBezig(false);
    setDank("Bedankt voor je eerlijke antwoord. Daar leren we van!");
    setStap("dank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={sluit}
          aria-label="Sluiten"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-black/5 hover:text-ink"
        >
          ✕
        </button>

        {stap === "vraag" && (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
              🤔
            </span>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
              Je proefperiode loopt bijna af
            </h2>
            <p className="mt-2 text-ink/70">
              Hoe zeker is het dat je een abonnement neemt? Eén klik helpt ons enorm.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={kiesZeker}
                disabled={bezig}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
              >
                Zeker weten
              </button>
              <button
                onClick={() => kiesReden("twijfel")}
                className="rounded-xl border-2 border-ink/10 px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/20"
              >
                Ik twijfel nog
              </button>
              <button
                onClick={() => kiesReden("nee")}
                className="rounded-xl border-2 border-ink/10 px-5 py-3 text-sm font-bold text-ink transition hover:border-ink/20"
              >
                Geen abonnement
              </button>
            </div>
          </>
        )}

        {stap === "reden" && (
          <>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {keuze === "twijfel" ? "Wat maakt je nog twijfelen?" : "Wat is de reden?"}
            </h2>
            <p className="mt-2 text-ink/70">Kies wat het beste past — één tikje is genoeg.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {CATS[keuze === "nee" ? "nee" : "twijfel"].map((c) => {
                const aan = categorie === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategorie(aan ? "" : c)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition " +
                      (aan
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-black/10 text-ink/70 hover:border-black/25")
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <textarea
              value={reden}
              onChange={(e) => setReden(e.target.value)}
              rows={3}
              placeholder="Wil je het toelichten? (optioneel)"
              className="mt-3 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={sluit}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
              >
                Overslaan
              </button>
              <button
                onClick={verstuurReden}
                disabled={bezig || (!categorie && !reden.trim())}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                Versturen
              </button>
            </div>
          </>
        )}

        {stap === "dank" && (
          <div className="py-2 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
              ✓
            </span>
            <p className="mt-4 text-lg font-semibold text-ink">{dank}</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

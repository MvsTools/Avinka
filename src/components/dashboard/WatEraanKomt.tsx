"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addTaak } from "@/lib/db";
import { aanleidingen } from "@/lib/planning";
import type { Context, PlanningBron, Schoolsystemen } from "@/lib/planning";
import TaakKnop from "./TaakKnop";

// "Wat eraan komt" — het vooruitkijk-blok (fase 4 van Mijn schooljaar).
//
// Op Start staat de korte versie tussen de dagrij en de tools; in Mijn
// schooljaar zelf staat dezelfde strook met alles erin. Eén component, dus de
// twee kunnen elkaar niet tegenspreken.
//
// VIER ONTWERPKEUZES:
// 1. **Geen leeg blok.** Is er niets aan de hand, dan staat er niets — geen
//    kaart met "geen signalen". Een blok dat er altijd staat maar meestal niets
//    zegt, leert mensen eroverheen te kijken.
// 2. **Eén object, geen losse kaartjes.** De signalen delen één kaart met een
//    haarlijn ertussen. Losse kaartjes zouden met de toolkaarten eronder gaan
//    concurreren, en die zijn de held van deze pagina.
// 3. **De knop zegt wat je gaat doen**, niet "beginnen": je leest in één regel
//    waar je heen gaat en waarom.
// 4. **Elk seintje is wegklikbaar.** Er is geen scherm meer waar je vooraf het
//    soort van een afspraak instelt (zie AfspraakFormulier.tsx) — Avinka raadt
//    dat uit de titel. Klopt die gok een keer niet, dan klik je het seintje
//    hier weg in plaats van dat we je vooraf met een vraag belasten die 99%
//    van de tijd voor niets is.
// 5. **Bij een activiteit gokken we niet wat je moet doen.** Een schoolreis en
//    een verkeersexamen vragen elk iets anders, en dat verschilt ook per
//    school — dus geen kant-en-klare taak. Wel een knop om er zelf taken
//    onder te hangen (KopjeToevoegen hieronder); die krijgen in de takenlijst
//    het "kopje" van de activiteit, zodat ze bij elkaar staan.

export default function WatEraanKomt({
  bron,
  vandaag,
  groepen = [],
  systemen = {},
  context = {},
  maximaal,
  vergrendeld = [],
  genegeerd = [],
  titel = "Wat eraan komt",
}: {
  bron: PlanningBron;
  vandaag: string;
  groepen?: number[];
  /** Met welke systemen werkt deze school? Maakt de voorbereidingstips concreet. */
  systemen?: Schoolsystemen;
  /** Je werkdagen en je voortgang; maakt de signalen persoonlijk. */
  context?: Context;
  /** Op Start hooguit twee, zodat de tools eronder de held blijven. */
  maximaal?: number;
  /** Slugs van tools die niet in het pakket zitten; die wijzen naar het abonnement. */
  vergrendeld?: string[];
  /** Seintje-id's die je zelf al hebt weggeklikt. */
  genegeerd?: string[];
  titel?: string;
}) {
  const router = useRouter();
  // Optimistisch verbergen zodra je klikt, niet pas als de server het
  // bevestigt — anders blijft het seintje nog even hangen na een klik.
  const [verborgen, setVerborgen] = useState<Set<string>>(new Set());
  const [bezig, setBezig] = useState<string | null>(null);

  const negeer = async (id: string) => {
    setVerborgen((v) => new Set(v).add(id));
    setBezig(id);
    try {
      const res = await fetch("/api/aanleiding/negeer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      // Mislukt? Dan gewoon weer laten zien — stil laten verdwijnen terwijl
      // het niet gelukt is, betekent dat het volgende bezoek weer terugkomt
      // zonder dat je begrijpt waarom.
      setVerborgen((v) => {
        const n = new Set(v);
        n.delete(id);
        return n;
      });
    } finally {
      setBezig(null);
    }
  };

  const alles = aanleidingen(bron, vandaag, groepen, systemen, context).filter(
    (a) => !genegeerd.includes(a.id) && !verborgen.has(a.id),
  );
  if (!alles.length) return null;
  const lijst = maximaal ? alles.slice(0, maximaal) : alles;

  return (
    <section>
      <h2 className="text-xl font-bold text-ink">{titel}</h2>
      <div className="mt-4 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        {lijst.map((a, i) => {
          const opSlot = Boolean(a.tool && vergrendeld.includes(a.tool.slug));
          return (
            <div
              key={a.id}
              className={
                "relative flex flex-col gap-3 px-5 py-4 pr-11 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:py-5 sm:pr-14" +
                (i > 0 ? " border-t border-black/5" : "")
              }
            >
              <div className="flex min-w-0 items-center gap-4">
                {/* Hetzelfde anker als de tegels erboven en de toolkaarten
                    eronder: een zacht getint vierkant met de tool-emoji. Zonder
                    dit viel de regel op een breed scherm uit elkaar in "tekst
                    links, knop rechts", en zag je pas op de knop om welke tool
                    het ging. */}
                {/* Werk dat geen tool voor je doet krijgt geen tool-kleur maar
                    het vinkje: het gaat naar je eigen lijst. */}
                <span
                  aria-hidden
                  className={
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl " +
                    (a.tool ? a.tool.tint : "bg-ink/[0.06] text-ink/60")
                  }
                >
                  {a.tool ? (
                    a.tool.emoji
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-bold leading-tight text-ink">{a.kop}</p>
                  <p className="mt-1 truncate text-sm text-ink/60">
                    {a.wanneer}
                    {a.detail && ` · ${a.detail}`}
                  </p>
                </div>
              </div>

              {/* Vier soorten knop, en de vorm vertelt welke:
                  groen = Avinka neemt dit van je over,
                  wit met een + = jouw eigen werk, gaat naar je takenlijst,
                  wit met een slotje = zit niet in je pakket,
                  wit → invoerveld = geen gegokte taak, jij typt zelf. */}
              {a.kopje ? (
                <KopjeToevoegen kopje={a.kopje} deadline={a.taakDatum ?? a.datum} />
              ) : a.aard === "voorbereiden" && a.link ? (
                // Weten we wáár het moet gebeuren, dan brengt de knop je er
                // meteen heen. Wit en niet groen: dit is een ander programma,
                // geen onderdeel van Avinka.
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 self-start rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-ink/75 transition-transform duration-150 hover:text-ink active:scale-[0.97] sm:self-auto"
                >
                  {a.actie}
                  <span aria-hidden> ↗</span>
                </a>
              ) : a.aard === "voorbereiden" ? (
                <TaakKnop
                  taken={a.taken ?? []}
                  deadline={a.taakDatum ?? a.datum}
                  label={a.actie}
                  alOpDeLijst={a.alOpDeLijst}
                />
              ) : (
                <Link
                  href={opSlot ? "/dashboard/abonnement" : a.tool!.pad!}
                  className={
                    "shrink-0 self-start rounded-xl px-4 py-2 text-sm font-bold transition-transform duration-150 active:scale-[0.97] sm:self-auto " +
                    (opSlot
                      ? "border border-black/10 bg-white text-ink/60 hover:text-ink"
                      : "bg-brand-dark text-white")
                  }
                >
                  {/* Bewust GEEN tool-emoji op de knop: op het donkergroen
                      vallen de gekleurde emoji's uit elkaar (het envelopje
                      wordt een grijs blokje) en de knoptekst zegt het al. */}
                  {opSlot ? "🔒 Zit niet in je pakket" : a.actie}
                  <span aria-hidden> →</span>
                </Link>
              )}

              <button
                onClick={() => negeer(a.id)}
                disabled={bezig === a.id}
                aria-label="Klopt dit niet? Seintje wegklikken"
                title="Klopt dit niet? Wegklikken"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-ink/25 transition-colors hover:bg-ink/5 hover:text-ink/60 disabled:opacity-40 sm:right-4 sm:top-4"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Geen kant-en-klare taak (die zou gokken wat je moet doen), wel een plek om
 * er zelf een of meer taken onder te hangen. Staat pas open na een klik, en
 * blijft daarna open zodat je meteen een tweede taak kunt typen — de meeste
 * activiteiten vragen meer dan één dingetje.
 */
function KopjeToevoegen({ kopje, deadline }: { kopje: string; deadline?: string }) {
  const [open, setOpen] = useState(false);
  const [tekst, setTekst] = useState("");
  const [bezig, setBezig] = useState(false);
  const [toegevoegd, setToegevoegd] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const voegToe = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = tekst.trim();
    if (!t || bezig) return;
    setBezig(true);
    const nieuw = await addTaak(t, kopje, deadline);
    setBezig(false);
    if (nieuw) {
      setTekst("");
      setToegevoegd((n) => n + 1);
      inputRef.current?.focus();
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 self-start rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-ink/75 transition-transform duration-150 hover:text-ink active:scale-[0.97] sm:self-auto"
      >
        Taken toevoegen
      </button>
    );
  }

  return (
    <form onSubmit={voegToe} className="flex w-full flex-col gap-1.5 sm:w-64">
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          autoFocus
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder={`Taak bij "${kopje}"`}
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream/50 px-3 py-2 text-sm text-ink outline-none transition-shadow focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,158,110,0.18)]"
        />
        <button
          type="submit"
          disabled={!tekst.trim() || bezig}
          aria-label="Taak toevoegen"
          className="shrink-0 rounded-xl bg-brand-dark px-3.5 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-50"
        >
          +
        </button>
      </div>
      {toegevoegd > 0 && (
        <p role="status" className="text-xs font-semibold text-brand-dark">
          {toegevoegd === 1 ? "Toegevoegd." : `${toegevoegd} toegevoegd.`} Nog een?
        </p>
      )}
    </form>
  );
}

"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useRouter } from "next/navigation";
import { SOORT_INFO, type Soort } from "@/lib/agenda-herken";
import { dagnaam, kort } from "@/lib/planning";
import type { PlanItem } from "@/lib/planning";
import TijdVeld from "./TijdVeld";

// Zelf een afspraak in je agenda zetten.
//
// Zonder gekoppelde schoolagenda bleef Mijn schooljaar leeg — en juist de
// dingen die JOU aangaan (jouw gespreksavond, de startdag van het team) staan
// vaak niet in de agenda die de school deelt.
//
// 🔑 HET SOORT IS HIER HET BELANGRIJKSTE VELD, en daarom staat het niet
// onderaan als bijzaak. Het bepaalt wat Avinka met de afspraak dóét: zet je er
// "oudergesprekken" bij, dan krijg je drie weken van tevoren te horen dat je
// het rooster moet openzetten. Bij een gekoppelde agenda moeten we die soort
// raden uit de titel; hier hoeft dat niet.

/** Wat een soort je oplevert. Kort, want dit staat onder een keuzerij. */
const WAT_LEVERT_HET_OP: Partial<Record<Soort, string>> = {
  rapport: "Je krijgt 4 weken vooraf een seintje, en een knop naar Rapporten.",
  gesprek: "Je krijgt 3 weken vooraf een seintje om het rooster open te zetten.",
  toets: "Je krijgt vooraf een seintje om de toetsen klaar te zetten, en erna om ze te analyseren.",
  activiteit: "Je krijgt 6 weken vooraf een seintje over hulpouders en vervoer.",
  vrij: "Deze dag telt als een dag zonder les.",
  vakantie: "Deze dagen tellen als vakantie.",
  vergadering: "Staat in je dag, verder geen seintje.",
  overig: "Staat in je dag, verder geen seintje.",
};

/**
 * De soorten op volgorde van hoe vaak je ze nodig hebt — niet op de technische
 * volgorde uit SOORT_INFO. "Vakantie" staat bewust achteraan: dat is de
 * zwaarste keuze (die maakt een hele dag leeg in je jaaroverzicht) en hoort
 * niet als eerste onder je duim te staan.
 */
const SOORT_VOLGORDE: Soort[] = [
  "overig",
  "gesprek",
  "toets",
  "rapport",
  "activiteit",
  "vergadering",
  "vrij",
  "vakantie",
];

const VELD =
  "w-full rounded-xl border border-black/10 bg-cream/50 px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink/35 focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,158,110,0.18)]";

export type Vorm = {
  id?: string;
  titel: string;
  datum: string;
  totDatum: string;
  heleDag: boolean;
  begin: string;
  eind: string;
  soort: Soort;
};

/** Om het formulier van buitenaf te openen — bijv. met een "+" op een dag in
 *  de kalender, mét die datum al ingevuld. */
export type EigenAfsprakenHandle = { open: (start?: Partial<Vorm>) => void };

const LEEG: Vorm = {
  titel: "",
  datum: "",
  totDatum: "",
  heleDag: false,
  begin: "",
  eind: "",
  soort: "overig",
};

const EigenAfspraken = forwardRef<EigenAfsprakenHandle, {
  /** De afspraken die deze leerkracht zelf heeft ingevoerd. */
  eigen: PlanItem[];
  vandaag: string;
}>(function EigenAfspraken({ eigen, vandaag }, ref) {
  const [vorm, setVorm] = useState<Vorm | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState<string | null>(null);
  // Het soort staat standaard dicht: de gok (of de vorige waarde bij
  // wijzigen) is meestal goed genoeg, en dan hoef je niet ook nog door acht
  // knoppen heen. Pas open klikken als je twijfelt.
  const [soortOpen, setSoortOpen] = useState(false);
  const router = useRouter();

  const open = (start?: Partial<Vorm>) => {
    setFout(null);
    setGelukt(null);
    setSoortOpen(false);
    setVorm({ ...LEEG, datum: vandaag, ...start });
  };

  useImperativeHandle(ref, () => ({ open }));

  /** Titel getypt? Dan alvast een soort voorstellen — je kunt hem zelf omzetten. */
  const raadSoort = async (titel: string) => {
    if (!titel.trim() || !vorm || vorm.id) return;
    try {
      const res = await fetch(`/api/agenda/afspraak?titel=${encodeURIComponent(titel)}`);
      if (!res.ok) return;
      const { raad } = await res.json();
      // Alleen invullen zolang je zelf nog niets gekozen hebt.
      setVorm((v) => (v && v.soort === "overig" && raad ? { ...v, soort: raad } : v));
    } catch {
      /* een suggestie die niet komt is geen probleem */
    }
  };

  const bewaar = async () => {
    if (!vorm) return;
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch("/api/agenda/afspraak", {
        method: vorm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vorm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(data.fout || "Opslaan lukte niet.");
        return;
      }
      setGelukt(vorm.id ? "Afspraak bijgewerkt." : "Afspraak toegevoegd.");
      setVorm(null);
      router.refresh();
    } catch {
      setFout("Opslaan lukte niet. Ben je nog online?");
    } finally {
      setBezig(false);
    }
  };

  const weghalen = async (id: string) => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch("/api/agenda/afspraak", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(data.fout || "Weghalen lukte niet.");
        return;
      }
      setGelukt("Afspraak weggehaald.");
      router.refresh();
    } catch {
      setFout("Weghalen lukte niet. Ben je nog online?");
    } finally {
      setBezig(false);
    }
  };

  if (!vorm && !gelukt && eigen.length === 0) return null;

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      {gelukt && !vorm && (
        <p role="status" className="text-sm font-semibold text-brand-dark">
          {gelukt}
        </p>
      )}

      {vorm && (
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="text-sm font-bold text-ink">Wat is het?</span>
            <input
              autoFocus
              value={vorm.titel}
              onChange={(e) => setVorm({ ...vorm, titel: e.target.value })}
              onBlur={(e) => raadSoort(e.target.value)}
              placeholder="Bijv. Oudergesprekken groep 5"
              className={VELD + " mt-1.5"}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <label className="min-w-[9rem] flex-1">
              <span className="text-sm font-bold text-ink">Wanneer?</span>
              <input
                type="date"
                value={vorm.datum}
                onChange={(e) =>
                  setVorm({
                    ...vorm,
                    datum: e.target.value,
                    // Eén dag is verreweg het meest voorkomend; de einddatum
                    // schuift daarom mee zolang je hem niet zelf hebt gezet.
                    totDatum:
                      !vorm.totDatum || vorm.totDatum === vorm.datum ? e.target.value : vorm.totDatum,
                  })
                }
                className={VELD + " mt-1.5"}
              />
            </label>
            <label className="min-w-[9rem] flex-1">
              <span className="text-sm font-bold text-ink">Tot en met</span>
              <input
                type="date"
                value={vorm.totDatum || vorm.datum}
                min={vorm.datum}
                onChange={(e) => setVorm({ ...vorm, totDatum: e.target.value })}
                className={VELD + " mt-1.5"}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex items-center gap-2 py-2.5">
              <input
                type="checkbox"
                checked={vorm.heleDag}
                onChange={(e) => setVorm({ ...vorm, heleDag: e.target.checked })}
                className="h-4 w-4 accent-[#25855a]"
              />
              <span className="text-sm font-bold text-ink">Hele dag</span>
            </label>
            {!vorm.heleDag && (
              <>
                <label>
                  <span className="text-sm font-bold text-ink">Van</span>
                  <TijdVeld
                    key={(vorm.id ?? "nieuw") + "-begin"}
                    value={vorm.begin}
                    onChange={(v) => setVorm({ ...vorm, begin: v })}
                    className="mt-1.5"
                  />
                </label>
                <label>
                  <span className="text-sm font-bold text-ink">Tot</span>
                  <TijdVeld
                    key={(vorm.id ?? "nieuw") + "-eind"}
                    value={vorm.eind}
                    onChange={(v) => setVorm({ ...vorm, eind: v })}
                    className="mt-1.5"
                  />
                </label>
              </>
            )}
          </div>

          <div>
            {soortOpen ? (
              <>
                <span className="text-sm font-bold text-ink">
                  Wat voor soort?
                  <span className="font-normal text-ink/50"> (bepaalt of je er een seintje van krijgt)</span>
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SOORT_VOLGORDE.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setVorm({ ...vorm, soort: s });
                        setSoortOpen(false);
                      }}
                      className={
                        "rounded-xl border px-3.5 py-2 text-sm font-semibold transition " +
                        (vorm.soort === s
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-black/10 text-ink/70 hover:border-black/20")
                      }
                    >
                      {SOORT_INFO[s].woord}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSoortOpen(true)}
                className="flex flex-wrap items-baseline gap-x-2 text-left"
              >
                <span className="text-sm font-bold text-ink">Soort: {SOORT_INFO[vorm.soort].woord}</span>
                <span className="text-sm text-ink/45 underline-offset-2 hover:underline">
                  klopt dat niet? wijzigen
                </span>
              </button>
            )}
            <p className="mt-2 text-xs text-ink/55">{WAT_LEVERT_HET_OP[vorm.soort]}</p>
          </div>

          {fout && (
            <p role="alert" className="text-sm font-semibold text-rose-700">
              {fout}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={bewaar}
              disabled={bezig}
              className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
            >
              {bezig ? "Bezig…" : vorm.id ? "Wijziging bewaren" : "Toevoegen"}
            </button>
            <button
              onClick={() => {
                setVorm(null);
                setFout(null);
              }}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:text-ink"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {eigen.length > 0 && (
        <div className={vorm || gelukt ? "mt-5 border-t border-black/5 pt-4" : ""}>
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
            Jouw eigen afspraken ({eigen.length})
          </p>
          <ul className="mt-2 flex flex-col">
            {eigen.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 border-b border-black/5 py-2.5 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{a.titel}</span>
                  <span className="block text-sm text-ink/55">
                    {dagnaam(a.datum)} {kort(a.datum)}
                    {a.totDatum && a.totDatum !== a.datum && ` t/m ${kort(a.totDatum)}`}
                    {!a.heleDag && a.begin && ` · ${a.begin}`}
                    {" · "}
                    {SOORT_INFO[a.soort]?.woord ?? a.soort}
                  </span>
                </span>
                <button
                  onClick={() =>
                    open({
                      id: a.id,
                      titel: a.titel,
                      datum: a.datum,
                      totDatum: a.totDatum,
                      heleDag: a.heleDag,
                      begin: a.begin ?? "",
                      eind: a.eind ?? "",
                      soort: a.soort,
                    })
                  }
                  className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink/55 transition-colors hover:text-ink"
                >
                  Wijzigen
                </button>
                <button
                  onClick={() => weghalen(a.id)}
                  disabled={bezig}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink/45 transition-colors hover:text-rose-700 disabled:opacity-50"
                >
                  Weghalen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

export default EigenAfspraken;

"use client";

import { useEffect, useState } from "react";
import {
  getGedeeldeKlassen,
  getKlasCollegas,
  getDuoTaken,
  addDuoTaak,
  setDuoTaakGedaan,
  setDuoTaakToegewezen,
  deleteDuoTaak,
  getMijnGebruikerId,
  type DuoTaak,
  type KlasCollega,
} from "@/lib/db";

// Gedeelde takenlijst per GROEP — los van je eigen persoonlijke takenlijst
// (TakenView). Simpel gehouden: tekst, afvinken, en wie het doet, geen
// deadlines of herhaling.
//
// Wie het doet is een keuze uit de collega's van die groep: "Ik" plus de
// voornaam van elke ander. Tik je niemand aan, dan is het van iedereen — en
// dan verschijnt de taak bij álle collega's op Start (zie TakenOverzicht).
type Groep = { klasId: string; klasNaam: string };

export default function DuoTaken() {
  const [mijnId, setMijnId] = useState<string | null>(null);
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [leden, setLeden] = useState<Record<string, KlasCollega[]>>({});
  const [taken, setTaken] = useState<Record<string, DuoTaak[]>>({});
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    (async () => {
      const [mij, gedeeld] = await Promise.all([getMijnGebruikerId(), getGedeeldeKlassen()]);
      setMijnId(mij);
      setGroepen(gedeeld);
      const [lijsten, ledenLijsten] = await Promise.all([
        Promise.all(gedeeld.map((g) => getDuoTaken(g.klasId))),
        Promise.all(gedeeld.map((g) => getKlasCollegas(g.klasId))),
      ]);
      const t: Record<string, DuoTaak[]> = {};
      const l: Record<string, KlasCollega[]> = {};
      gedeeld.forEach((g, i) => {
        t[g.klasId] = lijsten[i];
        l[g.klasId] = ledenLijsten[i];
      });
      setTaken(t);
      setLeden(l);
      setGeladen(true);
    })();
  }, []);

  async function voegToe(klasId: string) {
    const t = (invoer[klasId] ?? "").trim();
    if (!t) return;
    setInvoer((v) => ({ ...v, [klasId]: "" }));
    const nieuw = await addDuoTaak(klasId, t);
    if (nieuw) setTaken((v) => ({ ...v, [klasId]: [nieuw, ...(v[klasId] ?? [])] }));
  }

  function toggle(klasId: string, taak: DuoTaak) {
    const gedaan = !taak.gedaan;
    setTaken((v) => ({
      ...v,
      [klasId]: (v[klasId] ?? []).map((t) => (t.id === taak.id ? { ...t, gedaan } : t)),
    }));
    setDuoTaakGedaan(taak.id, gedaan);
  }

  // Nog eens op dezelfde naam tikken haalt de toewijzing er weer af: dan is de
  // taak van iedereen.
  function wijsToe(klasId: string, taak: DuoTaak, wie: string | null) {
    const nieuw = taak.toegewezenAan === wie ? null : wie;
    setTaken((v) => ({
      ...v,
      [klasId]: (v[klasId] ?? []).map((t) =>
        t.id === taak.id ? { ...t, toegewezenAan: nieuw } : t,
      ),
    }));
    setDuoTaakToegewezen(taak.id, nieuw);
  }

  function verwijder(klasId: string, id: string) {
    setTaken((v) => ({ ...v, [klasId]: (v[klasId] ?? []).filter((t) => t.id !== id) }));
    deleteDuoTaak(id);
  }

  if (!geladen || groepen.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {groepen.map((g) => {
        const lijst = taken[g.klasId] ?? [];
        const open = lijst.filter((t) => !t.gedaan);
        const af = lijst.filter((t) => t.gedaan);
        // "Ik" eerst, daarna de anderen op voornaam.
        const knoppen = (leden[g.klasId] ?? [])
          .map((l) => ({ id: l.userId, naam: l.userId === mijnId ? "Ik" : l.voornaam || "Collega" }))
          .sort((a, b) => (a.naam === "Ik" ? -1 : b.naam === "Ik" ? 1 : a.naam.localeCompare(b.naam)));

        return (
          <div key={g.klasId} className="rounded-3xl border border-black/5 bg-white shadow-sm">
            <div className="border-b border-black/5 px-5 py-4 sm:px-6">
              <h2 className="font-bold text-ink">Samen — {g.klasNaam}</h2>
              <p className="text-xs text-ink/50">
                Gedeelde takenlijst met je collega&apos;s bij deze groep
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                voegToe(g.klasId);
              }}
              className="flex items-center gap-2 border-b border-black/5 px-4 py-3 sm:px-5"
            >
              <input
                value={invoer[g.klasId] ?? ""}
                onChange={(e) => setInvoer((v) => ({ ...v, [g.klasId]: e.target.value }))}
                placeholder="Wat moet er samen gebeuren?"
                className="flex-1 rounded-xl bg-cream px-4 py-2.5 text-ink outline-none transition placeholder:text-ink/45 focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                disabled={!(invoer[g.klasId] ?? "").trim()}
                className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                Toevoegen
              </button>
            </form>

            {open.length === 0 && af.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink/50">Nog geen gedeelde taken.</p>
            ) : (
              <ul>
                {open.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-2.5 border-b border-black/5 px-5 py-3 transition last:border-0 hover:bg-cream/40 sm:px-6"
                  >
                    <Rondje gedaan={false} onClick={() => toggle(g.klasId, t)} />
                    <span className="min-w-0 flex-1 text-ink">{t.tekst}</span>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      {knoppen.map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => wijsToe(g.klasId, t, k.id)}
                          className={
                            "rounded-full border px-2.5 py-1 text-xs font-semibold transition " +
                            (t.toegewezenAan === k.id
                              ? "border-brand bg-brand-soft text-brand"
                              : "border-black/10 text-ink/50 hover:border-black/20")
                          }
                        >
                          {k.naam}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => verwijder(g.klasId, t.id)}
                      aria-label="Verwijderen"
                      className="shrink-0 rounded-lg px-1 text-lg text-ink/25 transition hover:text-rose-500"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {af.length > 0 && (
              <ul className="border-t border-black/5">
                {af.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 border-b border-black/5 px-5 py-2.5 last:border-0 sm:px-6"
                  >
                    <Rondje gedaan onClick={() => toggle(g.klasId, t)} />
                    <span className="flex-1 text-ink/45 line-through">{t.tekst}</span>
                    <button
                      type="button"
                      onClick={() => verwijder(g.klasId, t.id)}
                      aria-label="Verwijderen"
                      className="shrink-0 rounded-lg px-1.5 text-lg text-ink/25 transition hover:text-rose-500"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Rondje({ gedaan, onClick }: { gedaan: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={gedaan ? "Markeer als niet gedaan" : "Afvinken"}
      className={
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition " +
        (gedaan
          ? "border-brand bg-brand text-white"
          : "border-ink/25 text-transparent hover:border-brand hover:text-brand/40")
      }
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}

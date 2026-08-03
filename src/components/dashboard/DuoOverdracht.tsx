"use client";

import { useEffect, useRef, useState } from "react";
import { getGedeeldeKlassen, getDuoOverdracht, zetDuoOverdracht } from "@/lib/db";

type Groep = { klasId: string; klasNaam: string };

// Overdracht voor je collega's bij een groep: één kort briefje per groep,
// altijd overschreven (geen opstapelend logboek — dat is de belangrijkste
// privacymaatregel hier, zie database/schema.sql sectie 19). Verschijnt op
// Start zodra je een groep met iemand deelt.
//
// Bewust een SMAL STROOKJE, geen kaart: op Start zijn de tools de held (zie de
// takenlijst, die om dezelfde reden klein is). Het briefje zelf staat wél
// gewoon in beeld — lezen wat je collega schreef is het hele punt; alleen het
// schrijven zit achter een klik.
export default function DuoOverdracht() {
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [teksten, setTeksten] = useState<Record<string, string>>({});
  const [bijgewerkt, setBijgewerkt] = useState<Record<string, string>>({});
  const [bewaard, setBewaard] = useState<string | null>(null);
  const [bewerkt, setBewerkt] = useState<string | null>(null);
  const geladenRef = useRef(false);

  useEffect(() => {
    (async () => {
      const actief = await getGedeeldeKlassen();
      setGroepen(actief);
      const overdrachten = await Promise.all(actief.map((g) => getDuoOverdracht(g.klasId)));
      const t: Record<string, string> = {};
      const b: Record<string, string> = {};
      actief.forEach((g, i) => {
        t[g.klasId] = overdrachten[i]?.tekst ?? "";
        b[g.klasId] = overdrachten[i]?.bijgewerkt ?? "";
      });
      setTeksten(t);
      setBijgewerkt(b);
      geladenRef.current = true;
    })();
  }, []);

  // Debounced autosave per groep — zelfde principe als de weekrooster-editor:
  // elke wijziging wordt na 900ms stil bewaard, geen aparte opslaan-knop.
  useEffect(() => {
    if (!geladenRef.current) return;
    const timers = groepen.map((g) =>
      setTimeout(async () => {
        const ok = await zetDuoOverdracht(g.klasId, teksten[g.klasId] ?? "");
        if (ok) {
          setBijgewerkt((v) => ({ ...v, [g.klasId]: new Date().toISOString() }));
          setBewaard(g.klasId);
          setTimeout(() => setBewaard((v) => (v === g.klasId ? null : v)), 1500);
        }
      }, 900),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teksten]);

  if (groepen.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {groepen.map((g) => {
        const tekst = teksten[g.klasId] ?? "";
        const open = bewerkt === g.klasId;
        return (
          <div
            key={g.klasId}
            className="rounded-2xl border border-black/5 bg-white px-4 py-2.5 shadow-sm"
          >
            {/* Ingeklapt is dit één regel: je LEEST het briefje meteen, want dat
                is waar het voor is. Alleen het schrijven zit achter een klik. */}
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-ink/40">
                Overdracht{groepen.length > 1 && ` · ${g.klasNaam}`}
              </span>
              {!open && (
                <p className={"min-w-0 flex-1 truncate text-sm " + (tekst ? "text-ink/75" : "text-ink/40")}>
                  {tekst || "Nog geen briefje voor je collega's."}
                </p>
              )}
              <div className="ml-auto flex shrink-0 items-center gap-3">
                {bewaard === g.klasId && (
                  <span className="text-xs font-semibold text-emerald-600">✓ Bewaard</span>
                )}
                <button
                  type="button"
                  onClick={() => setBewerkt(open ? null : g.klasId)}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-brand transition hover:bg-brand-soft"
                >
                  {open ? "Klaar" : tekst ? "Bewerken" : "Schrijven"}
                </button>
              </div>
            </div>

            {open && (
              <>
                <textarea
                  autoFocus
                  value={tekst}
                  onChange={(e) => setTeksten((v) => ({ ...v, [g.klasId]: e.target.value }))}
                  placeholder="Bijv. waar je gebleven bent, wat er nog moet gebeuren, iets belangrijks voor morgen…"
                  rows={3}
                  className="mt-2 w-full resize-y rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <p className="mt-1.5 text-xs text-ink/45">
                  Vervangt het vorige briefje, er blijft geen geschiedenis staan. Geen
                  bijzondere persoonsgegevens (medisch, gezinssituatie, diagnoses).
                  {bijgewerkt[g.klasId] && (
                    <>
                      {" · bijgewerkt "}
                      {new Date(bijgewerkt[g.klasId]).toLocaleString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

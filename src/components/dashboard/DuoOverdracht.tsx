"use client";

import { useEffect, useRef, useState } from "react";
import { getDuoKoppels, getDuoOverdracht, zetDuoOverdracht, type DuoKoppel } from "@/lib/db";

// Overdracht voor je duo-collega: één kort briefje per koppel, altijd
// overschreven (geen opstapelend logboek — dat is de belangrijkste
// privacymaatregel hier, zie database/schema.sql sectie 19). Verschijnt op
// Start zodra er een actief duo-koppel is.
//
// Bewust een SMAL STROOKJE, geen kaart: op Start zijn de tools de held (zie de
// takenlijst, die om dezelfde reden klein is). Het briefje zelf staat wél
// gewoon in beeld — lezen wat je collega schreef is het hele punt; alleen het
// schrijven zit achter een klik.
export default function DuoOverdracht() {
  const [koppels, setKoppels] = useState<DuoKoppel[]>([]);
  const [teksten, setTeksten] = useState<Record<string, string>>({});
  const [bijgewerkt, setBijgewerkt] = useState<Record<string, string>>({});
  const [bewaard, setBewaard] = useState<string | null>(null);
  const [bewerkt, setBewerkt] = useState<string | null>(null);
  const geladenRef = useRef(false);

  useEffect(() => {
    (async () => {
      const alle = await getDuoKoppels();
      const actief = alle.filter((k) => k.status === "actief");
      setKoppels(actief);
      const overdrachten = await Promise.all(actief.map((k) => getDuoOverdracht(k.id)));
      const t: Record<string, string> = {};
      const b: Record<string, string> = {};
      actief.forEach((k, i) => {
        t[k.id] = overdrachten[i]?.tekst ?? "";
        b[k.id] = overdrachten[i]?.bijgewerkt ?? "";
      });
      setTeksten(t);
      setBijgewerkt(b);
      geladenRef.current = true;
    })();
  }, []);

  // Debounced autosave per koppel — zelfde principe als de weekrooster-editor:
  // elke wijziging wordt na 900ms stil bewaard, geen aparte opslaan-knop.
  useEffect(() => {
    if (!geladenRef.current) return;
    const timers = koppels.map((k) =>
      setTimeout(async () => {
        const ok = await zetDuoOverdracht(k.id, teksten[k.id] ?? "");
        if (ok) {
          setBijgewerkt((v) => ({ ...v, [k.id]: new Date().toISOString() }));
          setBewaard(k.id);
          setTimeout(() => setBewaard((v) => (v === k.id ? null : v)), 1500);
        }
      }, 900),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teksten]);

  if (koppels.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {koppels.map((k) => {
        const tekst = teksten[k.id] ?? "";
        const open = bewerkt === k.id;
        return (
          <div
            key={k.id}
            className="rounded-2xl border border-black/5 bg-white px-4 py-2.5 shadow-sm"
          >
            {/* Ingeklapt is dit één regel: je LEEST het briefje meteen, want dat
                is waar het voor is. Alleen het schrijven zit achter een klik. */}
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-ink/40">
                Overdracht{koppels.length > 1 && ` · ${k.klasNaam}`}
              </span>
              {!open && (
                <p className={"min-w-0 flex-1 truncate text-sm " + (tekst ? "text-ink/75" : "text-ink/40")}>
                  {tekst || "Nog geen briefje voor je duo-collega."}
                </p>
              )}
              <div className="ml-auto flex shrink-0 items-center gap-3">
                {bewaard === k.id && (
                  <span className="text-xs font-semibold text-emerald-600">✓ Bewaard</span>
                )}
                <button
                  type="button"
                  onClick={() => setBewerkt(open ? null : k.id)}
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
                  onChange={(e) => setTeksten((v) => ({ ...v, [k.id]: e.target.value }))}
                  placeholder="Bijv. waar je gebleven bent, wat er nog moet gebeuren, iets belangrijks voor morgen…"
                  rows={3}
                  className="mt-2 w-full resize-y rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <p className="mt-1.5 text-xs text-ink/45">
                  Vervangt het vorige briefje, er blijft geen geschiedenis staan. Geen
                  bijzondere persoonsgegevens (medisch, gezinssituatie, diagnoses).
                  {bijgewerkt[k.id] && (
                    <>
                      {" · bijgewerkt "}
                      {new Date(bijgewerkt[k.id]).toLocaleString("nl-NL", {
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

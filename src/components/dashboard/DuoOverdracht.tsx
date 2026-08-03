"use client";

import { useEffect, useRef, useState } from "react";
import { getDuoKoppels, getDuoOverdracht, zetDuoOverdracht, type DuoKoppel } from "@/lib/db";

// Overdracht voor je duo-collega: één kort briefje per koppel, altijd
// overschreven (geen opstapelend logboek — dat is de belangrijkste
// privacymaatregel hier, zie database/schema.sql sectie 19). Verschijnt op
// Start zodra er een actief duo-koppel is.
export default function DuoOverdracht() {
  const [koppels, setKoppels] = useState<DuoKoppel[]>([]);
  const [teksten, setTeksten] = useState<Record<string, string>>({});
  const [bijgewerkt, setBijgewerkt] = useState<Record<string, string>>({});
  const [bewaard, setBewaard] = useState<string | null>(null);
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
    <div className="flex flex-col gap-4">
      {koppels.map((k) => (
        <div key={k.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">Overdracht — {k.klasNaam}</h2>
            {bewaard === k.id && (
              <span className="text-xs font-semibold text-emerald-600">✓ Bewaard</span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink/60">
            Een kort briefje voor je duo-collega. Wat je hier typt vervangt het vorige
            briefje — er blijft geen geschiedenis staan.
            {bijgewerkt[k.id] && (
              <span className="text-ink/45">
                {" "}
                · laatst bijgewerkt{" "}
                {new Date(bijgewerkt[k.id]).toLocaleString("nl-NL", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
          <textarea
            value={teksten[k.id] ?? ""}
            onChange={(e) => setTeksten((v) => ({ ...v, [k.id]: e.target.value }))}
            placeholder="Bijv. waar je gebleven bent, wat er nog moet gebeuren, iets belangrijks voor morgen…"
            rows={4}
            className="mt-3 w-full resize-y rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <p className="mt-2 text-xs text-ink/45">
            Geen bijzondere persoonsgegevens (medisch, gezinssituatie, diagnoses).
          </p>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGedeeldeKlassen,
  getKlasCollegas,
  getDuoOverdrachten,
  zetDuoOverdracht,
  getMijnGebruikerId,
  type DuoOverdracht as Briefje,
} from "@/lib/db";

type Groep = { klasId: string; klasNaam: string };

// Overdracht voor je collega's bij een groep: ÉÉN briefje per persoon, met de
// naam erbij zodat je ziet wie wat schreef.
//
// ⚠️ Bewust géén gesprek: schrijf je opnieuw, dan vervangt dat je eigen vorige
// briefje. Zo ontstaat er nooit een archief van kind-specifieke opmerkingen —
// dat is hier de belangrijkste privacymaatregel (zie schema.sql sectie 19).
// Het briefje van een collega kun je lezen maar niet aanpassen; bij een naam
// eronder moet je erop kunnen vertrouwen dat die klopt.
//
// Bewust een SMAL STROOKJE, geen kaart: op Start zijn de tools de held (zie de
// takenlijst, die om dezelfde reden klein is). Het laatste briefje staat wél
// gewoon in beeld — lezen is het hele punt; alleen schrijven zit achter een klik.
export default function DuoOverdracht() {
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [briefjes, setBriefjes] = useState<Record<string, Briefje[]>>({});
  const [namen, setNamen] = useState<Record<string, string>>({});
  const [mijnId, setMijnId] = useState<string | null>(null);
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const [bewaard, setBewaard] = useState<string | null>(null);
  const [bewerkt, setBewerkt] = useState<string | null>(null);
  const geladenRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [mij, actief] = await Promise.all([getMijnGebruikerId(), getGedeeldeKlassen()]);
      setMijnId(mij);
      setGroepen(actief);
      const [alle, collegas] = await Promise.all([
        Promise.all(actief.map((g) => getDuoOverdrachten(g.klasId))),
        Promise.all(actief.map((g) => getKlasCollegas(g.klasId))),
      ]);
      const b: Record<string, Briefje[]> = {};
      const inv: Record<string, string> = {};
      actief.forEach((g, i) => {
        b[g.klasId] = alle[i];
        inv[g.klasId] = alle[i].find((x) => x.auteur === mij)?.tekst ?? "";
      });
      const n: Record<string, string> = {};
      collegas.flat().forEach((c) => (n[c.userId] = c.voornaam || "Collega"));
      setBriefjes(b);
      setInvoer(inv);
      setNamen(n);
      geladenRef.current = true;
    })();
  }, []);

  // Debounced autosave per groep — zelfde principe als de weekrooster-editor:
  // elke wijziging wordt na 900ms stil bewaard, geen aparte opslaan-knop.
  useEffect(() => {
    if (!geladenRef.current) return;
    const timers = groepen.map((g) =>
      setTimeout(async () => {
        const tekst = invoer[g.klasId] ?? "";
        const eigen = (briefjes[g.klasId] ?? []).find((b) => b.auteur === mijnId);
        if ((eigen?.tekst ?? "") === tekst) return;
        const ok = await zetDuoOverdracht(g.klasId, tekst);
        if (!ok) return;
        const nu = new Date().toISOString();
        setBriefjes((v) => {
          const anderen = (v[g.klasId] ?? []).filter((b) => b.auteur !== mijnId);
          const eigenNieuw: Briefje[] = tekst.trim()
            ? [{ tekst, auteur: mijnId ?? "", bijgewerkt: nu }]
            : [];
          return { ...v, [g.klasId]: [...eigenNieuw, ...anderen] };
        });
        setBewaard(g.klasId);
        setTimeout(() => setBewaard((v) => (v === g.klasId ? null : v)), 1500);
      }, 900),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoer]);

  if (groepen.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {groepen.map((g) => {
        const lijst = (briefjes[g.klasId] ?? []).filter((b) => b.tekst.trim());
        const nieuwste = lijst[0];
        const open = bewerkt === g.klasId;
        return (
          <div
            key={g.klasId}
            className="rounded-2xl border border-black/5 bg-white px-4 py-2.5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-ink/40">
                Overdracht{groepen.length > 1 && ` · ${g.klasNaam}`}
              </span>
              {!open && (
                <p
                  className={
                    "min-w-0 flex-1 truncate text-sm " + (nieuwste ? "text-ink/75" : "text-ink/40")
                  }
                >
                  {nieuwste ? (
                    <>
                      <strong className="font-semibold text-ink">
                        {nieuwste.auteur === mijnId ? "Jij" : namen[nieuwste.auteur] || "Collega"}:
                      </strong>{" "}
                      {nieuwste.tekst}
                    </>
                  ) : (
                    "Nog geen briefje voor je collega's."
                  )}
                </p>
              )}
              <div className="ml-auto flex shrink-0 items-center gap-3">
                {lijst.length > 1 && !open && (
                  <span className="text-xs text-ink/40">+{lijst.length - 1}</span>
                )}
                {bewaard === g.klasId && (
                  <span className="text-xs font-semibold text-emerald-600">✓ Bewaard</span>
                )}
                <button
                  type="button"
                  onClick={() => setBewerkt(open ? null : g.klasId)}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-brand transition hover:bg-brand-soft"
                >
                  {open ? "Klaar" : lijst.length ? "Openen" : "Schrijven"}
                </button>
              </div>
            </div>

            {open && (
              <div className="mt-2 flex flex-col gap-2">
                {/* De briefjes van je collega's: lezen, niet bewerken. */}
                {lijst
                  .filter((b) => b.auteur !== mijnId)
                  .map((b) => (
                    <div key={b.auteur} className="rounded-xl bg-cream px-4 py-2.5">
                      <p className="text-xs font-bold text-ink/70">
                        {namen[b.auteur] || "Collega"}
                        <span className="ml-2 font-normal text-ink/40">
                          {new Date(b.bijgewerkt).toLocaleString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink/80">{b.tekst}</p>
                    </div>
                  ))}

                {/* Je eigen briefje: één per persoon, dus dit vervangt je vorige. */}
                <div>
                  <p className="text-xs font-bold text-ink/70">Jouw briefje</p>
                  <textarea
                    autoFocus
                    value={invoer[g.klasId] ?? ""}
                    onChange={(e) => setInvoer((v) => ({ ...v, [g.klasId]: e.target.value }))}
                    placeholder="Bijv. waar je gebleven bent, wat er nog moet gebeuren, iets belangrijks voor morgen…"
                    rows={3}
                    className="mt-1 w-full resize-y rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <p className="mt-1.5 text-xs text-ink/45">
                    Dit vervangt jouw vorige briefje, er blijft geen geschiedenis staan. Geen
                    bijzondere persoonsgegevens (medisch, gezinssituatie, diagnoses).
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

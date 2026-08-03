"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGedeeldeKlassen,
  getKlasCollegas,
  getDuoOverdrachten,
  getOverdrachtGelezen,
  markeerOverdrachtGelezen,
  zetDuoOverdracht,
  getMijnGebruikerId,
  type DuoOverdracht as Briefje,
} from "@/lib/db";
import { Kaartvenster } from "./SchooljaarDagkaart";

type Groep = { klasId: string; klasNaam: string };

// Overdracht voor je collega's bij een groep: ÉÉN briefje per persoon, met de
// naam erbij zodat je ziet wie wat schreef.
//
// ⚠️ Bewust géén gesprek: schrijf je opnieuw, dan vervangt dat je eigen vorige
// briefje. Zo ontstaat er nooit een archief van kind-specifieke opmerkingen —
// dat is hier de belangrijkste privacymaatregel (zie schema.sql sectie 19).
// Een briefje dat blijft staan omdat iemand stopt met schrijven, wordt na 30
// dagen alsnog opgeruimd (cron `wis-oude-overdracht` in database/retention.sql).
//
// Op Start is dit een TEGEL naast Vandaag/Vakantie/Deze dag, met het aantal
// nieuwe briefjes erop. Klikken opent hetzelfde soort venster als die tegels
// (Kaartvenster): één soort tegel, één soort venster. Dat houdt Start rustig —
// de tools blijven de held.
export default function DuoOverdracht() {
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [briefjes, setBriefjes] = useState<Record<string, Briefje[]>>({});
  const [gelezenOp, setGelezenOp] = useState<Record<string, string | null>>({});
  const [namen, setNamen] = useState<Record<string, string>>({});
  const [mijnId, setMijnId] = useState<string | null>(null);
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const [bewaard, setBewaard] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const geladenRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [mij, actief] = await Promise.all([getMijnGebruikerId(), getGedeeldeKlassen()]);
      setMijnId(mij);
      setGroepen(actief);
      const [alle, collegas, gelezen] = await Promise.all([
        Promise.all(actief.map((g) => getDuoOverdrachten(g.klasId))),
        Promise.all(actief.map((g) => getKlasCollegas(g.klasId))),
        Promise.all(actief.map((g) => getOverdrachtGelezen(g.klasId))),
      ]);
      const b: Record<string, Briefje[]> = {};
      const inv: Record<string, string> = {};
      const gl: Record<string, string | null> = {};
      actief.forEach((g, i) => {
        b[g.klasId] = alle[i];
        inv[g.klasId] = alle[i].find((x) => x.auteur === mij)?.tekst ?? "";
        gl[g.klasId] = gelezen[i];
      });
      const n: Record<string, string> = {};
      collegas.flat().forEach((c) => (n[c.userId] = c.voornaam || "Collega"));
      setBriefjes(b);
      setInvoer(inv);
      setGelezenOp(gl);
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

  // Nieuw = een briefje van een ánder dat is bijgewerkt ná jouw laatste bezoek.
  // Je eigen briefje telt nooit mee; dat heb je zelf net getypt.
  function nieuwIn(klasId: string): number {
    const sinds = gelezenOp[klasId];
    return (briefjes[klasId] ?? []).filter(
      (b) => b.auteur !== mijnId && b.tekst.trim() && (!sinds || b.bijgewerkt > sinds),
    ).length;
  }

  const totaalNieuw = groepen.reduce((n, g) => n + nieuwIn(g.klasId), 0);

  // Openen = gelezen. Dat gebeurt in de database en niet in de browser, zodat
  // het op je telefoon én je laptop klopt.
  function openen() {
    const nu = new Date().toISOString();
    setOpen(true);
    groepen.forEach((g) => {
      if (nieuwIn(g.klasId) === 0) return;
      markeerOverdrachtGelezen(g.klasId);
      setGelezenOp((v) => ({ ...v, [g.klasId]: nu }));
    });
  }

  if (groepen.length === 0) return null;

  const laatste = groepen
    .flatMap((g) => briefjes[g.klasId] ?? [])
    .filter((b) => b.tekst.trim())
    .sort((a, b) => b.bijgewerkt.localeCompare(a.bijgewerkt))[0];

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openen())}
        className={
          "rounded-3xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " +
          (totaalNieuw > 0 ? "border-brand/30 bg-brand-soft" : "border-black/5 bg-white")
        }
      >
        <div className="flex items-center gap-3">
          <span
            className={
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold " +
              (totaalNieuw > 0 ? "bg-brand text-white" : "bg-ink/[0.06] text-ink/70")
            }
          >
            {totaalNieuw > 0 ? (
              totaalNieuw
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 6h16v10H8l-4 3z" />
              </svg>
            )}
          </span>
          <p
            className={
              "text-xs font-bold uppercase tracking-wider " +
              (totaalNieuw > 0 ? "text-brand-dark" : "text-ink/40")
            }
          >
            Overdracht
          </p>
        </div>
        <div className="mt-2 pl-[52px]">
          {totaalNieuw > 0 ? (
            <p className="text-lg font-bold leading-tight text-ink">
              {totaalNieuw === 1 ? "1 nieuw bericht" : `${totaalNieuw} nieuwe berichten`}
            </p>
          ) : laatste ? (
            <>
              <p className="truncate text-lg font-bold leading-tight text-ink">{laatste.tekst}</p>
              <p className="mt-0.5 truncate text-sm text-ink/60">
                {laatste.auteur === mijnId ? "Van jou" : `Van ${namen[laatste.auteur] || "collega"}`}
              </p>
            </>
          ) : (
            <p className="text-lg font-bold leading-tight text-ink">Nog niets geschreven</p>
          )}
        </div>
      </button>

      {/* Zelfde venster als de tegels ernaast (Kaartvenster uit de dagkaart):
          verduisterde achtergrond, sluiten met Escape of door ernaast te
          klikken. Eén soort tegel hoort één soort venster te openen. */}
      {open && (
        <Kaartvenster titel="Overdracht" sluit={() => setOpen(false)}>
          <div className="mt-3 flex flex-col gap-5">
            {groepen.map((g) => {
              const lijst = (briefjes[g.klasId] ?? []).filter((b) => b.tekst.trim());
              return (
                <div key={g.klasId}>
                  {groepen.length > 1 && (
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">
                      {g.klasNaam}
                    </p>
                  )}

                  {/* De briefjes van je collega's: lezen, niet bewerken. */}
                  <div className="flex flex-col gap-2">
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
                          <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink/80">
                            {b.tekst}
                          </p>
                        </div>
                      ))}
                    {lijst.filter((b) => b.auteur !== mijnId).length === 0 && (
                      <p className="text-sm text-ink/45">
                        Je collega&apos;s hebben nog niets geschreven.
                      </p>
                    )}
                  </div>

                  {/* Je eigen briefje: één per persoon, dus dit vervangt je vorige. */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-ink/70">Jouw briefje</p>
                      {bewaard === g.klasId && (
                        <span className="text-xs font-semibold text-emerald-600">✓ Bewaard</span>
                      )}
                    </div>
                    <textarea
                      value={invoer[g.klasId] ?? ""}
                      onChange={(e) => setInvoer((v) => ({ ...v, [g.klasId]: e.target.value }))}
                      placeholder="Bijv. waar je gebleven bent, wat er nog moet gebeuren, iets belangrijks voor morgen…"
                      rows={3}
                      className="mt-1 w-full resize-y rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    {/* Kort houden: drie feiten, geen alinea. De volledige uitleg
                        over bewaren staat in /privacy. */}
                    <p className="mt-1.5 text-xs text-ink/45">
                      Vervangt je vorige briefje · weg na 30 dagen · geen medische of
                      gezinsgegevens
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Kaartvenster>
      )}
    </>
  );
}

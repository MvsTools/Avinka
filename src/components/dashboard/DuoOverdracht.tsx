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
  type DuoOverdracht as Bericht,
} from "@/lib/db";
import { Kaartvenster } from "./SchooljaarDagkaart";

type Groep = { klasId: string; klasNaam: string };

// De overdracht voor je collega's bij een groep. Leest als een gespreksscherm:
// berichten bovenin, typen onderin.
//
// ⚠️ Het is bewust GEEN echt gesprek: iedereen heeft één bericht per groep, en
// stuur je een nieuwe, dan vervangt die je vorige. Zo ontstaat er nooit een
// archief van kind-specifieke opmerkingen — dat is hier de belangrijkste
// privacymaatregel (zie database/schema.sql sectie 19). Een bericht dat blijft
// staan omdat iemand stopt met schrijven, wordt na 30 dagen alsnog opgeruimd
// (cron `wis-oude-overdracht` in database/retention.sql).
//
// Op Start is dit een TEGEL naast Vandaag/Vakantie/Deze dag, met het aantal
// nieuwe berichten erop. Klikken opent hetzelfde soort venster als die tegels
// (Kaartvenster): één soort tegel, één soort venster.
export default function DuoOverdracht() {
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [berichten, setBerichten] = useState<Record<string, Bericht[]>>({});
  const [gelezenOp, setGelezenOp] = useState<Record<string, string | null>>({});
  const [namen, setNamen] = useState<Record<string, string>>({});
  const [mijnId, setMijnId] = useState<string | null>(null);
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const [versturen, setVersturen] = useState(false);
  const [open, setOpen] = useState(false);
  const [actieveGroep, setActieveGroep] = useState<string>("");
  const onderaan = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [mij, actief] = await Promise.all([getMijnGebruikerId(), getGedeeldeKlassen()]);
      setMijnId(mij);
      setGroepen(actief);
      setActieveGroep(actief[0]?.klasId ?? "");
      const [alle, collegas, gelezen] = await Promise.all([
        Promise.all(actief.map((g) => getDuoOverdrachten(g.klasId))),
        Promise.all(actief.map((g) => getKlasCollegas(g.klasId))),
        Promise.all(actief.map((g) => getOverdrachtGelezen(g.klasId))),
      ]);
      const b: Record<string, Bericht[]> = {};
      const inv: Record<string, string> = {};
      const gl: Record<string, string | null> = {};
      actief.forEach((g, i) => {
        b[g.klasId] = alle[i];
        inv[g.klasId] = "";
        gl[g.klasId] = gelezen[i];
      });
      const n: Record<string, string> = {};
      collegas.flat().forEach((c) => (n[c.userId] = c.voornaam || "Collega"));
      setBerichten(b);
      setInvoer(inv);
      setGelezenOp(gl);
      setNamen(n);
    })();
  }, []);

  // Bij openen (en na versturen) onderaan het gesprek beginnen, zoals een
  // berichtenapp doet: het nieuwste bericht is waar je naar kijkt.
  useEffect(() => {
    if (open) onderaan.current?.scrollIntoView({ block: "end" });
  }, [open, actieveGroep, berichten]);

  // Nieuw = een bericht van een ánder dat is bijgewerkt ná jouw laatste bezoek.
  // Je eigen bericht telt nooit mee; dat heb je zelf net gestuurd.
  function nieuwIn(klasId: string): number {
    const sinds = gelezenOp[klasId];
    return (berichten[klasId] ?? []).filter(
      (b) => b.auteur !== mijnId && b.tekst.trim() && (!sinds || b.bijgewerkt > sinds),
    ).length;
  }

  const totaalNieuw = groepen.reduce((n, g) => n + nieuwIn(g.klasId), 0);

  // Openen = gelezen. Dat gebeurt in de database en niet in de browser, zodat
  // het op je telefoon én je laptop klopt.
  function openen() {
    const nu = new Date().toISOString();
    setOpen(true);
    const eersteMetNieuws = groepen.find((g) => nieuwIn(g.klasId) > 0);
    if (eersteMetNieuws) setActieveGroep(eersteMetNieuws.klasId);
    groepen.forEach((g) => {
      if (nieuwIn(g.klasId) === 0) return;
      markeerOverdrachtGelezen(g.klasId);
      setGelezenOp((v) => ({ ...v, [g.klasId]: nu }));
    });
  }

  async function verstuur(klasId: string) {
    const tekst = (invoer[klasId] ?? "").trim();
    if (!tekst || versturen) return;
    setVersturen(true);
    const ok = await zetDuoOverdracht(klasId, tekst);
    setVersturen(false);
    if (!ok) return;
    const nu = new Date().toISOString();
    setBerichten((v) => {
      const anderen = (v[klasId] ?? []).filter((b) => b.auteur !== mijnId);
      return { ...v, [klasId]: [...anderen, { tekst, auteur: mijnId ?? "", bijgewerkt: nu }] };
    });
    setInvoer((v) => ({ ...v, [klasId]: "" }));
  }

  if (groepen.length === 0) return null;

  const laatste = groepen
    .flatMap((g) => berichten[g.klasId] ?? [])
    .filter((b) => b.tekst.trim())
    .sort((a, b) => b.bijgewerkt.localeCompare(a.bijgewerkt))[0];

  // Oudste bovenaan, nieuwste onderaan — de leesrichting van een berichtenapp.
  const gesprek = (berichten[actieveGroep] ?? [])
    .filter((b) => b.tekst.trim())
    .sort((a, b) => a.bijgewerkt.localeCompare(b.bijgewerkt));

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
            <p className="text-lg font-bold leading-tight text-ink">Nog geen overdracht</p>
          )}
        </div>
      </button>

      {open && (
        <Kaartvenster titel="Overdracht" sluit={() => setOpen(false)}>
          {/* Deel je meer dan één groep, dan is elke groep een eigen gesprek. */}
          {groepen.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {groepen.map((g) => (
                <button
                  key={g.klasId}
                  type="button"
                  onClick={() => setActieveGroep(g.klasId)}
                  className={
                    "rounded-xl border px-3 py-1.5 text-sm font-semibold transition " +
                    (actieveGroep === g.klasId
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-black/10 text-ink/60 hover:border-black/20")
                  }
                >
                  {g.klasNaam}
                  {nieuwIn(g.klasId) > 0 && ` (${nieuwIn(g.klasId)})`}
                </button>
              ))}
            </div>
          )}

          {/* ── Bovenin: de berichten ── */}
          <div className="mt-3 flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
            {gesprek.length === 0 && (
              <p className="py-6 text-center text-sm text-ink/45">
                Nog geen overdracht. Begin hieronder.
              </p>
            )}
            {gesprek.map((b) => {
              const vanMij = b.auteur === mijnId;
              return (
                <div
                  key={b.auteur}
                  className={
                    "max-w-[85%] rounded-2xl px-4 py-2.5 " +
                    (vanMij
                      ? "self-end rounded-br-md bg-brand-soft"
                      : "self-start rounded-bl-md bg-cream")
                  }
                >
                  <p className="text-xs font-bold text-ink/70">
                    {vanMij ? "Jij" : namen[b.auteur] || "Collega"}
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
              );
            })}
            <div ref={onderaan} />
          </div>

          {/* ── Onderin: typen ── */}
          <div className="mt-3 border-t border-black/5 pt-3">
            <label htmlFor="overdracht-invoer" className="text-sm font-semibold text-ink">
              Wat wil je delen met je collega&apos;s?
            </label>
            <div className="mt-1.5 flex items-end gap-2">
              <textarea
                id="overdracht-invoer"
                value={invoer[actieveGroep] ?? ""}
                onChange={(e) => setInvoer((v) => ({ ...v, [actieveGroep]: e.target.value }))}
                onKeyDown={(e) => {
                  // Enter verstuurt, shift+Enter maakt een nieuwe regel — zoals
                  // je van een berichtenveld verwacht.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    verstuur(actieveGroep);
                  }
                }}
                rows={2}
                className="min-w-0 flex-1 resize-y rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => verstuur(actieveGroep)}
                disabled={!(invoer[actieveGroep] ?? "").trim() || versturen}
                className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
              >
                {versturen ? "Bezig…" : "Versturen"}
              </button>
            </div>
            {/* Kort houden: drie feiten, geen alinea. De volledige uitleg over
                bewaren staat in /privacy. */}
            <p className="mt-1.5 text-xs text-ink/45">
              Vervangt je vorige overdracht · weg na 30 dagen · geen privacygevoelige
              informatie
            </p>
          </div>
        </Kaartvenster>
      )}
    </>
  );
}

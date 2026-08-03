"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGedeeldeKlassen,
  getKlasCollegas,
  getDuoOverdrachten,
  getDuoTaken,
  getOverdrachtGelezen,
  markeerOverdrachtGelezen,
  zetDuoOverdracht,
  getMijnGebruikerId,
  type DuoOverdracht as Bericht,
} from "@/lib/db";
import type { PlanningBron } from "@/lib/planning";
import { feitenVanVandaag, maakConcept, maakNetter } from "@/lib/overdracht-ai";
import { Kaartvenster } from "./SchooljaarDagkaart";
import DagTegel from "./DagTegel";

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
//
// `bron` en `vandaag` komen van Start mee: die heeft de planning toch al
// opgehaald, en het AI-knopje hieronder maakt er zijn concept uit.
export default function DuoOverdracht({
  bron,
  vandaag,
}: {
  bron: PlanningBron;
  vandaag: string;
}) {
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [berichten, setBerichten] = useState<Record<string, Bericht[]>>({});
  const [gelezenOp, setGelezenOp] = useState<Record<string, string | null>>({});
  const [namen, setNamen] = useState<Record<string, string>>({});
  const [mijnId, setMijnId] = useState<string | null>(null);
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const [versturen, setVersturen] = useState(false);
  const [fout, setFout] = useState(false);
  const [open, setOpen] = useState(false);
  const [actieveGroep, setActieveGroep] = useState<string>("");
  // Het AI-knopje: het voorstel staat apart tot je het overneemt, zodat je
  // eigen tekst nooit onder je handen vandaan wordt geschreven.
  const [aiBezig, setAiBezig] = useState(false);
  const [voorstel, setVoorstel] = useState<string | null>(null);
  const [aiFout, setAiFout] = useState<string | null>(null);
  const onderaan = useRef<HTMLDivElement>(null);
  const veld = useRef<HTMLTextAreaElement>(null);

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
    setFout(false);
    const ok = await zetDuoOverdracht(klasId, tekst);
    setVersturen(false);
    // Een knop die niets doet en niets zegt is het ergste soort fout: je blijft
    // typen en denkt dat het aankomt. Zeg het dus, en houd de tekst staan.
    if (!ok) {
      setFout(true);
      return;
    }
    const nu = new Date().toISOString();
    setBerichten((v) => {
      const anderen = (v[klasId] ?? []).filter((b) => b.auteur !== mijnId);
      return { ...v, [klasId]: [...anderen, { tekst, auteur: mijnId ?? "", bijgewerkt: nu }] };
    });
    setInvoer((v) => ({ ...v, [klasId]: "" }));
    setVoorstel(null);
    setAiFout(null);
  }

  // Van groep wisselen betekent een ander gesprek; een voorstel dat bij de
  // vorige groep hoorde mag daar niet blijven hangen.
  function kiesGroep(klasId: string) {
    setActieveGroep(klasId);
    setVoorstel(null);
    setAiFout(null);
  }

  // Eén knop, twee situaties. Staat er tekst, dan werkt de AI die tekst uit.
  // Is het veld leeg, dan bouwt de code eerst de feiten van vandaag op en
  // schrijft de AI daar een concept van.
  async function vraagAi() {
    const groep = groepen.find((g) => g.klasId === actieveGroep);
    if (!groep || aiBezig) return;
    const getypt = (invoer[actieveGroep] ?? "").trim();

    setAiBezig(true);
    setAiFout(null);
    setVoorstel(null);

    let antwoord;
    if (getypt) {
      antwoord = await maakNetter(getypt);
    } else {
      const taken = await getDuoTaken(groep.klasId);
      const feiten = feitenVanVandaag(bron, vandaag, groep.klasNaam, taken);
      if (feiten.leeg) {
        // Zonder feiten valt er niets te schrijven, en dan gaat de AI het gat
        // vullen met iets dat niet gebeurd is. Dus vragen we het niet eens.
        setAiBezig(false);
        setAiFout(
          "Van vandaag is er nog niets bekend om mee te beginnen. Typ zelf een paar steekwoorden, dan maak ik er een bericht van.",
        );
        return;
      }
      antwoord = await maakConcept(feiten);
    }

    setAiBezig(false);
    if (antwoord.ok) setVoorstel(antwoord.tekst);
    else setAiFout(antwoord.melding);
  }

  function neemVoorstelOver() {
    if (!voorstel) return;
    setInvoer((v) => ({ ...v, [actieveGroep]: voorstel }));
    setVoorstel(null);
    veld.current?.focus();
  }

  if (groepen.length === 0) return null;

  const laatste = groepen
    .flatMap((g) => berichten[g.klasId] ?? [])
    .filter((b) => b.tekst.trim())
    .sort((a, b) => b.bijgewerkt.localeCompare(a.bijgewerkt))[0];

  // Bepaalt wat het AI-knopje doet: uitwerken wat je al typte, of beginnen.
  const heeftTekst = Boolean((invoer[actieveGroep] ?? "").trim());

  // Oudste bovenaan, nieuwste onderaan — de leesrichting van een berichtenapp.
  const gesprek = (berichten[actieveGroep] ?? [])
    .filter((b) => b.tekst.trim())
    .sort((a, b) => a.bijgewerkt.localeCompare(b.bijgewerkt));

  return (
    <>
      <DagTegel
        onClick={() => (open ? setOpen(false) : openen())}
        label="Overdracht"
        labelKleur={totaalNieuw > 0 ? "text-brand-dark" : "text-ink/40"}
        achtergrond={totaalNieuw > 0 ? "border-brand/30 bg-brand-soft" : "border-black/5 bg-white"}
        badge={
          "text-sm font-bold " + (totaalNieuw > 0 ? "bg-brand text-white" : "bg-ink/[0.06] text-ink/70")
        }
        icon={
          totaalNieuw > 0 ? (
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
          )
        }
      >
        {totaalNieuw > 0 ? (
          <p className="text-lg font-bold leading-tight text-ink">
            {totaalNieuw === 1 ? "1 nieuw bericht" : `${totaalNieuw} nieuwe berichten`}
          </p>
        ) : laatste ? (
          <>
            <p className="truncate text-lg font-bold leading-tight text-ink">{laatste.tekst}</p>
            <p className="truncate text-sm text-ink/60">
              {laatste.auteur === mijnId ? "Van jou" : `Van ${namen[laatste.auteur] || "collega"}`}
            </p>
          </>
        ) : (
          <p className="text-lg font-bold leading-tight text-ink">Nog geen overdracht</p>
        )}
      </DagTegel>

      {open && (
        <Kaartvenster titel="Overdracht" sluit={() => setOpen(false)}>
          {/* Deel je meer dan één groep, dan is elke groep een eigen gesprek. */}
          {groepen.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {groepen.map((g) => (
                <button
                  key={g.klasId}
                  type="button"
                  onClick={() => kiesGroep(g.klasId)}
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

            {/* Het voorstel staat náást je eigen tekst, niet eroverheen: je
                vergelijkt en kiest zelf. */}
            {(aiBezig || voorstel) && (
              <div
                aria-live="polite"
                className="mt-2 rounded-2xl border border-brand/25 bg-brand-soft/60 px-4 py-3"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                  Voorstel
                </p>
                {aiBezig ? (
                  <p className="mt-1 text-sm text-ink/60">Even schrijven…</p>
                ) : (
                  <>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink/80">
                      {voorstel}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={neemVoorstelOver}
                        // Bewust niet gevuld groen: Versturen staat er vlak
                        // onder en dat is de knop die het bericht wegstuurt.
                        // Twee volle groene knoppen boven elkaar leest als twee
                        // keer dezelfde eindstap.
                        className="rounded-xl border border-brand bg-white px-4 py-1.5 text-sm font-bold text-brand-dark transition hover:bg-brand-soft"
                      >
                        Gebruiken
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoorstel(null)}
                        className="rounded-xl border border-black/10 px-4 py-1.5 text-sm font-semibold text-ink/60 transition hover:border-black/20"
                      >
                        Toch niet
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {aiFout && (
              <p aria-live="polite" className="mt-2 text-sm text-red-600">
                {aiFout}
              </p>
            )}

            {/* Onder het veld staat één rij bediening: typen, hulp, wegsturen.
                De twee knoppen zitten in een eigen groepje, zodat ze op een
                smal scherm samen onder het veld springen in plaats van dat er
                eentje alleen achterblijft. */}
            <div className="mt-1.5 flex flex-wrap items-end gap-2">
              <textarea
                ref={veld}
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
                className="min-w-[12rem] flex-1 resize-y rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <div className="flex shrink-0 items-end gap-2">
                {/* Bewust neutraal van vorm: alleen het sterretje is groen.
                    Zo staat er één groene knop in beeld en zie je meteen welke
                    het bericht wegstuurt. */}
                <button
                  type="button"
                  onClick={vraagAi}
                  disabled={aiBezig || versturen}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-black/20 disabled:opacity-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-brand"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M13 2.5l1.9 5.6 5.6 1.9-5.6 1.9L13 17.5l-1.9-5.6L5.5 10l5.6-1.9L13 2.5z" />
                    <path d="M5.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
                  </svg>
                  {heeftTekst ? "Netter maken" : "Begin voor mij"}
                </button>
                <button
                  type="button"
                  onClick={() => verstuur(actieveGroep)}
                  disabled={!(invoer[actieveGroep] ?? "").trim() || versturen}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {versturen ? "Bezig…" : "Versturen"}
                </button>
              </div>
            </div>
            {fout && (
              <p className="mt-2 text-sm text-red-600">
                Versturen lukte niet. Je tekst staat er nog, probeer het zo nog eens.
              </p>
            )}
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

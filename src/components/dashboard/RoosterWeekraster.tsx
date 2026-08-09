"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { staatVast, naarBlokken, type Basisrooster, type RuilPlek } from "@/lib/planning/rooster";
import type { Dagbeeld, Roosterblok } from "@/lib/planning/types";
import { ETIKET } from "./schooljaar-stijl";
import {
  Bewerkraster,
  Blokkaart,
  lesontwerpLink,
  VakKiezer,
  SlotIcoon,
  DAG_ID,
  STANDAARD_VAKKEN,
  nieuwId,
  type Gekozen,
} from "./RoosterBewerken";

// Korte maandnaam voor in de dagkoppen — daar moet "12 aug" passen, niet
// "12 augustus". Elders in het onderdeel (Start, agenda's) blijft de volle
// naam gewoon staan; dit is alleen voor dit smalle koppen-rijtje.
const MAAND_KORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];
function datumLabelKort(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MAAND_KORT[Number(iso.slice(5, 7)) - 1]}`;
}

// Het weekoverzicht ís de bewerkstand: geen knop om er "in" te gaan, geen
// aparte Opslaan-stap. Slepen, verwijderen, toevoegen kan gewoon meteen; elke
// wijziging wordt na een korte stilte automatisch bewaard als weekafwijking
// (rooster_week) — het basisrooster blijft ongemoeid. Vakkleuren en nieuwe
// vakken blijven op slot: dat regel je bij "Basisrooster aanpassen".
export default function RoosterWeekraster({
  maandag,
  dagen,
}: {
  /** Maandag van de getoonde week (ISO). */
  maandag: string;
  /** De vijf dagen van deze week (agenda + vrij-status komen hiervandaan). */
  dagen: Dagbeeld[];
}) {
  const [concept, setConcept] = useState<Basisrooster | null>(null);
  const [geschiedenis, setGeschiedenis] = useState<Basisrooster[]>([]);
  const [vuil, setVuil] = useState(false);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState<string | null>(null);
  const [bewarenBezig, setBewarenBezig] = useState(false);
  const [bewaarFout, setBewaarFout] = useState(false);
  const [gekozen, setGekozen] = useState<Gekozen | null>(null);
  const [toevoegen, setToevoegen] = useState<{
    weekdag: number;
    start: number;
    duur: number;
    x: number;
    y: number;
    kant: "links" | "rechts";
  } | null>(null);
  const [slotstand, setSlotstand] = useState(false);
  const [slotHint, setSlotHint] = useState<string | null>(null);
  // Is er voor deze week al een afwijking bewaard? Dan kun je 'm terugzetten.
  const [overschrijving, setOverschrijving] = useState(false);
  const [terugzettenBezig, setTerugzettenBezig] = useState(false);
  const laatsteStap = useRef<string | null>(null);

  // Voor het wisselen van week: zodat we een nog niet bewaarde wijziging van
  // de week die je verlaat eerst kunnen versturen, in plaats van hem kwijt te
  // raken aan de 900ms-stilte die nooit kwam omdat je al was doorgeklikt.
  const vuilRef = useRef(false);
  const conceptRef = useRef<Basisrooster | null>(null);
  const maandagRef = useRef(maandag);
  useEffect(() => {
    vuilRef.current = vuil;
    conceptRef.current = concept;
  }, [vuil, concept]);

  async function bewaar(rooster: Basisrooster, doelMaandag: string) {
    const antwoord = await fetch("/api/rooster-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rooster, maandag: doelMaandag }),
    });
    if (!antwoord.ok) throw new Error("bewaren mislukt");
  }

  // Het rooster van een week ophalen. Nog geen afwijking? Dan komt er een
  // kopie van het basisrooster terug, als startpunt. Herbruikt bij het openen
  // van de week, het bladeren naar een andere week, én na "Terugzetten naar
  // basis" (dan laden we gewoon opnieuw i.p.v. zelf te bedenken hoe de basis
  // eruitziet).
  async function laadWeek(doelMaandag: string, levend: () => boolean) {
    setLaden(true);
    setGeschiedenis([]);
    setVuil(false);
    setGekozen(null);
    setToevoegen(null);
    try {
      const antwoord = await fetch(`/api/rooster-week?maandag=${encodeURIComponent(doelMaandag)}`, {
        headers: { Accept: "application/json" },
      });
      if (!antwoord.ok) throw new Error("laden mislukt");
      const data = await antwoord.json();
      if (levend()) {
        setConcept(data.rooster ?? null);
        setOverschrijving(Boolean(data.overschrijving));
        setFout(null);
      }
    } catch {
      if (levend()) setFout("Deze week kon niet worden geladen.");
    } finally {
      if (levend()) setLaden(false);
    }
  }

  useEffect(() => {
    let levend = true;
    (async () => {
      if (vuilRef.current && conceptRef.current && maandagRef.current !== maandag) {
        await bewaar(conceptRef.current, maandagRef.current).catch(() => {});
      }
      maandagRef.current = maandag;
      await laadWeek(maandag, () => levend);
    })();
    return () => {
      levend = false;
    };
  }, [maandag]);

  async function terugNaarBasis() {
    setTerugzettenBezig(true);
    try {
      await fetch(`/api/rooster-week?maandag=${encodeURIComponent(maandag)}`, {
        method: "DELETE",
      });
      await laadWeek(maandag, () => true);
    } finally {
      setTerugzettenBezig(false);
    }
  }

  function pasToe(maak: (c: Basisrooster) => Basisrooster, stap?: string) {
    if (!concept) return;
    const doorgaan = stap != null && stap === laatsteStap.current;
    if (!doorgaan) setGeschiedenis((g) => [...g, concept]);
    laatsteStap.current = stap ?? null;
    setConcept(maak(concept));
    setVuil(true);
  }

  function ongedaan() {
    if (!geschiedenis.length) return;
    setConcept(geschiedenis[geschiedenis.length - 1]);
    setGeschiedenis((g) => g.slice(0, -1));
    setVuil(true);
    setGekozen(null);
  }

  // Automatisch bewaren: pas ná een echte wijziging (vuil wordt hier gezet
  // door pasToe/ongedaan), nooit meteen bij het laden — anders zou een week
  // enkel *bekijken* hem al als afwijkend markeren.
  useEffect(() => {
    if (!vuil || !concept) return;
    const doelMaandag = maandag;
    const t = setTimeout(async () => {
      setBewarenBezig(true);
      setBewaarFout(false);
      try {
        await bewaar(concept, doelMaandag);
        setVuil(false);
        setOverschrijving(true);
      } catch {
        setBewaarFout(true);
      } finally {
        setBewarenBezig(false);
      }
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vuil, concept]);

  const lessen = useMemo<Roosterblok[]>(
    () => (concept ? naarBlokken(concept).filter((b) => b.soort === "les") : []),
    [concept],
  );
  const gekozenBlok = gekozen ? (lessen.find((b) => b.id === gekozen.id) ?? null) : null;
  // Zie RoosterBewerken.tsx: pauzeblokken delen allemaal vak "pauze", dus ook
  // op naam matchen — anders telt "bij alle …-blokken" de verkeerde pauze mee.
  const zelfdeVak = gekozenBlok
    ? (concept?.blokken ?? []).filter(
        (b) => b.vak === gekozenBlok.vak && b.naam === gekozenBlok.naam,
      )
    : [];
  const overalGelijk =
    zelfdeVak.length > 1 &&
    Boolean(gekozenBlok?.omschrijving?.trim()) &&
    zelfdeVak.every((b) => (b.omschrijving ?? "") === (gekozenBlok?.omschrijving ?? ""));
  const vakkenLijst =
    concept?.setup.vakken && concept.setup.vakken.length > 0
      ? concept.setup.vakken
      : STANDAARD_VAKKEN;

  function wijzigEinde(id: string, delta: number) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) =>
        b.id === id ? { ...b, duur: Math.min(180, Math.max(10, b.duur + delta)) } : b,
      ),
    }));
  }
  function wijzigBegin(id: string, delta: number) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) => {
        if (b.id !== id) return b;
        const start = b.start + delta;
        const duur = b.duur - delta;
        if (start < 0 || duur < 10 || duur > 180) return b;
        return { ...b, start, duur };
      }),
    }));
  }
  function zetOmschrijving(id: string, tekst: string, overal: boolean) {
    const nieuw = tekst.trim() ? tekst : undefined;
    pasToe(
      (c) => {
        const bron = c.blokken.find((b) => b.id === id);
        return {
          ...c,
          blokken: c.blokken.map((b) =>
            b.id === id || (overal && bron && b.vak === bron.vak && b.naam === bron.naam)
              ? { ...b, omschrijving: nieuw }
              : b,
          ),
        };
      },
      `omschrijving:${overal ? "vak" : "blok"}:${id}`,
    );
  }
  function verwijder(id: string) {
    pasToe((c) => ({ ...c, blokken: c.blokken.filter((b) => b.id !== id) }));
    setGekozen(null);
  }
  function voegToe(weekdag: number, start: number, duur: number, vak: string, naam: string) {
    pasToe((c) => ({
      ...c,
      blokken: [
        ...c.blokken,
        { id: nieuwId(), dag: DAG_ID[weekdag], start, duur, vak, naam, type: "les" },
      ],
    }));
    setToevoegen(null);
  }
  function zetBlok(id: string, w: { weekdag?: number; start?: number; duur?: number }) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) =>
        b.id === id
          ? {
              ...b,
              dag: w.weekdag != null ? DAG_ID[w.weekdag] : b.dag,
              start: w.start != null ? w.start : b.start,
              duur: w.duur != null ? w.duur : b.duur,
            }
          : b,
      ),
    }));
  }
  function ruilBlokken(aId: string, bId: string, plek: { a: RuilPlek; b: RuilPlek }) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) => {
        const nieuw = b.id === aId ? plek.a : b.id === bId ? plek.b : null;
        if (!nieuw) return b;
        return { ...b, dag: DAG_ID[nieuw.weekdag], start: nieuw.start, duur: nieuw.duur };
      }),
    }));
  }
  function wisselSlot(id: string) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) => (b.id === id ? { ...b, opSlot: !staatVast(b) } : b)),
    }));
  }
  function kopieerDag(bron: number, doelen: number[]) {
    pasToe((c) => {
      const bronBlokken = c.blokken.filter((b) => DAG_ID.indexOf(b.dag) === bron);
      const blokken = c.blokken.filter((b) => !doelen.includes(DAG_ID.indexOf(b.dag)));
      for (const doel of doelen)
        for (const b of bronBlokken) blokken.push({ ...b, id: nieuwId(), dag: DAG_ID[doel] });
      return { ...c, blokken };
    });
  }
  function kies(id: string, el: HTMLElement) {
    if (gekozen?.id === id) {
      setGekozen(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const breedte = 244;
    const hoogteSchatting = 325;
    let x = r.right + 8;
    let kant: "links" | "rechts" = "rechts";
    if (x + breedte > window.innerWidth - 8) {
      x = r.left - breedte - 8;
      kant = "links";
    }
    if (x < 8) x = 8;
    const y = Math.max(8, Math.min(r.top, window.innerHeight - hoogteSchatting - 8));
    setGekozen({ id, x, y, kant });
  }

  const dagInfo = dagen.map((d) => ({
    datumLabel: datumLabelKort(d.datum),
    vrij: d.vrij,
    vrijLabel: d.vrijReden === "weekend" ? "Weekend" : d.vakantie ? "Vakantie" : "Geen les",
  }));

  return (
    <div className="flex flex-col gap-3">
      {/* Agenda-strookje: wat er die dag speelt, los van je rooster. */}
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] bg-cream/40">
          <div className="px-1 py-1.5 text-right text-xs font-semibold leading-tight text-ink/35">
            agenda
          </div>
          {dagen.map((d) => {
            const items = d.items.filter((i) => i.soort !== "vakantie");
            return (
              <div key={d.datum} className="min-h-[2.25rem] border-l border-black/5 p-1">
                {d.vakantie && (
                  <span className="block truncate rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-bold text-brand-dark">
                    {d.vakantie.naam}
                  </span>
                )}
                {items.slice(0, 2).map((i) => (
                  <span
                    key={i.id}
                    title={i.titel + (i.begin ? `, ${i.begin}` : "")}
                    className={
                      "mt-0.5 block truncate rounded-md px-1.5 py-0.5 text-xs font-bold " +
                      ETIKET[i.soort].stijl
                    }
                  >
                    {i.titel}
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="mt-0.5 block px-1.5 text-xs font-bold text-ink/45">
                    en nog {items.length - 2}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setGekozen(null);
            setToevoegen(null);
            setSlotHint(null);
            setSlotstand((s) => !s);
          }}
          title="Blokken vastzetten"
          aria-label="Blokken vastzetten"
          aria-pressed={slotstand}
          className={
            "flex h-9 w-9 items-center justify-center rounded-xl border transition-transform duration-150 active:scale-[0.96] " +
            (slotstand
              ? "border-brand-dark bg-brand-dark text-white"
              : "border-black/10 bg-white text-ink/60 hover:text-ink")
          }
        >
          <SlotIcoon dicht={slotstand} grootte={15} />
        </button>
        {slotstand ? (
          <p className="flex items-start gap-2 text-sm leading-6 text-brand-dark">
            <span className="mt-1 shrink-0">
              <SlotIcoon dicht grootte={13} />
            </span>
            <span>Klik een blok aan om het vast te zetten.</span>
          </p>
        ) : slotHint ? (
          <p className="flex items-start gap-2 text-sm leading-6 text-ink/70">
            <span className="mt-1 shrink-0 text-ink/45">
              <SlotIcoon dicht grootte={13} />
            </span>
            <span>{slotHint}</span>
          </p>
        ) : null}
        <span className="ml-auto flex items-center gap-3">
          <span className="text-xs font-semibold text-ink/40">
            {bewarenBezig ? "Bewaren…" : bewaarFout ? "Bewaren mislukt — probeer opnieuw" : null}
          </span>
          <button
            onClick={ongedaan}
            disabled={!geschiedenis.length}
            className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ongedaan maken
          </button>
          {/* Alleen zichtbaar als er voor deze week al iets bewaard is om
              terug te zetten. */}
          {overschrijving && (
            <button
              onClick={terugNaarBasis}
              disabled={terugzettenBezig}
              className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {terugzettenBezig ? "Bezig…" : "Terugzetten naar basis"}
            </button>
          )}
        </span>
      </div>

      {fout && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{fout}</p>
      )}

      {laden ? (
        <p className="rounded-3xl border border-black/5 bg-white px-6 py-8 text-ink/60 shadow-sm">
          Wordt geladen…
        </p>
      ) : (
        <>
          <Bewerkraster
            lessen={lessen}
            gekozenId={gekozen?.id ?? null}
            kies={kies}
            zetBlok={zetBlok}
            slotstand={slotstand}
            wisselSlot={wisselSlot}
            ruil={ruilBlokken}
            meldVast={(naam) =>
              setSlotHint(
                `${naam} staat vast op deze tijd. Klik op het slotje hierboven om het los te maken.`,
              )
            }
            kopieerDag={kopieerDag}
            nieuwOp={(weekdag, start, duur, x, y, kant) => {
              setGekozen(null);
              setToevoegen({ weekdag, start, duur, x, y, kant });
            }}
            voorbeeld={
              toevoegen
                ? { weekdag: toevoegen.weekdag, start: toevoegen.start, duur: toevoegen.duur }
                : null
            }
            dagInfo={dagInfo}
          />

          {gekozenBlok && gekozen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setGekozen(null)} />
              <Blokkaart
                key={gekozenBlok.id}
                blok={gekozenBlok}
                x={gekozen.x}
                y={gekozen.y}
                kant={gekozen.kant}
                beginEerder={() => wijzigBegin(gekozenBlok.id, -5)}
                beginLater={() => wijzigBegin(gekozenBlok.id, 5)}
                eindeEerder={() => wijzigEinde(gekozenBlok.id, -5)}
                eindeLater={() => wijzigEinde(gekozenBlok.id, 5)}
                zetOmschrijving={(tekst, overal) => zetOmschrijving(gekozenBlok.id, tekst, overal)}
                aantalZelfdeVak={zelfdeVak.length}
                overalGelijk={overalGelijk}
                lesLink={lesontwerpLink(gekozenBlok)}
                weghalen={() => verwijder(gekozenBlok.id)}
                sluit={() => setGekozen(null)}
              />
            </>
          )}

          {toevoegen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setToevoegen(null)} />
              <VakKiezer
                vakken={vakkenLijst}
                setup={concept?.setup ?? {}}
                x={toevoegen.x}
                y={toevoegen.y}
                kant={toevoegen.kant}
                kies={(vak, naam) =>
                  voegToe(toevoegen.weekdag, toevoegen.start, toevoegen.duur, vak, naam)
                }
                sluit={() => setToevoegen(null)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

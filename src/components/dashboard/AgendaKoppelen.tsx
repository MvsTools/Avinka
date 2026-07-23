"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { kort } from "@/lib/planning";
import type { AgendaBron } from "@/lib/planning";

// Het koppelen van je agenda's. Je mag er zoveel toevoegen als je wilt: bij de
// meeste scholen staat niet alles op één plek (schoolagenda bij Parro,
// vergaderingen in Outlook). Staat dezelfde afspraak in twee agenda's, dan
// tellen we hem één keer (zie src/lib/planning/dubbelingen.ts).

type Aanbieder = { id: string; naam: string; stappen: string[] };

const AANBIEDERS: Aanbieder[] = [
  {
    id: "parro",
    naam: "Parro",
    stappen: [
      "Ga naar talk.parro.com en log in",
      "Klik op Instellingen",
      "Klik op Agenda koppelen en daarna op Aan de slag",
      "Klik op de link om hem te kopiëren",
    ],
  },
  {
    id: "socialschools",
    naam: "Social Schools",
    stappen: [
      "Ga naar app.socialschools.eu en log in",
      "Open het tabblad Agenda",
      "Klik rechtsboven op Abonneren",
      "Klik op de link om hem te kopiëren",
    ],
  },
  {
    id: "outlook",
    naam: "Outlook of Teams",
    stappen: [
      "Open Outlook in de browser",
      "Ga naar Instellingen, dan Agenda, dan Gedeelde agenda's",
      "Kies je agenda onder Een agenda publiceren",
      "Kopieer de ICS-link",
    ],
  },
  {
    id: "google",
    naam: "Google Agenda",
    stappen: [
      "Open calendar.google.com op een computer",
      "Ga naar Instellingen en kies je agenda in de zijbalk",
      "Zoek Geheim adres in iCal-indeling",
      "Kopieer die link",
    ],
  },
];

type Telling = {
  soort: string;
  woord: string;
  aantal: number;
  slots?: number;
  weken?: number;
  vrij: boolean;
};
type Uitslag = {
  naam: string | null;
  aantal: number;
  blokken: number;
  van: string | null;
  tot: string | null;
  heleDagen: number;
  telling: Telling[];
};
/** "vandaag om 09:14" of "22 juli om 23:40" */
function wanneer(iso: string | null): string {
  if (!iso) return "nog niet opgehaald";
  const d = new Date(iso);
  const dag = d.toISOString().slice(0, 10);
  const tijd = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return dag === new Date().toISOString().slice(0, 10)
    ? `vandaag om ${tijd}`
    : `${kort(dag)} om ${tijd}`;
}

export default function AgendaKoppelen({ agendas }: { agendas: AgendaBron[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [bezig, setBezig] = useState(false);
  const [uitslag, setUitslag] = useState<Uitslag | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [modus, setModus] = useState<"alles" | "heledagen">("alles");
  const [opslaan, setOpslaan] = useState(false);
  const [druk, setDruk] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState<string | null>(null);
  const router = useRouter();

  // De agenda's komen van de server mee. Na koppelen, verversen of loskoppelen
  // moet het jaar opnieuw worden opgebouwd. Dat doen we met router.refresh():
  // die haalt de servergegevens opnieuw op zonder de pagina te herladen, dus je
  // blijft gewoon op dit scherm staan en ziet het bijgewerkte tijdstip
  // verschijnen. Een echte herlaad zou je terugzetten op het jaaroverzicht.
  const bronnen = agendas;

  async function controleer() {
    setBezig(true);
    setFout(null);
    setUitslag(null);
    try {
      const antwoord = await fetch("/api/agenda/controleer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link }),
      });
      const data = await antwoord.json();
      if (!antwoord.ok) setFout(data.fout || "Er ging iets mis.");
      else setUitslag(data);
    } catch {
      setFout("We konden de agenda niet bereiken. Probeer het zo nog eens.");
    } finally {
      setBezig(false);
    }
  }

  async function koppel(systeem: string, naam: string) {
    setOpslaan(true);
    setFout(null);
    try {
      const antwoord = await fetch("/api/agenda/bronnen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, systeem, naam: uitslag?.naam || naam, modus }),
      });
      const data = await antwoord.json().catch(() => ({}));
      if (!antwoord.ok) {
        setFout(data.fout || "Koppelen is niet gelukt.");
        return;
      }
      // Gelukt: het formulier leegmaken en de nieuwe agenda laten verschijnen.
      setLink("");
      setUitslag(null);
      setOpen(null);
      router.refresh();
    } catch {
      setFout("Koppelen is niet gelukt. Probeer het zo nog eens.");
    } finally {
      setOpslaan(false);
    }
  }

  async function ververs(id: string) {
    setDruk(id);
    await fetch("/api/agenda/ververs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
    setDruk(null);
    // Even een vinkje: als het tijdstip binnen dezelfde minuut valt zie je
    // anders helemaal niet dat er iets is gebeurd.
    setGelukt(id);
    setTimeout(() => setGelukt((h) => (h === id ? null : h)), 2500);
  }

  async function koppelLos(id: string) {
    setDruk(id);
    await fetch(`/api/agenda/bronnen?id=${id}`, { method: "DELETE" });
    router.refresh();
    setDruk(null);
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Eerst wat je al gekoppeld hebt, daarna pas hoe je er een toevoegt. */}
      {bronnen.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-ink">Je gekoppelde agenda&apos;s</h3>
          {bronnen.map((br, i) => (
            <div
              key={br.id}
              className={
                "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-white px-5 py-4 shadow-sm " +
                (br.laatste_fout ? "border-red-200" : "border-black/5")
              }
            >
              <span
                className={
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                  (br.laatste_fout ? "bg-red-50" : "bg-brand-soft")
                }
                aria-hidden
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={br.laatste_fout ? "#b91c1c" : "#25855a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {br.laatste_fout ? <path d="M12 8v5M12 17h.01" /> : <path d="M4 12.5l5 5 11-11" />}
                </svg>
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-bold text-ink">{br.naam}</span>
                  {i === 0 && bronnen.length > 1 && (
                    <span className="rounded-lg bg-cream px-2 py-0.5 text-xs font-bold text-ink/55">
                      hoofdagenda
                    </span>
                  )}
                </span>
                <span className="block text-sm text-ink/60">
                  {br.laatste_fout ? (
                    <span className="text-red-700">{br.laatste_fout}</span>
                  ) : (
                    <>
                      {br.aantal_items} afspraken, bijgewerkt {wanneer(br.laatst_gelukt)}
                      {br.modus === "heledagen" ? ", alleen hele dagen" : ""}
                    </>
                  )}
                </span>
              </span>
              <span className="ml-auto flex gap-2">
                <button
                  onClick={() => ververs(br.id)}
                  disabled={druk === br.id}
                  className={
                    "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors duration-200 active:scale-[0.97] disabled:opacity-50 " +
                    (gelukt === br.id
                      ? "border-brand/30 bg-brand-soft text-brand-dark"
                      : "border-black/10 text-ink/70 hover:text-ink")
                  }
                >
                  {gelukt === br.id && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 12.5l5 5 11-11" />
                    </svg>
                  )}
                  {druk === br.id ? "Bezig…" : gelukt === br.id ? "Bijgewerkt" : "Ververs"}
                </button>
                <button
                  onClick={() => koppelLos(br.id)}
                  disabled={druk === br.id}
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink/50 transition-colors hover:text-red-700 disabled:opacity-50"
                >
                  Loskoppelen
                </button>
              </span>
            </div>
          ))}
          {bronnen.length > 1 && (
            <p className="text-sm text-ink/55">
              Staat dezelfde afspraak in meer dan één agenda, dan zie je hem één keer. De
              hoofdagenda is de agenda die je als eerste koppelde.
            </p>
          )}
        </div>
      )}

      {/* Het kopje hoort bij de lijst eronder, dus die twee staan dicht op
          elkaar. Heb je al gekoppeld, dan is de hele uitleg overbodig: dan
          volstaat een kopje. Voor wie nog niets heeft blijft het verhaal staan. */}
      <div className="flex flex-col gap-3">
        {bronnen.length > 0 ? (
          <h3 className="text-lg font-bold text-ink">Nog een agenda koppelen?</h3>
        ) : (
          <div className="mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              Koppel de agenda van je school
            </h2>
            <p className="mt-1.5 max-w-xl leading-7 text-ink/70">
              Plak één link en je hele schooljaar staat er. Studiedagen, rapporten, gesprekken. Je
              mag er zoveel toevoegen als je wilt, want bij de meeste scholen staat niet alles op
              één plek.
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        {AANBIEDERS.map((b, i) => {
          const uit = open === b.id;
          return (
            <div key={b.id} className={i > 0 ? "border-t border-black/5" : ""}>
              <button
                onClick={() => {
                  setOpen(uit ? null : b.id);
                  setUitslag(null);
                  setFout(null);
                }}
                aria-expanded={uit}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-cream/60"
              >
                <span
                  className={
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors " +
                    (uit ? "bg-brand-soft" : "bg-cream")
                  }
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25855a" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                    <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 font-bold text-ink">{b.naam}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={"shrink-0 text-ink/30 transition-transform duration-200 " + (uit ? "rotate-90" : "")}
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Openklappen zonder springen: grid-rows van 0 naar 1 */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: uit ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 sm:pl-20">
                    <ol className="flex flex-col gap-1.5 text-sm text-ink/70">
                      {b.stappen.map((s, n) => (
                        <li key={n} className="flex gap-2.5">
                          <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-bold text-ink/50">
                            {n + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ol>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <input
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !bezig && controleer()}
                        className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream/50 px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink/35 focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,158,110,0.18)]"
                        placeholder="Plak hier je link"
                        aria-label={`Agendalink van ${b.naam}`}
                      />
                      <button
                        onClick={controleer}
                        disabled={bezig || !link.trim()}
                        className="rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
                      >
                        {bezig ? "Even kijken…" : "Controleren"}
                      </button>
                    </div>

                    {fout && (
                      <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        {fout}
                      </p>
                    )}

                    {uitslag && (
                      <div className="mt-4 rounded-2xl bg-brand-soft/70 px-4 py-4">
                        <p className="font-bold text-ink">
                          Gelukt. {uitslag.aantal} afspraken gevonden
                          {uitslag.van && uitslag.tot
                            ? `, van ${kort(uitslag.van)} ${uitslag.van.slice(0, 4)} tot ${kort(uitslag.tot)} ${uitslag.tot.slice(0, 4)}`
                            : ""}
                          .
                        </p>
                        <p className="mt-2.5 text-sm text-ink/75">
                          <strong className="font-bold text-ink">Alles komt in je agenda.</strong>{" "}
                          Van een deel weet ik ook wát het is, en daar doe ik dan iets mee:
                        </p>
                        <ul className="mt-2 flex flex-col gap-1 text-sm text-ink/75">
                          {uitslag.telling
                            .filter((t) => t.soort !== "overig")
                            .map((t) => (
                              <li key={t.soort}>
                                <strong className="font-bold text-ink">{t.aantal}</strong> {t.woord}
                                {t.slots
                                  ? ` (${t.slots} losse tijdvakken${t.weken ? ` in ${t.weken} weken` : ""}, per dag samengevouwen)`
                                  : ""}
                                {t.vrij ? ", daar plan ik geen les op" : ""}
                              </li>
                            ))}
                        </ul>
                        {uitslag.telling.some((t) => t.soort === "overig") && (
                          <p className="mt-2.5 text-sm text-ink/75">
                            De overige{" "}
                            <strong className="font-bold text-ink">
                              {uitslag.telling.find((t) => t.soort === "overig")?.aantal}
                            </strong>{" "}
                            afspraken krijgen geen etiket van mij. Die staan er gewoon in, precies
                            zoals je school ze heeft opgeschreven.
                          </p>
                        )}

                        <p className="mt-3 text-sm font-semibold text-ink/70">
                          Wat wil je hiervan overnemen?
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(
                            [
                              ["alles", `Alles (${uitslag.aantal})`],
                              ["heledagen", `Alleen hele dagen (${uitslag.heleDagen})`],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              onClick={() => setModus(id)}
                              className={
                                "rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-transform duration-150 active:scale-[0.97] " +
                                (modus === id
                                  ? "bg-brand-dark text-white"
                                  : "border border-black/10 bg-white text-ink/70")
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-ink/50">
                          Kies je hele dagen, dan haal je alleen de vrije dagen en vakanties op.
                          Handig voor je persoonlijke agenda, waar ook je tandarts in staat.
                        </p>

                        <button
                          onClick={() => koppel(b.id, b.naam)}
                          disabled={opslaan}
                          className="mt-4 w-full rounded-xl bg-brand-dark px-4 py-3 font-bold text-white transition-transform duration-150 active:scale-[0.99] disabled:opacity-60"
                        >
                          {opslaan ? "Bezig met koppelen…" : "Koppel deze agenda aan Avinka"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <p className="max-w-xl text-sm leading-6 text-ink/55">
        Zo&apos;n link is een sleutel tot jouw agenda. Hij staat versleuteld in je eigen account,
        alleen jij kunt erbij, en je kunt hem met één klik intrekken. Namen van kinderen worden
        afgeschermd voordat er iets wordt bewaard.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  getKlassen,
  getDuoKoppels,
  getKlasCollegas,
  getGedeeldeMap,
  maakDuoUitnodiging,
  bekijkDuoUitnodiging,
  accepteerDuoUitnodiging,
  verbreekDuo,
  zetDuoRol,
  zetGedeeldeMap,
  getBestanden,
  addMap,
  type Klas,
  type DuoKoppel,
  type DuoRol,
  type DuoUitnodiging,
  type KlasCollega,
  type Bestand,
} from "@/lib/db";
import { meldVoorkeurenGewijzigd } from "@/lib/voorkeuren-verversen";

// Collega's bij deze groep: samen één klas draaien. Was eerst alleen voor een
// duobaan (twee leerkrachten), maar er kunnen er meer bij — een assistent
// bijvoorbeeld. Daarom is dit scherm per GROEP opgebouwd en niet per koppel.
//
// Uitnodigen werkt via een deelbare code/link, en pas ná expliciete acceptatie
// door de ander gaat de toegang open — dat opent gedeelde rapporten en
// bestanden, dus nooit stilzwijgend.

// Naam voor de gedeelde map. Klassen heten bij de een "7" en bij de ander
// "groep 7"; blind "Groep " ervoor plakken gaf dan "Groep groep 7". Staat het
// woord er al, dan gebruiken we de klasnaam zoals hij is (met een hoofdletter).
function gedeeldeMapNaam(klasNaam: string): string {
  const naam = klasNaam.trim();
  if (!naam) return "Gedeelde map";
  if (/^groep\b/i.test(naam)) return naam.charAt(0).toUpperCase() + naam.slice(1);
  return `Groep ${naam}`;
}

const ROL_TEKST: Record<DuoRol, string> = {
  volledig: "Volledig",
  meekijken: "Meekijken (leest mee)",
};

export default function DuoCollega() {
  const router = useRouter();
  const pathname = usePathname();
  const zoekParams = useSearchParams();

  const [klassen, setKlassen] = useState<Klas[]>([]);
  const [koppels, setKoppels] = useState<DuoKoppel[]>([]);
  const [bestanden, setBestanden] = useState<Bestand[]>([]);
  const [leden, setLeden] = useState<Record<string, KlasCollega[]>>({});
  const [mappen, setMappen] = useState<Record<string, { id: string; naam: string } | null>>({});
  const [laden, setLaden] = useState(true);
  const [mapKiezerVoor, setMapKiezerVoor] = useState<string | null>(null);
  const [mapBezig, setMapBezig] = useState(false);

  const [gekozenKlas, setGekozenKlas] = useState("");
  const [gekozenRol, setGekozenRol] = useState<DuoRol>("volledig");
  const [nieuweLink, setNieuweLink] = useState("");
  const [gekopieerd, setGekopieerd] = useState(false);
  const [uitnodigenBezig, setUitnodigenBezig] = useState(false);
  const [uitnodigenFout, setUitnodigenFout] = useState(false);

  const uitnodigingsCode = zoekParams.get("duo");
  const [voorbeeld, setVoorbeeld] = useState<
    DuoUitnodiging | null | "laden" | "fout"
  >(uitnodigingsCode ? "laden" : null);
  const [accepterenBezig, setAccepterenBezig] = useState(false);
  const [handmatigeCode, setHandmatigeCode] = useState("");

  async function laadAlles() {
    const [k, d, b] = await Promise.all([getKlassen(), getDuoKoppels(), getBestanden()]);
    setKlassen(k);
    setKoppels(d);
    setBestanden(b);
    setLaden(false);

    // Per gedeelde groep: wie hoort erbij (naam + mailadres, uit auth.users via
    // een security-definer functie) en welke map jullie delen.
    const klasIds = [...new Set(d.filter((x) => x.status === "actief").map((x) => x.klasId))];
    const [alleLeden, alleMappen] = await Promise.all([
      Promise.all(klasIds.map((id) => getKlasCollegas(id))),
      Promise.all(klasIds.map((id) => getGedeeldeMap(id))),
    ]);
    const l: Record<string, KlasCollega[]> = {};
    const m: Record<string, { id: string; naam: string } | null> = {};
    klasIds.forEach((id, i) => {
      l[id] = alleLeden[i];
      m[id] = alleMappen[i];
    });
    setLeden(l);
    setMappen(m);
  }

  useEffect(() => {
    (async () => {
      await laadAlles();
    })();
  }, []);

  useEffect(() => {
    if (!uitnodigingsCode) return;
    bekijkDuoUitnodiging(uitnodigingsCode).then((v) => setVoorbeeld(v ?? "fout"));
  }, [uitnodigingsCode]);

  // Escape sluit de pop-up, net als "Later". Niet tijdens het accepteren: dan
  // loopt er een verzoek en zou je het scherm kwijtraken zonder de uitkomst.
  useEffect(() => {
    if (!uitnodigingsCode || !voorbeeld || accepterenBezig) return;
    function bijToets(e: KeyboardEvent) {
      if (e.key === "Escape") verwijderDuoParam();
    }
    window.addEventListener("keydown", bijToets);
    return () => window.removeEventListener("keydown", bijToets);
  });

  function verwijderDuoParam() {
    const params = new URLSearchParams(zoekParams.toString());
    params.delete("duo");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  // Een met de hand ingevulde code zetten we in de link, zodat hij daarna
  // exact dezelfde weg aflegt als een code uit een uitnodigingslink.
  function bekijkCode(code: string) {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const params = new URLSearchParams(zoekParams.toString());
    params.set("duo", c);
    router.replace(`${pathname}?${params.toString()}`);
  }

  async function accepteer() {
    if (!uitnodigingsCode) return;
    setAccepterenBezig(true);
    const ok = await accepteerDuoUitnodiging(uitnodigingsCode);
    setAccepterenBezig(false);
    if (ok) {
      setVoorbeeld(null);
      verwijderDuoParam();
      laadAlles();
      // Accepteren vult school en groep in (zie duo_koppel_accepteren). Het
      // formulier daaronder heeft zijn waarden al geladen en zou anders leeg
      // blijven staan terwijl ze wél gevuld zijn.
      meldVoorkeurenGewijzigd();
    } else {
      setVoorbeeld("fout");
    }
  }

  async function nodigUit() {
    if (!gekozenKlas) return;
    setUitnodigenBezig(true);
    setUitnodigenFout(false);
    const code = await maakDuoUitnodiging(gekozenKlas, gekozenRol);
    setUitnodigenBezig(false);
    if (code) {
      setNieuweLink(`${window.location.origin}/dashboard/instellingen?duo=${code}`);
      laadAlles();
    } else {
      setUitnodigenFout(true);
    }
  }

  async function kopieer(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      /* niets */
    }
  }

  async function loskoppelen(koppel: DuoKoppel) {
    const wie = koppel.status === "actief" ? "Deze collega loskoppelen?" : "Uitnodiging intrekken?";
    if (!confirm(`${wie} Gedeelde toegang stopt meteen.`)) return;
    if (await verbreekDuo(koppel.id)) laadAlles();
  }

  async function wisselRol(koppel: DuoKoppel) {
    const nieuw: DuoRol = koppel.rol === "volledig" ? "meekijken" : "volledig";
    if (await zetDuoRol(koppel.id, nieuw)) laadAlles();
  }

  async function kiesGedeeldeMap(klasId: string, mapId: string) {
    setMapBezig(true);
    const ok = await zetGedeeldeMap(klasId, mapId);
    setMapBezig(false);
    if (ok) {
      setMapKiezerVoor(null);
      laadAlles();
    }
  }

  async function nieuweGedeeldeMap(klasId: string, klasNaam: string) {
    setMapBezig(true);
    const map = await addMap(gedeeldeMapNaam(klasNaam), null);
    if (map) await zetGedeeldeMap(klasId, map.id);
    setMapBezig(false);
    setMapKiezerVoor(null);
    laadAlles();
  }

  const topMappen = bestanden.filter((b) => b.type === "map" && !b.parent_id);
  const klasNaamVan = (id: string) => klassen.find((k) => k.id === id)?.naam ?? "";

  // Alles wat je deelt, gegroepeerd per groep: de actieve collega's plus de
  // uitnodigingen die nog open staan.
  const groepen = [...new Set(koppels.map((k) => k.klasId))].map((klasId) => ({
    klasId,
    klasNaam: koppels.find((k) => k.klasId === klasId)?.klasNaam || klasNaamVan(klasId),
    actief: koppels.filter((k) => k.klasId === klasId && k.status === "actief"),
    open: koppels.filter((k) => k.klasId === klasId && k.status === "uitgenodigd"),
  }));

  return (
    /* scroll-mt: de tip op Start linkt naar #collegas, en dan moet de kop niet
       onder de vaste balk verdwijnen. */
    <div
      id="collegas"
      className="scroll-mt-24 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7"
    >
      <h2 className="text-lg font-bold text-ink">Collega&apos;s bij deze groep</h2>
      <p className="mt-2 text-sm text-ink/65">
        Draai je samen een groep? Koppel je duo-partner of een onderwijsassistent: jullie
        delen dan de klas, een gezamenlijke takenlijst, een gedeelde map en de overdracht.
        Bijzondere persoonsgegevens (medisch, gezinssituatie, diagnoses) horen hier nooit in.
      </p>

      {/* ── Code met de hand invullen ── */}
      {/* Vangnet: de link kan onderweg sneuvelen (doorgestuurd, afgekapt in een
          bericht, of geopend in een andere browser dan waarin je bent ingelogd).
          Met de code alleen kom je er ook. */}
      {!uitnodigingsCode && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="duo-code" className="text-sm text-ink/65">
            Code gekregen?
          </label>
          <input
            id="duo-code"
            value={handmatigeCode}
            onChange={(e) => setHandmatigeCode(e.target.value.toUpperCase())}
            placeholder="ABC23XY"
            maxLength={7}
            className="w-32 rounded-xl border border-black/10 bg-cream px-3 py-2 text-sm font-semibold tracking-widest text-ink outline-none focus:border-brand"
          />
          <button
            type="button"
            disabled={handmatigeCode.trim().length < 7}
            onClick={() => bekijkCode(handmatigeCode)}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 disabled:opacity-40"
          >
            Bekijken
          </button>
        </div>
      )}

      {/* ── Uitnodiging accepteren (via ?duo=code) ──────────────────────────
         Als pop-up en niet als kaartje in de pagina: wie via een uitnodiging
         een account aanmaakt, landt hier en moest anders eerst langs het hele
         instellingenscherm naar beneden scrollen om te vinden waarvoor hij
         kwam. De velden School en Groep staan er wél achter, zodat je ze ziet
         invullen zodra je accepteert. */}
      {uitnodigingsCode && voorbeeld && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="duo-uitnodiging-kop"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
            {voorbeeld === "laden" && (
              <p className="text-ink/70">Uitnodiging laden…</p>
            )}

            {voorbeeld === "fout" && (
              <>
                <h2 id="duo-uitnodiging-kop" className="font-serif text-2xl font-semibold text-ink">
                  Deze uitnodiging werkt niet meer
                </h2>
                <p className="mt-3 leading-7 text-ink/75">
                  Misschien is hij al geaccepteerd of ingetrokken. Vraag je collega om een
                  nieuwe link.
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={verwijderDuoParam}
                    className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-black/20"
                  >
                    Sluiten
                  </button>
                </div>
              </>
            )}

            {typeof voorbeeld === "object" && voorbeeld !== null && (
              <>
                <h2 id="duo-uitnodiging-kop" className="font-serif text-2xl font-semibold text-ink">
                  {voorbeeld.uitnodigerVoornaam || "Een collega"} nodigt je uit
                </h2>
                <p className="mt-3 leading-7 text-ink/75">
                  Om <strong className="font-semibold text-ink">{voorbeeld.klasNaam}</strong> samen
                  te draaien. Jullie delen dan de rapporten, bestanden, taken en de overdracht
                  van die groep.
                </p>

                {/* Alleen tonen als er echt iets over te nemen valt: heeft de
                   uitnodiger zelf niets ingevuld, dan is deze belofte leeg. */}
                {(voorbeeld.schoolnaam || voorbeeld.standaardgroep) && (
                  <div className="mt-4 rounded-2xl bg-brand-soft px-4 py-3">
                    <p className="text-sm font-bold text-ink/80">
                      We vullen dan ook vast voor je in:
                    </p>
                    <p className="mt-1 text-sm text-ink/70">
                      {[voorbeeld.schoolnaam, voorbeeld.standaardgroep]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={verwijderDuoParam}
                    className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-black/20"
                  >
                    Later
                  </button>
                  <button
                    onClick={accepteer}
                    disabled={accepterenBezig}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {accepterenBezig ? "Bezig…" : "Accepteren"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Per groep: wie hoort erbij ── */}
      {!laden && groepen.length > 0 && (
        <div className="mt-5 flex flex-col gap-4 border-t border-black/5 pt-5">
          {groepen.map((g) => (
            <div key={g.klasId}>
              <p className="text-sm font-bold text-ink">{g.klasNaam}</p>

              <ul className="mt-2 divide-y divide-black/5">
                {(leden[g.klasId] ?? []).map((lid) => {
                  // De koppel-rij hoort bij een collega, niet bij de eigenaar:
                  // daarmee kun je zijn rol wijzigen of hem loskoppelen.
                  const koppel = g.actief.find((k) => k.partnerId === lid.userId);
                  return (
                    <li
                      key={lid.userId}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-ink">
                          <strong className="font-semibold">{lid.voornaam || "Collega"}</strong>
                          {lid.isEigenaar && (
                            <span className="ml-2 text-xs text-ink/45">eigenaar van de groep</span>
                          )}
                        </p>
                        <a
                          href={`mailto:${lid.email}`}
                          className="break-all text-xs text-brand hover:underline"
                        >
                          {lid.email}
                        </a>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-ink/60">
                          {ROL_TEKST[lid.rol]}
                        </span>
                        {koppel && (
                          <>
                            <button
                              onClick={() => wisselRol(koppel)}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand-soft"
                            >
                              Rol wijzigen
                            </button>
                            <button
                              onClick={() => loskoppelen(koppel)}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-ink/50 transition hover:text-red-600"
                            >
                              Loskoppelen
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}

                {g.open.map((k) => (
                  <li
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink/70">
                        {k.benIkUitnodiger ? "Uitnodiging verstuurd" : "Uitnodiging ontvangen"}
                        <span className="ml-2 font-mono text-xs tracking-widest text-ink/45">
                          {k.code}
                        </span>
                      </p>
                      <p className="text-xs text-ink/45">
                        Wacht op acceptatie · {ROL_TEKST[k.rol]}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {k.benIkUitnodiger && k.code && (
                        <button
                          onClick={() =>
                            kopieer(
                              `${window.location.origin}/dashboard/instellingen?duo=${k.code}`,
                            )
                          }
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand-soft"
                        >
                          {gekopieerd ? "✓ Gekopieerd" : "Link kopiëren"}
                        </button>
                      )}
                      <button
                        onClick={() => loskoppelen(k)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-ink/50 transition hover:text-red-600"
                      >
                        Intrekken
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {g.actief.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-ink/55">
                    Gedeelde map:{" "}
                    <strong className="text-ink">
                      {mappen[g.klasId]?.naam ?? "nog niet gekozen"}
                    </strong>
                  </span>
                  <button
                    onClick={() =>
                      setMapKiezerVoor(mapKiezerVoor === g.klasId ? null : g.klasId)
                    }
                    className="font-semibold text-brand hover:underline"
                  >
                    {mappen[g.klasId] ? "Wijzigen" : "Map kiezen"}
                  </button>
                </div>
              )}

              {mapKiezerVoor === g.klasId && (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl bg-cream/60 p-3">
                  {topMappen.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={mapBezig}
                      onClick={() => kiesGedeeldeMap(g.klasId, m.id)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-black/20 disabled:opacity-50"
                    >
                      📁 {m.naam || "Naamloze map"}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={mapBezig}
                    onClick={() => nieuweGedeeldeMap(g.klasId, g.klasNaam)}
                    className="rounded-lg border border-dashed border-black/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-brand hover:text-brand disabled:opacity-50"
                  >
                    + Nieuwe map &quot;{gedeeldeMapNaam(g.klasNaam)}&quot;
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Nieuwe uitnodiging maken ── */}
      <div className="mt-5 border-t border-black/5 pt-5">
        <p className="text-sm font-bold text-ink">Collega uitnodigen</p>
        {klassen.length === 0 ? (
          <p className="mt-2 text-sm text-ink/55">Maak eerst een klas aan.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {klassen.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setGekozenKlas(k.id)}
                  className={
                    "rounded-xl border px-4 py-2.5 text-sm font-semibold transition " +
                    (gekozenKlas === k.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-black/10 text-ink/70 hover:border-black/20")
                  }
                >
                  {k.naam}
                </button>
              ))}
            </div>

            {/* Rol: bepaalt of iemand rapporten mag VASTLEGGEN. Lezen mag
                sinds 4-8 allebei; het verschil zit in het schrijven en in het
                aanpassen van de klassenlijst. Bewust een keuze vooraf en niet
                iets wat je achteraf moet ontdekken. */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(["volledig", "meekijken"] as DuoRol[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setGekozenRol(r)}
                  className={
                    "rounded-xl border px-4 py-2 text-sm font-semibold transition " +
                    (gekozenRol === r
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-black/10 text-ink/60 hover:border-black/20")
                  }
                >
                  {ROL_TEKST[r]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink/50">
              {gekozenRol === "volledig"
                ? "Ziet en bewerkt alles van deze groep, inclusief de rapporten en de klassenlijst."
                : "Werkt mee aan de takenlijst, de gedeelde map en de overdracht, en leest de rapporten mee. Schrijft ze niet en past de klassenlijst niet aan."}
            </p>

            <button
              onClick={nodigUit}
              disabled={!gekozenKlas || uitnodigenBezig}
              className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
            >
              {uitnodigenBezig
                ? "Bezig…"
                : `Maak uitnodigingslink${gekozenKlas ? ` voor ${klasNaamVan(gekozenKlas)}` : ""}`}
            </button>

            {uitnodigenFout && (
              <p className="mt-3 text-sm text-red-600">
                Het maken van de link lukte niet. Probeer het zo nog eens.
              </p>
            )}

            {nieuweLink && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={nieuweLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-ink outline-none"
                />
                <button
                  onClick={() => kopieer(nieuweLink)}
                  className="shrink-0 rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-ink/70 transition hover:border-black/20"
                >
                  {gekopieerd ? "✓ Gekopieerd" : "Kopieer link"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

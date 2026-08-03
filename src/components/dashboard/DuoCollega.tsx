"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  getKlassen,
  getDuoKoppels,
  maakDuoUitnodiging,
  bekijkDuoUitnodiging,
  accepteerDuoUitnodiging,
  verbreekDuo,
  zetGedeeldeMap,
  getBestanden,
  addMap,
  type Klas,
  type DuoKoppel,
  type Bestand,
} from "@/lib/db";

// Duo-collega's: samen dezelfde klas draaien. Uitnodigen werkt via een
// deelbare code/link (zelfde principe als de "nodig collega's uit"-link),
// maar hier pas actief ná expliciete acceptatie door de ander — dat opent
// namelijk toegang tot gedeelde rapporten/bestanden/taken, dus nooit stilzwijgend.
export default function DuoCollega() {
  const router = useRouter();
  const pathname = usePathname();
  const zoekParams = useSearchParams();

  const [klassen, setKlassen] = useState<Klas[]>([]);
  const [koppels, setKoppels] = useState<DuoKoppel[]>([]);
  const [bestanden, setBestanden] = useState<Bestand[]>([]);
  const [laden, setLaden] = useState(true);
  const [mapKiezerVoor, setMapKiezerVoor] = useState<string | null>(null);
  const [mapBezig, setMapBezig] = useState(false);

  const [gekozenKlas, setGekozenKlas] = useState("");
  const [nieuweLink, setNieuweLink] = useState("");
  const [gekopieerd, setGekopieerd] = useState(false);
  const [uitnodigenBezig, setUitnodigenBezig] = useState(false);
  const [uitnodigenFout, setUitnodigenFout] = useState(false);

  const uitnodigingsCode = zoekParams.get("duo");
  const [voorbeeld, setVoorbeeld] = useState<
    { klasNaam: string; status: string } | null | "laden" | "fout"
  >(uitnodigingsCode ? "laden" : null);
  const [accepterenBezig, setAccepterenBezig] = useState(false);

  async function laadAlles() {
    const [k, d, b] = await Promise.all([getKlassen(), getDuoKoppels(), getBestanden()]);
    setKlassen(k);
    setKoppels(d);
    setBestanden(b);
    setLaden(false);
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

  function verwijderDuoParam() {
    const params = new URLSearchParams(zoekParams.toString());
    params.delete("duo");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
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
    } else {
      setVoorbeeld("fout");
    }
  }

  async function nodigUit() {
    if (!gekozenKlas) return;
    setUitnodigenBezig(true);
    setUitnodigenFout(false);
    const code = await maakDuoUitnodiging(gekozenKlas);
    setUitnodigenBezig(false);
    if (code) {
      setNieuweLink(`${window.location.origin}/dashboard/instellingen?duo=${code}`);
      laadAlles();
    } else {
      setUitnodigenFout(true);
    }
  }

  async function kopieer() {
    if (!nieuweLink) return;
    try {
      await navigator.clipboard.writeText(nieuweLink);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      /* niets */
    }
  }

  async function loskoppelen(id: string) {
    if (!confirm("Duo-koppeling verbreken? Gedeelde toegang stopt meteen voor jullie allebei.")) {
      return;
    }
    const ok = await verbreekDuo(id);
    if (ok) laadAlles();
  }

  async function kiesGedeeldeMap(koppelId: string, mapId: string) {
    setMapBezig(true);
    const ok = await zetGedeeldeMap(koppelId, mapId);
    setMapBezig(false);
    if (ok) {
      setMapKiezerVoor(null);
      laadAlles();
    }
  }

  async function nieuweGedeeldeMap(koppel: DuoKoppel) {
    setMapBezig(true);
    const map = await addMap(`Groep ${koppel.klasNaam}`.trim(), null);
    if (map) await zetGedeeldeMap(koppel.id, map.id);
    setMapBezig(false);
    setMapKiezerVoor(null);
    laadAlles();
  }

  const topMappen = bestanden.filter((b) => b.type === "map" && !b.parent_id);

  const klasNaam = (id: string) => klassen.find((k) => k.id === id)?.naam ?? "";

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-ink">Duo-collega</h2>
      <p className="mt-2 text-sm text-ink/65">
        Deel een klas met je duo-partner: samen rapporten bewerken, lesontwerpen en
        werkbladen inzien, een gezamenlijke takenlijst en een overdracht voor elkaar.
        Bijzondere persoonsgegevens (medisch, gezinssituatie, diagnoses) horen hier
        nooit in.
      </p>

      {/* ── Uitnodiging accepteren (via ?duo=code) ── */}
      {uitnodigingsCode && voorbeeld && (
        <div className="mt-5 rounded-2xl border border-brand/30 bg-brand-soft p-5">
          {voorbeeld === "laden" && (
            <p className="text-sm text-ink/70">Uitnodiging laden…</p>
          )}
          {voorbeeld === "fout" && (
            <>
              <p className="text-sm font-semibold text-ink">
                Deze uitnodiging is niet (meer) geldig.
              </p>
              <p className="mt-1 text-sm text-ink/65">
                Misschien is hij al geaccepteerd of ingetrokken. Vraag je collega om een
                nieuwe link.
              </p>
              <button
                onClick={verwijderDuoParam}
                className="mt-3 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 hover:border-black/20"
              >
                Sluiten
              </button>
            </>
          )}
          {voorbeeld !== "laden" && voorbeeld !== "fout" && (
            <>
              <p className="text-sm font-semibold text-ink">
                Je bent uitgenodigd om <strong>{voorbeeld.klasNaam}</strong> samen te
                draaien als duo-collega&apos;s.
              </p>
              <p className="mt-1 text-sm text-ink/65">
                Na accepteren kunnen jullie elkaars rapporten, lesontwerpen, werkbladen,
                takenlijst en overdracht voor deze klas zien en bewerken.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={accepteer}
                  disabled={accepterenBezig}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {accepterenBezig ? "Bezig…" : "Accepteren"}
                </button>
                <button
                  onClick={verwijderDuoParam}
                  className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 hover:border-black/20"
                >
                  Niet nu
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bestaande koppels ── */}
      {!laden && koppels.length > 0 && (
        <div className="mt-5 divide-y divide-black/5 border-t border-black/5">
          {koppels.map((k) => (
            <div key={k.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{k.klasNaam}</p>
                  <p className="text-xs text-ink/55">
                    {k.status === "actief"
                      ? "Actief gekoppeld"
                      : k.benIkUitnodiger
                        ? "Wacht op acceptatie door je collega"
                        : "Uitnodiging ontvangen"}
                  </p>
                </div>
                <button
                  onClick={() => loskoppelen(k.id)}
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-red-200 hover:text-red-600"
                >
                  {k.status === "actief" ? "Loskoppelen" : "Intrekken"}
                </button>
              </div>

              {k.status === "actief" && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-ink/55">
                    Gedeelde map:{" "}
                    <strong className="text-ink">{k.gedeeldeMapNaam ?? "nog niet gekozen"}</strong>
                  </span>
                  <button
                    onClick={() => setMapKiezerVoor(mapKiezerVoor === k.id ? null : k.id)}
                    className="font-semibold text-brand hover:underline"
                  >
                    {k.gedeeldeMapId ? "Wijzigen" : "Map kiezen"}
                  </button>
                </div>
              )}

              {mapKiezerVoor === k.id && (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl bg-cream/60 p-3">
                  {topMappen.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={mapBezig}
                      onClick={() => kiesGedeeldeMap(k.id, m.id)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-black/20 disabled:opacity-50"
                    >
                      📁 {m.naam || "Naamloze map"}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={mapBezig}
                    onClick={() => nieuweGedeeldeMap(k)}
                    className="rounded-lg border border-dashed border-black/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-brand hover:text-brand disabled:opacity-50"
                  >
                    + Nieuwe map &quot;Groep {k.klasNaam}&quot;
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Nieuwe uitnodiging maken ── */}
      <div className="mt-5 border-t border-black/5 pt-5">
        <p className="text-sm font-bold text-ink">Nieuwe duo-collega uitnodigen</p>
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
            <button
              onClick={nodigUit}
              disabled={!gekozenKlas || uitnodigenBezig}
              className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
            >
              {uitnodigenBezig ? "Bezig…" : `Maak uitnodigingslink${gekozenKlas ? ` voor ${klasNaam(gekozenKlas)}` : ""}`}
            </button>

            {uitnodigenFout && (
              <p className="mt-3 text-sm text-red-600">
                Het maken van de link lukte niet. Probeer het zo nog eens, of trek de bestaande
                uitnodiging hierboven eerst in.
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
                  onClick={kopieer}
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

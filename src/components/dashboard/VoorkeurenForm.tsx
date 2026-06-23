"use client";

import { useEffect, useState } from "react";
import { getVoorkeuren, saveVoorkeuren, type Voorkeuren } from "@/lib/db";

// Voorkeuren staan in je eigen account (Supabase, per user-id afgeschermd).
// BEWUST geen localStorage-import meer: die data is apparaat-gebonden en lekte
// tussen accounts op dezelfde browser. De oude sleutel wordt opgeruimd.
const OUD_KEY = "avinka_voorkeuren";

const tonen = [
  { waarde: "warm", label: "Warm & persoonlijk" },
  { waarde: "neutraal", label: "Neutraal" },
  { waarde: "zakelijk", label: "Kort & zakelijk" },
];
const taalniveaus = [
  { waarde: "standaard", label: "Standaard" },
  { waarde: "a2", label: "Eenvoudig (A2)" },
  { waarde: "b1", label: "Toegankelijk (B1)" },
];
const lengtes = [
  { waarde: "kort", label: "Kort" },
  { waarde: "gemiddeld", label: "Gemiddeld" },
  { waarde: "uitgebreid", label: "Uitgebreid" },
];
const aanspreekvormen = [
  { waarde: "je", label: "Je / jullie" },
  { waarde: "u", label: "U" },
];

// Eén keuzerij met knoppen, zoals de toon-knoppen. waarde/zet werken op het
// veld in de Voorkeuren-state.
function KeuzeRij({
  titel,
  hint,
  opties,
  waarde,
  zet,
}: {
  titel: string;
  hint?: string;
  opties: { waarde: string; label: string }[];
  waarde: string;
  zet: (w: string) => void;
}) {
  return (
    <div className="mt-5">
      <span className="block text-sm font-bold text-ink">
        {titel}
        {hint && <span className="font-normal text-ink/50"> {hint}</span>}
      </span>
      <div className="mt-2 flex flex-wrap gap-2">
        {opties.map((o) => (
          <button
            key={o.waarde}
            type="button"
            onClick={() => zet(o.waarde)}
            className={
              "rounded-xl border px-4 py-2.5 text-sm font-semibold transition " +
              (waarde === o.waarde
                ? "border-brand bg-brand-soft text-brand"
                : "border-black/10 text-ink/70 hover:border-black/20")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VoorkeurenForm() {
  const [v, setV] = useState<Voorkeuren>({
    schoolnaam: "",
    standaardgroep: "",
    toon: "warm",
    taalniveau: "standaard",
    lengte: "gemiddeld",
    aanspreekvorm: "je",
  });
  const [geladen, setGeladen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getVoorkeuren();
      if (db) setV(db);
      // Oude apparaat-brede sleutel opruimen (kon schoolnaam e.d. bevatten).
      try {
        localStorage.removeItem(OUD_KEY);
      } catch {
        /* geen opslag */
      }
      setGeladen(true);
    })();
  }, []);

  async function bewaar() {
    setBezig(true);
    const ok = await saveVoorkeuren(v);
    setBezig(false);
    if (ok) {
      setOpgeslagen(true);
      setTimeout(() => setOpgeslagen(false), 2500);
    }
  }

  if (!geladen) return null;

  return (
    <>
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-ink">Schoolgegevens</h2>
      <p className="mt-1 text-sm text-ink/55">
        Deze gebruiken de tools in je brieven en berichten.
      </p>

      <div className="mt-5">
        <label htmlFor="schoolnaam" className="block text-sm font-bold text-ink">
          Naam van je school <span className="font-normal text-ink/50">(voor in brieven)</span>
        </label>
        <input
          id="schoolnaam"
          value={v.schoolnaam}
          onChange={(e) => setV({ ...v, schoolnaam: e.target.value })}
          placeholder="Bijv. De Regenboog"
          className="mt-1.5 w-full max-w-md rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="v-groep" className="block text-sm font-bold text-ink">
          Standaardgroep <span className="font-normal text-ink/50">(optioneel)</span>
        </label>
        <input
          id="v-groep"
          value={v.standaardgroep}
          onChange={(e) => setV({ ...v, standaardgroep: e.target.value })}
          placeholder="Bijv. Groep 5"
          className="mt-1.5 w-full max-w-xs rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </div>

    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-ink">Voorkeuren</h2>
      <p className="mt-1 text-sm text-ink/55">
        De tools vullen deze automatisch voor je in, zodat je minder hoeft te kiezen. Je
        kunt het per tool altijd nog aanpassen.
      </p>

      <KeuzeRij
        titel="Toon van de teksten"
        opties={tonen}
        waarde={v.toon}
        zet={(w) => setV({ ...v, toon: w })}
      />
      <KeuzeRij
        titel="Taalniveau"
        hint="(hoe makkelijk leesbaar)"
        opties={taalniveaus}
        waarde={v.taalniveau}
        zet={(w) => setV({ ...v, taalniveau: w })}
      />
      <KeuzeRij
        titel="Lengte van de teksten"
        opties={lengtes}
        waarde={v.lengte}
        zet={(w) => setV({ ...v, lengte: w })}
      />
      <KeuzeRij
        titel="Aanspreekvorm"
        hint="(voor ouderberichten)"
        opties={aanspreekvormen}
        waarde={v.aanspreekvorm}
        zet={(w) => setV({ ...v, aanspreekvorm: w })}
      />
    </div>

    <div className="flex items-center gap-3">
        <button
          onClick={bewaar}
          disabled={bezig}
          className="rounded-2xl bg-brand px-6 py-3 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60"
        >
          {bezig ? "Bewaren…" : "Bewaren"}
        </button>
        {opgeslagen && (
          <span className="text-sm font-semibold text-emerald-600">✓ Opgeslagen</span>
        )}
      </div>
    </>
  );
}

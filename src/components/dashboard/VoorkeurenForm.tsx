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

type SchoolTreffer = { n: string; p: string; pc: string; b: string; v: string };

// Zoek-en-kies je school uit het DUO-register (/api/scholen). Een gekozen school
// zet de exacte naam + BRIN + vestigingscode, zodat de maskering altijd klopt en
// de school later aan de org-laag te koppelen is. Vrij typen mag ook (vangnet):
// dan wist de keuze het BRIN, want dan is het geen geregistreerde school meer.
function SchoolKiezer({
  naam,
  brin,
  zet,
}: {
  naam: string;
  brin: string;
  zet: (naam: string, brin: string, vestiging: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [treffers, setTreffers] = useState<SchoolTreffer[]>([]);

  // Debounced zoeken, alleen terwijl het lijstje open is (geen zoekje bij laden).
  // De setState's staan in de timeout-callback, niet synchroon in de effect-body.
  useEffect(() => {
    if (!open) return;
    const term = naam.trim();
    const id = setTimeout(async () => {
      if (term.length < 2) {
        setTreffers([]);
        return;
      }
      try {
        const r = await fetch(`/api/scholen?q=${encodeURIComponent(term)}`);
        const j = await r.json();
        setTreffers(Array.isArray(j.scholen) ? j.scholen : []);
      } catch {
        setTreffers([]);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [naam, open]);

  function kies(s: SchoolTreffer) {
    zet(s.n, s.b, s.v);
    setOpen(false);
    setTreffers([]);
  }

  return (
    <div className="relative mt-1.5 max-w-md">
      <input
        id="schoolnaam"
        value={naam}
        autoComplete="off"
        onChange={(e) => {
          setOpen(true);
          zet(e.target.value, "", ""); // vrij typen → geen geregistreerde school
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Zoek je school, bijv. Regenboog Amsterdam"
        className="w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {open && treffers.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg">
          {treffers.map((s) => (
            <li key={s.v}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => kies(s)}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-brand-soft"
              >
                <span className="font-semibold text-ink">{s.n}</span>
                <span className="text-ink/50">
                  {" · "}
                  {s.p}
                  {s.pc ? ` · ${s.pc}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {brin ? (
        <p className="mt-1.5 text-xs font-medium text-emerald-600">
          ✓ Gekozen uit het schoolregister (BRIN {brin})
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-ink/45">
          Kies je school uit de lijst, dan klopt de naam precies. Staat hij er niet
          bij? Typ hem gewoon zelf.
        </p>
      )}
    </div>
  );
}

export default function VoorkeurenForm() {
  const [v, setV] = useState<Voorkeuren>({
    schoolnaam: "",
    school_brin: "",
    school_vestiging: "",
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
          Naam van je school
        </label>
        <SchoolKiezer
          naam={v.schoolnaam}
          brin={v.school_brin}
          zet={(naam, brin, vestiging) =>
            setV({
              ...v,
              schoolnaam: naam,
              school_brin: brin,
              school_vestiging: vestiging,
            })
          }
        />
      </div>

      <div className="mt-5">
        <label htmlFor="v-groep" className="block text-sm font-bold text-ink">
          Standaardgroep
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

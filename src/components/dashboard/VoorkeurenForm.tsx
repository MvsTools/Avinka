"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
const communicatieApps = [
  { waarde: "", label: "Geen" },
  { waarde: "parro", label: "Parro" },
  { waarde: "social_schools", label: "Social Schools" },
  { waarde: "isy", label: "Isy" },
  { waarde: "konnect", label: "Konnect" },
];
const commAppsMetEigenAdres = ["isy", "konnect"];
// Vast domein-staartje per systeem — de leerkracht vult alleen het voorste
// stukje in (zie ook avinka-communicatie-app.js / avinka-lvs-app.js).
const commStaartje: Record<string, string> = {
  isy: ".isy-school.nl",
  konnect: ".ouderportaal.nl",
};
const lvsStaartje: Record<string, string> = {
  esis: ".rovictonline.nl",
};
const lvsSystemen = [
  { waarde: "", label: "Geen" },
  { waarde: "parnassys", label: "ParnasSys" },
  { waarde: "esis", label: "Esis" },
];

// Eén keuzerij met knoppen, zoals de toon-knoppen. waarde/zet werken op het
// veld in de Voorkeuren-state.
function KeuzeRij({
  titel,
  hint,
  opties,
  waarde,
  zet,
  extra,
}: {
  titel: string;
  hint?: string;
  opties: { waarde: string; label: string }[];
  waarde: string;
  zet: (w: string) => void;
  extra?: ReactNode; // statusbadge naast de titel
}) {
  return (
    <div className="mt-5">
      <div className="flex min-h-5 items-center gap-2">
        <span className="text-sm font-bold text-ink">
          {titel}
          {hint && <span className="font-normal text-ink/50"> {hint}</span>}
        </span>
        {extra}
      </div>
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
        placeholder="Zoek op naam, plaats of BRIN, bijv. Regenboog Amsterdam"
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
    communicatie_app: "",
    communicatie_url: "",
    lvs_systeem: "",
    lvs_url: "",
  });
  const [geladen, setGeladen] = useState(false);
  const [status, setStatus] = useState<"" | "bezig" | "klaar" | "fout">("");
  const [laatstVeld, setLaatstVeld] = useState(""); // welk onderdeel je net wijzigde
  const eersteNaLaden = useRef(true);

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

  // Automatisch bewaren (kort uitgesteld) bij elke wijziging. De eerste keer net
  // na het laden slaan we over, anders bewaren we de zojuist geladen gegevens weer.
  useEffect(() => {
    if (!geladen) return;
    if (eersteNaLaden.current) {
      eersteNaLaden.current = false;
      return;
    }
    const id = setTimeout(async () => {
      setStatus("bezig");
      const ok = await saveVoorkeuren(v);
      setStatus(ok ? "klaar" : "fout");
      // Geen auto-verbergen: "✓ Opgeslagen" blijft naast het laatst gewijzigde
      // onderdeel staan tot je iets anders aanpast of de pagina herlaadt.
    }, 700);
    return () => clearTimeout(id);
  }, [v, geladen]);

  // Markeer welk onderdeel je net wijzigde en wis het vorige bewaar-bericht,
  // zodat het badge meteen naar het nieuwe onderdeel verspringt.
  function raak(veld: string) {
    setLaatstVeld(veld);
    setStatus("");
  }

  // Inline bewaar-pilletje dat alleen direct naast het laatst gewijzigde
  // onderdeel verschijnt, zodat je meteen ziet bij welk vakje het hoort.
  function badge(veld: string) {
    if (veld !== laatstVeld) return null;
    if (status === "bezig")
      return (
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-ink/50">
          Bewaren…
        </span>
      );
    if (status === "klaar")
      return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          ✓ Opgeslagen
        </span>
      );
    if (status === "fout")
      return (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
          Opslaan lukte niet
        </span>
      );
    return null;
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
        <div className="flex min-h-5 items-center gap-2">
          <label htmlFor="schoolnaam" className="text-sm font-bold text-ink">
            Naam van je school
          </label>
          {badge("schoolnaam")}
        </div>
        <SchoolKiezer
          naam={v.schoolnaam}
          brin={v.school_brin}
          zet={(naam, brin, vestiging) => {
            setV({
              ...v,
              schoolnaam: naam,
              school_brin: brin,
              school_vestiging: vestiging,
            });
            raak("schoolnaam");
          }}
        />
      </div>

      <div className="mt-5">
        <div className="flex min-h-5 items-center gap-2">
          <label htmlFor="v-groep" className="text-sm font-bold text-ink">
            Standaardgroep
          </label>
          {badge("standaardgroep")}
        </div>
        <input
          id="v-groep"
          value={v.standaardgroep}
          onChange={(e) => {
            setV({ ...v, standaardgroep: e.target.value });
            raak("standaardgroep");
          }}
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
        zet={(w) => {
          setV({ ...v, toon: w });
          raak("toon");
        }}
        extra={badge("toon")}
      />
      <KeuzeRij
        titel="Taalniveau"
        opties={taalniveaus}
        waarde={v.taalniveau}
        zet={(w) => {
          setV({ ...v, taalniveau: w });
          raak("taalniveau");
        }}
        extra={badge("taalniveau")}
      />
      <KeuzeRij
        titel="Lengte van de teksten"
        opties={lengtes}
        waarde={v.lengte}
        zet={(w) => {
          setV({ ...v, lengte: w });
          raak("lengte");
        }}
        extra={badge("lengte")}
      />
      <KeuzeRij
        titel="Aanspreekvorm"
        hint="(voor ouderberichten)"
        opties={aanspreekvormen}
        waarde={v.aanspreekvorm}
        zet={(w) => {
          setV({ ...v, aanspreekvorm: w });
          raak("aanspreekvorm");
        }}
        extra={badge("aanspreekvorm")}
      />
      <KeuzeRij
        titel="Communicatie-app"
        hint="(voor de “open in ...”-knop bij berichten)"
        opties={communicatieApps}
        waarde={v.communicatie_app}
        zet={(w) => {
          setV({ ...v, communicatie_app: w });
          raak("communicatie_app");
        }}
        extra={badge("communicatie_app")}
      />
      {commAppsMetEigenAdres.includes(v.communicatie_app) && (
        <div className="mt-3 max-w-md">
          <div className="flex min-h-5 items-center gap-2">
            <label htmlFor="v-comm-url" className="text-sm font-bold text-ink">
              Voorste stukje van jullie{" "}
              {communicatieApps.find((a) => a.waarde === v.communicatie_app)?.label}-adres
            </label>
            {badge("communicatie_url")}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="v-comm-url"
              value={v.communicatie_url}
              onChange={(e) => {
                setV({ ...v, communicatie_url: e.target.value });
                raak("communicatie_url");
              }}
              placeholder="bijv. bottel"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <span className="whitespace-nowrap text-sm font-semibold text-ink/45">
              {commStaartje[v.communicatie_app]}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-ink/45">
            Alleen het voorste stukje hoef je in te vullen (te vinden in de adresbalk
            als je bent ingelogd) — het stukje hierna vult Avinka vanzelf aan.
          </p>
        </div>
      )}
      <KeuzeRij
        titel="Leerlingvolgsysteem"
        hint="(voor de “open in ...”-knop bij bijv. een gespreksverslag)"
        opties={lvsSystemen}
        waarde={v.lvs_systeem}
        zet={(w) => {
          setV({ ...v, lvs_systeem: w });
          raak("lvs_systeem");
        }}
        extra={badge("lvs_systeem")}
      />
      {v.lvs_systeem === "esis" && (
        <div className="mt-3 max-w-md">
          <div className="flex min-h-5 items-center gap-2">
            <label htmlFor="v-lvs-url" className="text-sm font-bold text-ink">
              Voorste stukje van jullie Esis-adres
            </label>
            {badge("lvs_url")}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="v-lvs-url"
              value={v.lvs_url}
              onChange={(e) => {
                setV({ ...v, lvs_url: e.target.value });
                raak("lvs_url");
              }}
              placeholder="bijv. esis97"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <span className="whitespace-nowrap text-sm font-semibold text-ink/45">
              {lvsStaartje.esis}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-ink/45">
            Alleen het voorste stukje hoef je in te vullen (te vinden in de adresbalk
            als je bent ingelogd) — het stukje hierna vult Avinka vanzelf aan.
          </p>
        </div>
      )}
    </div>

    </>
  );
}

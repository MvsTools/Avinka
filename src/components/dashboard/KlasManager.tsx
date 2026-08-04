"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import KaartMelding from "./KaartMelding";
import {
  getKlassen,
  addKlas,
  saveKlas,
  magKlasBewerken,
  deleteKlas,
  setActieveKlas,
  getActieveKlasId,
  getAbonnement,
  type Klas,
  type Leerling,
} from "@/lib/db";
import { klasLimiet, type Abonnement } from "@/lib/abonnement";

// Je klassen staan in je eigen account (Supabase, EU) — ze synchroniseren tussen
// apparaten en blijven bewaard. Wordt automatisch opgeslagen terwijl je typt.
const OUD_GROEP = "avinka_klas_groep";
const OUD_LIJST = "avinka_klas_lijst";
const OUD_NAMEN = "avinka_klas_namen"; // alleroudste (plak-tekst)

function netjes(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((woord) =>
      woord
        .split("-")
        .map((deel) =>
          deel ? deel.charAt(0).toUpperCase() + deel.slice(1).toLowerCase() : deel,
        )
        .join("-"),
    )
    .join(" ");
}

export default function KlasManager() {
  const [klassen, setKlassen] = useState<Klas[]>([]);
  const [mijnActieveId, setMijnActieveId] = useState<string | null>(null);
  const [selId, setSelId] = useState<string>("");
  const [invoer, setInvoer] = useState("");
  const [nieuwGeslacht, setNieuwGeslacht] = useState<Leerling["geslacht"]>("");
  const [geladen, setGeladen] = useState(false);
  const [bewaard, setBewaard] = useState(false);
  /* Mag ik DEZE groep bewerken? Je eigen klas altijd; een gedeelde groep
     alleen met de rol 'volledig'. Zonder dit kon een meekijkende collega een
     kind toevoegen, "Bewaard" te zien krijgen, en na herladen was het weg. */
  const [magBewerken, setMagBewerken] = useState(true);
  const [bewaarFout, setBewaarFout] = useState(false);
  const [profielIdx, setProfielIdx] = useState<number | null>(null);
  const [klasWeg, setKlasWeg] = useState<Klas | null>(null);
  const [ab, setAb] = useState<Abonnement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sel = klassen.find((k) => k.id === selId) ?? null;

  // Hoeveel groepen mag deze leerkracht beheren? (Start = 1, Compleet/Pro = meer)
  // Een gedeelde duo-klas van je partner telt niet mee voor jouw eigen limiet.
  const limiet = ab ? klasLimiet(ab) : Infinity;
  const magNogKlas = klassen.filter((k) => k.eigenKlas).length < limiet;

  // ── Laden ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      let lijst = await getKlassen();

      // Geen klassen in dit account? Maak een lege eerste klas aan zodat er iets
      // te bewerken is. BEWUST GEEN localStorage-import meer: die oude testdata
      // is apparaat-gebonden en lekte tussen accounts op dezelfde browser
      // (leerlingnamen van het ene account belandden zo in het andere).
      if (lijst.length === 0) {
        const nieuw = await addKlas("");
        if (nieuw) lijst = await getKlassen();
      }

      // Oude apparaat-brede sleutels opruimen — die konden leerlingnamen bevatten.
      try {
        localStorage.removeItem(OUD_GROEP);
        localStorage.removeItem(OUD_LIJST);
        localStorage.removeItem(OUD_NAMEN);
      } catch {
        /* geen opslag */
      }

      const actieveId = await getActieveKlasId(lijst);
      setKlassen(lijst);
      setMijnActieveId(actieveId);
      setSelId(actieveId ?? lijst[0]?.id ?? "");
      setGeladen(true);
    })();
  }, []);

  // Bewerkrechten van de gekozen groep. Bij je eigen klas is dit meteen waar;
  // we vragen het toch aan de database, zodat het scherm en het slot dezelfde
  // bron gebruiken en niet uit elkaar kunnen lopen.
  useEffect(() => {
    if (!selId) return;
    let actueel = true;
    magKlasBewerken(selId).then((ok) => {
      if (actueel) setMagBewerken(ok);
    });
    return () => {
      actueel = false;
    };
  }, [selId]);

  // Abonnement laden (bepaalt hoeveel groepen je mag beheren).
  useEffect(() => {
    getAbonnement().then(setAb);
  }, []);

  // ── Automatisch bewaren van de geselecteerde klas ─────────────────────────
  const sig = sel ? JSON.stringify({ n: sel.naam, d: sel.leerlingenData }) : "";
  useEffect(() => {
    if (!geladen || !sel) return;
    const id = sel.id;
    const naam = sel.naam.trim();
    const data = sel.leerlingenData;
    const t = setTimeout(async () => {
      const ok = await saveKlas(id, { naam, leerlingenData: data });
      setBewaarFout(!ok);
      if (ok) {
        setBewaard(true);
        setTimeout(() => setBewaard(false), 1500);
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, geladen]);

  // ── Klas-acties ────────────────────────────────────────────────────────────
  function patchSel(leerlingenData: Leerling[], naam?: string) {
    setKlassen((ks) =>
      ks.map((k) =>
        k.id === selId
          ? {
              ...k,
              naam: naam ?? k.naam,
              leerlingenData,
              leerlingen: leerlingenData.map((l) => l.naam),
            }
          : k,
      ),
    );
  }

  // Alle wijzigingen lopen via patchSel; door hier én in voegToe/
  // verwijderLeerling te stoppen kan geen enkele knop er stiekem langs, ook
  // niet eentje die later wordt toegevoegd zonder aan rechten te denken.
  function hernoem(naam: string) {
    setKlassen((ks) => ks.map((k) => (k.id === selId ? { ...k, naam } : k)));
  }

  async function nieuweKlas() {
    if (!magNogKlas) return; // limiet van het pakket bereikt
    const k = await addKlas("");
    if (!k) return;
    setKlassen((ks) => [...ks, k]);
    setSelId(k.id);
  }

  async function maakActief(k: Klas) {
    const ok = await setActieveKlas(k);
    if (!ok) return;
    setMijnActieveId(k.id);
    if (k.eigenKlas) {
      setKlassen((ks) => ks.map((x) => (x.eigenKlas ? { ...x, actief: x.id === k.id } : x)));
    }
  }

  function verwijderKlas(id: string) {
    const k = klassen.find((x) => x.id === id);
    if (k) setKlasWeg(k);
  }

  async function doVerwijderKlas() {
    const k = klasWeg;
    if (!k) return;
    setKlasWeg(null);
    const ok = await deleteKlas(k.id);
    if (!ok) return;
    const rest = klassen.filter((x) => x.id !== k.id);
    // Was dit de klas die voor MIJ actief stond? Maak dan een andere actief.
    if (mijnActieveId === k.id && rest.length) {
      await setActieveKlas(rest[0]);
      setMijnActieveId(rest[0].id);
      if (rest[0].eigenKlas) rest[0] = { ...rest[0], actief: true };
    }
    setKlassen(rest);
    if (selId === k.id) setSelId(rest[0]?.id ?? "");
  }

  // ── Leerling-acties ─────────────────────────────────────────────────────────
  function voegToe() {
    const naam = netjes(invoer);
    if (!naam || !sel || !magBewerken) return;
    patchSel([...sel.leerlingenData, { naam, geslacht: nieuwGeslacht }]);
    setInvoer("");
    inputRef.current?.focus();
  }

  function verwijderLeerling(index: number) {
    if (!sel || !magBewerken) return;
    patchSel(sel.leerlingenData.filter((_, i) => i !== index));
    setProfielIdx(null);
  }

  function zetGeslacht(index: number, g: Leerling["geslacht"]) {
    if (!sel || !magBewerken) return;
    patchSel(
      sel.leerlingenData.map((l, i) =>
        i === index ? { ...l, geslacht: l.geslacht === g ? "" : g } : l,
      ),
    );
  }

  if (!geladen) return null;

  const profiel = profielIdx != null && sel ? sel.leerlingenData[profielIdx] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Klassen-tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {klassen.map((k) => (
          <div
            key={k.id}
            className={`flex items-center gap-1.5 rounded-full border py-1.5 pl-2 pr-2.5 text-sm font-semibold transition ${
              k.id === selId
                ? "border-brand bg-brand-soft text-brand"
                : "border-black/10 bg-white text-ink/70"
            }`}
          >
            <button
              type="button"
              onClick={() => maakActief(k)}
              title={
                k.id === mijnActieveId
                  ? "De tools vullen deze klas in"
                  : "Deze klas door de tools laten gebruiken"
              }
              className={`text-base leading-none transition ${
                k.id === mijnActieveId ? "text-amber-500" : "text-ink/25 hover:text-amber-500"
              }`}
            >
              {k.id === mijnActieveId ? "★" : "☆"}
            </button>
            <button
              type="button"
              onClick={() => setSelId(k.id)}
              className="max-w-[40vw] truncate"
              title={k.eigenKlas ? undefined : "Gedeeld door je duo-partner"}
            >
              {!k.eigenKlas && "👥 "}
              {k.naam || "Naamloze klas"}
            </button>
            {klassen.length > 1 && (
              <button
                type="button"
                onClick={() => verwijderKlas(k.id)}
                aria-label="Klas verwijderen"
                className="ml-0.5 text-ink/30 transition hover:text-rose-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {magNogKlas ? (
          <button
            onClick={nieuweKlas}
            className="rounded-full border border-dashed border-black/20 px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-brand hover:text-brand"
          >
            + Klas toevoegen
          </button>
        ) : (
          <Link
            href="/dashboard/abonnement"
            title="Meerdere groepen hoort bij Compleet"
            className="rounded-full border border-dashed border-black/20 px-4 py-2 text-sm font-semibold text-ink/45 transition hover:border-brand hover:text-brand"
          >
            🔒 Meer groepen met Compleet
          </Link>
        )}
      </div>

      {sel && (
        <div className="flex flex-col gap-6">
          {/* Boven: instellingen van deze klas — compact, twee velden naast elkaar.
              Kijk je alleen mee, dan staat hier NIETS: elk veld in deze kaart
              wijzigt de klas van je collega. Uitgezette velden laten staan is
              rommel op het scherm en nodigt uit tot proberen; het uitroepteken
              op de namenlijst hieronder vertelt waarom ze weg zijn. */}
          {magBewerken && (
            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="groep" className="block text-sm font-bold text-ink">
                    Naam van deze klas <span className="font-normal text-ink/50">(optioneel)</span>
                  </label>
                  <input
                    id="groep"
                    value={sel.naam}
                    onChange={(e) => hernoem(e.target.value)}
                    placeholder="Bijv. Groep 5 of De Dolfijnen"
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label htmlFor="leerling" className="block text-sm font-bold text-ink">
                    Leerling toevoegen{" "}
                    <span className="font-normal text-ink/50">(Enter)</span>
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="leerling"
                      ref={inputRef}
                        value={invoer}
                      onChange={(e) => setInvoer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          voegToe();
                        }
                      }}
                      placeholder="Bijv. Sanne"
                      autoComplete="off"
                      className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      onClick={voegToe}
                      aria-label="Toevoegen"
                        className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-base font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-ink/55">Geslacht:</span>
                    {(
                      [
                        ["j", "♂", "Jongen", "#3f6fb1"],
                        ["m", "♀", "Meisje", "#c2497e"],
                      ] as const
                    ).map(([g, sym, lab, kl]) => {
                      const aan = nieuwGeslacht === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setNieuwGeslacht(aan ? "" : g)}
                          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                            aan ? "" : "border-black/10 text-ink/55 hover:border-black/25"
                          }`}
                          style={aan ? { color: kl, borderColor: kl, backgroundColor: `${kl}14` } : undefined}
                        >
                          <span style={{ color: kl }}>{sym}</span>
                          {lab}
                        </button>
                      );
                    })}
                    <span className="text-xs text-ink/40">
                      {nieuwGeslacht === "" ? "of laat leeg" : "— blijft staan voor de volgende"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onder: de namenlijst met slotje */}
          <div className="relative rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
            {/* Subtiel slotje linksboven; volledige privacytekst bij hover */}
            <div className="group absolute left-4 top-4 z-10">
              <span className="flex h-7 w-7 cursor-help items-center justify-center rounded-full bg-cream text-sm text-ink/45 transition group-hover:text-brand">
                🔒
              </span>
              <div className="pointer-events-none absolute left-0 top-9 w-72 rounded-2xl bg-ink px-4 py-3 text-xs leading-5 text-white opacity-0 shadow-xl transition group-hover:opacity-100">
                Je klassenlijst staat veilig in <strong>jouw eigen account</strong> (in de EU)
                en wordt automatisch bewaard. Hij blijft van jou — de namen gaan nooit naar de AI.
              </div>
            </div>

            {/* Zelfde uitroepteken als op de toolkaarten op Start, zodat het
                overal hetzelfde betekent: er geldt hier iets, klik voor waarom. */}
            {!magBewerken && (
              <KaartMelding
                className="absolute right-4 top-4 z-10"
                tekst="Je kijkt mee bij deze groep. De klassenlijst is van je collega: je ziet de namen wel, maar je past ze niet aan."
              />
            )}
            {bewaarFout && (
              <p
                role="alert"
                className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                Deze wijziging is niet opgeslagen. Herlaad de pagina om te zien wat er
                wél bewaard is.
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pl-9">
              <h2 className="text-sm font-bold text-ink">
                {sel.leerlingenData.length === 0
                  ? "Jouw klas"
                  : `${sel.leerlingenData.length} ${
                      sel.leerlingenData.length === 1 ? "leerling" : "leerlingen"
                    }`}
              </h2>
              {bewaard && (
                <span className="text-xs font-semibold text-emerald-600">✓ Bewaard</span>
              )}
            </div>

            {sel.leerlingenData.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-black/15 bg-cream/50 px-4 py-8 text-center text-sm text-ink/55">
                Nog geen leerlingen.
                <br />
                Typ links een naam en druk op Enter.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {sel.leerlingenData.map((l, i) => {
                  const av =
                    l.geslacht === "j"
                      ? { bg: "#e7eefb", fg: "#3f6fb1" }
                      : l.geslacht === "m"
                        ? { bg: "#fbe9f1", fg: "#c2497e" }
                        : { bg: "#eef0f3", fg: "#6b6880" };
                  return (
                    <li key={i} className="relative">
                      <button
                        onClick={() => setProfielIdx(i)}
                        className="flex w-full items-center gap-2 rounded-xl border border-black/5 bg-white py-1.5 pl-1.5 pr-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold"
                          style={{ background: av.bg, color: av.fg }}
                        >
                          {l.naam.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                          {l.naam}
                        </span>
                      </button>
                      <button
                        onClick={() => verwijderLeerling(i)}
                        aria-label={`${l.naam} verwijderen`}
                        hidden={!magBewerken}
                        className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-ink/25 transition hover:bg-rose-100 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 text-xs text-ink/45">
              Tik op een leerlingkaart om het geslacht in te stellen.
            </p>
          </div>
        </div>
      )}

      {/* ── Leerling-profiel ─────────────────────────────────────────────── */}
      {profiel && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-ink/45 p-4 sm:p-8"
          onClick={() => setProfielIdx(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-2xl font-semibold text-ink">{profiel.naam}</h3>
              <button
                onClick={() => setProfielIdx(null)}
                aria-label="Sluiten"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-xl text-ink/50 transition hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Geslacht */}
            <p className="mt-6 text-sm font-bold text-ink">Geslacht</p>
            <p className="mt-0.5 text-xs text-ink/55">
              Eén keer instellen — de tools gebruiken het automatisch (bijv. hij/zij in een
              verhaaltje).
            </p>
            <div className="mt-3 flex gap-2">
              {magBewerken &&
                (
                [
                  { g: "j" as const, label: "Jongen", sym: "♂", kleur: "#3f6fb1" },
                  { g: "m" as const, label: "Meisje", sym: "♀", kleur: "#c2497e" },
                ]
              ).map(({ g, label, sym, kleur }) => {
                const aan = profiel.geslacht === g;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      zetGeslacht(profielIdx!, g);
                      setProfielIdx(null);
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${
                      aan ? "border-current" : "border-black/10 text-ink/70 hover:border-black/25"
                    }`}
                    style={aan ? { color: kleur, backgroundColor: `${kleur}14` } : undefined}
                  >
                    <span style={{ color: kleur }}>{sym}</span>
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 border-t border-black/5 pt-4">
              <button
                onClick={() => verwijderLeerling(profielIdx!)}
                hidden={!magBewerken}
                className="text-sm font-semibold text-ink/40 transition hover:text-rose-600"
              >
                Leerling verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Klas verwijderen — eigen scherm i.p.v. browser-melding */}
      {klasWeg && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto bg-ink/45 p-4 sm:p-8"
          onClick={() => setKlasWeg(null)}
        >
          <div
            className="mt-[12vh] w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-xl font-semibold text-ink">Klas verwijderen?</h3>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              De klas <strong>{klasWeg.naam || "Naamloze klas"}</strong> en alle namen erin
              worden verwijderd.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setKlasWeg(null)}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
              >
                Annuleren
              </button>
              <button
                onClick={doVerwijderKlas}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

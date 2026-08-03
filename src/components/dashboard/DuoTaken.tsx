"use client";

import { useEffect, useState } from "react";
import {
  getDuoKoppels,
  getDuoTaken,
  addDuoTaak,
  setDuoTaakGedaan,
  setDuoTaakToegewezen,
  deleteDuoTaak,
  getMijnGebruikerId,
  type DuoKoppel,
  type DuoTaak,
} from "@/lib/db";

// Gedeelde takenlijst per actief duo-koppel — los van je eigen persoonlijke
// takenlijst (TakenView). Simpel gehouden: tekst, afvinken, en een
// naam-toewijs-knopje (Ik / Duo-collega), geen deadlines of herhaling.
export default function DuoTaken() {
  const [mijnId, setMijnId] = useState<string | null>(null);
  const [koppels, setKoppels] = useState<DuoKoppel[]>([]);
  const [taken, setTaken] = useState<Record<string, DuoTaak[]>>({});
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    (async () => {
      const [mij, alleKoppels] = await Promise.all([getMijnGebruikerId(), getDuoKoppels()]);
      const actief = alleKoppels.filter((k) => k.status === "actief");
      setMijnId(mij);
      setKoppels(actief);
      const lijsten = await Promise.all(actief.map((k) => getDuoTaken(k.id)));
      const map: Record<string, DuoTaak[]> = {};
      actief.forEach((k, i) => (map[k.id] = lijsten[i]));
      setTaken(map);
      setGeladen(true);
    })();
  }, []);

  async function voegToe(koppelId: string) {
    const t = (invoer[koppelId] ?? "").trim();
    if (!t) return;
    setInvoer((v) => ({ ...v, [koppelId]: "" }));
    const nieuw = await addDuoTaak(koppelId, t);
    if (nieuw) setTaken((v) => ({ ...v, [koppelId]: [nieuw, ...(v[koppelId] ?? [])] }));
  }

  function toggle(koppelId: string, taak: DuoTaak) {
    const gedaan = !taak.gedaan;
    setTaken((v) => ({
      ...v,
      [koppelId]: (v[koppelId] ?? []).map((t) => (t.id === taak.id ? { ...t, gedaan } : t)),
    }));
    setDuoTaakGedaan(taak.id, gedaan);
  }

  function wijsToe(koppelId: string, taak: DuoTaak, wie: string | null) {
    const nieuw = taak.toegewezenAan === wie ? null : wie;
    setTaken((v) => ({
      ...v,
      [koppelId]: (v[koppelId] ?? []).map((t) =>
        t.id === taak.id ? { ...t, toegewezenAan: nieuw } : t,
      ),
    }));
    setDuoTaakToegewezen(taak.id, nieuw);
  }

  function verwijder(koppelId: string, id: string) {
    setTaken((v) => ({ ...v, [koppelId]: (v[koppelId] ?? []).filter((t) => t.id !== id) }));
    deleteDuoTaak(id);
  }

  if (!geladen || koppels.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {koppels.map((k) => {
        const lijst = taken[k.id] ?? [];
        const open = lijst.filter((t) => !t.gedaan);
        const af = lijst.filter((t) => t.gedaan);
        return (
          <div key={k.id} className="rounded-3xl border border-black/5 bg-white shadow-sm">
            <div className="border-b border-black/5 px-5 py-4 sm:px-6">
              <h2 className="font-bold text-ink">Samen — {k.klasNaam}</h2>
              <p className="text-xs text-ink/50">Gedeelde takenlijst met je duo-collega</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                voegToe(k.id);
              }}
              className="flex items-center gap-2 border-b border-black/5 px-4 py-3 sm:px-5"
            >
              <input
                value={invoer[k.id] ?? ""}
                onChange={(e) => setInvoer((v) => ({ ...v, [k.id]: e.target.value }))}
                placeholder="Wat moet er samen gebeuren?"
                className="flex-1 rounded-xl bg-cream px-4 py-2.5 text-ink outline-none transition placeholder:text-ink/45 focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                disabled={!(invoer[k.id] ?? "").trim()}
                className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                Toevoegen
              </button>
            </form>

            {open.length === 0 && af.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink/50">Nog geen gedeelde taken.</p>
            ) : (
              <ul>
                {open.map((t) => (
                  <DuoTaakRegel
                    key={t.id}
                    taak={t}
                    isVanMij={t.toegewezenAan === mijnId}
                    isVanPartner={!!t.toegewezenAan && t.toegewezenAan === k.partnerId}
                    onToggle={() => toggle(k.id, t)}
                    onWijsMij={() => wijsToe(k.id, t, mijnId)}
                    onWijsPartner={() => k.partnerId && wijsToe(k.id, t, k.partnerId)}
                    onVerwijder={() => verwijder(k.id, t.id)}
                  />
                ))}
              </ul>
            )}

            {af.length > 0 && (
              <ul className="border-t border-black/5">
                {af.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 border-b border-black/5 px-5 py-2.5 last:border-0 sm:px-6"
                  >
                    <Rondje gedaan onClick={() => toggle(k.id, t)} />
                    <span className="flex-1 text-ink/45 line-through">{t.tekst}</span>
                    <button
                      type="button"
                      onClick={() => verwijder(k.id, t.id)}
                      aria-label="Verwijderen"
                      className="shrink-0 rounded-lg px-1.5 text-lg text-ink/25 transition hover:text-rose-500"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DuoTaakRegel({
  taak,
  isVanMij,
  isVanPartner,
  onToggle,
  onWijsMij,
  onWijsPartner,
  onVerwijder,
}: {
  taak: DuoTaak;
  isVanMij: boolean;
  isVanPartner: boolean;
  onToggle: () => void;
  onWijsMij: () => void;
  onWijsPartner: () => void;
  onVerwijder: () => void;
}) {
  return (
    <li className="group flex items-center gap-2.5 border-b border-black/5 px-5 py-3 transition last:border-0 hover:bg-cream/40 sm:px-6">
      <Rondje gedaan={false} onClick={onToggle} />
      <span className="flex-1 text-ink">{taak.tekst}</span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onWijsMij}
          className={
            "rounded-full border px-2.5 py-1 text-xs font-semibold transition " +
            (isVanMij
              ? "border-brand bg-brand-soft text-brand"
              : "border-black/10 text-ink/50 hover:border-black/20")
          }
        >
          Ik
        </button>
        <button
          type="button"
          onClick={onWijsPartner}
          className={
            "rounded-full border px-2.5 py-1 text-xs font-semibold transition " +
            (isVanPartner
              ? "border-brand bg-brand-soft text-brand"
              : "border-black/10 text-ink/50 hover:border-black/20")
          }
        >
          Duo-collega
        </button>
      </div>
      <button
        type="button"
        onClick={onVerwijder}
        aria-label="Verwijderen"
        className="shrink-0 rounded-lg px-1 text-lg text-ink/25 transition hover:text-rose-500"
      >
        ✕
      </button>
    </li>
  );
}

function Rondje({ gedaan, onClick }: { gedaan: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={gedaan ? "Markeer als niet gedaan" : "Afvinken"}
      className={
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition " +
        (gedaan
          ? "border-brand bg-brand text-white"
          : "border-ink/25 text-transparent hover:border-brand hover:text-brand/40")
      }
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}

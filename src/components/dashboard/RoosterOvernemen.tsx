"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { isBasisrooster } from "@/lib/planning";

// Nog geen basisrooster bij je account. Twee mogelijkheden:
//
// 1. Je hebt er al een gemaakt in de weekplanning. Dat rooster stond alleen in
//    deze browser (localStorage), dus we bieden aan het over te nemen. Daarna
//    staat het bij je account en heb je het overal.
// 2. Je hebt er nog geen. Dan verwijzen we naar de weekplanning om er een te
//    maken.

const BEWAAR_SLEUTEL = "avinka_weekplanning_v1";

/** Niets om je op te abonneren: localStorage verandert hier niet vanzelf. */
const geenAbonnement = () => () => {};

export default function RoosterOvernemen({ schooljaar }: { schooljaar: string }) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const router = useRouter();

  // localStorage is externe opslag die de server niet kent. useSyncExternalStore
  // is daar het aangewezen middel voor: op de server null, in de browser de
  // echte waarde, zonder state in een effect te zetten.
  const opgeslagen = useSyncExternalStore(
    geenAbonnement,
    () => {
      try {
        return localStorage.getItem(BEWAAR_SLEUTEL);
      } catch {
        return null;
      }
    },
    () => null,
  );

  const gevonden = useMemo(() => {
    if (!opgeslagen) return null;
    try {
      const o = JSON.parse(opgeslagen);
      return isBasisrooster(o) ? { blokken: o.blokken.length } : null;
    } catch {
      return null;
    }
  }, [opgeslagen]);

  async function neemOver() {
    setBezig(true);
    setFout(null);
    try {
      const ruw = localStorage.getItem(BEWAAR_SLEUTEL);
      const rooster = ruw ? JSON.parse(ruw) : null;
      const antwoord = await fetch("/api/rooster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooster, schooljaar }),
      });
      if (!antwoord.ok) {
        const data = await antwoord.json().catch(() => ({}));
        setFout(data.fout || "Overnemen is niet gelukt.");
        return;
      }
      router.refresh();
    } catch {
      setFout("Overnemen is niet gelukt. Probeer het zo nog eens.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white px-6 py-8 shadow-sm">
      <h3 className="text-lg font-bold text-ink">Je hebt nog geen basisrooster</h3>
      <p className="mt-2 max-w-xl leading-7 text-ink/70">
        Je basisrooster is je vaste lesweek. Die maak je één keer aan het begin van het jaar en
        daarna pas je hem aan wanneer je wilt. Hij bepaalt ook hoe je lesdag eruitziet.
      </p>

      {gevonden ? (
        <div className="mt-5 rounded-2xl bg-brand-soft/70 px-5 py-4">
          <p className="font-semibold text-ink">
            Er staat een rooster in deze browser, met {gevonden.blokken} blokken.
          </p>
          <p className="mt-1 text-sm text-ink/70">
            Neem het over en het staat bij je account, dus ook op school en op je telefoon.
          </p>
          <button
            onClick={neemOver}
            disabled={bezig}
            className="mt-3 rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            {bezig ? "Bezig met overnemen…" : "Dit rooster overnemen"}
          </button>
        </div>
      ) : (
        <Link
          href="/tools/weekplanning.html"
          className="mt-5 inline-block rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
        >
          Basisrooster maken
        </Link>
      )}

      {fout && (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {fout}
        </p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getKlassen, getDuoKoppels } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";

// Slank strookje op Start dat één keer laat weten DAT je een groep samen kunt
// draaien. Zonder dit vindt niemand de functie: hij woont in Instellingen, en
// daar ga je alleen kijken als je al weet dat hij bestaat.
//
// Verschijnt zodra je een klas hebt, en verdwijnt zodra je iemand hebt
// uitgenodigd — of zodra je op "Niet nu" klikt. Draai je alleen, dan zie je het
// dus precies één keer.
//
// De "niet nu"-vlag staat PER ACCOUNT (sleutel + user-id): localStorage hoort
// bij de browser, niet bij de gebruiker, en anders erft een tweede account op
// dezelfde computer de keuze van de eerste.
const STORAGE_PREFIX = "avinka_collega_tip_weg_";

export default function CollegaUitnodigen() {
  const [sleutel, setSleutel] = useState<string | null>(null);
  const [tonen, setTonen] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data } = await sb.auth.getUser();
      const key = STORAGE_PREFIX + (data.user?.id ?? "anon");
      setSleutel(key);
      let weg = false;
      try {
        weg = localStorage.getItem(key) === "1";
      } catch {
        /* geen opslag */
      }
      if (weg) return;
      const [klassen, koppels] = await Promise.all([getKlassen(), getDuoKoppels()]);
      setTonen(klassen.length > 0 && koppels.length === 0);
    })();
  }, []);

  function nietNu() {
    try {
      if (sleutel) localStorage.setItem(sleutel, "1");
    } catch {
      /* geen opslag */
    }
    setTonen(false);
  }

  if (!tonen) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        {/* ⚠️ Noemde ook de onderwijsassistent. Sinds 8-8 is er één soort
            gedeelde toegang, en die geeft je duo álles wat jij ook kunt,
            inclusief de rapporten. Dat wil je niet aan een assistent aanbieden;
            zie de rolbeslissing in DuoCollega.tsx. */}
        <p className="font-bold text-ink">Nodig je duo uit voor deze groep</p>
        <p className="text-sm leading-6 text-ink/60">
          Draai je de groep samen? Dan delen jullie de klas, de rapporten, een
          gezamenlijke takenlijst en de overdracht.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <Link
          href="/dashboard/instellingen#collegas"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
        >
          Duo uitnodigen
        </Link>
        <button
          onClick={nietNu}
          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-black/20"
        >
          Niet nu
        </button>
      </div>
    </div>
  );
}

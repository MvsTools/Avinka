"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bereikTekst, maandagVan, plus, weekbeeld } from "@/lib/planning";
import type { PlanningBron } from "@/lib/planning";
import RoosterOvernemen from "./RoosterOvernemen";
import RoosterBewerken from "./RoosterBewerken";
import RoosterWeekraster from "./RoosterWeekraster";

// De Week-laag: je basisrooster in een concrete week. Het weekoverzicht ís de
// bewerkstand — geen knop nodig om er "in" te gaan, aanpassen kan altijd en
// wordt automatisch bewaard (zie RoosterWeekraster). Alleen het basisrooster
// (het sjabloon voor élke week) is een bewuste, aparte actie met een eigen
// Opslaan-knop.
//
// AFSPRAAK (docs/planning-mijn-schooljaar.md §3.6): agenda en rooster lopen niet
// door elkaar. Boven elke dag een smal agenda-strookje, de lessen in het raster
// eronder. Een vakantie of studiedag vult het rooster niet maar wist het.
// "Na schooltijd" hoort niet bij het basisrooster (wisselt per dag) en staat hier
// dus niet.

export default function SchooljaarWeek({
  bron,
  vandaag,
  verlaatGuard,
}: {
  bron: PlanningBron;
  vandaag: string;
  verlaatGuard?: { current: ((actie: () => void) => void) | null };
}) {
  const { schooljaar } = bron;
  const router = useRouter();
  const binnenJaar = vandaag >= schooljaar.start && vandaag <= schooljaar.eind;
  const [maandag, setMaandag] = useState(() =>
    maandagVan(binnenJaar ? vandaag : schooljaar.start),
  );
  const [bewerkBasis, setBewerkBasis] = useState(false);

  // In de bewerkstand vervangt de editor het overzicht. Bij "Klaar" halen we de
  // server opnieuw op (router.refresh), zodat het overzicht je nieuwe basisrooster toont.
  if (bewerkBasis) {
    return (
      <RoosterBewerken
        schooljaar={schooljaar.id}
        verlaatGuard={verlaatGuard}
        onKlaar={() => {
          setBewerkBasis(false);
          router.refresh();
        }}
      />
    );
  }

  const week = weekbeeld(bron, maandag);
  const heeftRooster = bron.blokken.length > 0;

  const verschuif = (weken: number) => setMaandag((m) => plus(m, weken * 7));
  const opDezeWeek = maandag === maandagVan(binnenJaar ? vandaag : schooljaar.start);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => verschuif(-1)}
            aria-label="Vorige week"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => verschuif(1)}
            aria-label="Volgende week"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h3 className="text-lg font-bold text-ink">Week {week.weeknummer}</h3>
        <span className="text-sm text-ink/55">{bereikTekst(maandag, plus(maandag, 4))}</span>
        {!opDezeWeek && (
          <button
            onClick={() => setMaandag(maandagVan(binnenJaar ? vandaag : schooljaar.start))}
            className="text-sm font-bold text-brand-dark underline-offset-4 hover:underline"
          >
            Naar deze week
          </button>
        )}
        {/* Het basisrooster is een sjabloon voor de toekomst, dus dat aanpassen
            heeft geen zin meer voor een afgesloten jaar. Een weekafwijking (zie
            hierboven het weekoverzicht zelf) geldt alleen voor déze ene week en
            blijft daarom altijd aanpasbaar, ook voor een afgesloten jaar. */}
        {heeftRooster && !schooljaar.afgesloten && (
          <button
            onClick={() => setBewerkBasis(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-bold text-ink/80 transition-transform duration-150 hover:text-ink active:scale-[0.97]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Basisrooster aanpassen
          </button>
        )}
      </div>

      {!heeftRooster ? (
        // Voor een afgelopen jaar heeft het geen zin om een rooster te maken of
        // over te nemen; daar valt niets meer aan te plannen.
        schooljaar.afgesloten ? (
          <p className="rounded-3xl border border-black/5 bg-white px-6 py-8 text-ink/60 shadow-sm">
            Voor dit schooljaar is geen rooster bewaard.
          </p>
        ) : (
          <RoosterOvernemen schooljaar={schooljaar.id} />
        )
      ) : (
        <RoosterWeekraster maandag={maandag} dagen={week.dagen} />
      )}
    </div>
  );
}

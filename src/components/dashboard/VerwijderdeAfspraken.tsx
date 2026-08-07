"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PlanningBron } from "@/lib/planning";

// Welke afspraken je NET hebt weggehaald, voor de hele pagina op één plek.
//
// Een afspraak staat namelijk op meer dan één plek tegelijk op het scherm: in
// het dagkaartje waar je op "Verwijderen" drukt, maar ook in de kalender of de
// lijst eronder. Hield elk onderdeel dat zelf bij, dan verdween hij in het
// kaartje meteen en bleef hij in de kalender nog een seconde staan tot
// router.refresh() de hele pagina opnieuw had opgehaald — precies de traagheid
// die we uit het kaartje al hadden gehaald, alleen nu een laag lager.
//
// De echte verwijdering en de server-verversing lopen op de achtergrond gewoon
// door. Mislukt die onverwacht, dan meldt de aanroeper `weg = false` en komt de
// afspraak overal weer terug.

type Verwijderlijst = {
  ids: Set<string>;
  /** `weg = true` zodra je verwijdert, `false` als het toch niet lukte. */
  meld: (id: string, weg: boolean) => void;
};

const Ctx = createContext<Verwijderlijst | null>(null);

export function VerwijderdeAfspraken({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const meld = useCallback((id: string, weg: boolean) => {
    setIds((v) => {
      const n = new Set(v);
      if (weg) n.add(id);
      else n.delete(id);
      return n;
    });
  }, []);

  const waarde = useMemo(() => ({ ids, meld }), [ids, meld]);
  return <Ctx.Provider value={waarde}>{children}</Ctx.Provider>;
}

/** Null buiten de provider — dan houdt useEigenAfspraakVorm zijn eigen lijstje bij. */
export function useVerwijderlijst(): Verwijderlijst | null {
  return useContext(Ctx);
}

/** Dezelfde planning, zonder wat je zojuist hebt weggehaald. */
export function zonderVerwijderd(bron: PlanningBron, ids?: Set<string>): PlanningBron {
  if (!ids || ids.size === 0) return bron;
  return { ...bron, items: bron.items.filter((i) => !ids.has(i.id)) };
}

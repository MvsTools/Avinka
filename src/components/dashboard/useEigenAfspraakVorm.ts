"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Soort } from "@/lib/agenda-herken";
import { useVerwijderlijst } from "./VerwijderdeAfspraken";

// De logica achter "zelf een afspraak toevoegen", los van waar het formulier
// op het scherm staat. Twee plekken gebruiken hem: de kaart in Jaaroverzicht
// (EigenAfspraken.tsx) en het dagkaartje in de kalender (SchooljaarDagkaart),
// zodat je een afspraak kunt maken op de plek waar je al bent, in plaats van
// ergens anders op de pagina te belanden.
//
// Er is BEWUST geen manier om het soort met de hand te kiezen. Avinka raadt
// het uit de titel (raadSoort) en blijft dat de hele tijd doen, ook nadat er
// al een keer gegokt is — er is niets meer dat die gok "vastzet". Zie
// AfspraakFormulier.tsx voor de reden.

export type Vorm = {
  id?: string;
  titel: string;
  datum: string;
  totDatum: string;
  heleDag: boolean;
  begin: string;
  eind: string;
  soort: Soort;
};

const LEEG: Vorm = {
  titel: "",
  datum: "",
  totDatum: "",
  heleDag: false,
  begin: "",
  eind: "",
  soort: "overig",
};

export function useEigenAfspraakVorm(vandaag: string) {
  const [vorm, setVorm] = useState<Vorm | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState<string | null>(null);
  // Verwijderen voelde traag, want het kaartje wachtte tot router.refresh()
  // helemaal klaar was (de hele pagina opnieuw ophalen) voordat de afspraak
  // uit de lijst verdween. Nu verdwijnt hij METEEN, en loopt de echte
  // verwijdering en de server-verversing op de achtergrond door — mislukt die
  // onverwacht, dan komt de afspraak gewoon terug (zie de catch hieronder).
  //
  // Staat er een gedeelde lijst om ons heen (VerwijderdeAfspraken), dan houden
  // we hem dáár bij: anders verdwijnt de afspraak wel uit dit kaartje maar
  // blijft hij in de kalender eronder nog even staan. Zonder provider — een
  // formulier dat los in een pagina hangt — volstaat het eigen lijstje.
  const gedeeld = useVerwijderlijst();
  const [eigenVerwijderd, setEigenVerwijderd] = useState<Set<string>>(() => new Set());
  const netVerwijderd = gedeeld ? gedeeld.ids : eigenVerwijderd;
  const meldVerwijderd = (id: string, weg: boolean) => {
    if (gedeeld) {
      gedeeld.meld(id, weg);
      return;
    }
    setEigenVerwijderd((v) => {
      const n = new Set(v);
      if (weg) n.add(id);
      else n.delete(id);
      return n;
    });
  };
  const router = useRouter();
  const soortTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (start?: Partial<Vorm>) => {
    if (soortTimer.current) clearTimeout(soortTimer.current);
    setFout(null);
    setGelukt(null);
    setVorm({ ...LEEG, datum: vandaag, ...start });
  };

  const annuleren = () => {
    if (soortTimer.current) clearTimeout(soortTimer.current);
    setVorm(null);
    setFout(null);
  };

  /** Wat dénken we dat dit voor afspraak is? Bepaalt op de achtergrond of en
   *  wanneer je er een seintje van krijgt — er is geen scherm dat dit vraagt. */
  const raadSoort = async (titel: string) => {
    if (!titel.trim() || !vorm || vorm.id) return;
    try {
      const res = await fetch(`/api/agenda/afspraak?titel=${encodeURIComponent(titel)}`);
      if (!res.ok) return;
      const { raad } = await res.json();
      setVorm((v) => (v && raad ? { ...v, soort: raad } : v));
    } catch {
      /* een suggestie die niet komt is geen probleem */
    }
  };

  /** Elke toets een verzoek sturen is zonde; wachten tot je even stopt met
   *  typen (geen aparte AI-aanroep, dus dit kost niets — zie route.ts). */
  const wijzigTitel = (titel: string) => {
    if (!vorm) return;
    setVorm({ ...vorm, titel });
    if (soortTimer.current) clearTimeout(soortTimer.current);
    soortTimer.current = setTimeout(() => raadSoort(titel), 350);
  };

  const wijzigVeld = (patch: Partial<Vorm>) => {
    setVorm((v) => (v ? { ...v, ...patch } : v));
  };

  const bewaar = async () => {
    if (!vorm) return false;
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch("/api/agenda/afspraak", {
        method: vorm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vorm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(data.fout || "Opslaan lukte niet.");
        return false;
      }
      if (soortTimer.current) clearTimeout(soortTimer.current);
      setGelukt(vorm.id ? "Afspraak bijgewerkt." : "Afspraak toegevoegd.");
      setVorm(null);
      router.refresh();
      return true;
    } catch {
      setFout("Opslaan lukte niet. Ben je nog online?");
      return false;
    } finally {
      setBezig(false);
    }
  };

  const weghalen = async (id: string) => {
    meldVerwijderd(id, true);
    setVorm(null);
    try {
      const res = await fetch("/api/agenda/afspraak", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setGelukt("Afspraak verwijderd.");
      router.refresh();
    } catch {
      // Mislukt? Dan gewoon weer laten zien — het formulier is al dicht,
      // dus een foutmelding heeft hier niets om op te verschijnen. Terug
      // laten komen in de lijst is zelf al het signaal dat het niet lukte.
      meldVerwijderd(id, false);
    }
  };

  return {
    vorm,
    bezig,
    fout,
    gelukt,
    netVerwijderd,
    open,
    annuleren,
    wijzigTitel,
    wijzigVeld,
    bewaar,
    weghalen,
  };
}

export type EigenAfspraakVorm = ReturnType<typeof useEigenAfspraakVorm>;

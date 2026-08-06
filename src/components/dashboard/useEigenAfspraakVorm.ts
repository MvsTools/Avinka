"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Soort } from "@/lib/agenda-herken";

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
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch("/api/agenda/afspraak", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(data.fout || "Weghalen lukte niet.");
        return;
      }
      setGelukt("Afspraak weggehaald.");
      router.refresh();
    } catch {
      setFout("Weghalen lukte niet. Ben je nog online?");
    } finally {
      setBezig(false);
    }
  };

  return {
    vorm,
    bezig,
    fout,
    gelukt,
    open,
    annuleren,
    wijzigTitel,
    wijzigVeld,
    bewaar,
    weghalen,
  };
}

export type EigenAfspraakVorm = ReturnType<typeof useEigenAfspraakVorm>;

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Soort } from "@/lib/agenda-herken";

// De logica achter "zelf een afspraak toevoegen", los van waar het formulier
// op het scherm staat. Twee plekken gebruiken hem: de kaart in Jaaroverzicht
// (EigenAfspraken.tsx) en het dagkaartje in de kalender (SchooljaarDagkaart),
// zodat je een afspraak kunt maken op de plek waar je al bent, in plaats van
// ergens anders op de pagina te belanden.

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
  // Het soort staat standaard dicht: de gok (of de vorige waarde bij
  // wijzigen) is meestal goed genoeg, en dan hoef je niet ook nog door acht
  // knoppen heen. Pas open klikken als je twijfelt.
  const [soortOpen, setSoortOpen] = useState(false);
  const router = useRouter();
  const soortTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Een ref, niet een state: raadSoort loopt async, en moet op het moment dat
  // de fetch terugkomt weten of je ONDERTUSSEN zelf hebt gekozen — niet nog
  // de oude waarde uit de closure van toen het verzoek begon.
  const soortDoorJou = useRef(false);

  const open = (start?: Partial<Vorm>) => {
    if (soortTimer.current) clearTimeout(soortTimer.current);
    soortDoorJou.current = false;
    setFout(null);
    setGelukt(null);
    setSoortOpen(false);
    setVorm({ ...LEEG, datum: vandaag, ...start });
  };

  const annuleren = () => {
    if (soortTimer.current) clearTimeout(soortTimer.current);
    setVorm(null);
    setFout(null);
  };

  /** Wat dénken we dat dit voor afspraak is? Alleen een suggestie; je kunt
   *  hem zelf altijd omzetten — en zolang je dat niet gedaan hebt, mag een
   *  latere gok een eerdere gok gewoon weer bijstellen. */
  const raadSoort = async (titel: string) => {
    if (!titel.trim() || !vorm || vorm.id) return;
    try {
      const res = await fetch(`/api/agenda/afspraak?titel=${encodeURIComponent(titel)}`);
      if (!res.ok) return;
      const { raad } = await res.json();
      setVorm((v) => (v && !soortDoorJou.current && raad ? { ...v, soort: raad } : v));
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

  const kiesSoort = (s: Soort) => {
    soortDoorJou.current = true;
    setVorm((v) => (v ? { ...v, soort: s } : v));
    setSoortOpen(false);
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
    soortOpen,
    setSoortOpen,
    open,
    annuleren,
    wijzigTitel,
    wijzigVeld,
    kiesSoort,
    bewaar,
    weghalen,
  };
}

export type EigenAfspraakVorm = ReturnType<typeof useEigenAfspraakVorm>;

"use client";

// TIJDELIJKE PROEFROUTE — alleen om het wachtscherm te kunnen bekijken zonder
// een echte registratie te doen (dat zou een echte mail versturen naar een
// verzonnen adres, en een bounce schaadt de verzendreputatie).
// ⚠️ Weghalen zodra het scherm is goedgekeurd.
import { useState } from "react";
import BevestigWachtscherm from "@/components/BevestigWachtscherm";

export default function WachtschermProef() {
  // Met een deadline erbij, want dat is wat een echte gebruiker ziet: er is
  // zojuist een mail verstuurd, dus de teller loopt al. In de echte stroom komt
  // dit tijdstip van de server-action; hier zetten we het bij het openen.
  const [opnieuwNa] = useState(() => Date.now() + 60_000);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <BevestigWachtscherm
        email="marieke@pcboapeldoorn.nl"
        opnieuwNa={opnieuwNa}
      />
    </main>
  );
}

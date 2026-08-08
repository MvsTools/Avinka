import type { Metadata } from "next";
import BevestigLosseCode from "@/components/BevestigLosseCode";

/* Voor wie het tabblad kwijt is waarin hij zich aanmeldde.

   Hier komt iemand op twee manieren:
   1. Hij probeert in te loggen met een account dat nog niet bevestigd is. Dan
      stuurt login() hem hierheen met ?email=…&reden=onbevestigd, want een
      foutmelding zou een doodlopende weg zijn: opnieuw aanmelden kan niet
      (het account bestaat al) en het codeveld van het wachtscherm is weg.
   2. Hij typt het adres zelf in.

   ⚠️ Bewust GEEN verwijzing meer naar deze pagina in de bevestigingsmail. Sinds
   die mail een code bevat komt hij binnen enkele seconden aan en heeft vrijwel
   niemand dit nodig; een instructie vooraf is dan ruis. De uitweg hoort te
   verschijnen op het moment dat je vastloopt, niet ervoor. */

export const metadata: Metadata = {
  title: "Bevestig je aanmelding",
};

export default async function BevestigenPagina({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; reden?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <BevestigLosseCode
        beginEmail={params.email ?? ""}
        onbevestigd={params.reden === "onbevestigd"}
      />
    </main>
  );
}

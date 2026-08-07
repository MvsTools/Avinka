import type { Metadata } from "next";
import BevestigLosseCode from "@/components/BevestigLosseCode";

/* Voor wie het tabblad heeft gesloten waar hij zich aanmeldde.
   In de bevestigingsmail staat naast de code een verwijzing naar deze pagina.

   🔑 Die verwijzing is een GEWONE link zonder token erin, en dat is met opzet:
   schoolbesturen draaien Microsoft Safe Links, dat elke link in een mail eerst
   zelf ophaalt. Zit er iets eenmaligs in, dan is het daarna op. Hier valt niets
   te verbruiken, dus mag Microsoft hem zo vaak openen als hij wil. */

export const metadata: Metadata = {
  title: "Bevestig je aanmelding",
};

export default function BevestigenPagina() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <BevestigLosseCode />
    </main>
  );
}

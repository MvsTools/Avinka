import type { NextConfig } from "next";

/* ⚠️ NIET OPNIEUW PROBEREN: www.avinka.nl → avinka.nl is niet op 308 te krijgen.
   Vercel stuurt www zelf door met een 307 ("tijdelijk"). Dat is niet te wijzigen:
   in het dashboard ziet hij www als onderdeel van avinka.nl en weigert een losse
   doorverwijsregel ("a domain cannot redirect to itself"). Een `redirects()`-regel
   hier werkt óók niet — gemeten 7-8-2026, ruim zes minuten na een geslaagde
   deploy nog steeds 307. Reden: Vercel handelt het af op zijn edge, dus het
   verzoek bereikt deze app nooit.
   Praktisch maakt het niets uit (bezoekers komen goed uit, en het verschil telt
   alleen voor zoekmachines). Wil je het tóch permanent, dan is de enige route
   Vercel-support vragen. Zie [[golive-checklist]]. */

const nextConfig: NextConfig = {
  /* ── Meekijken op je eigen telefoon ────────────────────────────────────────
     Next blokkeert zijn dev-bestanden (/_next/...) voor élk adres behalve
     localhost. Zonder deze regel gebeurt er op een telefoon iets dat je heel
     makkelijk verkeerd uitlegt: de PAGINA komt gewoon binnen, want die maakt de
     server, maar de SCRIPTS worden geweigerd. Je krijgt dus een scherm dat er
     volkomen normaal uitziet en waarop geen enkele knop werkt.

     ⚠️ 9-8: daar ben ik ingetrapt. De eigenaar meldde dat de toolkaarten op zijn
     telefoon niet opengingen; ik heb tweemaal de klikafhandeling herschreven
     terwijl die code op dat toestel nooit is uitgevoerd. Pas toen bleek dat óók
     de veelgestelde vragen niet openklapten, viel het kwartje: als álles dood
     is ligt het niet aan één component. De log van de dev-server zei het al die
     tijd letterlijk ("Blocked cross-origin request ... from 192.168.2.11").
     🔑 Werkt er op een apparaat NIETS meer, kijk dan eerst of het script
     überhaupt draait, vóór je één onderdeel gaat repareren. En lees de
     serverlog; die waarschuwt vaak allang.

     Dit geldt alleen bij `npm run dev`. Op Vercel doet deze instelling niets.
     Staat er een ander adres in de dev-server dan wat hier staat? Dan heeft de
     router de pc een nieuw nummer gegeven: overnemen en de server herstarten.
     ───────────────────────────────────────────────────────────────────────── */
  allowedDevOrigins: ["192.168.2.11"],
};

export default nextConfig;

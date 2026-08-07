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
  /* config options here */
};

export default nextConfig;

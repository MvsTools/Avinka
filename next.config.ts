import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* www.avinka.nl → avinka.nl, permanent (308).
     Vercel stuurt www zelf al door, maar met een 307 ("tijdelijk"), en die code
     is in het dashboard niet te veranderen: hij ziet www als onderdeel van
     avinka.nl en weigert een losse doorverwijsregel ("a domain cannot redirect
     to itself"). Tijdelijk is hier onwaar — www is definitief geen eigen adres —
     en een zoekmachine hoort te weten dat avinka.nl het echte is.
     ⚠️ Of deze regel wint van Vercels eigen afhandeling moet gemeten worden;
     die zit vóór de app. Doet hij niets, dan blijft de werkende 307 staan. */
  async redirects() {
    return [
      {
        source: "/:pad*",
        has: [{ type: "host", value: "www.avinka.nl" }],
        destination: "https://avinka.nl/:pad*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

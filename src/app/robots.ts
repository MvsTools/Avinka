import type { MetadataRoute } from "next";
import { MAG_GEVONDEN_WORDEN } from "@/lib/zichtbaarheid";

// robots.txt, maar dan door Next zelf gemaakt zodat hij mee kan bewegen met de
// omgeving. Zie src/lib/zichtbaarheid.ts voor waarom dit standaard dicht staat.
//
// ⚠️ robots.txt is een VERZOEK, geen slot. Daarom staat er in de layout ook een
// noindex-regel voor de pagina zelf; die twee samen houden een testomgeving uit
// de zoekresultaten. Wil je iets echt onbereikbaar houden, dan hoort het achter
// een inlog — en dat is precies waar het dashboard al staat.
export default function robots(): MetadataRoute.Robots {
  if (!MAG_GEVONDEN_WORDEN) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Het dashboard en de tools zijn persoonlijk; die horen sowieso niet in
        // een zoekmachine, ook niet als de site wél live is.
        disallow: ["/dashboard/", "/tools/", "/api/"],
      },
    ],
  };
}

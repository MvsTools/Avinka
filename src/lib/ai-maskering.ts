// Toegang tot het klasnamen-vangnet (public/avinka-masking.js) vanuit React.
//
// Dat bestand is de gedeelde maskeerlaag van het hele platform: het haalt de
// voornamen uit je dashboard plus de schoolnaam op en vervangt die in elke
// tekst door codes (KN-001, KN-002, …) vóór er iets naar de AI gaat. Ná het
// antwoord zet het de codes lokaal weer terug.
//
// Waarom we het script laden in plaats van het na te bouwen in TypeScript:
// een tweede kopie van dezelfde regels loopt vroeg of laat uit de pas met de
// eerste, en dan maskeert de ene laag iets wat de andere doorlaat. Eén bron.
//
// Het script wordt pas opgehaald op het moment dat iemand de AI daadwerkelijk
// gebruikt — het dashboard hoeft er bij het laden geen last van te hebben.

type AvinkaMask = {
  ready: Promise<unknown>;
  namen: () => string[];
  /** Namen en schoolnaam → codes. Doen vóór verzending. */
  apply: (tekst: string) => string;
  /** Codes → namen, in de schrijfwijze van je klas. Doen ná het antwoord. */
  restore: (tekst: string) => string;
};

declare global {
  interface Window {
    avinkaMask?: AvinkaMask;
  }
}

const BRON = "/avinka-masking.js";

let bezig: Promise<AvinkaMask | null> | null = null;

/**
 * De maskeerlaag, klaar voor gebruik. `null` betekent: het is niet gelukt.
 *
 * Bij `null` hoor je NIETS naar de AI te sturen. Dit is de enige laag die de
 * namen van kinderen tegenhoudt in het dashboard (de losse tools hebben elk
 * ook nog hun eigen laag, dit scherm niet), dus vallen we hier dicht en niet
 * open.
 */
export function haalMaskering(): Promise<AvinkaMask | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (bezig) return bezig;

  bezig = new Promise<AvinkaMask | null>((klaar) => {
    const gereed = () => {
      const mask = window.avinkaMask;
      if (!mask) return klaar(null);
      // `ready` wacht op de namenlijst. Mislukt die, dan blijft de lijst leeg
      // en maskeert het script niets — het script zelf vangt dat al af.
      mask.ready.then(
        () => klaar(mask),
        () => klaar(mask),
      );
    };

    if (window.avinkaMask) return gereed();

    const bestaand = document.querySelector<HTMLScriptElement>(`script[src="${BRON}"]`);
    const script = bestaand ?? document.createElement("script");
    script.addEventListener("load", gereed, { once: true });
    script.addEventListener("error", () => klaar(null), { once: true });
    if (!bestaand) {
      script.src = BRON;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return bezig;
}

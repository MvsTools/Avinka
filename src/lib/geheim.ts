import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Versleutelen van gegevens die wél in de database moeten staan, maar die
// niemand mag kunnen lezen als de database ooit uitlekt. Op dit moment gebruikt
// voor agendalinks: zo'n link is een sleutel tot de hele schoolagenda van een
// leerkracht, dus die hoort niet leesbaar op een schijf te staan.
//
// De sleutel staat in de omgevingsvariabele AVINKA_GEHEIM_SLEUTEL en komt nooit
// in de code of in de database. Zonder sleutel doen we niets: dan zou de link
// leesbaar worden opgeslagen en dat is erger dan een foutmelding.

const ALGORITME = "aes-256-gcm";

function sleutel(): Buffer {
  const ruw = process.env.AVINKA_GEHEIM_SLEUTEL;
  if (!ruw) {
    throw new Error(
      "AVINKA_GEHEIM_SLEUTEL ontbreekt. Zet hem in .env.local, anders kunnen agendalinks niet veilig worden bewaard.",
    );
  }
  const buf = Buffer.from(ruw, "base64");
  if (buf.length !== 32) {
    throw new Error("AVINKA_GEHEIM_SLEUTEL moet 32 bytes zijn (base64).");
  }
  return buf;
}

/** Geeft "iv.tag.inhoud", alledrie in base64. */
export function versleutel(tekst: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv(ALGORITME, sleutel(), iv);
  const inhoud = Buffer.concat([c.update(tekst, "utf8"), c.final()]);
  return [iv.toString("base64"), c.getAuthTag().toString("base64"), inhoud.toString("base64")].join(".");
}

export function ontsleutel(pakket: string): string {
  const [iv, tag, inhoud] = pakket.split(".");
  if (!iv || !tag || !inhoud) throw new Error("Onleesbaar versleuteld pakket.");
  const d = createDecipheriv(ALGORITME, sleutel(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(inhoud, "base64")), d.final()]).toString("utf8");
}

/** Handig om te tonen zonder de link prijs te geven: "…d71761c". */
export function staart(link: string): string {
  const schoon = link.split("?")[0];
  return "…" + schoon.slice(-7);
}

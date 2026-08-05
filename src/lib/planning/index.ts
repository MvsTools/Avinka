// Mijn schooljaar — het fundament onder de vier lagen (jaar, periode, week, dag).
//
// Eén ingang voor de rest van het platform:
//
//   import { haalPlanning, dagbeeld } from "@/lib/planning";
//
//   const bron = await haalPlanning(supabase);      // alles van dit schooljaar
//   const vandaag = dagbeeld(bron, "2026-11-12");   // wat speelt er die dag?
//
// De gegevens komen op één plek uit de database (ophalen.ts); al het rekenen
// eromheen is gewone code zonder database, zodat elk scherm hetzelfde weet.

export * from "./types";
export * from "./datum";
export * from "./vakanties";
export * from "./schooljaar";
export * from "./eigen-vakanties";
export * from "./dubbelingen";
export * from "./relevantie";
export * from "./rooster";
export * from "./dagbeeld";
export * from "./aanleiding";
export * from "./ophalen";

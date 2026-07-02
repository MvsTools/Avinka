// ── Avinka: algemene gegevens over het platform zelf ─────────────────────

// De datum waarop Avinka publiek live ging. De welkomstpop-up telt hiervandaan
// "Avinka bestaat nu X dagen". Pas ALLEEN deze ene regel aan zodra de
// definitieve livedatum vaststaat (formaat JJJJ-MM-DD, tijdzone Amsterdam).
export const AVINKA_LIVE_DATUM = "2026-08-25"; // TODO: definitieve livedatum invullen

// Hoeveel hele dagen bestaat Avinka nu? Nooit minder dan 1, zodat de tekst ook
// tijdens testen (vóór de livedatum) netjes "1 dag" toont in plaats van 0 of
// een negatief getal.
export function dagenSindsLive(nu: Date = new Date()): number {
  const start = new Date(`${AVINKA_LIVE_DATUM}T00:00:00`);
  const dagen = Math.floor((nu.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, dagen);
}

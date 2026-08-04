/* Seintje "je voorkeuren zijn buitenom gewijzigd, haal ze opnieuw op".
 *
 * Nodig omdat het instellingenformulier zijn waarden één keer bij het laden
 * ophaalt en daarna in eigen state bijhoudt. Vult de database die waarden
 * ergens anders vandaan in — bij het accepteren van een duo-uitnodiging vult
 * de database school en groep van je collega in — dan weet het formulier daar
 * niets van en blijf je lege velden zien terwijl ze in werkelijkheid gevuld
 * zijn. router.refresh() helpt hier niet: dat ververst servercomponenten, niet
 * de state van een clientcomponent.
 *
 * Bewust een gebeurtenis en geen gedeelde store: het is één zeldzaam moment
 * tussen twee componenten die verder niets met elkaar te maken hebben. */

export const VOORKEUREN_VERVERSEN = "avinka:voorkeuren-verversen";

export function meldVoorkeurenGewijzigd() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VOORKEUREN_VERVERSEN));
}

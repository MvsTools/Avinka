// Her-akkoord-reminder hook (PostToolUse). Draait na Edit/Write/MultiEdit. Als het
// gewijzigde bestand de algemene voorwaarden of de privacyverklaring is, geeft het
// Claude een seintje om óók de versie in src/lib/juridisch.ts te bumpen. Zonder die
// bump triggert de verplichte her-akkoord-pop-up niet en gaan bestaande gebruikers
// niet opnieuw akkoord. Geen externe tools nodig (geen jq): puur Node op stdin.
let invoer = "";
process.stdin.on("data", (d) => (invoer += d));
process.stdin.on("end", () => {
  let pad = "";
  try {
    const j = JSON.parse(invoer || "{}");
    pad = (j.tool_input && j.tool_input.file_path) || "";
  } catch {
    return; // geen geldige invoer → stil afsluiten
  }
  pad = pad.replace(/\\/g, "/"); // Windows-backslashes gelijktrekken
  if (!/\/(voorwaarden|privacy)\/page\.tsx$/.test(pad)) return;

  const doc = pad.includes("/privacy/") ? "privacyverklaring" : "algemene voorwaarden";
  const boodschap =
    `Let op: je hebt zojuist de ${doc} gewijzigd (${pad}). Werk nu ook ` +
    "src/lib/juridisch.ts bij: bump de `versie` én `weergave` van het gewijzigde " +
    "document naar de datum van vandaag, en vul `WIJZIGING_SAMENVATTING` met een korte " +
    "samenvatting van wat er veranderde. Zonder versiebump verschijnt de verplichte " +
    "her-akkoord-pop-up niet en gaan bestaande gebruikers niet opnieuw akkoord.";

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: boodschap,
      },
    }),
  );
});

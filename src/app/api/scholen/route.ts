import scholenData from "@/data/scholen.json";

// Zoek-API over het DUO-register van basis- en speciaal-onderwijsvestigingen.
// Gevoed door src/data/scholen.json (gebouwd uit de open DUO-CSV's via
// _tmp/bouw-scholen.js). Publieke referentiedata: geen inlog/persoonsgegevens.
// De leerkracht kiest hier zijn school zodat de naam exact (canoniek) is — dat
// houdt de maskering kloppend en legt het BRIN vast voor de latere org-laag.
type School = { n: string; p: string; pc: string; b: string; v: string };
const SCHOLEN = scholenData as School[];

// Lowercase, accenten weg, alles wat geen letter/cijfer is → spatie.
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combineertekens (accenten) verwijderen
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Eén keer voorgerekend bij het laden van de module (niet per request).
const INDEX = SCHOLEN.map((s) => norm(`${s.n} ${s.p} ${s.pc}`));
const NAAM_NORM = SCHOLEN.map((s) => norm(s.n));

export async function GET(request: Request) {
  const q = norm(new URL(request.url).searchParams.get("q") || "");
  if (q.length < 2) return Response.json({ scholen: [] });

  const tokens = q.split(" ").filter(Boolean);
  const eerste = tokens[0];
  const treffers: { i: number; score: number }[] = [];

  for (let i = 0; i < SCHOLEN.length; i++) {
    const hooi = INDEX[i];
    let past = true;
    for (let t = 0; t < tokens.length; t++) {
      if (!hooi.includes(tokens[t])) {
        past = false;
        break;
      }
    }
    if (!past) continue;

    // Naamtreffers wegen zwaarder dan plaats/postcode; vroeger = relevanter.
    const naam = NAAM_NORM[i];
    let score = 0;
    if (naam.startsWith(eerste)) score += 100;
    else if (naam.includes(eerste)) score += 40;
    const pos = naam.indexOf(eerste);
    if (pos >= 0) score -= pos;
    treffers.push({ i, score });
  }

  treffers.sort(
    (a, b) => b.score - a.score || SCHOLEN[a.i].n.length - SCHOLEN[b.i].n.length,
  );
  const top = treffers.slice(0, 12).map((t) => SCHOLEN[t.i]);
  return Response.json({ scholen: top });
}

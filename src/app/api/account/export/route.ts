import { type NextRequest, NextResponse } from "next/server";
import {
  type Gegevens,
  TABELLEN,
  bestandsnaamVoor,
  deelBestand,
  zipBestand,
  zonderGeheimen,
} from "@/lib/export-gegevens";
import { createClient } from "@/utils/supabase/server";

/* ══════════════════════════════════════════════════════════════════════════
 * JE GEGEVENS DOWNLOADEN (AVG art. 15 en 20)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Deze route levert alleen BESTANDEN. Het scherm eromheen is een gewone pagina
 * geworden (src/app/mijn-gegevens), zodat het de lettertypes, kleuren en
 * vormtaal van het platform erft in plaats van een eigen setje opmaak te
 * onderhouden.
 *
 *   ?deel=rapporten                één categorie, in het formaat dat erbij hoort
 *   ?deel=klassen&deel=agenda_items  meerdere: samen in een zip
 *   ?format=json                   alles, machineleesbaar
 *   (zonder iets)                  door naar de pagina
 *
 * ⚠️ Alles leunt op RLS: er wordt gelezen met de sessie van de bezoeker, dus
 * hij krijgt per definitie alleen zijn eigen rijen. Er staat hier geen enkel
 * eigen filter op "van wie is deze rij" — dat hoort in de database.
 * ══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Een programma dat JSON vraagt krijgt JSON terug; een mens krijgt het
    // inlogscherm, met de bestemming eraan zodat hij daarna alsnog op zijn
    // eigen overzicht uitkomt.
    return request.nextUrl.searchParams.get("format") === "json"
      ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/sign-in?volgende=%2Fmijn-gegevens", request.url));
  }

  const gegevens: Gegevens = {};
  for (const tabel of TABELLEN) {
    const { data } = await supabase.from(tabel).select("*");
    gegevens[tabel] = zonderGeheimen((data as Record<string, unknown>[]) ?? []);
  }

  // ⚠️ Alleen namen uit TABELLEN worden geaccepteerd. Zonder die controle zou
  // ?deel=<wat dan ook> een tabelnaam kunnen zijn die hier niet hoort.
  // `bestanden` valt af: daarin zit het eigen vakwerk dat we juist bewaren, en
  // de plattegronden erin wachten nog op een tekening.
  const gekozen = request.nextUrl.searchParams
    .getAll("deel")
    .filter((d) => (TABELLEN as readonly string[]).includes(d) && d !== "bestanden");

  // Eén categorie? Dan gewoon dat bestand. Iemand die alleen zijn rapportteksten
  // wil, moet geen zip hoeven uitpakken om erbij te komen.
  if (gekozen.length === 1) {
    const { inhoud, type } = deelBestand(gekozen[0], gegevens[gekozen[0]] ?? []);
    return new NextResponse(inhoud, {
      headers: {
        "content-type": type,
        "content-disposition": `attachment; filename="${bestandsnaamVoor(gekozen[0])}"`,
      },
    });
  }

  // Meerdere categorieën zijn meerdere bestandssoorten, dus die gaan in een zip.
  if (gekozen.length > 1) {
    const zip = zipBestand(
      gekozen.map((d) => ({
        naam: bestandsnaamVoor(d),
        inhoud: deelBestand(d, gegevens[d] ?? []).inhoud,
      })),
    );
    // Buffer en niet de kale Uint8Array: die laatste accepteert het antwoordtype
    // niet, en een omweg via een string sloopt de bytes.
    return new NextResponse(Buffer.from(zip), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="avinka-mijn-gegevens.zip"',
      },
    });
  }

  // Machineleesbaar, om over te zetten naar een andere dienst.
  if (request.nextUrl.searchParams.get("format") === "json") {
    const payload = {
      geexporteerd_op: new Date().toISOString(),
      toelichting:
        "Een kopie van de gegevens die Avinka onder jouw account bewaart. Voor een verzoek dat hier niet in past, mail ons.",
      account: {
        id: user.id,
        email: user.email,
        voornaam: (user.user_metadata?.first_name as string) ?? null,
        aangemaakt: user.created_at,
      },
      gegevens,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="avinka-mijn-gegevens.json"',
      },
    });
  }

  // Niets gevraagd: dan wilde je het overzicht.
  return NextResponse.redirect(new URL("/mijn-gegevens", request.url));
}

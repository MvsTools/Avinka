import { createClient } from "@/utils/supabase/server";
import { haalOfMaakEigenBron } from "@/lib/agenda-eigen";
import { herken, SOORT_INFO, type Soort } from "@/lib/agenda-herken";

// Zelf een afspraak toevoegen, wijzigen of weghalen.
//
// WAAROM DIT MEER IS DAN "EEN REGELTJE OPSLAAN"
// Een afspraak die je hier invoert doet in de rest van het platform precies mee
// met wat er uit een gekoppelde agenda komt: hij staat in je dagbeeld, hij telt
// mee in het jaaroverzicht, en — dat is het punt — hij levert dezelfde signalen
// op in "Wat eraan komt". Zet je hier een gespreksavond in, dan krijg je drie
// weken van tevoren te horen dat je het rooster moet openzetten.
//
// Dat werkt alleen als `soort` klopt: dat veld bepaalt wélk signaal je krijgt.
// Daarom kiest de leerkracht het zelf, met de automatische herkenning als
// suggestie (`raad` hieronder). Bij een gekoppelde agenda moeten we raden; hier
// hoeft dat niet, en dan is zelf kiezen altijd beter.

export const runtime = "nodejs";

const SOORTEN = Object.keys(SOORT_INFO) as Soort[];
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const TIJD = /^\d{2}:\d{2}$/;

type Invoer = {
  id?: string;
  titel?: string;
  datum?: string;
  totDatum?: string;
  heleDag?: boolean;
  begin?: string;
  eind?: string;
  soort?: string;
};

/** Alles nakijken vóór het de database in gaat. Geeft de nette rij terug, of
 *  een uitlegbare fout — nooit een half ingevulde afspraak. */
function controleer(v: Invoer): { fout: string } | { rij: Record<string, unknown> } {
  const titel = String(v.titel ?? "").trim();
  if (!titel) return { fout: "Geef de afspraak een naam." };
  if (titel.length > 300) return { fout: "Die naam is te lang." };

  const datum = String(v.datum ?? "");
  if (!DATUM.test(datum)) return { fout: "Kies een datum." };

  const totDatum = String(v.totDatum ?? "") || datum;
  if (!DATUM.test(totDatum)) return { fout: "De einddatum klopt niet." };
  if (totDatum < datum) return { fout: "De einddatum ligt vóór de begindatum." };

  const heleDag = v.heleDag !== false;
  const begin = String(v.begin ?? "");
  const eind = String(v.eind ?? "");
  if (!heleDag) {
    if (!TIJD.test(begin)) return { fout: "Vul een begintijd in, of kies 'hele dag'." };
    if (eind && !TIJD.test(eind)) return { fout: "De eindtijd klopt niet." };
    if (eind && eind < begin && totDatum === datum) {
      return { fout: "De eindtijd ligt vóór de begintijd." };
    }
  }

  const soort = String(v.soort ?? "");
  if (!SOORTEN.includes(soort as Soort)) return { fout: "Kies wat voor soort afspraak dit is." };

  return {
    rij: {
      titel,
      datum,
      tot_datum: totDatum,
      hele_dag: heleDag,
      begintijd: heleDag || !begin ? null : `${begin}:00`,
      eindtijd: heleDag || !eind ? null : `${eind}:00`,
      soort,
      tijdvakken: 1,
      bijgewerkt: new Date().toISOString(),
    },
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });

  let invoer: Invoer;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ fout: "Onleesbare aanvraag." }, { status: 400 });
  }

  const uitslag = controleer(invoer);
  if ("fout" in uitslag) return Response.json({ fout: uitslag.fout }, { status: 400 });

  const bron = await haalOfMaakEigenBron(supabase, user.id);
  if ("fout" in bron) return Response.json({ fout: bron.fout }, { status: 500 });

  const { data, error } = await supabase
    .from("agenda_items")
    .insert({
      ...uitslag.rij,
      user_id: user.id,
      bron_id: bron.id,
      // Eigen afspraken hebben geen uid uit een agendabestand. We maken er een
      // die niet kan botsen met een gekoppelde agenda (die gebruikt datum|soort|tijd).
      uid: `eigen-${crypto.randomUUID()}`,
    })
    .select("id, datum, tot_datum, hele_dag, begintijd, eindtijd, titel, soort")
    .single();

  // .select() erachter, zodat een geblokkeerde insert niet als succes langskomt.
  if (error || !data) {
    return Response.json({ fout: "De afspraak kon niet worden opgeslagen." }, { status: 500 });
  }
  return Response.json({ afspraak: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });

  let invoer: Invoer;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ fout: "Onleesbare aanvraag." }, { status: 400 });
  }
  if (!invoer.id) return Response.json({ fout: "Welke afspraak?" }, { status: 400 });

  const uitslag = controleer(invoer);
  if ("fout" in uitslag) return Response.json({ fout: uitslag.fout }, { status: 400 });

  // Alleen je eigen afspraken zijn te wijzigen: wat uit een gekoppelde agenda
  // komt hoort bij de school en zou bij de eerstvolgende verversing toch weer
  // overschreven worden. Daarom de bron erbij in de voorwaarde.
  const bron = await haalOfMaakEigenBron(supabase, user.id);
  if ("fout" in bron) return Response.json({ fout: bron.fout }, { status: 500 });

  const { data, error } = await supabase
    .from("agenda_items")
    .update(uitslag.rij)
    .eq("id", invoer.id)
    .eq("bron_id", bron.id)
    .select("id, datum, tot_datum, hele_dag, begintijd, eindtijd, titel, soort")
    .single();

  if (error || !data) {
    return Response.json(
      { fout: "Die afspraak is niet gewijzigd. Komt hij uit een gekoppelde agenda?" },
      { status: 400 },
    );
  }
  return Response.json({ afspraak: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });

  let id: string | undefined;
  try {
    id = (await request.json())?.id;
  } catch {
    /* hieronder afgevangen */
  }
  if (!id) return Response.json({ fout: "Welke afspraak?" }, { status: 400 });

  const bron = await haalOfMaakEigenBron(supabase, user.id);
  if ("fout" in bron) return Response.json({ fout: bron.fout }, { status: 500 });

  const { data, error } = await supabase
    .from("agenda_items")
    .delete()
    .eq("id", id)
    .eq("bron_id", bron.id)
    .select("id");

  if (error || !data?.length) {
    return Response.json(
      { fout: "Die afspraak is niet verwijderd. Komt hij uit een gekoppelde agenda?" },
      { status: 400 },
    );
  }
  return Response.json({ ok: true });
}

/** Wat dénken wij dat dit voor afspraak is? Alleen een suggestie voor het
 *  formulier; de leerkracht kiest zelf. */
export async function GET(request: Request) {
  const titel = new URL(request.url).searchParams.get("titel") ?? "";
  return Response.json({ raad: titel.trim() ? herken(titel) : "overig" });
}

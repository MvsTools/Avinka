import { createClient } from "@/utils/supabase/server";
import {
  haalBronnen,
  haalGenegeerdeAanleidingen,
  haalMijnGroepen, haalPlanningContext, haalSchoolsystemen,
  haalPlanning,
  haalSchooljaren,
  vandaag,
} from "@/lib/planning";
import SchooljaarView from "@/components/dashboard/SchooljaarView";
import { haalOfMaakEigenBron } from "@/lib/agenda-eigen";

// Mijn schooljaar: het jaar van deze leerkracht, opgebouwd uit zijn eigen
// gekoppelde agenda's. Het ophalen gebeurt hier op de server, zodat het scherm
// meteen goed staat; de vier lagen eromheen zijn gewoon een andere blik op
// dezelfde gegevens (zie src/lib/planning).

export default async function SchooljaarPage({
  searchParams,
}: {
  searchParams: Promise<{ jaar?: string }>;
}) {
  const gekozen = (await searchParams).jaar;
  const supabase = await createClient();

  const nu = vandaag();
  const jaren = await haalSchooljaren(supabase, nu);
  const jaarId = jaren.some((j) => j.id === gekozen) ? gekozen : jaren[0]?.id;

  const { data: gebruiker } = await supabase.auth.getUser();
  const [bron, agendas, groepen, systemen, planContext, genegeerd] = await Promise.all([
    haalPlanning(supabase, { schooljaarId: jaarId, nu }),
    haalBronnen(supabase),
    haalMijnGroepen(supabase),
    haalSchoolsystemen(supabase),
    haalPlanningContext(supabase),
    haalGenegeerdeAanleidingen(supabase),
  ]);

  // De bron-id van je eigen, zelf ingevoerde afspraken. Die mag je wijzigen en
  // weghalen op de dag zelf; wat uit een gekoppelde agenda komt niet.
  const eigenBron = gebruiker.user
    ? await haalOfMaakEigenBron(supabase, gebruiker.user.id)
    : { fout: "geen sessie" };
  const eigenBronId = "id" in eigenBron ? eigenBron.id : null;

  return (
    <SchooljaarView
      bron={bron}
      jaren={jaren.map((j) => ({ id: j.id, label: j.label, afgesloten: j.afgesloten }))}
      vandaag={nu}
      agendas={agendas}
      mijnGroepen={groepen}
      systemen={systemen}
      context={planContext}
      eigenBronId={eigenBronId}
      genegeerd={genegeerd}
    />
  );
}

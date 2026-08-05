import { createClient } from "@/utils/supabase/server";
import {
  haalBronnen,
  haalMijnGroepen, haalPlanningContext, haalSchoolsystemen,
  haalPlanning,
  haalSchooljaren,
  vandaag,
} from "@/lib/planning";
import SchooljaarView from "@/components/dashboard/SchooljaarView";

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

  const [bron, agendas, groepen, systemen, planContext] = await Promise.all([
    haalPlanning(supabase, { schooljaarId: jaarId, nu }),
    haalBronnen(supabase),
    haalMijnGroepen(supabase),
    haalSchoolsystemen(supabase),
    haalPlanningContext(supabase),
  ]);

  return (
    <SchooljaarView
      bron={bron}
      jaren={jaren.map((j) => ({ id: j.id, label: j.label, afgesloten: j.afgesloten }))}
      vandaag={nu}
      agendas={agendas}
      mijnGroepen={groepen}
      systemen={systemen}
      context={planContext}
    />
  );
}

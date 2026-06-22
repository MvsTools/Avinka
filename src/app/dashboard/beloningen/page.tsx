import { createClient } from "@/utils/supabase/server";
import BeloningenView from "@/components/dashboard/BeloningenView";

export default async function BeloningenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lidSinds = user?.created_at ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Beloningen</h1>
        <p className="mt-2 text-lg text-ink/70">
          Help Avinka groeien en spaar voor mooie voordelen op je abonnement.
        </p>
      </div>
      <BeloningenView lidSinds={lidSinds} />
    </div>
  );
}

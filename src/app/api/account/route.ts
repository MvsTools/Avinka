import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Je account (en alle bijbehorende gegevens) definitief verwijderen.
// AVG: recht op vergetelheid (art. 17). De echte verwijdering doet de
// database-functie `verwijder_mijn_account()` (security definer): die haalt je
// rij uit auth.users, waarna alle app-tabellen via "on delete cascade" meegaan.
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("verwijder_mijn_account");
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // Sessie-cookies opruimen; de gebruiker bestaat nu niet meer.
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Geeft de (publieke) Supabase-gegevens + het sessie-token door aan een tool-
// pagina, zodat die live kan samenwerken via Supabase Realtime (presence +
// wijzigingen delen). Alleen voor ingelogde gebruikers. De url/key zijn de
// publieke NEXT_PUBLIC_-waarden; het token is dat van de eigen sessie.
export async function GET() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const {
    data: { session },
  } = await sb.auth.getSession();

  const email = user.email || "";
  const naam = email
    ? email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Iemand"
    : "Iemand";

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    token: session?.access_token ?? null,
    userId: user.id,
    naam,
  });
}

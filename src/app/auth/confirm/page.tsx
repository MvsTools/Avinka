import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { veiligIntern } from "@/lib/paden";
import { verzilverMailLink } from "./actie";
import Knop from "./Knop";

/* Hierheen komt de gebruiker via de link in een bevestigingsmail. Deze pagina
   DOET NIETS bij het openen: ze toont alleen een knop. Pas die klik verzilvert
   het token (zie ./actie.ts voor het waarom).

   ⚠️ HERSTELMAIL GAAT HIER NIET LANGS, die wordt doorgestuurd. Bij wachtwoord
   vergeten is er al een vervolgscherm waar iets in te vullen valt, en dan is een
   knoppagina ervóór een klik voor niets: we sturen het token dóór naar
   /nieuw-wachtwoord en wisselen het pas in bij het versturen van dát formulier.
   Zo werkt het bij de meeste grote partijen ook. Doorsturen mag hier gerust,
   want er wordt niets verzilverd. Bij een adreswijziging kan dat niet: daar is
   geen vervolgformulier, dus die houdt de knop.

   Werkt met beide soorten Supabase-links:
     - ?code=...                    (standaard-mailtemplate)
     - ?token_hash=...&type=...     (onze eigen sjablonen, docs/mailsjablonen.md)

   ⚠️ De mailsjablonen zijn hier NIET voor aangepast. Dezelfde link, dezelfde
   parameters; alleen wat er aan onze kant gebeurt is veranderd. */

type Zoek = {
  code?: string;
  token_hash?: string;
  type?: string;
  next?: string;
  email?: string;
};

// De tekst hangt af van waaróm iemand hier is. Bewust zonder uitleg over
// mailscanners: dat is een probleem van ons, niet van de lezer (keuze eigenaar
// 8-8). De kop noemt gewoon de handeling.
const TEKST: Record<string, { teken: string; kop: string; uitleg: string; knop: string }> = {
  // Geen `recovery` hier: die wordt hierboven doorgestuurd naar het scherm waar
  // je een nieuw wachtwoord kiest.
  // ⚠️ Kop kort houden en zonder streepje: "Bevestig je nieuwe e-mailadres"
  // brak in de kaart af als "Bevestig je nieuwe e- / mailadres".
  email_change: {
    teken: "✉️",
    kop: "Bevestig dit adres",
    uitleg: "Druk op de knop om dit adres aan je Avinka-account te koppelen.",
    knop: "Ga verder",
  },
  standaard: {
    teken: "✓",
    kop: "Nog één stap",
    uitleg: "Druk op de knop om verder te gaan.",
    knop: "Ga verder",
  },
};

function tekstVoor(type: string | undefined) {
  return TEKST[type ?? ""] ?? TEKST.standaard;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Zoek>;
}): Promise<Metadata> {
  const { type } = await searchParams;
  return {
    title: tekstVoor(type).kop,
    // Een pagina met een eenmalig token hoort nooit in een zoekmachine, ook niet
    // ná de livegang (dan valt de algemene noindex uit src/app/layout.tsx weg).
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmPagina({
  searchParams,
}: {
  searchParams: Promise<Zoek>;
}) {
  const { code, token_hash, type, next, email } = await searchParams;
  const bestemming = veiligIntern(next);

  // Zit er geen bruikbaar kaartje in de link, dan is er niets te bevestigen en
  // heeft een knop tonen geen zin.
  if (!code && !(token_hash && type)) {
    redirect("/sign-in?fout=link-verlopen");
  }

  // Wachtwoord vergeten: meteen dóór naar het scherm waar iets in te vullen valt.
  // Het token gaat mee in de link en wordt daar pas bij het versturen ingewisseld,
  // dus dit doorsturen gebruikt niets op.
  if (type === "recovery" && token_hash) {
    const naar = new URLSearchParams({ token_hash });
    // Het adres reist mee als de mail het meestuurde, zodat het wachtwoordscherm
    // ook op een ánder apparaat weet om welk account het gaat.
    if (email) naar.set("email", email);
    redirect(`/nieuw-wachtwoord?${naar}`);
  }

  const t = tekstVoor(type);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Logo vol className="h-16 w-auto" priority />
      </Link>

      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-xl sm:p-10">
        <span
          aria-hidden
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-3xl"
        >
          {t.teken}
        </span>
        <h1 className="mt-5 text-balance text-2xl font-bold text-ink">{t.kop}</h1>
        <p className="mt-3 leading-7 text-ink/70">{t.uitleg}</p>

        <form action={verzilverMailLink}>
          <input type="hidden" name="code" value={code ?? ""} />
          <input type="hidden" name="token_hash" value={token_hash ?? ""} />
          <input type="hidden" name="type" value={type ?? ""} />
          <input type="hidden" name="next" value={bestemming} />
          <Knop label={t.knop} />
        </form>
      </div>
    </div>
  );
}

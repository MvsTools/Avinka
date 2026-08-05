import Link from "next/link";
import { aanleidingen } from "@/lib/planning";
import type { PlanningBron } from "@/lib/planning";

// "Wat eraan komt" — het vooruitkijk-blok (fase 4 van Mijn schooljaar).
//
// Op Start staat de korte versie tussen de dagrij en de tools; in Mijn
// schooljaar zelf staat dezelfde strook met alles erin. Eén component, dus de
// twee kunnen elkaar niet tegenspreken.
//
// DRIE ONTWERPKEUZES:
// 1. **Geen leeg blok.** Is er niets aan de hand, dan staat er niets — geen
//    kaart met "geen signalen". Een blok dat er altijd staat maar meestal niets
//    zegt, leert mensen eroverheen te kijken.
// 2. **Eén object, geen losse kaartjes.** De signalen delen één kaart met een
//    haarlijn ertussen. Losse kaartjes zouden met de toolkaarten eronder gaan
//    concurreren, en die zijn de held van deze pagina.
// 3. **De knop zegt wat je gaat doen**, niet "beginnen": je leest in één regel
//    waar je heen gaat en waarom.

export default function WatEraanKomt({
  bron,
  vandaag,
  groepen = [],
  maximaal,
  vergrendeld = [],
  titel = "Wat eraan komt",
}: {
  bron: PlanningBron;
  vandaag: string;
  groepen?: number[];
  /** Op Start hooguit twee, zodat de tools eronder de held blijven. */
  maximaal?: number;
  /** Slugs van tools die niet in het pakket zitten; die wijzen naar het abonnement. */
  vergrendeld?: string[];
  titel?: string;
}) {
  const alles = aanleidingen(bron, vandaag, groepen);
  if (!alles.length) return null;
  const lijst = maximaal ? alles.slice(0, maximaal) : alles;

  return (
    <section>
      <h2 className="text-xl font-bold text-ink">{titel}</h2>
      <div className="mt-4 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        {lijst.map((a, i) => {
          const opSlot = vergrendeld.includes(a.tool.slug);
          return (
            <div
              key={a.id}
              className={
                "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:py-5" +
                (i > 0 ? " border-t border-black/5" : "")
              }
            >
              <div className="flex min-w-0 items-center gap-4">
                {/* Hetzelfde anker als de tegels erboven en de toolkaarten
                    eronder: een zacht getint vierkant met de tool-emoji. Zonder
                    dit viel de regel op een breed scherm uit elkaar in "tekst
                    links, knop rechts", en zag je pas op de knop om welke tool
                    het ging. */}
                <span
                  aria-hidden
                  className={
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl " + a.tool.tint
                  }
                >
                  {a.tool.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-bold leading-tight text-ink">{a.kop}</p>
                  <p className="mt-1 truncate text-sm text-ink/60">
                    {a.wanneer}
                    {a.detail && ` · ${a.detail}`}
                  </p>
                </div>
              </div>

              {/* Groen = hier kun je nu aan de slag. Zit de tool niet in je
                  pakket, dan hoort de knop die belofte ook niet te doen: die
                  wordt rustig en wit, zodat je in één blik ziet wat er wél kan. */}
              <Link
                href={opSlot ? "/dashboard/abonnement" : a.tool.pad!}
                className={
                  "shrink-0 self-start rounded-xl px-4 py-2 text-sm font-bold transition-transform duration-150 active:scale-[0.97] sm:self-auto " +
                  (opSlot
                    ? "border border-black/10 bg-white text-ink/60 hover:text-ink"
                    : "bg-brand-dark text-white")
                }
              >
                {/* Zit de tool niet in je pakket, dan zeggen we dat gewoon in
                    plaats van je naar een slotje te laten lopen.
                    Bewust GEEN tool-emoji op de knop: op het donkergroen vallen
                    de gekleurde emoji's uit elkaar (het envelopje wordt een
                    grijs blokje) en de knoptekst zegt het al. */}
                {opSlot ? "🔒 Zit niet in je pakket" : a.actie}
                <span aria-hidden> →</span>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

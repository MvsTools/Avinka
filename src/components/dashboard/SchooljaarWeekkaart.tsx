"use client";

import { bereikTekst, dagbeeld, kort, plus, volledig, weeknummer } from "@/lib/planning";
import type { PlanningBron } from "@/lib/planning";
import { Afspraakregel, Kaartvenster } from "./SchooljaarDagkaart";

// Klik op een weeknummer in de kalender en je ziet in één keer wat er die week
// speelt: per dag de afspraken met hun tijden. Dagen waarop niets bijzonders
// staat laten we weg — het gaat juist om wat eruit springt.

export default function SchooljaarWeekkaart({
  bron,
  maandag,
  sluit,
  groepen = [],
}: {
  bron: PlanningBron;
  /** De maandag van de week. */
  maandag: string;
  sluit: () => void;
  groepen?: number[];
}) {
  const dagen = [0, 1, 2, 3, 4, 5, 6].map((n) => dagbeeld(bron, plus(maandag, n)));
  const zondag = plus(maandag, 6);

  // Een vakantie of startweek geldt voor de hele week; die zetten we één keer
  // bovenaan in plaats van bij elke dag opnieuw.
  const schooldagen = dagen.slice(0, 5);
  const heleWeekVrij = schooldagen.every((d) => d.vakantie);
  const weekVakantie = heleWeekVrij ? schooldagen[0].vakantie : undefined;
  const startweek = schooldagen.some((d) => d.startweek);

  // Alleen dagen met iets bijzonders: afspraken, of een dag zonder les.
  const bijzonder = dagen
    .map((d) => ({ dag: d, afspraken: d.items.filter((i) => i.soort !== "vakantie") }))
    .filter(({ dag, afspraken }) => afspraken.length > 0 || dag.vrijReden === "vrije dag");

  return (
    <Kaartvenster titel={`Week ${weeknummer(maandag)}`} sluit={sluit}>
      <p className="mt-1 text-ink/55">{bereikTekst(maandag, zondag)}</p>

      {startweek && (
        <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 font-semibold text-amber-800">
          Startweek
        </p>
      )}
      {weekVakantie && (
        <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 font-semibold text-brand-dark">
          {weekVakantie.naam}, tot en met {kort(weekVakantie.tot)}
        </p>
      )}

      {bijzonder.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          {bijzonder.map(({ dag, afspraken }) => (
            <div key={dag.datum}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <p className="font-bold text-ink">{volledig(dag.datum).replace(/ \d{4}$/, "")}</p>
                {dag.vrijReden === "vrije dag" && (
                  <span className="rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-dark">
                    Geen les
                  </span>
                )}
              </div>
              {afspraken.length > 0 && (
                <ul className="mt-2 flex flex-col gap-2">
                  {afspraken.map((item) => (
                    <Afspraakregel key={item.id} item={item} groepen={groepen} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {!bijzonder.length && !weekVakantie && !startweek && (
        <p className="mt-4 text-ink/60">Niets bijzonders deze week.</p>
      )}
    </Kaartvenster>
  );
}

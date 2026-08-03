// De tegel uit de rij bovenaan Start (Vandaag / Vakantie / Deze dag /
// Overdracht). Staat in een eigen bestand omdat zowel VandaagRij als
// DuoOverdracht 'm gebruikt, en die twee kunnen elkaar niet importeren: de
// overdracht-tegel wordt juist ín VandaagRij geschoven.
//
// De opbouw ligt hier vast, zodat de tegels niet uit elkaar lopen: een
// icoonvlak met een label erachter, en daaronder één dikke regel met één fijne
// regel eronder. Meer past er niet in — een tegel die zijn hele inhoud
// uitschrijft maakt de rij twee keer zo hoog als de rest.
export default function DagTegel({
  icon,
  badge,
  label,
  labelKleur = "text-ink/40",
  achtergrond = "border-black/5 bg-white",
  onClick,
  children,
}: {
  icon: React.ReactNode;
  badge: string;
  label: string;
  labelKleur?: string;
  achtergrond?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-3xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " +
        achtergrond
      }
    >
      <div className="flex items-center gap-3">
        <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + badge}>
          {icon}
        </span>
        <p className={"text-xs font-bold uppercase tracking-wider " + labelKleur}>{label}</p>
      </div>
      {/* Vaste hoogte voor de inhoud: één dikke regel plus één fijne regel.
          Tegels waarvan die tweede regel soms wegvalt (geen vakantie meer, geen
          datum) zakken daardoor niet in, en de vier lijnen onderling uit. */}
      <div className="mt-2 min-h-11 pl-[52px]">{children}</div>
    </button>
  );
}

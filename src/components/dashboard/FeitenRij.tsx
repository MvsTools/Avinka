// Drie feiten naast elkaar, elk als label + groot getal/woord + een kleine
// toelichting. Eén keer goed uitgewerkt in Mijn schooljaar ("de drie dingen
// waar een leerkracht echt naar zoekt"), en van hier herbruikbaar.
export default function FeitenRij({
  feiten,
}: {
  feiten: { label: string; groot: string; klein: string }[];
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-3xl border border-black/5 bg-black/5 shadow-sm sm:grid-cols-3">
      {feiten.map((f) => (
        <div key={f.label} className="bg-white px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{f.label}</p>
          <p className="mt-1.5 text-lg font-bold leading-tight text-ink">{f.groot}</p>
          {f.klein && <p className="mt-0.5 text-sm text-ink/55">{f.klein}</p>}
        </div>
      ))}
    </div>
  );
}

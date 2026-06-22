// Lichtgewicht staafgrafiek (geen externe library). Voor reeksen over tijd, zoals
// aanmeldingen per maand of AI-kosten per dag.
export type BarPunt = { label: string; value: number; titel?: string };

export default function BarChart({
  data,
  kleur = "#2f9e6e",
  formatValue,
}: {
  data: BarPunt[];
  kleur?: string;
  formatValue?: (n: number) => string;
}) {
  if (data.length === 0) {
    return (
      <p className="rounded-2xl bg-cream px-4 py-6 text-center text-sm text-ink/50">
        Nog geen gegevens in deze periode.
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = formatValue ?? ((n: number) => n.toLocaleString("nl-NL"));

  return (
    <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
      {data.map((d, i) => (
        <div key={i} className="flex min-w-[26px] flex-1 flex-col items-center gap-1">
          <div className="flex h-28 w-full items-end">
            <div
              className="w-full rounded-t-md transition-all hover:opacity-80"
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%`, background: kleur }}
              title={`${d.titel ?? d.label}: ${fmt(d.value)}`}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-ink/50">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

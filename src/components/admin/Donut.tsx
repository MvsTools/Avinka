// Lichtgewicht donut-grafiek (pure SVG, geen externe library). Voor verdelingen
// zoals het aantal Start/Compleet/Pro-abonnementen.
export type DonutDeel = { label: string; value: number; kleur: string };

export default function Donut({
  data,
  size = 150,
  dik = 20,
}: {
  data: DonutDeel[];
  size?: number;
  dik?: number;
}) {
  const totaal = data.reduce((s, d) => s + d.value, 0);
  const r = (size - dik) / 2;
  const omtrek = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0000000f" strokeWidth={dik} />
          {totaal > 0 &&
            data.map((d, i) => {
              const len = (d.value / totaal) * omtrek;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={d.kleur}
                  strokeWidth={dik}
                  strokeDasharray={`${len} ${omtrek - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
        </g>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#1f2430"
          style={{ fontSize: 26, fontWeight: 600, fontFamily: "var(--font-serif, serif)" }}
        >
          {totaal}
        </text>
      </svg>

      <ul className="flex flex-col gap-2 text-sm">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: d.kleur }} />
            <span className="font-semibold text-ink">{d.label}</span>
            <span className="text-ink/55">
              {d.value}
              {totaal > 0 ? ` · ${Math.round((d.value / totaal) * 100)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

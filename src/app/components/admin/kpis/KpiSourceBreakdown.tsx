import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { SourceBucket } from "../../../lib/kpiCompute";

const FILLS = ["#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b"];

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.96)",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px -6px rgb(15 23 42 / 0.12)",
  fontSize: "12px",
  fontWeight: 500,
} as const;

interface Props {
  data: SourceBucket[];
  title: string;
  description: string;
}

export function KpiSourceBreakdown({ data, title, description }: Props) {
  if (!data.length || data.every((d) => d.count === 0)) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">Sin datos en el rango actual.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="mx-auto aspect-square w-full max-w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={92}
                paddingAngle={3}
                dataKey="count"
                nameKey="name"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={FILLS[i % FILLS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {data.map((row, i) => (
            <li key={row.name} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: FILLS[i % FILLS.length] }}
                  aria-hidden
                />
                <span className="truncate text-slate-700">{row.name}</span>
              </span>
              <span className="shrink-0 tabular-nums font-semibold text-brand-navy">
                {row.count} <span className="font-normal text-slate-400">({(row.share * 100).toFixed(1)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { PieChart as PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Lead } from "../../../data/leads";
import { groupLeadsBySource } from "../../../lib/leadFunnel";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

const CHART_SEGMENT_FILLS = ["#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155"];

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.96)",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px -6px rgb(15 23 42 / 0.12)",
  fontSize: "12px",
  fontWeight: 500,
} as const;

type Props = {
  leads: Lead[];
};

export function DashboardSourcesChart({ leads }: Props) {
  const sourceData = groupLeadsBySource(leads);

  return (
    <section className={dashboardCard}>
      <DashboardSectionHeader
        title="Origen de leads"
        description="Distribución por canal de captación"
      />
      {sourceData.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-16 text-sm text-slate-400">Sin datos de origen</p>
      ) : (
        <div className="grid flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="mx-auto aspect-square w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="52%" outerRadius="78%">
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={CHART_SEGMENT_FILLS[i % CHART_SEGMENT_FILLS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {sourceData.map((row, i) => (
              <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CHART_SEGMENT_FILLS[i % CHART_SEGMENT_FILLS.length] }}
                  />
                  <span className="truncate text-slate-700">{row.name}</span>
                </span>
                <span className="shrink-0 font-semibold text-brand-navy">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

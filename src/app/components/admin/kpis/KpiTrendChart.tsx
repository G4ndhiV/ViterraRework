import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { TrendPoint } from "../../../lib/kpiCompute";
import { formatMoney } from "../../../lib/kpiCompute";
import type { KpiSnapshot } from "../../../lib/supabaseKpis";

interface Props {
  trend: TrendPoint[];
  snapshots: KpiSnapshot[];
  scope: "user" | "group" | "company";
  scopeId: string | null;
}

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px -8px rgb(15 23 42 / 0.12)",
  fontSize: "12px",
  fontWeight: 500,
} as const;

export function KpiTrendChart({ trend, snapshots, scope, scopeId }: Props) {
  const merged = useMemo(() => {
    const byMonth = new Map<string, KpiSnapshot>();
    for (const s of snapshots) {
      if (s.scope !== scope) continue;
      if ((s.scopeId ?? null) !== (scopeId ?? null)) continue;
      byMonth.set(s.month, s);
    }
    return trend.map((p) => {
      const snap = byMonth.get(p.monthIso);
      const sn = (snap?.metrics ?? {}) as Record<string, number>;
      return {
        ...p,
        snapshotNewLeads: sn.new_leads ?? null,
        snapshotSales: sn.sales_count ?? null,
        snapshotVolume: sn.sales_volume ?? null,
      };
    });
  }, [trend, snapshots, scope, scopeId]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-brand-navy">Evolución mensual</h3>
          <p className="text-xs text-slate-500">
            Nuevos leads vs. cierres mensuales (líneas punteadas: snapshots Supabase si están disponibles).
          </p>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${formatMoney(Number(v))}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => {
                if (name.toLowerCase().includes("monto") || name.toLowerCase().includes("volume")) {
                  return [`$${formatMoney(v)}`, name];
                }
                return [v, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="newLeads"
              name="Nuevos leads"
              stroke="#141c2e"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="closedLeads"
              name="Cierres"
              stroke="#7f1d1d"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="salesVolume"
              name="Monto vendido"
              stroke="#475569"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

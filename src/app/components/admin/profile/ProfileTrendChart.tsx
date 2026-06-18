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

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px -8px rgb(15 23 42 / 0.12)",
  fontSize: "12px",
  fontWeight: 500,
} as const;

type Props = {
  trend: TrendPoint[];
};

export function ProfileTrendChart({ trend }: Props) {
  if (!trend.length || trend.every((p) => p.newLeads === 0 && p.closedLeads === 0 && p.salesVolume === 0)) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-brand-navy">Evolución mensual</h3>
        <p className="mt-2 text-sm text-slate-400">Sin actividad registrada en los últimos 6 meses.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-brand-navy">Evolución mensual</h3>
          <p className="text-xs text-slate-500">Últimos 6 meses · tus leads asignados</p>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
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
                if (name.toLowerCase().includes("monto")) {
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
              stroke="#c41e3a"
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

import { LineChart } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

export type DashboardTrendRow = { month: string; leads: number; conversiones: number };

type Props = {
  trendData: DashboardTrendRow[];
};

export function DashboardTrendChart({ trendData }: Props) {
  return (
    <section className={dashboardCard}>
      <DashboardSectionHeader
        title="Tendencia de leads"
        description="Últimos 6 meses · conversiones = cierres del mes"
      />
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id="dashColorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#141c2e" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#141c2e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dashColorConv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7f1d1d" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#7f1d1d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "12px", fontWeight: 500 }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: "12px", fontWeight: 500 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "13px",
              fontWeight: 500,
            }}
          />
          <Area type="monotone" dataKey="leads" stroke="#141c2e" strokeWidth={2} fill="url(#dashColorLeads)" name="Leads" />
          <Area
            type="monotone"
            dataKey="conversiones"
            stroke="#7f1d1d"
            strokeWidth={2}
            fill="url(#dashColorConv)"
            name="Cierres"
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

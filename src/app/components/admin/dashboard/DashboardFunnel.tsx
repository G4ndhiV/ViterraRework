import { LayoutGrid } from "lucide-react";
import type { Lead } from "../../../data/leads";
import type { CustomKanbanStage } from "../../../data/leads";
import { funnelChartData } from "../../../lib/leadFunnel";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

type Props = {
  leads: Lead[];
  customStages: CustomKanbanStage[];
};

export function DashboardFunnel({ leads, customStages }: Props) {
  const funnelData = funnelChartData(leads, customStages);
  const maxFunnel = Math.max(...funnelData.map((r) => r.value), 1);

  return (
    <section className={dashboardCard}>
      <DashboardSectionHeader
        title="Embudo de ventas"
        description="Prospectos por etapa del pipeline"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {funnelData.map((row) => (
          <div
            key={row.name}
            className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-center transition hover:border-slate-200 hover:bg-white"
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{row.name}</span>
            <span className="font-heading mt-1 text-xl text-brand-navy" style={{ fontWeight: 700 }}>
              {row.value}
            </span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-slate-600 transition-all duration-500"
                style={{ width: `${Math.max(8, (row.value / maxFunnel) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

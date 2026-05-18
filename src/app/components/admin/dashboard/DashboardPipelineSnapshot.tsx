import { LayoutGrid } from "lucide-react";
import { useMemo } from "react";
import type { Lead } from "../../../data/leads";
import type { CustomKanbanStage } from "../../../data/leads";
import { funnelChartData } from "../../../lib/leadFunnel";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

type Props = {
  leads: Lead[];
  customStages: CustomKanbanStage[];
  onOpenLeads: () => void;
};

export function DashboardPipelineSnapshot({ leads, customStages, onOpenLeads }: Props) {
  const stages = useMemo(() => {
    const withValues = funnelChartData(leads, customStages).filter((r) => r.value > 0);
    if (withValues.length <= 4) return withValues;
    return [...withValues].sort((a, b) => b.value - a.value).slice(0, 4);
  }, [leads, customStages]);

  const total = stages.reduce((s, r) => s + r.value, 0);

  return (
    <section className={dashboardCard}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <DashboardSectionHeader
          title="Pipeline"
          description={`${total} activos en etapas visibles`}
        />
        <button type="button" onClick={onOpenLeads} className="shrink-0 text-xs font-medium text-primary hover:underline">
          Ver leads
        </button>
      </div>
      {stages.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">Sin prospectos en pipeline</p>
      ) : (
        <ul className="space-y-2">
          {stages.map((row) => (
            <li key={row.name}>
              <button
                type="button"
                onClick={onOpenLeads}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-left transition hover:border-slate-200 hover:bg-white"
              >
                <span className="text-xs font-medium text-slate-600">{row.name}</span>
                <span className="font-heading text-lg font-semibold text-brand-navy">{row.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

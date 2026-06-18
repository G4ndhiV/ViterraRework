import { AlertTriangle, ChevronRight } from "lucide-react";
import type { Lead } from "../../../data/leads";
import { labelForLeadStatus, type CustomKanbanStage } from "../../../data/leads";
import { leadsNeedingAttention } from "../../../lib/leadFunnel";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

type Props = {
  leads: Lead[];
  customStages: CustomKanbanStage[];
  onOpenLeads: () => void;
  staleDays?: number;
};

export function DashboardAlerts({ leads, customStages, onOpenLeads, staleDays = 7 }: Props) {
  const rows = leadsNeedingAttention(leads, staleDays).slice(0, 5);

  return (
    <section className={dashboardCard}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <DashboardSectionHeader
          title="Requieren atención"
          description={`Sin contacto en más de ${staleDays} días`}
        />
        <button type="button" onClick={onOpenLeads} className="shrink-0 text-xs font-medium text-primary hover:underline">
          Ver leads
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Todo al día en seguimiento</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((lead) => (
            <li key={lead.id}>
              <button
                type="button"
                onClick={onOpenLeads}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-amber-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-navy">{lead.name}</p>
                  <p className="mt-0.5 truncate text-xs text-amber-800/80">
                    {labelForLeadStatus(lead.status, customStages)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                  Seguimiento
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

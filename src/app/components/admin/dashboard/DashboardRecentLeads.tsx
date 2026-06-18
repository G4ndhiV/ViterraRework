import { ChevronRight, Users } from "lucide-react";
import type { Lead } from "../../../data/leads";
import { labelForLeadStatus, type CustomKanbanStage } from "../../../data/leads";
import type { User } from "../../../contexts/AuthContext";
import { parseLeadTime } from "../../../lib/leadFunnel";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

type Props = {
  leads: Lead[];
  users: User[];
  customStages: CustomKanbanStage[];
  onOpenLeads: () => void;
  limit?: number;
};

function advisorLabel(lead: Lead, users: User[]): string {
  const uid = lead.assignedToUserId?.trim();
  if (uid) {
    const u = users.find((x) => x.id.toLowerCase() === uid.toLowerCase());
    if (u?.name?.trim()) return u.name.trim();
    if (u?.email?.trim()) return u.email.trim();
  }
  return lead.assignedTo?.trim() || "Sin asignar";
}

function recentLeads(leads: Lead[], limit = 5): Lead[] {
  return [...leads]
    .sort((a, b) => (parseLeadTime(b.createdAt) ?? 0) - (parseLeadTime(a.createdAt) ?? 0))
    .slice(0, limit);
}

export function DashboardRecentLeads({ leads, users, customStages, onOpenLeads, limit = 8 }: Props) {
  const rows = recentLeads(leads, limit);

  return (
    <section className={dashboardCard}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <DashboardSectionHeader title="Leads recientes" description="Últimas altas registradas" />
        <button
          type="button"
          onClick={onOpenLeads}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Ver todos
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Sin leads recientes</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((lead) => (
            <li key={lead.id}>
              <button
                type="button"
                onClick={onOpenLeads}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-slate-50/80"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-navy">{lead.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {labelForLeadStatus(lead.status, customStages)} · {advisorLabel(lead, users)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { AlertTriangle, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { useMemo } from "react";
import type { AgendaAppointment } from "../../../data/agenda";
import { AGENDA_STATUS_LABEL, parseAppointment } from "../../../data/agenda";
import type { Lead } from "../../../data/leads";
import { labelForLeadStatus, type CustomKanbanStage } from "../../../data/leads";
import { appointmentsNext48h, newLeadsWithoutContact } from "../../../lib/dashboardOps";
import { leadsNeedingAttention } from "../../../lib/leadFunnel";
import { cn } from "../../ui/utils";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

type PriorityItem =
  | { kind: "stale"; lead: Lead; sortKey: number }
  | { kind: "appointment"; apt: AgendaAppointment; sortKey: number; urgent: boolean }
  | { kind: "new_lead"; lead: Lead; sortKey: number };

type Props = {
  leads: Lead[];
  appointments: AgendaAppointment[];
  customStages: CustomKanbanStage[];
  staleDays?: number;
  maxItems?: number;
  onOpenLeads: () => void;
  onOpenAgenda: () => void;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildPriorityItems(
  leads: Lead[],
  appointments: AgendaAppointment[],
  staleDays: number,
): PriorityItem[] {
  const items: PriorityItem[] = [];

  for (const lead of leadsNeedingAttention(leads, staleDays)) {
    const last = lead.lastContact ?? lead.createdAt ?? "";
    items.push({ kind: "stale", lead, sortKey: Date.parse(last.includes("T") ? last : `${last}T12:00:00`) || 0 });
  }

  const now = Date.now();
  for (const apt of appointmentsNext48h(appointments)) {
    const t = parseAppointment(apt).start.getTime();
    const urgent = t - now < 24 * 3600000;
    items.push({ kind: "appointment", apt, sortKey: t, urgent });
  }

  for (const lead of newLeadsWithoutContact(leads)) {
    const created = lead.createdAt ?? "";
    items.push({
      kind: "new_lead",
      lead,
      sortKey: -(Date.parse(created.includes("T") ? created : `${created}T12:00:00`) || 0),
    });
  }

  items.sort((a, b) => {
    const rank = (x: PriorityItem) => {
      if (x.kind === "stale") return 0;
      if (x.kind === "appointment" && x.urgent) return 1;
      if (x.kind === "appointment") return 2;
      return 3;
    };
    const dr = rank(a) - rank(b);
    if (dr !== 0) return dr;
    return a.sortKey - b.sortKey;
  });

  return items;
}

export function DashboardPrioritiesPanel({
  leads,
  appointments,
  customStages,
  staleDays = 7,
  maxItems = 10,
  onOpenLeads,
  onOpenAgenda,
}: Props) {
  const rows = useMemo(
    () => buildPriorityItems(leads, appointments, staleDays).slice(0, maxItems),
    [leads, appointments, staleDays, maxItems],
  );

  return (
    <section className={dashboardCard}>
      <DashboardSectionHeader
        title="Prioridades de hoy"
        description="Seguimiento pendiente, citas próximas y altas nuevas"
      />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-emerald-900">Nada urgente por hoy</p>
          <p className="mt-1 text-xs text-emerald-800/80">Revisa leads recientes o abre la agenda cuando quieras.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => {
            if (row.kind === "stale") {
              return (
                <li key={`stale-${row.lead.id}`}>
                  <button
                    type="button"
                    onClick={onOpenLeads}
                    className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-amber-50/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand-navy">{row.lead.name}</p>
                      <p className="mt-0.5 truncate text-xs text-amber-900/80">
                        Sin seguimiento · {labelForLeadStatus(row.lead.status, customStages)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                      Urgente
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                  </button>
                </li>
              );
            }
            if (row.kind === "appointment") {
              return (
                <li key={`apt-${row.apt.id}`}>
                  <button
                    type="button"
                    onClick={onOpenAgenda}
                    className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50/80"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        row.urgent ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800",
                      )}
                    >
                      <Calendar className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand-navy">
                        {row.apt.title || row.apt.clientName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {formatWhen(row.apt.start)} · {AGENDA_STATUS_LABEL[row.apt.status]}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        row.urgent ? "bg-red-100 text-red-900" : "bg-sky-100 text-sky-900",
                      )}
                    >
                      {row.urgent ? "Hoy" : "48h"}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                  </button>
                </li>
              );
            }
            return (
              <li key={`new-${row.lead.id}`}>
                <button
                  type="button"
                  onClick={onOpenLeads}
                  className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50/80"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                    <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-navy">{row.lead.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      Alta reciente sin primer contacto · {labelForLeadStatus(row.lead.status, customStages)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-900">
                    Nuevo
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

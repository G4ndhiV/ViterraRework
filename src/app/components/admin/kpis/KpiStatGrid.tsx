import { Pencil, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../ui/utils";
import { formatDelta, formatHours, formatMoney, pctDelta, type CoreKpis } from "../../../lib/kpiCompute";
import type { AppointmentStats } from "../../../lib/kpiCompute";
import type { KpiTarget, KpiTargetMetric } from "../../../lib/supabaseKpis";
import { findActiveTarget } from "../../../hooks/useKpiData";

export interface StatCardClickContext {
  metric: KpiTargetMetric | "stale_leads" | "ticket_avg" | "weighted_pipeline" | "pipeline_days";
  scope: "user" | "group" | "company";
  scopeId: string | null;
  label: string;
  value: number;
}

interface CardProps {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  targetBadge?: ReactNode;
  onClick?: () => void;
  onEdit?: () => void;
}

function StatCard({ label, value, hint, delta, targetBadge, onClick, onEdit }: CardProps) {
  const fmtDelta = formatDelta(delta ?? null);
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:border-slate-300/80 hover:shadow-md sm:p-5",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>

      <p className="font-heading mt-3 text-2xl tracking-tight text-brand-navy sm:text-[1.65rem]" style={{ fontWeight: 700 }}>
        {value}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {fmtDelta.sign !== "na" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
              fmtDelta.sign === "up" && "bg-emerald-100 text-emerald-800",
              fmtDelta.sign === "down" && "bg-rose-100 text-rose-800",
              fmtDelta.sign === "flat" && "bg-slate-100 text-slate-600"
            )}
          >
            {fmtDelta.sign === "up" ? (
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
            ) : fmtDelta.sign === "down" ? (
              <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />
            ) : (
              <Minus className="h-3 w-3" strokeWidth={2.5} />
            )}
            {fmtDelta.label}
          </span>
        ) : null}

        {targetBadge}
      </div>

      {hint ? <p className="mt-2 text-xs leading-snug text-slate-500">{hint}</p> : null}

      {onEdit ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-brand-navy group-hover:opacity-100"
          title="Editar meta"
          aria-label="Editar meta"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}

function targetBadge(target: KpiTarget | null, current: number): ReactNode {
  if (!target || target.targetValue <= 0) return null;
  const pct = (current / target.targetValue) * 100;
  const cls =
    pct >= 100
      ? "bg-emerald-100 text-emerald-800"
      : pct >= 75
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-100 text-slate-600";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>
      Meta: {pct.toFixed(0)}% ({formatMoney(target.targetValue)})
    </span>
  );
}

interface Props {
  current: CoreKpis;
  previous: CoreKpis;
  yearAgo: CoreKpis;
  appointments: AppointmentStats;
  appointmentsPrev: AppointmentStats;
  compareYearOverYear: boolean;
  targets: KpiTarget[];
  targetScope: "user" | "group" | "company";
  targetScopeId: string | null;
  rangeStartIso: string;
  canEditTargets: boolean;
  onEditTarget?: (metric: KpiTargetMetric) => void;
  onDrilldown?: (ctx: StatCardClickContext) => void;
}

export function KpiStatGrid({
  current,
  previous,
  yearAgo,
  appointments,
  appointmentsPrev,
  compareYearOverYear,
  targets,
  targetScope,
  targetScopeId,
  rangeStartIso,
  canEditTargets,
  onEditTarget,
  onDrilldown,
}: Props) {
  const cmp = compareYearOverYear ? yearAgo : previous;
  const apptsCmp = appointmentsPrev; // siempre vs período anterior (snap diario por estado)

  const newLeadsTarget = findActiveTarget(targets, "new_leads", targetScope, targetScopeId, rangeStartIso);
  const salesTarget = findActiveTarget(targets, "sales_count", targetScope, targetScopeId, rangeStartIso);
  const volumeTarget = findActiveTarget(targets, "sales_volume", targetScope, targetScopeId, rangeStartIso);
  const conversionTarget = findActiveTarget(targets, "conversion_rate", targetScope, targetScopeId, rangeStartIso);
  const responseTarget = findActiveTarget(targets, "response_time_hours", targetScope, targetScopeId, rangeStartIso);
  const apptsTarget = findActiveTarget(targets, "appointments_completed", targetScope, targetScopeId, rangeStartIso);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Leads totales"
        value={current.totalLeads.toString()}
        delta={pctDelta(current.totalLeads, cmp.totalLeads)}
        onClick={() =>
          onDrilldown?.({ metric: "new_leads", scope: targetScope, scopeId: targetScopeId, label: "Leads totales", value: current.totalLeads })
        }
      />
      <StatCard
        label="Nuevos leads"
        value={current.newLeads.toString()}
        delta={pctDelta(current.newLeads, cmp.newLeads)}
        targetBadge={targetBadge(newLeadsTarget, current.newLeads)}
        onClick={() =>
          onDrilldown?.({ metric: "new_leads", scope: targetScope, scopeId: targetScopeId, label: "Nuevos leads", value: current.newLeads })
        }
        onEdit={canEditTargets ? () => onEditTarget?.("new_leads") : undefined}
      />
      <StatCard
        label="Tasa de conversión"
        value={`${(current.conversionRate * 100).toFixed(1)}%`}
        delta={pctDelta(current.conversionRate, cmp.conversionRate)}
        targetBadge={targetBadge(conversionTarget, current.conversionRate * 100)}
        onClick={() =>
          onDrilldown?.({ metric: "conversion_rate", scope: targetScope, scopeId: targetScopeId, label: "Conversión", value: current.conversionRate })
        }
        onEdit={canEditTargets ? () => onEditTarget?.("conversion_rate") : undefined}
      />
      <StatCard
        label="Ventas (cierres)"
        value={current.salesCount.toString()}
        delta={pctDelta(current.salesCount, cmp.salesCount)}
        targetBadge={targetBadge(salesTarget, current.salesCount)}
        onClick={() =>
          onDrilldown?.({ metric: "sales_count", scope: targetScope, scopeId: targetScopeId, label: "Cierres", value: current.salesCount })
        }
        onEdit={canEditTargets ? () => onEditTarget?.("sales_count") : undefined}
      />

      <StatCard
        label="Monto vendido"
        value={`$${formatMoney(current.salesVolume)}`}
        delta={pctDelta(current.salesVolume, cmp.salesVolume)}
        targetBadge={targetBadge(volumeTarget, current.salesVolume)}
        onClick={() =>
          onDrilldown?.({ metric: "sales_volume", scope: targetScope, scopeId: targetScopeId, label: "Monto vendido", value: current.salesVolume })
        }
        onEdit={canEditTargets ? () => onEditTarget?.("sales_volume") : undefined}
      />
      <StatCard
        label="Ticket promedio"
        value={`$${formatMoney(current.ticketAverage)}`}
        delta={pctDelta(current.ticketAverage, cmp.ticketAverage)}
      />
      <StatCard
        label="Tiempo en pipeline"
        value={current.avgPipelineDays == null ? "—" : `${current.avgPipelineDays.toFixed(0)} d`}
        delta={
          current.avgPipelineDays == null || cmp.avgPipelineDays == null
            ? null
            : pctDelta(current.avgPipelineDays, cmp.avgPipelineDays)
        }
      />
      <StatCard
        label="1° contacto"
        value={formatHours(current.avgFirstContactHours)}
        delta={
          current.avgFirstContactHours == null || cmp.avgFirstContactHours == null
            ? null
            : pctDelta(current.avgFirstContactHours, cmp.avgFirstContactHours)
        }
        targetBadge={targetBadge(responseTarget, current.avgFirstContactHours ?? 0)}
        onEdit={canEditTargets ? () => onEditTarget?.("response_time_hours") : undefined}
      />

      <StatCard
        label="Pipeline ponderado"
        value={`$${formatMoney(current.weightedPipelineValue)}`}
        delta={pctDelta(current.weightedPipelineValue, cmp.weightedPipelineValue)}
        hint="Budget × probabilidad por etapa"
      />
      <StatCard
        label="Sin contacto > 7d"
        value={current.staleLeads.toString()}
        delta={pctDelta(current.staleLeads, cmp.staleLeads)}
        hint="Leads abiertos sin último contacto reciente"
        onClick={() =>
          onDrilldown?.({ metric: "stale_leads", scope: targetScope, scopeId: targetScopeId, label: "Stale leads", value: current.staleLeads })
        }
      />
      <StatCard
        label="Citas completadas"
        value={appointments.completed.toString()}
        delta={pctDelta(appointments.completed, apptsCmp.completed)}
        targetBadge={targetBadge(apptsTarget, appointments.completed)}
        hint={`Agendadas: ${appointments.scheduled} · Canceladas: ${appointments.cancelled}`}
        onEdit={canEditTargets ? () => onEditTarget?.("appointments_completed") : undefined}
      />
      <StatCard
        label="Leads perdidos"
        value={current.lostLeads.toString()}
        delta={pctDelta(current.lostLeads, cmp.lostLeads)}
      />
    </div>
  );
}

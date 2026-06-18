import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Crown,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import type { ProfileMonthDelta } from "../../../lib/profileInsights";
import { ProfilePerformanceCharts } from "./ProfilePerformanceCharts";
import type { User } from "../../../contexts/AuthContext";
import type { Lead, CustomKanbanStage } from "../../../data/leads";
import type { AgendaAppointment } from "../../../data/agenda";
import type { UserGroup } from "../../../lib/userGroups";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { fetchKpiTargets, type KpiTarget } from "../../../lib/supabaseKpis";
import { buildProfileInsights } from "../../../lib/profileInsights";
import {
  downloadProfilePerformanceReportCsv,
  downloadProfilePerformanceReportExcel,
} from "../../../lib/profileReportExport";
import { downloadProfilePerformanceReportPdf } from "../../../lib/downloadProfilePerformanceReportPdf";
import { formatMoney } from "../../../lib/kpiCompute";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { cn } from "../../ui/utils";
import { profileSectionTitle } from "./profileUi";

type Props = {
  user: User;
  users: User[];
  userGroups: UserGroup[];
  leads: Lead[];
  appointments: AgendaAppointment[];
  customStages: CustomKanbanStage[];
  stageOrder: string[];
  leadsLoading?: boolean;
  onOpenKpis?: () => void;
};

function MonthDeltaChip({ row }: { row: ProfileMonthDelta }) {
  const delta = row.deltaPct;
  const up = delta != null && delta > 0;
  const down = delta != null && delta < 0;
  const display =
    row.format === "percent"
      ? `${row.current}%`
      : String(row.current);
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{row.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-heading text-xl font-semibold text-brand-navy">{display}</p>
        {delta != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              up && "bg-emerald-50 text-emerald-800",
              down && "bg-red-50 text-red-800",
              !up && !down && "bg-slate-100 text-slate-600",
            )}
          >
            {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : null}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">vs mes ant.</span>
        )}
      </div>
    </div>
  );
}

function formatApptWhen(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="font-heading mt-2 text-2xl font-semibold tracking-tight text-brand-navy">{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

function KpiProgressBar({
  label,
  displayActual,
  displayTarget,
  progress,
  lowerIsBetter,
}: {
  label: string;
  displayActual: string;
  displayTarget: string;
  progress: number | null;
  lowerIsBetter: boolean;
}) {
  const pct = progress != null ? Math.round(progress * 100) : null;
  const barPct = progress != null ? Math.min(100, Math.max(4, progress * 100)) : 8;
  const onTrack = progress != null && (lowerIsBetter ? progress >= 0.85 : progress >= 0.7);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-brand-navy">{label}</p>
        {pct != null ? (
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              onTrack ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
            )}
          >
            {pct}%
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{displayActual}</span>
        <span className="text-slate-400"> / meta {displayTarget}</span>
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            onTrack ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  );
}

export function ProfilePerformanceTab({
  user,
  users,
  userGroups,
  leads,
  appointments,
  customStages,
  stageOrder,
  leadsLoading,
  onOpenKpis,
}: Props) {
  const [targets, setTargets] = useState<KpiTarget[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setTargetsLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setTargetsLoading(true);
      const res = await fetchKpiTargets(client);
      if (!cancelled) {
        setTargets(res.data);
        setTargetsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const insights = useMemo(
    () =>
      buildProfileInsights({
        user,
        users,
        groups: userGroups,
        leads,
        appointments,
        customStages,
        stageOrder,
        targets,
      }),
    [user, users, userGroups, leads, appointments, customStages, stageOrder, targets],
  );

  const [exporting, setExporting] = useState(false);
  const loading = leadsLoading || targetsLoading;

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-7 w-7 animate-spin text-primary" strokeWidth={1.75} />
        <p className="text-sm">Calculando tu rendimiento…</p>
      </div>
    );
  }

  const handleExportPdf = async () => {
    const toastId = toast.loading("Generando PDF…");
    try {
      setExporting(true);
      await downloadProfilePerformanceReportPdf(insights, user);
      toast.success("Reporte descargado en PDF.", { id: toastId });
    } catch {
      toast.error("No se pudo generar el PDF.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      downloadProfilePerformanceReportExcel(insights, user);
      toast.success("Reporte descargado en Excel.");
    } catch {
      toast.error("No se pudo generar el archivo Excel.");
    }
  };

  const handleExportCsv = () => {
    try {
      downloadProfilePerformanceReportCsv(insights, user);
      toast.success("Reporte descargado en CSV.");
    } catch {
      toast.error("No se pudo generar el CSV.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={exporting}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              Descargar reporte
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => void handleExportPdf()} disabled={exporting}>
              <FileText className="mr-2 h-4 w-4" strokeWidth={1.75} />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" strokeWidth={1.75} />
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {onOpenKpis ? (
          <button
            type="button"
            onClick={onOpenKpis}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
          >
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Ver KPIs completos
            <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <section>
        <h3 className={profileSectionTitle}>Tu equipo</h3>
        {insights.groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
            <UsersRound className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.5} />
            <p className="mt-2 text-sm font-medium text-slate-600">Sin grupo asignado</p>
            <p className="mt-1 text-xs text-slate-500">
              {user.role === "admin"
                ? "Como administrador puedes ver todo el CRM; si te asignan a un equipo, aparecerá aquí."
                : "Cuando un administrador te incorpore a un equipo, verás el nombre del grupo y a tus compañeros."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {insights.groups.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.02]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-navy">{g.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Líder: <span className="font-medium text-slate-700">{g.leaderName}</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      g.role === "leader"
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                    )}
                  >
                    {g.role === "leader" ? (
                      <Crown className="h-3 w-3" strokeWidth={2} />
                    ) : (
                      <Users className="h-3 w-3" strokeWidth={2} />
                    )}
                    {g.role === "leader" ? "Líder" : "Miembro"}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-medium text-slate-500">
                  {g.memberCount} integrante{g.memberCount === 1 ? "" : "s"}
                </p>
                {g.teammates.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.teammates.slice(0, 6).map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex max-w-[10rem] truncate rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {m.name}
                      </span>
                    ))}
                    {g.teammates.length > 6 ? (
                      <span className="text-[11px] text-slate-400">+{g.teammates.length - 6} más</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">Eres el único miembro visible en este grupo.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h3 className={profileSectionTitle}>Rendimiento personal</h3>
          <p className="-mt-2 text-xs text-slate-500">{insights.rangeLabel} · leads asignados a ti</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            label="Pipeline activo"
            value={String(insights.stats.activePipeline)}
            hint="Leads abiertos a tu cargo"
          />
          <StatTile
            label="Nuevos leads"
            value={String(insights.stats.newLeadsMonth)}
            hint={insights.rangeLabel}
          />
          <StatTile
            label="Cierres"
            value={String(insights.stats.closedMonth)}
            hint={insights.rangeLabel}
          />
          <StatTile
            label="Conversión"
            value={`${insights.stats.conversionPct}%`}
            hint="Sobre leads con actividad del período"
          />
          <StatTile
            label="Sin seguimiento"
            value={String(insights.stats.staleLeads)}
            hint="Más de 7 días sin contacto"
          />
          <StatTile
            label="Citas"
            value={String(insights.stats.appointmentsMonth)}
            hint={`Agenda · ${insights.rangeLabel.toLowerCase()}`}
          />
        </div>
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-white p-4 shadow-sm ring-1 ring-slate-900/[0.03]">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Info className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-navy">Valor estimado del pipeline</p>
              <p className="font-heading mt-1 text-2xl font-semibold tracking-tight text-brand-navy">
                {formatMoney(insights.stats.pipelineValue)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Suma del presupuesto de tus leads abiertos, multiplicada por una probabilidad estimada de
                cierre según la etapa (ej. visita ~40%, oferta ~55%). Es una proyección de oportunidad, no
                ingreso confirmado.
              </p>
              {insights.pipelineByStage.length > 0 ? (
                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  {insights.pipelineByStage.slice(0, 5).map((row) => (
                    <li
                      key={row.stageLabel}
                      className="flex items-center justify-between gap-2 text-xs text-slate-600"
                    >
                      <span className="truncate">
                        {row.stageLabel}{" "}
                        <span className="text-slate-400">
                          ({row.leadCount} · ~{row.probabilityPct}% prob.)
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-slate-800">
                        {formatMoney(row.weightedValue)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {insights.monthComparison.map((row) => (
            <MonthDeltaChip key={row.label} row={row} />
          ))}
        </div>

        {(insights.stats.ticketAverage > 0 ||
          insights.stats.avgFirstContactHours != null ||
          insights.stats.avgPipelineDays != null) && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            {insights.stats.ticketAverage > 0 ? (
              <span>
                Ticket promedio:{" "}
                <strong className="text-slate-800">{formatMoney(insights.stats.ticketAverage)}</strong>
              </span>
            ) : null}
            {insights.stats.avgFirstContactHours != null ? (
              <span>
                1.er contacto:{" "}
                <strong className="text-slate-800">
                  {insights.stats.avgFirstContactHours.toFixed(1)} h
                </strong>
              </span>
            ) : null}
            {insights.stats.avgPipelineDays != null ? (
              <span>
                Días en pipeline (cierres):{" "}
                <strong className="text-slate-800">
                  {insights.stats.avgPipelineDays.toFixed(0)} d
                </strong>
              </span>
            ) : null}
          </div>
        )}
      </section>

      {(insights.priorityLeads.length > 0 || insights.upcomingAppointments.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {insights.priorityLeads.length > 0 ? (
            <div>
              <h3 className={profileSectionTitle}>Prioridades de hoy</h3>
              <ul className="space-y-2">
                {insights.priorityLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm shadow-sm"
                  >
                    <p className="font-semibold text-brand-navy">{lead.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {lead.stageLabel} · {lead.daysSinceContact} d sin contacto
                      {lead.budget > 0 ? ` · ${formatMoney(lead.budget)}` : ""}
                    </p>
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                        lead.reason === "stale"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {lead.reason === "stale" ? "Sin seguimiento" : "Alto valor"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {insights.upcomingAppointments.length > 0 ? (
            <div>
              <h3 className={profileSectionTitle}>Próximas citas (7 días)</h3>
              <ul className="space-y-2">
                {insights.upcomingAppointments.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm shadow-sm"
                  >
                    <p className="font-semibold text-brand-navy">{a.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {a.clientName} · {formatApptWhen(a.start)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      <section>
        <h3 className={profileSectionTitle}>Gráficos</h3>
        <ProfilePerformanceCharts insights={insights} />
      </section>

      <section>
        <h3 className={profileSectionTitle}>Metas KPI activas</h3>
        {insights.kpiProgress.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-7 text-center">
            <Target className="mx-auto h-7 w-7 text-slate-300" strokeWidth={1.5} />
            <p className="mt-2 text-sm font-medium text-slate-600">Sin metas configuradas</p>
            <p className="mt-1 text-xs text-slate-500">
              Las metas mensuales se definen en el módulo KPI&apos;s (por usuario o por equipo).
            </p>
            {onOpenKpis ? (
              <button
                type="button"
                onClick={onOpenKpis}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Ir a KPI&apos;s
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.kpiProgress.map((row) => (
              <KpiProgressBar
                key={`${row.metric}-${row.label}`}
                label={row.label}
                displayActual={row.displayActual}
                displayTarget={row.displayTarget}
                progress={row.progress}
                lowerIsBetter={row.lowerIsBetter}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

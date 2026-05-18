import type { User } from "../contexts/AuthContext";
import type { Lead, CustomKanbanStage } from "../data/leads";
import { labelForLeadStatus } from "../data/leads";
import type { AgendaAppointment } from "../data/agenda";
import type { UserGroup } from "./userGroups";
import { getGroupsContainingUser, getGroupsLedByUser } from "./kpiAccess";
import {
  buildDateRange,
  comparePeriods,
  computeCoreKpis,
  computeFunnelRates,
  computeSourceBreakdown,
  computeTrendFromLeads,
  formatMoney,
  isClosedLead,
  isLostLead,
  parseLeadTime,
  stageWinProbability,
  type DateRange,
  type FunnelStageStat,
  type SourceBucket,
  type TrendPoint,
} from "./kpiCompute";
import { findActiveTarget } from "../hooks/useKpiData";
import type { KpiTarget, KpiTargetMetric } from "./supabaseKpis";
import { foldSearchText } from "./searchText";

const METRIC_LABELS: Record<KpiTargetMetric, string> = {
  sales_count: "Cierres",
  sales_volume: "Monto vendido",
  new_leads: "Nuevos leads",
  conversion_rate: "Conversión",
  response_time_hours: "1° contacto (máx.)",
  appointments_completed: "Citas completadas",
};

export type ProfileGroupCard = {
  id: string;
  name: string;
  role: "leader" | "member";
  leaderName: string;
  memberCount: number;
  teammates: Array<{ id: string; name: string }>;
};

export type ProfileKpiProgress = {
  metric: KpiTargetMetric;
  label: string;
  target: number;
  actual: number;
  displayActual: string;
  displayTarget: string;
  progress: number | null;
  lowerIsBetter: boolean;
};

export type ProfilePersonalStats = {
  activePipeline: number;
  newLeadsMonth: number;
  closedMonth: number;
  conversionPct: number;
  staleLeads: number;
  appointmentsMonth: number;
  pipelineValue: number;
  ticketAverage: number;
  avgFirstContactHours: number | null;
  avgPipelineDays: number | null;
};

export type ProfilePipelineStageRow = {
  stageLabel: string;
  leadCount: number;
  weightedValue: number;
  probabilityPct: number;
};

export type ProfileMonthDelta = {
  label: string;
  current: number;
  previous: number;
  deltaPct: number | null;
  format: "number" | "percent";
};

export type ProfilePriorityLead = {
  id: string;
  name: string;
  stageLabel: string;
  budget: number;
  daysSinceContact: number;
  reason: "stale" | "high_value";
};

export type ProfileUpcomingAppointment = {
  id: string;
  title: string;
  clientName: string;
  start: string;
  status: string;
};

export type ProfileInsights = {
  groups: ProfileGroupCard[];
  stats: ProfilePersonalStats;
  kpiProgress: ProfileKpiProgress[];
  rangeLabel: string;
  funnel: FunnelStageStat[];
  sources: SourceBucket[];
  trend: TrendPoint[];
  pipelineByStage: ProfilePipelineStageRow[];
  monthComparison: ProfileMonthDelta[];
  priorityLeads: ProfilePriorityLead[];
  upcomingAppointments: ProfileUpcomingAppointment[];
};

function leadAssignedToUser(lead: Lead, user: User): boolean {
  const uid = lead.assignedToUserId?.trim().toLowerCase();
  const crmId = user.id.trim().toLowerCase();
  if (uid && crmId && uid === crmId) return true;
  const tokko = user.tokkoUserId?.trim().toLowerCase();
  if (uid && tokko && uid === tokko) return true;
  const at = foldSearchText(lead.assignedTo);
  const nm = foldSearchText(user.name);
  if (!at || !nm) return false;
  return at.includes(nm) || nm.includes(at);
}

export function filterMyLeads(leads: Lead[], user: User): Lead[] {
  return leads.filter((l) => leadAssignedToUser(l, user));
}

function isInRange(t: number | null, range: DateRange): boolean {
  if (t == null) return false;
  return t >= range.start && t < range.end;
}

function countAppointmentsMonth(appts: AgendaAppointment[], user: User, range: DateRange): number {
  const name = foldSearchText(user.name);
  if (!name) return 0;
  let n = 0;
  for (const a of appts) {
    if (a.status === "cancelled") continue;
    if (foldSearchText(a.staffName) !== name) continue;
    const t = parseLeadTime(a.start);
    if (isInRange(t, range)) n += 1;
  }
  return n;
}

function activePipelineCount(leads: Lead[], customStages: CustomKanbanStage[]): number {
  return leads.filter((l) => !isClosedLead(l, customStages) && !isLostLead(l, customStages)).length;
}

function formatMetricValue(metric: KpiTargetMetric, value: number): string {
  if (metric === "sales_volume") return formatMoney(value);
  if (metric === "conversion_rate") return `${value.toFixed(1)}%`;
  if (metric === "response_time_hours") return value > 0 ? `${value.toFixed(1)} h` : "—";
  if (metric === "appointments_completed") return String(Math.round(value));
  return String(Math.round(value));
}

function metricActual(
  metric: KpiTargetMetric,
  kpis: ReturnType<typeof computeCoreKpis>,
  appointmentsMonth: number,
): number {
  switch (metric) {
    case "sales_count":
      return kpis.salesCount;
    case "sales_volume":
      return kpis.salesVolume;
    case "new_leads":
      return kpis.newLeads;
    case "conversion_rate":
      return kpis.conversionRate * 100;
    case "response_time_hours":
      return kpis.avgFirstContactHours ?? 0;
    case "appointments_completed":
      return appointmentsMonth;
    default:
      return 0;
  }
}

function progressForMetric(
  metric: KpiTargetMetric,
  actual: number,
  target: number,
): number | null {
  if (target <= 0) return null;
  if (metric === "response_time_hours") {
    if (actual <= 0) return 1;
    return Math.min(1, target / actual);
  }
  return Math.min(1, actual / target);
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function computePipelineStageBreakdown(
  leads: Lead[],
  customStages: CustomKanbanStage[],
): ProfilePipelineStageRow[] {
  const byStage = new Map<
    string,
    { label: string; count: number; weighted: number; prob: number }
  >();

  for (const l of leads) {
    if (isClosedLead(l, customStages) || isLostLead(l, customStages)) continue;
    const lab = labelForLeadStatus(l.status, customStages);
    const prob = stageWinProbability(lab);
    const budget = Number(l.budget) || 0;
    const row = byStage.get(lab) ?? { label: lab, count: 0, weighted: 0, prob };
    row.count += 1;
    row.weighted += budget * prob;
    byStage.set(lab, row);
  }

  return [...byStage.values()]
    .map((r) => ({
      stageLabel: r.label,
      leadCount: r.count,
      weightedValue: r.weighted,
      probabilityPct: Math.round(r.prob * 1000) / 10,
    }))
    .sort((a, b) => b.weightedValue - a.weightedValue)
    .slice(0, 8);
}

function daysSinceContact(lead: Lead): number {
  const last =
    parseLeadTime(lead.lastContact) ??
    parseLeadTime(lead.updatedAt) ??
    parseLeadTime(lead.createdAt);
  if (last == null) return 999;
  return Math.floor((Date.now() - last) / 86400000);
}

function buildPriorityLeads(
  myLeads: Lead[],
  customStages: CustomKanbanStage[],
): ProfilePriorityLead[] {
  const stale7d = Date.now() - 7 * 86400000;
  const open = myLeads.filter((l) => !isClosedLead(l, customStages) && !isLostLead(l, customStages));

  const stale: ProfilePriorityLead[] = [];
  const highValue: ProfilePriorityLead[] = [];

  for (const l of open) {
    const last =
      parseLeadTime(l.lastContact) ??
      parseLeadTime(l.updatedAt) ??
      parseLeadTime(l.createdAt);
    const days = daysSinceContact(l);
    const item: ProfilePriorityLead = {
      id: l.id,
      name: l.name,
      stageLabel: labelForLeadStatus(l.status, customStages),
      budget: Number(l.budget) || 0,
      daysSinceContact: days,
      reason: "stale",
    };
    if (last != null && last < stale7d) stale.push(item);
    else if ((Number(l.budget) || 0) >= 500_000) highValue.push({ ...item, reason: "high_value" });
  }

  stale.sort((a, b) => b.daysSinceContact - a.daysSinceContact);
  highValue.sort((a, b) => b.budget - a.budget);

  const seen = new Set<string>();
  const out: ProfilePriorityLead[] = [];
  for (const item of [...stale, ...highValue]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
    if (out.length >= 5) break;
  }
  return out;
}

function buildUpcomingAppointments(
  appts: AgendaAppointment[],
  user: User,
): ProfileUpcomingAppointment[] {
  const name = foldSearchText(user.name);
  if (!name) return [];
  const now = Date.now();
  const weekEnd = now + 7 * 86400000;
  return appts
    .filter((a) => {
      if (a.status === "cancelled") return false;
      if (foldSearchText(a.staffName) !== name) return false;
      const t = parseLeadTime(a.start);
      return t != null && t >= now && t < weekEnd;
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: a.title,
      clientName: a.clientName,
      start: a.start,
      status: a.status,
    }));
}

export function buildProfileInsights(params: {
  user: User;
  users: User[];
  groups: UserGroup[];
  leads: Lead[];
  appointments: AgendaAppointment[];
  customStages: CustomKanbanStage[];
  stageOrder: string[];
  targets: KpiTarget[];
}): ProfileInsights {
  const { user, users, groups, leads, appointments, customStages, stageOrder, targets } = params;
  const range = buildDateRange("month");
  const comparison = comparePeriods(range);
  const rangeStartIso = new Date(range.start).toISOString().slice(0, 10);
  const myLeads = filterMyLeads(leads, user);
  const kpis = computeCoreKpis(myLeads, customStages, range);
  const prevKpis = computeCoreKpis(myLeads, customStages, comparison.previous);
  const appointmentsMonth = countAppointmentsMonth(appointments, user, range);

  const memberGroups = getGroupsContainingUser(user, groups);
  const ledGroups = getGroupsLedByUser(user, groups);
  const ledIds = new Set(ledGroups.map((g) => g.id));

  const groupCards: ProfileGroupCard[] = memberGroups.map((g) => {
    const leader = users.find((u) => u.id === g.leaderId);
    const teammates = g.memberIds
      .filter((id) => id !== user.id)
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is User => Boolean(u))
      .map((u) => ({ id: u.id, name: u.name }));
    return {
      id: g.id,
      name: g.name,
      role: ledIds.has(g.id) ? "leader" : "member",
      leaderName: leader?.name ?? "Sin líder asignado",
      memberCount: g.memberIds.length,
      teammates,
    };
  });

  const kpiMetrics: KpiTargetMetric[] = [
    "sales_count",
    "new_leads",
    "conversion_rate",
    "appointments_completed",
    "sales_volume",
    "response_time_hours",
  ];

  const kpiProgress: ProfileKpiProgress[] = [];
  for (const metric of kpiMetrics) {
    const targetRow = findActiveTarget(targets, metric, "user", user.id, rangeStartIso);
    if (!targetRow) continue;
    const actual = metricActual(metric, kpis, appointmentsMonth);
    const target = targetRow.targetValue;
    kpiProgress.push({
      metric,
      label: METRIC_LABELS[metric],
      target,
      actual,
      displayActual: formatMetricValue(metric, actual),
      displayTarget: formatMetricValue(metric, target),
      progress: progressForMetric(metric, actual, target),
      lowerIsBetter: metric === "response_time_hours",
    });
  }

  for (const g of groupCards) {
    if (g.role !== "leader") continue;
    const gDef = groups.find((x) => x.id === g.id);
    if (!gDef) continue;
    const memberIds = new Set(gDef.memberIds);
    const tokkos = new Set(
      users
        .filter((u) => memberIds.has(u.id))
        .map((u) => u.tokkoUserId?.trim() ?? "")
        .filter(Boolean),
    );
    const teamLeads = leads.filter((l) => {
      const aid = l.assignedToUserId?.trim() ?? "";
      return memberIds.has(aid) || tokkos.has(aid);
    });
    const groupKpis = computeCoreKpis(teamLeads, customStages, range);

    for (const metric of kpiMetrics) {
      const targetRow = findActiveTarget(targets, metric, "group", g.id, rangeStartIso);
      if (!targetRow) continue;
      const actual = metricActual(metric, groupKpis, appointmentsMonth);
      kpiProgress.push({
        metric,
        label: `${METRIC_LABELS[metric]} · ${g.name}`,
        target: targetRow.targetValue,
        actual,
        displayActual: formatMetricValue(metric, actual),
        displayTarget: formatMetricValue(metric, targetRow.targetValue),
        progress: progressForMetric(metric, actual, targetRow.targetValue),
        lowerIsBetter: metric === "response_time_hours",
      });
    }
  }

  const monthComparison: ProfileMonthDelta[] = [
    {
      label: "Nuevos leads",
      current: kpis.newLeads,
      previous: prevKpis.newLeads,
      deltaPct: pctDelta(kpis.newLeads, prevKpis.newLeads),
      format: "number",
    },
    {
      label: "Cierres",
      current: kpis.salesCount,
      previous: prevKpis.salesCount,
      deltaPct: pctDelta(kpis.salesCount, prevKpis.salesCount),
      format: "number",
    },
    {
      label: "Conversión",
      current: Math.round(kpis.conversionRate * 1000) / 10,
      previous: Math.round(prevKpis.conversionRate * 1000) / 10,
      deltaPct: pctDelta(kpis.conversionRate * 100, prevKpis.conversionRate * 100),
      format: "percent",
    },
  ];

  return {
    groups: groupCards,
    stats: {
      activePipeline: activePipelineCount(myLeads, customStages),
      newLeadsMonth: kpis.newLeads,
      closedMonth: kpis.salesCount,
      conversionPct: Math.round(kpis.conversionRate * 1000) / 10,
      staleLeads: kpis.staleLeads,
      appointmentsMonth,
      pipelineValue: kpis.weightedPipelineValue,
      ticketAverage: kpis.ticketAverage,
      avgFirstContactHours: kpis.avgFirstContactHours,
      avgPipelineDays: kpis.avgPipelineDays,
    },
    kpiProgress,
    rangeLabel: "Este mes",
    funnel: computeFunnelRates(myLeads, stageOrder, customStages),
    sources: computeSourceBreakdown(myLeads).slice(0, 8),
    trend: computeTrendFromLeads(myLeads, customStages, 6),
    pipelineByStage: computePipelineStageBreakdown(myLeads, customStages),
    monthComparison,
    priorityLeads: buildPriorityLeads(myLeads, customStages),
    upcomingAppointments: buildUpcomingAppointments(appointments, user),
  };
}

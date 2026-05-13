import type { Lead, CustomKanbanStage } from "../data/leads";
import { labelForLeadStatus } from "../data/leads";
import type { Property } from "../components/PropertyCard";
import type { AgendaAppointment } from "../data/agenda";
import { foldSearchText } from "./searchText";

// ---------------------------------------------------------------------------
// Tipos comunes
// ---------------------------------------------------------------------------

export type DateRangeKey = "month" | "3m" | "6m" | "12m" | "ytd" | "custom";

export interface DateRange {
  key: DateRangeKey;
  /** Inclusivo (ms epoch). */
  start: number;
  /** Exclusivo (ms epoch). */
  end: number;
}

export interface PeriodComparison {
  current: DateRange;
  previous: DateRange;
  yearAgo: DateRange;
}

// ---------------------------------------------------------------------------
// Helpers de fecha
// ---------------------------------------------------------------------------

export function startOfMonthMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime();
}

export function startOfNextMonthMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0).getTime();
}

export function shiftMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1, 0, 0, 0, 0);
}

export function buildDateRange(key: DateRangeKey, customFromIso?: string, customToIso?: string): DateRange {
  const now = new Date();
  if (key === "custom" && customFromIso && customToIso) {
    const start = Date.parse(`${customFromIso}T00:00:00`);
    const end = Date.parse(`${customToIso}T23:59:59.999`) + 1;
    return { key, start: Number.isFinite(start) ? start : 0, end: Number.isFinite(end) ? end : Date.now() };
  }
  if (key === "month") {
    return { key, start: startOfMonthMs(now), end: startOfNextMonthMs(now) };
  }
  if (key === "ytd") {
    return { key, start: new Date(now.getFullYear(), 0, 1).getTime(), end: startOfNextMonthMs(now) };
  }
  const map: Record<Exclude<DateRangeKey, "month" | "custom" | "ytd">, number> = {
    "3m": 3,
    "6m": 6,
    "12m": 12,
  };
  const months = map[key as Exclude<DateRangeKey, "month" | "custom" | "ytd">] ?? 1;
  const startDate = shiftMonths(now, -(months - 1));
  return { key, start: startOfMonthMs(startDate), end: startOfNextMonthMs(now) };
}

/** Período inmediatamente anterior de la misma duración + período del año pasado. */
export function comparePeriods(range: DateRange): PeriodComparison {
  const span = range.end - range.start;
  const previous: DateRange = {
    key: range.key,
    start: range.start - span,
    end: range.start,
  };
  const ms365 = 365 * 86400000;
  const yearAgo: DateRange = {
    key: range.key,
    start: range.start - ms365,
    end: range.end - ms365,
  };
  return { current: range, previous, yearAgo };
}

export function parseLeadTime(raw: string | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const t = Date.parse(s.includes("T") ? s : `${s}T12:00:00`);
  return Number.isNaN(t) ? null : t;
}

function isInRange(t: number | null, range: DateRange): boolean {
  if (t == null) return false;
  return t >= range.start && t < range.end;
}

function foldStage(s: string): string {
  return foldSearchText(s).replace(/\s+/g, " ").trim();
}

export function isClosedLead(lead: Lead, customStages: CustomKanbanStage[]): boolean {
  if (lead.status === "cerrado") return true;
  const id = foldStage(lead.status);
  if (id.includes("cerrad")) return true;
  const lab = foldStage(labelForLeadStatus(lead.status, customStages));
  return lab.includes("cerrad");
}

export function isLostLead(lead: Lead, customStages: CustomKanbanStage[]): boolean {
  const id = foldStage(lead.status);
  if (id.includes("perdid")) return true;
  const lab = foldStage(labelForLeadStatus(lead.status, customStages));
  return lab.includes("perdid");
}

export function leadClosedAt(lead: Lead): number | null {
  return parseLeadTime(lead.updatedAt) ?? parseLeadTime(lead.lastContact) ?? parseLeadTime(lead.createdAt);
}

// ---------------------------------------------------------------------------
// KPIs principales
// ---------------------------------------------------------------------------

export interface CoreKpis {
  totalLeads: number;
  newLeads: number;
  closedLeads: number;
  lostLeads: number;
  conversionRate: number; // 0..1
  salesCount: number;
  salesVolume: number;
  ticketAverage: number;
  avgPipelineDays: number | null;
  avgFirstContactHours: number | null;
  staleLeads: number; // sin contactar > 7 días
  weightedPipelineValue: number;
}

export function computeCoreKpis(
  leads: Lead[],
  customStages: CustomKanbanStage[],
  range: DateRange
): CoreKpis {
  let totalLeads = 0;
  let newLeads = 0;
  let closedLeads = 0;
  let lostLeads = 0;
  let salesCount = 0;
  let salesVolume = 0;
  const pipelineDays: number[] = [];
  const firstContactHours: number[] = [];
  let staleLeads = 0;
  const stale7d = Date.now() - 7 * 86400000;

  for (const l of leads) {
    const created = parseLeadTime(l.createdAt);
    const closedAt = leadClosedAt(l);
    const lastContact = parseLeadTime(l.lastContact);

    const inRangeAny =
      isInRange(created, range) || isInRange(closedAt, range) || isInRange(lastContact, range);
    if (!inRangeAny) continue;

    totalLeads += 1;

    if (isInRange(created, range)) newLeads += 1;

    const closed = isClosedLead(l, customStages);
    const lost = isLostLead(l, customStages);
    if (closed) closedLeads += 1;
    if (lost) lostLeads += 1;

    if (closed && isInRange(closedAt, range)) {
      salesCount += 1;
      salesVolume += Number(l.budget) || 0;
      if (created != null && closedAt != null) {
        pipelineDays.push((closedAt - created) / 86400000);
      }
    }

    if (created != null && lastContact != null && lastContact >= created) {
      firstContactHours.push((lastContact - created) / 3600000);
    }

    if (!closed && !lost) {
      const lastTouch = lastContact ?? parseLeadTime(l.updatedAt) ?? created;
      if (lastTouch != null && lastTouch < stale7d) staleLeads += 1;
    }
  }

  const conversionRate = totalLeads > 0 ? closedLeads / totalLeads : 0;
  const ticketAverage = salesCount > 0 ? salesVolume / salesCount : 0;
  const avgPipelineDays = pipelineDays.length
    ? pipelineDays.reduce((a, b) => a + b, 0) / pipelineDays.length
    : null;
  const avgFirstContactHours = firstContactHours.length
    ? firstContactHours.reduce((a, b) => a + b, 0) / firstContactHours.length
    : null;

  const weightedPipelineValue = computeWeightedPipelineValue(leads, customStages);

  return {
    totalLeads,
    newLeads,
    closedLeads,
    lostLeads,
    conversionRate,
    salesCount,
    salesVolume,
    ticketAverage,
    avgPipelineDays,
    avgFirstContactHours,
    staleLeads,
    weightedPipelineValue,
  };
}

// ---------------------------------------------------------------------------
// Funnel: tasa de avance entre etapas (en orden del pipeline configurado)
// ---------------------------------------------------------------------------

export interface FunnelStageStat {
  id: string;
  label: string;
  count: number;
  /** % que pasa de esta etapa a la siguiente (0..1). null en la última etapa. */
  conversionToNext: number | null;
}

export function computeFunnelRates(
  leads: Lead[],
  stageOrder: string[],
  customStages: CustomKanbanStage[]
): FunnelStageStat[] {
  if (!stageOrder.length) return [];
  const counts = new Map<string, number>();
  for (const id of stageOrder) counts.set(id, 0);
  for (const l of leads) {
    const id = l.status?.trim();
    if (id && counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const out: FunnelStageStat[] = [];
  let cumulativeAfter = 0;
  for (let i = 0; i < stageOrder.length; i += 1) {
    const id = stageOrder[i];
    const c = counts.get(id) ?? 0;
    cumulativeAfter += c;
    out.push({
      id,
      label: labelForLeadStatus(id, customStages),
      count: c,
      conversionToNext: null,
    });
  }
  for (let i = 0; i < out.length - 1; i += 1) {
    const cur = out[i].count;
    const next = out[i + 1].count;
    out[i].conversionToNext = cur > 0 ? Math.min(1, next / cur) : null;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Origen / fuentes
// ---------------------------------------------------------------------------

export interface SourceBucket {
  name: string;
  count: number;
  share: number;
}

export function computeSourceBreakdown(leads: Lead[]): SourceBucket[] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const k = (l.source || "Sin origen").trim() || "Sin origen";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = leads.length || 1;
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, share: count / total }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Distribución por tipo / operación
// ---------------------------------------------------------------------------

export function computePropertyTypeDistribution(properties: Property[]): SourceBucket[] {
  const counts = new Map<string, number>();
  for (const p of properties) {
    const k = (p.type || "Otro").trim() || "Otro";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = properties.length || 1;
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, share: count / total }))
    .sort((a, b) => b.count - a.count);
}

export function computeOperationDistribution(properties: Property[]): SourceBucket[] {
  let venta = 0;
  let alquiler = 0;
  for (const p of properties) {
    if (p.status === "venta") venta += 1;
    else if (p.status === "alquiler") alquiler += 1;
  }
  const total = venta + alquiler || 1;
  return [
    { name: "Venta", count: venta, share: venta / total },
    { name: "Alquiler", count: alquiler, share: alquiler / total },
  ];
}

// ---------------------------------------------------------------------------
// Inventario sin movimiento > 60 días
// ---------------------------------------------------------------------------

export function computePropertiesStale(properties: Property[], days = 60): Property[] {
  const cutoff = Date.now() - days * 86400000;
  return properties.filter((p) => {
    const t = p.listedAtIso ? Date.parse(p.listedAtIso) : NaN;
    if (Number.isNaN(t)) return false;
    return t < cutoff && p.listingInventory !== "vendida";
  });
}

// ---------------------------------------------------------------------------
// Pipeline ponderado
// ---------------------------------------------------------------------------

/**
 * Pondera el budget de cada lead por una probabilidad heurística según el nombre de la etapa.
 * No requiere histórico; sirve cuando aún no hay suficientes datos para una probabilidad real.
 */
export function stageWinProbability(label: string): number {
  const f = foldStage(label);
  if (/cerrad/.test(f)) return 1;
  if (/perdid|cancel|descart|desist/.test(f)) return 0;
  if (/promes|contrato|escritur|firma|oferta\s*acept/.test(f)) return 0.85;
  if (/negoci/.test(f)) return 0.6;
  if (/oferta/.test(f)) return 0.55;
  if (/visita/.test(f)) return 0.4;
  if (/cita|programad/.test(f)) return 0.3;
  if (/calific/.test(f)) return 0.25;
  if (/contactad/.test(f)) return 0.15;
  if (/nuevo/.test(f)) return 0.08;
  return 0.1;
}

export function computeWeightedPipelineValue(
  leads: Lead[],
  customStages: CustomKanbanStage[]
): number {
  let total = 0;
  for (const l of leads) {
    if (isClosedLead(l, customStages) || isLostLead(l, customStages)) continue;
    const lab = labelForLeadStatus(l.status, customStages);
    const p = stageWinProbability(lab);
    total += (Number(l.budget) || 0) * p;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Ranking por asesor
// ---------------------------------------------------------------------------

export interface AdvisorRow {
  userId: string;
  name: string;
  totalLeads: number;
  closed: number;
  lost: number;
  conversionRate: number;
  salesVolume: number;
  ticketAverage: number;
  avgResponseHours: number | null;
}

export function computeAdvisorRanking(
  leads: Lead[],
  customStages: CustomKanbanStage[],
  range: DateRange,
  resolveName: (lead: Lead) => { id: string; name: string }
): AdvisorRow[] {
  const map = new Map<
    string,
    {
      userId: string;
      name: string;
      totalLeads: number;
      closed: number;
      lost: number;
      salesVolume: number;
      responseHours: number[];
    }
  >();
  for (const l of leads) {
    const created = parseLeadTime(l.createdAt);
    const closedAt = leadClosedAt(l);
    const lastContact = parseLeadTime(l.lastContact);
    if (!isInRange(created, range) && !isInRange(closedAt, range) && !isInRange(lastContact, range))
      continue;

    const { id, name } = resolveName(l);
    const key = id || `name:${foldSearchText(name)}`;
    const row = map.get(key) ?? {
      userId: id,
      name,
      totalLeads: 0,
      closed: 0,
      lost: 0,
      salesVolume: 0,
      responseHours: [],
    };
    row.totalLeads += 1;
    if (isClosedLead(l, customStages) && isInRange(closedAt, range)) {
      row.closed += 1;
      row.salesVolume += Number(l.budget) || 0;
    }
    if (isLostLead(l, customStages)) row.lost += 1;
    if (created != null && lastContact != null && lastContact >= created) {
      row.responseHours.push((lastContact - created) / 3600000);
    }
    map.set(key, row);
  }
  return [...map.values()]
    .map((r) => ({
      userId: r.userId,
      name: r.name,
      totalLeads: r.totalLeads,
      closed: r.closed,
      lost: r.lost,
      conversionRate: r.totalLeads > 0 ? r.closed / r.totalLeads : 0,
      salesVolume: r.salesVolume,
      ticketAverage: r.closed > 0 ? r.salesVolume / r.closed : 0,
      avgResponseHours: r.responseHours.length
        ? r.responseHours.reduce((a, b) => a + b, 0) / r.responseHours.length
        : null,
    }))
    .sort((a, b) => b.salesVolume - a.salesVolume || b.closed - a.closed);
}

// ---------------------------------------------------------------------------
// Citas / agenda
// ---------------------------------------------------------------------------

export interface AppointmentStats {
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export function computeAppointmentStats(appts: AgendaAppointment[], range: DateRange): AppointmentStats {
  let pending = 0;
  let confirmed = 0;
  let completed = 0;
  let cancelled = 0;
  for (const a of appts) {
    const t = Date.parse(a.start);
    if (Number.isNaN(t) || t < range.start || t >= range.end) continue;
    if (a.status === "pending") pending += 1;
    else if (a.status === "confirmed") confirmed += 1;
    else if (a.status === "completed") completed += 1;
    else if (a.status === "cancelled") cancelled += 1;
  }
  return {
    scheduled: pending + confirmed,
    confirmed,
    completed,
    cancelled,
    total: pending + confirmed + completed + cancelled,
  };
}

// ---------------------------------------------------------------------------
// Tendencia (a partir de leads en memoria; sirve cuando no hay snapshots)
// ---------------------------------------------------------------------------

export interface TrendPoint {
  monthIso: string; // YYYY-MM-01
  label: string; // 'Ene 26'
  newLeads: number;
  closedLeads: number;
  salesVolume: number;
}

const MONTH_LABELS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function computeTrendFromLeads(
  leads: Lead[],
  customStages: CustomKanbanStage[],
  monthsBack: number
): TrendPoint[] {
  const now = new Date();
  const points: TrendPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const start = shiftMonths(now, -i);
    const end = shiftMonths(now, -i + 1);
    const range: DateRange = { key: "month", start: start.getTime(), end: end.getTime() };
    let newLeads = 0;
    let closedLeads = 0;
    let salesVolume = 0;
    for (const l of leads) {
      const created = parseLeadTime(l.createdAt);
      const closedAt = leadClosedAt(l);
      if (isInRange(created, range)) newLeads += 1;
      if (isClosedLead(l, customStages) && isInRange(closedAt, range)) {
        closedLeads += 1;
        salesVolume += Number(l.budget) || 0;
      }
    }
    points.push({
      monthIso: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
      label: `${MONTH_LABELS_ES[start.getMonth()]} ${String(start.getFullYear()).slice(2)}`,
      newLeads,
      closedLeads,
      salesVolume,
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Heatmap día x hora (no usado en versión actual de UI extendida, pero útil)
// ---------------------------------------------------------------------------

export function bucketByDayHour(leads: Lead[]): number[][] {
  // grid[day(0..6)][hour(0..23)] = count
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const l of leads) {
    const t = parseLeadTime(l.createdAt);
    if (t == null) continue;
    const d = new Date(t);
    grid[d.getDay()][d.getHours()] += 1;
  }
  return grid;
}

// ---------------------------------------------------------------------------
// CSV (sin libs)
// ---------------------------------------------------------------------------

function escapeCsvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function csvFromRows(headers: string[], rows: Array<Record<string, unknown>>): string {
  const head = headers.map(escapeCsvCell).join(",");
  const body = rows
    .map((r) => headers.map((h) => escapeCsvCell(r[h])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Delta helpers
// ---------------------------------------------------------------------------

export function pctDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return null; // sin denominador comparable
  }
  return (current - previous) / Math.abs(previous);
}

export function formatDelta(delta: number | null): { sign: "up" | "down" | "flat" | "na"; label: string } {
  if (delta == null) return { sign: "na", label: "—" };
  if (Math.abs(delta) < 0.0005) return { sign: "flat", label: "0%" };
  const pct = (delta * 100).toFixed(1).replace(/\.0$/, "");
  return { sign: delta > 0 ? "up" : "down", label: `${delta > 0 ? "+" : ""}${pct}%` };
}

export function formatHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 24) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

export function formatMoney(n: number): string {
  return n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

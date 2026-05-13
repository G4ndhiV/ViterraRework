import type { SupabaseClient } from "@supabase/supabase-js";

export type KpiTargetScope = "user" | "group" | "company";
export type KpiTargetMetric =
  | "sales_count"
  | "sales_volume"
  | "new_leads"
  | "conversion_rate"
  | "response_time_hours"
  | "appointments_completed";
export type KpiTargetPeriod = "monthly" | "quarterly" | "yearly";

export interface KpiTarget {
  id: string;
  scope: KpiTargetScope;
  scopeId: string | null;
  metric: KpiTargetMetric;
  period: KpiTargetPeriod;
  targetValue: number;
  /** YYYY-MM-DD */
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface KpiSnapshot {
  scope: KpiTargetScope;
  scopeId: string | null;
  /** YYYY-MM-01 */
  month: string;
  metrics: Record<string, number>;
  computedAt: string;
}

type TargetRow = {
  id: string;
  scope: KpiTargetScope;
  scope_id: string | null;
  metric: KpiTargetMetric;
  period: KpiTargetPeriod;
  target_value: number | string;
  effective_from: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type SnapshotRow = {
  scope: KpiTargetScope;
  scope_id: string | null;
  month: string;
  metrics: Record<string, number>;
  computed_at: string;
};

function rowToTarget(row: TargetRow): KpiTarget {
  return {
    id: row.id,
    scope: row.scope,
    scopeId: row.scope_id,
    metric: row.metric,
    period: row.period,
    targetValue: Number(row.target_value) || 0,
    effectiveFrom: String(row.effective_from).slice(0, 10),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

function rowToSnapshot(row: SnapshotRow): KpiSnapshot {
  return {
    scope: row.scope,
    scopeId: row.scope_id,
    month: String(row.month).slice(0, 10),
    metrics: row.metrics ?? {},
    computedAt: row.computed_at,
  };
}

export async function fetchKpiTargets(
  client: SupabaseClient
): Promise<{ data: KpiTarget[]; error: { message: string } | null }> {
  const res = await client
    .from("kpi_targets")
    .select("*")
    .order("effective_from", { ascending: false });
  if (res.error) return { data: [], error: { message: res.error.message } };
  return { data: ((res.data ?? []) as TargetRow[]).map(rowToTarget), error: null };
}

export interface UpsertKpiTargetInput {
  id?: string;
  scope: KpiTargetScope;
  scopeId: string | null;
  metric: KpiTargetMetric;
  period: KpiTargetPeriod;
  targetValue: number;
  effectiveFrom: string;
}

export async function upsertKpiTarget(
  client: SupabaseClient,
  input: UpsertKpiTargetInput
): Promise<{ data: KpiTarget | null; error: { message: string } | null }> {
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    scope: input.scope,
    scope_id: input.scopeId,
    metric: input.metric,
    period: input.period,
    target_value: input.targetValue,
    effective_from: input.effectiveFrom,
    updated_at: new Date().toISOString(),
  };
  const res = await client
    .from("kpi_targets")
    .upsert(payload, { onConflict: "scope,scope_id,metric,period,effective_from" })
    .select("*")
    .single();
  if (res.error) return { data: null, error: { message: res.error.message } };
  return { data: rowToTarget(res.data as TargetRow), error: null };
}

export async function deleteKpiTarget(
  client: SupabaseClient,
  id: string
): Promise<{ error: { message: string } | null }> {
  const res = await client.from("kpi_targets").delete().eq("id", id);
  if (res.error) return { error: { message: res.error.message } };
  return { error: null };
}

/**
 * Trae snapshots mensuales en el rango [fromMonth, toMonth] (YYYY-MM-DD inclusivo del primer día del mes).
 */
export async function fetchKpiSnapshots(
  client: SupabaseClient,
  fromMonth: string,
  toMonth: string
): Promise<{ data: KpiSnapshot[]; error: { message: string } | null }> {
  const res = await client
    .from("kpi_monthly_snapshots")
    .select("*")
    .gte("month", fromMonth)
    .lte("month", toMonth)
    .order("month", { ascending: true });
  if (res.error) return { data: [], error: { message: res.error.message } };
  return { data: ((res.data ?? []) as SnapshotRow[]).map(rowToSnapshot), error: null };
}

/** Llama a la función SQL `recompute_kpi_monthly_snapshots(month)`. Solo admin. */
export async function recomputeMonthlySnapshots(
  client: SupabaseClient,
  month: string
): Promise<{ rowsWritten: number; error: { message: string } | null }> {
  const res = await client.rpc("recompute_kpi_monthly_snapshots", { month_start: month });
  if (res.error) return { rowsWritten: 0, error: { message: res.error.message } };
  return { rowsWritten: Number(res.data) || 0, error: null };
}

/** Recalcula un rango de meses (típico: últimos 12). Devuelve cuántas filas se escribieron en total. */
export async function recomputeMonthlySnapshotsRange(
  client: SupabaseClient,
  monthsIso: string[]
): Promise<{ rowsWritten: number; error: { message: string } | null }> {
  let total = 0;
  for (const m of monthsIso) {
    const res = await recomputeMonthlySnapshots(client, m);
    if (res.error) return { rowsWritten: total, error: res.error };
    total += res.rowsWritten;
  }
  return { rowsWritten: total, error: null };
}

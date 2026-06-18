import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogEntityType, CatalogActivityAction } from "./catalogActivityPayload";

export type CatalogActivitySource = "admin" | "tokko_sync";

export type CatalogActivityRow = {
  id: string;
  created_at: string;
  entity_type: CatalogEntityType;
  entity_id: string;
  action: CatalogActivityAction;
  actor_user_id: string | null;
  actor_name: string | null;
  source: CatalogActivitySource;
  snapshot: Record<string, unknown>;
  diff: Record<string, unknown> | null;
};

export type InsertCatalogActivityInput = Omit<CatalogActivityRow, "id" | "created_at"> & {
  id?: string;
};

export async function insertCatalogActivity(
  client: SupabaseClient,
  input: InsertCatalogActivityInput
): Promise<{ error: Error | null }> {
  const row = {
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    action: input.action,
    actor_user_id: input.actor_user_id,
    actor_name: input.actor_name,
    source: input.source ?? "admin",
    snapshot: input.snapshot,
    diff: input.diff ?? null,
  };
  const res = await client.from("catalog_activities").insert(row).select("id").maybeSingle();
  if (res.error) {
    return { error: new Error(res.error.message) };
  }
  return { error: null };
}

function localDayStartIso(dateStr: string): string {
  const parts = dateStr.split("-").map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return new Date(0).toISOString();
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function localDayEndIso(dateStr: string): string {
  const parts = dateStr.split("-").map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return new Date(0).toISOString();
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

export type FetchCatalogActivitiesParams = {
  limit?: number;
  /** ISO timestamp: filas con created_at estrictamente menor (paginación). */
  beforeCreatedAt?: string;
  entityType?: CatalogEntityType | "all";
  /** Si tiene elementos, solo esas acciones. Vacío = sin restricción de acción. */
  actions?: CatalogActivityAction[];
  /** Fecha local YYYY-MM-DD, inicio del día inclusive */
  dateFrom?: string;
  /** Fecha local YYYY-MM-DD, fin del día inclusive */
  dateTo?: string;
  /** Subcadena insensible a mayúsculas sobre `actor_name`; vacío = sin filtro */
  actorNameContains?: string;
};

export async function fetchCatalogActivities(
  client: SupabaseClient,
  params: FetchCatalogActivitiesParams = {}
): Promise<{ data: CatalogActivityRow[] | null; error: Error | null }> {
  const limit = Math.min(Math.max(params.limit ?? 40, 1), 100);
  let q = client.from("catalog_activities").select("*").order("created_at", { ascending: false }).limit(limit);

  if (params.beforeCreatedAt) {
    q = q.lt("created_at", params.beforeCreatedAt);
  }
  if (params.entityType && params.entityType !== "all") {
    q = q.eq("entity_type", params.entityType);
  }
  if (params.dateFrom?.trim()) {
    q = q.gte("created_at", localDayStartIso(params.dateFrom.trim()));
  }
  if (params.dateTo?.trim()) {
    q = q.lte("created_at", localDayEndIso(params.dateTo.trim()));
  }
  const nameNeedle = params.actorNameContains?.trim();
  if (nameNeedle) {
    // Evitar que %, _ o \ alteren el patrón ILIKE
    const safe = nameNeedle.replace(/[%_\\]/g, "");
    if (safe.length > 0) {
      q = q.ilike("actor_name", `%${safe}%`);
    }
  }
  if (params.actions && params.actions.length > 0) {
    q = q.in("action", params.actions);
  }

  const res = await q;
  if (res.error) {
    return { data: null, error: new Error(res.error.message) };
  }
  return { data: (res.data ?? []) as CatalogActivityRow[], error: null };
}

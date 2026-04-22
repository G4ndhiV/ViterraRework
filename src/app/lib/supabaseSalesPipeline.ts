import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDefaultBuiltinPipelineSnapshot,
  createEmptyGroupPipelineSnapshot,
  DEFAULT_PIPELINE_GROUP_ID,
  parseGroupPipelineConfigFromUnknown,
  type GroupPipelineSnapshot,
} from "./pipelineByGroup";

type PipelineRow = {
  group_id: string;
  config: unknown;
};

export async function fetchSalesPipelineConfigs(client: SupabaseClient): Promise<{
  data: PipelineRow[];
  error: { message: string } | null;
}> {
  const res = await client
    .from("sales_pipeline_configs")
    .select("group_id,config")
    .order("group_id", { ascending: true });
  if (res.error) {
    return { data: [], error: { message: res.error.message } };
  }
  return { data: (res.data ?? []) as PipelineRow[], error: null };
}

export function buildPipelineByGroupFromSources(
  dbRows: PipelineRow[],
  allowedGroupIds: string[],
  localLegacy: Record<string, GroupPipelineSnapshot>
): Record<string, GroupPipelineSnapshot> {
  const fromDb = new Map<string, GroupPipelineSnapshot>();
  for (const r of dbRows) {
    fromDb.set(r.group_id, parseGroupPipelineConfigFromUnknown(r.config));
  }
  const out: Record<string, GroupPipelineSnapshot> = {};
  for (const gid of allowedGroupIds) {
    const row = fromDb.get(gid);
    if (row) {
      out[gid] = row;
    } else if (localLegacy[gid]) {
      out[gid] = localLegacy[gid];
    } else if (gid === DEFAULT_PIPELINE_GROUP_ID) {
      out[gid] = createDefaultBuiltinPipelineSnapshot();
    } else {
      out[gid] = createEmptyGroupPipelineSnapshot();
    }
  }
  for (const [k, v] of Object.entries(localLegacy)) {
    if (allowedGroupIds.includes(k) && !Object.prototype.hasOwnProperty.call(out, k)) {
      out[k] = v;
    }
  }
  return out;
}

export async function persistSalesPipelineConfigs(
  client: SupabaseClient,
  map: Record<string, GroupPipelineSnapshot>
): Promise<{ error: { message: string } | null }> {
  const now = new Date().toISOString();
  const rows = Object.entries(map).map(([group_id, config]) => ({
    group_id,
    config: config as unknown as Record<string, unknown>,
    updated_at: now,
  }));
  if (rows.length === 0) return { error: null };
  const res = await client.from("sales_pipeline_configs").upsert(rows, { onConflict: "group_id" });
  if (res.error) return { error: { message: res.error.message } };
  return { error: null };
}

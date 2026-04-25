import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LeadClientNote, LeadActivityEntry } from "../data/leads";
import { normalizeLeadPipelineStatus, normalizeStoredLead } from "../data/leads";
import { DEFAULT_PIPELINE_GROUP_ID } from "./pipelineByGroup";

const nowIso = () => new Date().toISOString();

type LeadPayloadShape = {
  pipelineGroupId?: string;
  activity?: LeadActivityEntry[];
  clientNotes?: LeadClientNote[];
  relatedPropertyId?: string;
  relatedDevelopmentId?: string;
};

function parsePayload(raw: unknown): LeadPayloadShape {
  if (!raw || typeof raw !== "object") return {};
  return raw as LeadPayloadShape;
}

function tsFromDateField(value: string): string {
  if (value.includes("T")) return new Date(value).toISOString();
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function rowToLead(row: Record<string, unknown>): Lead {
  const payload = parsePayload(row.payload);
  return normalizeStoredLead({
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    interest: (row.interest as Lead["interest"]) ?? "compra",
    propertyType: String(row.property_type ?? ""),
    budget: typeof row.budget === "number" ? row.budget : Number(row.budget) || 0,
    location: String(row.location ?? ""),
    status:
      typeof row.status === "string" && row.status.length > 0
        ? normalizeLeadPipelineStatus(row.status)
        : "nuevo",
    priorityStars: row.priority_stars as Lead["priorityStars"],
    source: String(row.source ?? ""),
    assignedTo: String(row.assigned_to ?? ""),
    assignedToUserId: String(row.assigned_to_user_id ?? ""),
    pipelineGroupId: payload.pipelineGroupId ?? DEFAULT_PIPELINE_GROUP_ID,
    clientNotes: payload.clientNotes,
    relatedPropertyId:
      typeof payload.relatedPropertyId === "string" ? payload.relatedPropertyId : undefined,
    relatedDevelopmentId:
      typeof payload.relatedDevelopmentId === "string" ? payload.relatedDevelopmentId : undefined,
    activity: payload.activity,
    createdAt: row.created_at ? String(row.created_at).split("T")[0] : undefined,
    lastContact: row.last_contact ? String(row.last_contact).split("T")[0] : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  } as Partial<Lead> & Record<string, unknown>);
}

function leadPayloadForDb(lead: Lead): Record<string, unknown> {
  return {
    pipelineGroupId: lead.pipelineGroupId,
    activity: lead.activity ?? [],
    clientNotes: lead.clientNotes ?? [],
    relatedPropertyId: lead.relatedPropertyId ?? null,
    relatedDevelopmentId: lead.relatedDevelopmentId ?? null,
  };
}

function leadToInsertRow(lead: Lead, ts: string) {
  const tokkoId = `manual_${lead.id}`;
  return {
    id: lead.id,
    tokko_id: tokkoId,
    name: lead.name,
    email: lead.email || null,
    phone: lead.phone || null,
    interest: lead.interest,
    property_type: lead.propertyType || null,
    budget: lead.budget,
    location: lead.location || null,
    status: lead.status,
    priority_stars: lead.priorityStars,
    source: lead.source || null,
    assigned_to: lead.assignedTo || null,
    assigned_to_user_id: lead.assignedToUserId || null,
    created_at: tsFromDateField(lead.createdAt),
    last_contact: tsFromDateField(lead.lastContact),
    payload: leadPayloadForDb(lead) as Record<string, unknown>,
    synced_at: ts,
    updated_at: ts,
    deleted_at: null,
    is_owner: null,
    is_company: null,
    work_name: null,
    work_email: null,
    work_position: null,
    document_number: null,
    cellphone: null,
    other_email: null,
    other_phone: null,
    tag_names: [] as string[],
    birthdate: null,
  };
}

export async function fetchActiveLeads(client: SupabaseClient) {
  /** Ver comentario en `fetchCatalogProperties`: filtro `deleted_at` omitido por datos Tokko. */
  const res = await client.from("leads").select("*").order("updated_at", { ascending: false });
  if (res.error) return { data: [] as Lead[], error: res.error };
  const rows = (res.data ?? []) as Record<string, unknown>[];
  return { data: rows.map(rowToLead), error: null };
}

export async function insertLead(client: SupabaseClient, lead: Lead) {
  const ts = nowIso();
  return client.from("leads").insert(leadToInsertRow(lead, ts));
}

export async function updateLead(client: SupabaseClient, lead: Lead) {
  const ts = nowIso();
  const row = {
    name: lead.name,
    email: lead.email || null,
    phone: lead.phone || null,
    interest: lead.interest,
    property_type: lead.propertyType || null,
    budget: lead.budget,
    location: lead.location || null,
    status: lead.status,
    priority_stars: lead.priorityStars,
    source: lead.source || null,
    assigned_to: lead.assignedTo || null,
    assigned_to_user_id: lead.assignedToUserId || null,
    last_contact: tsFromDateField(lead.lastContact),
    payload: leadPayloadForDb(lead) as Record<string, unknown>,
    synced_at: ts,
    updated_at: ts,
  };
  return client.from("leads").update(row).eq("id", lead.id);
}

export async function softDeleteLead(client: SupabaseClient, id: string) {
  const ts = nowIso();
  return client.from("leads").update({ deleted_at: ts, updated_at: ts, synced_at: ts }).eq("id", id);
}

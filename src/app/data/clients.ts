/** Clientes del CRM (fichas independientes; pueden vincularse a leads, propiedades y desarrollos). */

export const CLIENTS_STORAGE_KEY = "viterra_crm_clients";

export type ClientActivityType =
  | "created"
  | "updated"
  | "note"
  | "link_property"
  | "link_development"
  | "link_lead";

export interface ClientActivityEntry {
  id: string;
  type: ClientActivityType;
  description: string;
  createdAt: string;
  actorName: string;
}

export interface CrmClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyIds: string[];
  developmentIds: string[];
  linkedLeadIds: string[];
  /** Asesor/líder titular (filtrado para rol asesor) */
  primaryOwnerUserId: string;
  createdAt: string;
  updatedAt: string;
  activity: ClientActivityEntry[];
}

export function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cli_${crypto.randomUUID()}`;
  }
  return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newClientActivityId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cact_${crypto.randomUUID()}`;
  }
  return `cact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhoneKey(phone: string): string {
  return phone.replace(/\D/g, "");
}

function isActivityEntry(x: unknown): x is ClientActivityEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.type === "string" &&
    typeof o.description === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.actorName === "string"
  );
}

const ACTIVITY_TYPES: ClientActivityType[] = [
  "created",
  "updated",
  "note",
  "link_property",
  "link_development",
  "link_lead",
];

export function normalizeStoredClient(raw: Partial<CrmClient> & Record<string, unknown>): CrmClient {
  const now = new Date().toISOString();
  const activityRaw = raw.activity;
  const activity: ClientActivityEntry[] = Array.isArray(activityRaw)
    ? activityRaw.filter(isActivityEntry).filter((e) => ACTIVITY_TYPES.includes(e.type as ClientActivityType))
    : [];

  const propertyIds = Array.isArray(raw.propertyIds)
    ? raw.propertyIds.filter((x): x is string => typeof x === "string")
    : [];
  const developmentIds = Array.isArray(raw.developmentIds)
    ? raw.developmentIds.filter((x): x is string => typeof x === "string")
    : [];
  const linkedLeadIds = Array.isArray(raw.linkedLeadIds)
    ? raw.linkedLeadIds.filter((x): x is string => typeof x === "string")
    : [];

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newClientId(),
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    propertyIds,
    developmentIds,
    linkedLeadIds,
    primaryOwnerUserId: typeof raw.primaryOwnerUserId === "string" ? raw.primaryOwnerUserId : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
    activity,
  };
}

export function appendClientActivity(
  client: CrmClient,
  entry: Omit<ClientActivityEntry, "id" | "createdAt"> & { id?: string; createdAt?: string }
): CrmClient {
  const createdAt = entry.createdAt ?? new Date().toISOString();
  const full: ClientActivityEntry = {
    id: entry.id ?? newClientActivityId(),
    type: entry.type,
    description: entry.description,
    createdAt,
    actorName: entry.actorName,
  };
  return {
    ...client,
    updatedAt: createdAt,
    activity: [full, ...client.activity],
  };
}

/** Busca cliente por email normalizado (primer match). */
export function findClientByEmailNormalized(clients: CrmClient[], email: string): CrmClient | undefined {
  const key = normalizeEmailKey(email);
  if (!key) return undefined;
  return clients.find((c) => normalizeEmailKey(c.email) === key);
}

/** ¿Algún cliente ya usa este email o teléfono normalizado? */
export function isLeadContactLinkedToClient(
  clients: CrmClient[],
  email: string,
  phone: string
): boolean {
  const ek = normalizeEmailKey(email);
  const pk = normalizePhoneKey(phone);
  return clients.some((c) => {
    if (ek && normalizeEmailKey(c.email) === ek) return true;
    if (pk && normalizePhoneKey(c.phone) === pk) return true;
    return false;
  });
}

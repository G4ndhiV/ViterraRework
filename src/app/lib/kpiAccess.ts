import type { User } from "../contexts/AuthContext";
import type { UserGroup } from "./userGroups";
import type { Lead } from "../data/leads";
import type { AgendaAppointment } from "../data/agenda";
import { foldSearchText } from "./searchText";

export type KpiScopeKind = "admin" | "leader" | "advisor";

export interface KpiScope {
  kind: KpiScopeKind;
  /** UUIDs (id de auth/tokko_users) cuyos leads/citas son visibles. */
  allowedUserIds: Set<string>;
  /** Tokko user ids (string numérico) opcionales del propio usuario y miembros del grupo, para leads no migrados. */
  allowedTokkoUserIds: Set<string>;
  /** Ids de `user_groups` que el usuario puede ver. */
  allowedGroupIds: Set<string>;
  /** Solo el usuario actual (asesor / líder editando sus propias metas). */
  selfUserId: string | null;
  /** Solo grupos donde es líder; usado para gating de edición de metas. */
  ledGroupIds: Set<string>;
}

const EMPTY_SET = new Set<string>();

/** Grupos donde el usuario es líder titular (`leaderId === user.id`). */
export function getGroupsLedByUser(user: User, groups: UserGroup[]): UserGroup[] {
  return groups.filter((g) => g.leaderId === user.id);
}

/** Grupos donde el usuario es miembro (incluye grupos que lidera). */
export function getGroupsContainingUser(user: User, groups: UserGroup[]): UserGroup[] {
  return groups.filter((g) => g.memberIds.includes(user.id));
}

/**
 * Calcula el scope de KPIs según rol.
 * - admin: ve a todos los usuarios y todos los grupos.
 * - lider_grupo: ve sus grupos liderados, sus miembros y a sí mismo.
 * - asesor: solo a sí mismo.
 */
export function getKpiScope(user: User | null, allUsers: User[], groups: UserGroup[]): KpiScope {
  if (!user) {
    return {
      kind: "advisor",
      allowedUserIds: EMPTY_SET,
      allowedTokkoUserIds: EMPTY_SET,
      allowedGroupIds: EMPTY_SET,
      selfUserId: null,
      ledGroupIds: EMPTY_SET,
    };
  }

  const tokkoIds = new Set<string>();
  if (user.tokkoUserId) tokkoIds.add(user.tokkoUserId.trim());

  if (user.role === "admin") {
    return {
      kind: "admin",
      allowedUserIds: new Set(allUsers.map((u) => u.id)),
      allowedTokkoUserIds: new Set(
        allUsers.map((u) => u.tokkoUserId?.trim() ?? "").filter(Boolean)
      ),
      allowedGroupIds: new Set(groups.map((g) => g.id)),
      selfUserId: user.id,
      ledGroupIds: new Set(groups.filter((g) => g.leaderId === user.id).map((g) => g.id)),
    };
  }

  if (user.role === "lider_grupo") {
    const led = getGroupsLedByUser(user, groups);
    const memberIds = new Set<string>();
    memberIds.add(user.id);
    for (const g of led) for (const id of g.memberIds) memberIds.add(id);

    const tokkos = new Set<string>();
    for (const u of allUsers) {
      if (memberIds.has(u.id) && u.tokkoUserId?.trim()) tokkos.add(u.tokkoUserId.trim());
    }

    return {
      kind: "leader",
      allowedUserIds: memberIds,
      allowedTokkoUserIds: tokkos,
      allowedGroupIds: new Set(led.map((g) => g.id)),
      selfUserId: user.id,
      ledGroupIds: new Set(led.map((g) => g.id)),
    };
  }

  return {
    kind: "advisor",
    allowedUserIds: new Set([user.id]),
    allowedTokkoUserIds: tokkoIds,
    allowedGroupIds: new Set<string>(),
    selfUserId: user.id,
    ledGroupIds: EMPTY_SET,
  };
}

/** ¿Este lead cae dentro del scope visible? */
export function leadInKpiScope(lead: Lead, scope: KpiScope): boolean {
  const aid = lead.assignedToUserId?.trim();
  if (!aid) return scope.kind === "admin";
  if (scope.allowedUserIds.has(aid)) return true;
  if (scope.allowedTokkoUserIds.has(aid)) return true;
  return false;
}

/** Filtra leads por scope. */
export function filterLeadsByKpiScope(leads: Lead[], scope: KpiScope): Lead[] {
  if (scope.kind === "admin") return leads;
  return leads.filter((l) => leadInKpiScope(l, scope));
}

/** Filtra agenda por nombre del staff (mejor esfuerzo: la agenda guarda nombre, no UUID). */
export function filterAppointmentsByKpiScope(
  appts: AgendaAppointment[],
  scope: KpiScope,
  allUsers: User[]
): AgendaAppointment[] {
  if (scope.kind === "admin") return appts;
  const allowedNames = new Set<string>();
  for (const u of allUsers) {
    if (scope.allowedUserIds.has(u.id) && u.name?.trim()) {
      allowedNames.add(foldSearchText(u.name));
    }
  }
  if (allowedNames.size === 0) return [];
  return appts.filter((a) => allowedNames.has(foldSearchText(a.staffName)));
}

/** ¿El usuario puede editar metas de este target (scope, scope_id)? */
export function canEditKpiTarget(
  user: User | null,
  groups: UserGroup[],
  scope: "user" | "group" | "company",
  scopeId: string | null
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (scope === "company") return false;
  if (user.role === "lider_grupo") {
    if (scope === "group") {
      return groups.some((g) => g.id === scopeId && g.leaderId === user.id);
    }
    if (scope === "user") {
      if (scopeId === user.id) return true;
      const led = getGroupsLedByUser(user, groups);
      return led.some((g) => scopeId && g.memberIds.includes(scopeId));
    }
  }
  if (user.role === "asesor") {
    return scope === "user" && scopeId === user.id;
  }
  return false;
}

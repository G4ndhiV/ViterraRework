import type { User, UserRole } from "../contexts/AuthContext";

export function canViewAllLeads(role: UserRole): boolean {
  return role === "admin" || role === "lider_grupo";
}

/** Tokko sync guarda `assigned_to_user_id` como id Tokko; el login usa UUID de Auth. */
export function leadIsAssignedToUser<T extends { assignedToUserId: string }>(lead: T, user: User | null): boolean {
  if (!user) return false;
  const a = lead.assignedToUserId?.trim();
  if (!a) return false;
  if (a === user.id) return true;
  const t = user.tokkoUserId?.trim();
  return Boolean(t && a === t);
}

export function filterLeadsForUser<T extends { assignedToUserId: string }>(
  leads: T[],
  user: User | null
): T[] {
  if (!user) return [];
  if (canViewAllLeads(user.role)) return leads;
  return leads.filter((l) => leadIsAssignedToUser(l, user));
}

export function roleLabelEs(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Administrador",
    lider_grupo: "Líder de grupo",
    asesor: "Asesor",
  };
  return labels[role];
}

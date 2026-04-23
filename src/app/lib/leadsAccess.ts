import type { User, UserRole } from "../contexts/AuthContext";

export function canViewAllLeads(role: UserRole): boolean {
  return role === "admin" || role === "lider_grupo";
}

function sameUserId(a: string | undefined, b: string | undefined): boolean {
  const x = (a ?? "").trim();
  const y = (b ?? "").trim();
  if (!x || !y) return false;
  return x.toLowerCase() === y.toLowerCase();
}

export function filterLeadsForUser<T extends { assignedToUserId: string }>(
  leads: T[],
  user: User | null
): T[] {
  if (!user) return [];
  if (canViewAllLeads(user.role)) return leads;
  return leads.filter((l) => sameUserId(l.assignedToUserId, user.id));
}

export function roleLabelEs(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Administrador",
    lider_grupo: "Líder de grupo",
    asesor: "Asesor",
  };
  return labels[role];
}

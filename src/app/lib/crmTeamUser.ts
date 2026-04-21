import type { User, UserRole } from "../contexts/AuthContext";
import type { Lead } from "../data/leads";

const PROFILE_ROLES: UserRole[] = ["lider_grupo", "asesor"];

/** Encuentra el usuario del equipo que corresponde al asignado del lead (id CRM o nombre). */
export function resolveLeadTeamUser(users: User[], lead: Lead): User | undefined {
  const byId = users.find((u) => u.id === lead.assignedToUserId);
  if (byId) return byId;
  const name = lead.assignedTo?.trim();
  if (!name) return undefined;
  return users.find((u) => u.name.trim() === name);
}

/** Solo líder/asesor (no uno mismo); enlazar a su ficha en Mi empresa → Usuarios. */
export function isClickableTeamMemberProfile(
  teamUser: User | undefined,
  currentUserId: string
): teamUser is User {
  if (!teamUser) return false;
  if (teamUser.id === currentUserId) return false;
  return PROFILE_ROLES.includes(teamUser.role);
}

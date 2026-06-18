import type { UserRole } from "../contexts/AuthContext";

export const USER_GROUPS_STORAGE_KEY = "viterra_user_groups";

export type UserGroup = {
  id: string;
  name: string;
  /** Debe ser un usuario con rol `lider_grupo` e incluido en `memberIds` */
  leaderId: string;
  memberIds: string[];
  createdAt: string;
};

export function newUserGroupId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `grp_${crypto.randomUUID()}`;
  }
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadUserGroupsFromStorage(): UserGroup[] {
  try {
    const raw = localStorage.getItem(USER_GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g): g is UserGroup =>
        typeof g === "object" &&
        g !== null &&
        typeof (g as UserGroup).id === "string" &&
        typeof (g as UserGroup).name === "string" &&
        typeof (g as UserGroup).leaderId === "string" &&
        Array.isArray((g as UserGroup).memberIds) &&
        typeof (g as UserGroup).createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function saveUserGroupsToStorage(groups: UserGroup[]): void {
  localStorage.setItem(USER_GROUPS_STORAGE_KEY, JSON.stringify(groups));
}

/** Líder válido: rol lider_grupo y activo */
export function isValidGroupLeader(
  userId: string,
  users: Array<{ id: string; role: UserRole; isActive: boolean }>
): boolean {
  const u = users.find((x) => x.id === userId);
  return !!u && u.isActive && u.role === "lider_grupo";
}

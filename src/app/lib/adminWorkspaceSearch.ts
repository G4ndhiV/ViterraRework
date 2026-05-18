import type { ComponentType } from "react";
import type { User, UserRole } from "../contexts/AuthContext";
import type { UserGroup } from "./userGroups";
import { getKpiScope, type KpiScope } from "./kpiAccess";
import { roleLabelEs } from "./leadsAccess";
import { foldSearchText } from "./searchText";

export type AdminSearchScope = "all" | "routes" | "users";

export type AdminUserRoleFilter = "all" | UserRole;

export type AdminSearchRoute = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: "crm" | "catalog" | "company" | "site" | "account";
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  action: () => void;
};

const CATEGORY_LABELS: Record<AdminSearchRoute["category"], string> = {
  crm: "CRM",
  catalog: "Catálogo",
  company: "Empresa",
  site: "Sitio público",
  account: "Cuenta",
};

export function adminSearchCategoryLabel(category: AdminSearchRoute["category"]): string {
  return CATEGORY_LABELS[category];
}

export function buildKpiScopeForSearch(
  viewer: User | null,
  allUsers: User[],
  groups: UserGroup[],
): KpiScope {
  return getKpiScope(viewer, allUsers, groups);
}

/** Puede ver listado de usuarios en el buscador (no solo rutas). */
export function canSearchTeamUsers(viewer: User | null, scope: KpiScope): boolean {
  if (!viewer) return false;
  if (viewer.role === "admin") return true;
  if (viewer.role === "lider_grupo") return scope.allowedUserIds.size > 1;
  return false;
}

/** Filtro por rol en chips (solo administrador). */
export function canFilterUsersByRole(viewer: User | null): boolean {
  return viewer?.role === "admin";
}

export function canOpenTeamMemberProfile(viewer: User | null, target: User, scope: KpiScope): boolean {
  if (!viewer) return false;
  if (viewer.id === target.id) return true;
  if (!canSearchTeamUsers(viewer, scope)) return false;
  return scope.allowedUserIds.has(target.id);
}

export function filterSearchableUsers(
  allUsers: User[],
  scope: KpiScope,
  options?: {
    roleFilter?: AdminUserRoleFilter;
    query?: string;
    limit?: number;
  },
): User[] {
  const limit = options?.limit ?? 12;
  const q = options?.query?.trim() ?? "";
  const foldedQ = q ? foldSearchText(q) : "";

  let list = allUsers.filter((u) => u.isActive && scope.allowedUserIds.has(u.id));

  if (options?.roleFilter && options.roleFilter !== "all") {
    list = list.filter((u) => u.role === options.roleFilter);
  }

  list = [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));

  if (!foldedQ) return list.slice(0, limit);

  return list
    .filter((u) => {
      const roleLabel = foldSearchText(roleLabelEs(u.role));
      const haystack = foldSearchText([u.name, u.email, roleLabel, u.id].join(" "));
      return haystack.includes(foldedQ);
    })
    .slice(0, limit);
}

export function filterSearchRoutes(
  routes: AdminSearchRoute[],
  options?: { query?: string; limit?: number },
): AdminSearchRoute[] {
  const limit = options?.limit ?? 8;
  const q = options?.query?.trim().toLowerCase() ?? "";
  if (!q) return routes.slice(0, limit);

  return routes
    .filter((route) => {
      const haystack = [route.title, route.description, adminSearchCategoryLabel(route.category), ...route.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit);
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export const ROLE_CHIP_STYLES: Record<UserRole, { active: string; idle: string }> = {
  admin: {
    active: "border-brand-burgundy/40 bg-brand-burgundy text-white shadow-sm",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-brand-burgundy/30 hover:text-brand-burgundy",
  },
  lider_grupo: {
    active: "border-sky-500/40 bg-sky-600 text-white shadow-sm",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700",
  },
  asesor: {
    active: "border-slate-500/40 bg-slate-600 text-white shadow-sm",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800",
  },
};

export const ROUTE_CATEGORY_STYLES: Record<
  AdminSearchRoute["category"],
  { iconWrap: string; icon: string }
> = {
  crm: { iconWrap: "bg-primary/10 text-primary", icon: "text-primary" },
  catalog: { iconWrap: "bg-emerald-50 text-emerald-700", icon: "text-emerald-700" },
  company: { iconWrap: "bg-violet-50 text-violet-700", icon: "text-violet-700" },
  site: { iconWrap: "bg-sky-50 text-sky-700", icon: "text-sky-700" },
  account: { iconWrap: "bg-slate-100 text-slate-600", icon: "text-slate-600" },
};

import type { Lead } from "../../data/leads";
import type { User } from "../../contexts/AuthContext";
import { foldSearchText } from "../../lib/searchText";
import {
  leadAssignedToCrmUser,
  teamMemberMatchesFoldedQuery,
  teamMemberNameMatchesFoldedQuery,
} from "./adminWorkspaceHelpers";
import type { LeadsCreatedRange } from "./useLeadsFilters";

export type LeadsDisplayFilters = {
  searchQuery: string;
  leadSearchNameScope: "all" | "client" | "advisor";
  statusFilter: string;
  createdRangeFilter: LeadsCreatedRange;
  createdFrom: string;
  createdTo: string;
};

/** Inicio del rango por preset relativo (1m/3m/6m/1y); null para "all"/"custom". */
function rangeStart(createdRangeFilter: LeadsCreatedRange, now: Date): Date | null {
  if (createdRangeFilter === "all" || createdRangeFilter === "custom") return null;
  const d = new Date(now);
  if (createdRangeFilter === "1m") d.setMonth(d.getMonth() - 1);
  if (createdRangeFilter === "3m") d.setMonth(d.getMonth() - 3);
  if (createdRangeFilter === "6m") d.setMonth(d.getMonth() - 6);
  if (createdRangeFilter === "1y") d.setFullYear(d.getFullYear() - 1);
  return d;
}

/**
 * Filtra leads por búsqueda (cliente/asesor/todo), estado y rango de creación.
 * Pura y testeable: `now` se inyecta para fijar la referencia temporal en tests.
 */
export function filterLeadsForDisplay(
  leads: Lead[],
  filters: LeadsDisplayFilters,
  users: User[],
  now: Date = new Date(),
): Lead[] {
  const { searchQuery, leadSearchNameScope, statusFilter, createdRangeFilter, createdFrom, createdTo } =
    filters;
  const fromByRange = rangeStart(createdRangeFilter, now);
  const customFromDate =
    createdRangeFilter === "custom" && createdFrom ? new Date(`${createdFrom}T00:00:00`) : null;
  const customToDate =
    createdRangeFilter === "custom" && createdTo ? new Date(`${createdTo}T23:59:59`) : null;
  const q = foldSearchText(searchQuery);

  return leads.filter((lead) => {
    const createdAtDate = lead.createdAt ? new Date(lead.createdAt) : null;

    const matchesSearch = (() => {
      if (!q) return true;
      if (leadSearchNameScope === "client") {
        return foldSearchText(lead.name).includes(q);
      }
      if (leadSearchNameScope === "advisor") {
        return (
          foldSearchText(lead.assignedTo).includes(q) ||
          users.some((u) => teamMemberNameMatchesFoldedQuery(u, q) && leadAssignedToCrmUser(lead, u))
        );
      }
      return (
        foldSearchText(lead.name).includes(q) ||
        foldSearchText(lead.email).includes(q) ||
        foldSearchText(lead.phone).includes(q) ||
        users.some((u) => teamMemberMatchesFoldedQuery(u, q) && leadAssignedToCrmUser(lead, u))
      );
    })();

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesCreatedRange =
      createdRangeFilter === "all" ||
      (createdAtDate !== null &&
        !Number.isNaN(createdAtDate.getTime()) &&
        (fromByRange ? createdAtDate >= fromByRange : true) &&
        (customFromDate ? createdAtDate >= customFromDate : true) &&
        (customToDate ? createdAtDate <= customToDate : true));

    return matchesSearch && matchesStatus && matchesCreatedRange;
  });
}

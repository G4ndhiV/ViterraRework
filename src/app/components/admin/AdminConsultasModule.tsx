import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Eye,
  Filter,
  Home,
  ImageOff,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import type { Lead } from "../../data/leads";
import { labelForLeadStatus, type CustomKanbanStage } from "../../data/leads";
import type { User } from "../../contexts/AuthContext";
import type { UserGroup } from "../../lib/userGroups";
import type { Property } from "../PropertyCard";
import type { Development } from "../../data/developments";
import { foldSearchText } from "../../lib/searchText";
import { resolveAssigneeName } from "../../data/crmAssignees";
import { DEFAULT_PIPELINE_GROUP_ID } from "../../lib/pipelineByGroup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { LeadPriorityBadge } from "./LeadPriorityBadge";
import { cn } from "../ui/utils";

type ConsultasTab = "todos" | "asignados" | "descartados";

type RelatedInventoryOption =
  | { kind: "property"; id: string; label: string }
  | { kind: "development"; id: string; label: string };

type Props = {
  leads: Lead[];
  users: User[];
  groups: UserGroup[];
  properties: Property[];
  developments: Development[];
  customStages: CustomKanbanStage[];
  loading: boolean;
  errorMessage: string | null;
  /** Reasignar un lead a otro asesor (UUID auth o id legacy). Devuelve true si la operación tuvo éxito. */
  onReassign: (lead: Lead, newAssigneeUserId: string, newAssigneeName: string) => Promise<boolean>;
  /** Abrir el detalle completo del lead (reusa `LeadDetailDialog`). */
  onOpenDetail: (lead: Lead) => void;
  /** Refrescar la lista (re-fetch de Supabase). */
  onRefresh?: () => void;
  /** Nombre de quien ejecuta la reasignación (para registrar en historial). */
  currentUserName: string;
};

function isLeadDeleted(lead: Lead): boolean {
  return lead.deletedAt != null;
}

function isLeadDiscarded(lead: Lead): boolean {
  return isLeadDeleted(lead) || lead.status === "perdido";
}

function isLeadAssigned(lead: Lead): boolean {
  return Boolean(lead.assignedToUserId && lead.assignedToUserId.trim().length > 0);
}

function formatCreatedAt(lead: Lead): string {
  const iso = lead.createdAtIso ?? lead.createdAt;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatBudget(value: number): string {
  if (!value || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function interestLabel(interest: Lead["interest"]): string {
  switch (interest) {
    case "compra":
      return "Compra";
    case "venta":
      return "Venta";
    case "alquiler":
      return "Renta";
    case "asesoria":
      return "Asesoría";
    default:
      return interest;
  }
}

/** Compara `assigned_to_user_id` aceptando UUID auth o `tokkoUserId` legacy. */
function userMatchesAssignee(u: User, assignedId: string): boolean {
  const a = assignedId.trim().toLowerCase();
  if (!a) return false;
  if (u.id.trim().toLowerCase() === a) return true;
  const t = u.tokkoUserId?.trim().toLowerCase();
  return Boolean(t && t === a);
}

/** Devuelve los ids de equipo a los que pertenece el asesor (vía `user_groups.memberIds`). */
function groupIdsForUser(userId: string, groups: UserGroup[]): string[] {
  return groups.filter((g) => g.memberIds.includes(userId)).map((g) => g.id);
}

const FIELD_CLASS =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-brand-navy shadow-sm placeholder:text-slate-400 focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/15";

export function AdminConsultasModule({
  leads,
  users,
  groups,
  properties,
  developments,
  customStages,
  loading,
  errorMessage,
  onReassign,
  onOpenDetail,
  onRefresh,
  currentUserName,
}: Props) {
  const [tab, setTab] = useState<ConsultasTab>("todos");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [advisorFilter, setAdvisorFilter] = useState<string>("all");
  const [clientQuery, setClientQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<string>("all");
  const [reassignTarget, setReassignTarget] = useState<Lead | null>(null);

  const tabFilteredAll = useMemo(() => leads.filter((l) => !isLeadDeleted(l)), [leads]);
  const tabFilteredAsignados = useMemo(
    () => leads.filter((l) => !isLeadDeleted(l) && isLeadAssigned(l)),
    [leads]
  );
  const tabFilteredDescartados = useMemo(
    () => leads.filter((l) => isLeadDiscarded(l)),
    [leads]
  );

  const tabSourceLeads = useMemo(() => {
    if (tab === "asignados") return tabFilteredAsignados;
    if (tab === "descartados") return tabFilteredDescartados;
    return tabFilteredAll;
  }, [tab, tabFilteredAll, tabFilteredAsignados, tabFilteredDescartados]);

  /** Asesores y líderes que pueden recibir leads. */
  const advisorOptions = useMemo(() => {
    return users
      .filter((u) => u.isActive && (u.role === "asesor" || u.role === "lider_grupo"))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [users]);

  /** Aplica restricción de equipo (cuando se eligió uno) sobre los asesores del filtro. */
  const filteredAdvisorOptions = useMemo(() => {
    if (groupFilter === "all") return advisorOptions;
    if (groupFilter === DEFAULT_PIPELINE_GROUP_ID) return advisorOptions;
    const grp = groups.find((g) => g.id === groupFilter);
    if (!grp) return advisorOptions;
    const memberSet = new Set(grp.memberIds);
    return advisorOptions.filter((u) => memberSet.has(u.id));
  }, [groupFilter, advisorOptions, groups]);

  const inventoryOptions = useMemo<RelatedInventoryOption[]>(() => {
    const props: RelatedInventoryOption[] = properties
      .map((p) => ({ kind: "property" as const, id: p.id, label: p.title || "Propiedad sin título" }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
    const devs: RelatedInventoryOption[] = developments
      .map((d) => ({ kind: "development" as const, id: d.id, label: d.name || "Desarrollo sin nombre" }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
    return [...props, ...devs];
  }, [properties, developments]);

  const propertyById = useMemo(() => {
    const map = new Map<string, Property>();
    for (const p of properties) map.set(p.id, p);
    return map;
  }, [properties]);

  const developmentById = useMemo(() => {
    const map = new Map<string, Development>();
    for (const d of developments) map.set(d.id, d);
    return map;
  }, [developments]);

  const userByLead = useMemo(() => {
    const map = new Map<string, User>();
    for (const lead of leads) {
      const aid = lead.assignedToUserId?.trim();
      if (!aid) continue;
      const u = users.find((x) => userMatchesAssignee(x, aid));
      if (u) map.set(lead.id, u);
    }
    return map;
  }, [leads, users]);

  /** Intenta resolver el nombre del equipo del lead a partir del `pipelineGroupId` o del asesor. */
  const groupNameForLead = useMemo(
    () => (lead: Lead): string => {
      const pipelineId = lead.pipelineGroupId;
      if (pipelineId && pipelineId !== DEFAULT_PIPELINE_GROUP_ID) {
        const g = groups.find((x) => x.id === pipelineId);
        if (g) return g.name;
      }
      const u = userByLead.get(lead.id);
      if (u) {
        const ids = groupIdsForUser(u.id, groups);
        if (ids.length > 0) {
          const g = groups.find((x) => x.id === ids[0]);
          if (g) return g.name;
        }
      }
      return pipelineId === DEFAULT_PIPELINE_GROUP_ID ? "General" : "—";
    },
    [groups, userByLead]
  );

  const filteredLeads = useMemo(() => {
    const q = foldSearchText(clientQuery);
    const fromTs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : null;
    const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59.999`) : null;

    return tabSourceLeads.filter((lead) => {
      // Equipo
      if (groupFilter !== "all") {
        if (groupFilter === DEFAULT_PIPELINE_GROUP_ID) {
          if (lead.pipelineGroupId !== DEFAULT_PIPELINE_GROUP_ID) return false;
        } else {
          // El lead pertenece al equipo si su pipelineGroupId coincide o si su asesor es miembro.
          const matchesByPipeline = lead.pipelineGroupId === groupFilter;
          let matchesByAdvisor = false;
          const u = userByLead.get(lead.id);
          if (u) {
            const grp = groups.find((g) => g.id === groupFilter);
            matchesByAdvisor = !!grp && grp.memberIds.includes(u.id);
          }
          if (!matchesByPipeline && !matchesByAdvisor) return false;
        }
      }

      // Asesor
      if (advisorFilter !== "all") {
        if (advisorFilter === "__unassigned__") {
          if (isLeadAssigned(lead)) return false;
        } else {
          const u = users.find((x) => x.id === advisorFilter);
          if (!u) return false;
          if (!userMatchesAssignee(u, lead.assignedToUserId)) return false;
        }
      }

      // Cliente (texto libre)
      if (q) {
        const haystack = [lead.name, lead.email, lead.phone].map(foldSearchText).join(" ");
        if (!haystack.includes(q)) return false;
      }

      // Fecha (sobre createdAtIso o createdAt)
      if (fromTs != null || toTs != null) {
        const iso = lead.createdAtIso ?? lead.createdAt;
        const ts = Date.parse(iso);
        if (Number.isNaN(ts)) return false;
        if (fromTs != null && ts < fromTs) return false;
        if (toTs != null && ts > toTs) return false;
      }

      // Propiedad / desarrollo
      if (inventoryFilter !== "all") {
        const [kind, id] = inventoryFilter.split(":");
        if (kind === "property") {
          if (lead.relatedPropertyId !== id) return false;
        } else if (kind === "development") {
          if (lead.relatedDevelopmentId !== id) return false;
        }
      }

      return true;
    });
  }, [
    tabSourceLeads,
    groupFilter,
    advisorFilter,
    clientQuery,
    dateFrom,
    dateTo,
    inventoryFilter,
    users,
    groups,
    userByLead,
  ]);

  const tabCounts = useMemo(
    () => ({
      todos: tabFilteredAll.length,
      asignados: tabFilteredAsignados.length,
      descartados: tabFilteredDescartados.length,
    }),
    [tabFilteredAll, tabFilteredAsignados, tabFilteredDescartados]
  );

  const filtersActive =
    groupFilter !== "all" ||
    advisorFilter !== "all" ||
    clientQuery.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    inventoryFilter !== "all";

  const clearFilters = () => {
    setGroupFilter("all");
    setAdvisorFilter("all");
    setClientQuery("");
    setDateFrom("");
    setDateTo("");
    setInventoryFilter("all");
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.14)] ring-1 ring-slate-900/[0.04]">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy" aria-hidden />
        <div className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent blur-3xl" aria-hidden />
        <div className="relative px-5 py-6 md:px-8 md:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary" style={{ fontWeight: 600 }}>
                Panel admin · Consultas
              </p>
              <h2 className="font-heading mt-1.5 text-[1.4rem] leading-tight text-brand-navy sm:text-[1.7rem]" style={{ fontWeight: 600 }}>
                Bandeja de leads
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
                Revisa todos los leads creados, los que ya están asignados y los descartados. Filtra por equipo, asesor,
                cliente, fecha o propiedad/desarrollo, y reasigna a otro asesor cuando lo necesites.
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-brand-navy"
                  style={{ fontWeight: 600 }}
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
                  Refrescar
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 inline-flex w-full items-stretch overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 sm:w-auto">
            {(["todos", "asignados", "descartados"] as const).map((id) => {
              const active = tab === id;
              const label =
                id === "todos" ? "Todos" : id === "asignados" ? "Asignados" : "Descartados";
              const count = tabCounts[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex h-10 min-w-[8.5rem] items-center justify-center gap-2 rounded-xl px-4 text-sm transition",
                    active
                      ? "bg-white text-brand-navy shadow-sm"
                      : "text-slate-600 hover:bg-white/70 hover:text-brand-navy"
                  )}
                  style={{ fontWeight: 600 }}
                  aria-pressed={active}
                >
                  {label}
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-[1.6rem] items-center justify-center rounded-full px-2 text-[11px]",
                      active ? "bg-primary/10 text-primary" : "bg-slate-200/80 text-slate-600"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500" style={{ fontWeight: 600 }}>
          <Filter className="h-3.5 w-3.5" strokeWidth={1.8} />
          Filtros
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="flex flex-col gap-1.5 xl:col-span-1">
            <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500" style={{ fontWeight: 600 }}>
              Equipo
            </span>
            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setAdvisorFilter("all");
              }}
              className={FIELD_CLASS}
            >
              <option value="all">Todos los equipos</option>
              <option value={DEFAULT_PIPELINE_GROUP_ID}>General (sin equipo)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 xl:col-span-1">
            <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500" style={{ fontWeight: 600 }}>
              Asesor
            </span>
            <select
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="all">Todos los asesores</option>
              <option value="__unassigned__">Sin asignar</option>
              {filteredAdvisorOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="relative flex flex-col gap-1.5 xl:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500" style={{ fontWeight: 600 }}>
              Cliente
            </span>
            <span className="absolute inset-y-0 left-3 top-[1.6rem] flex items-start pt-2.5 text-slate-400">
              <Search className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <input
              type="search"
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              placeholder="Nombre, email o teléfono"
              className={cn(FIELD_CLASS, "pl-9")}
            />
          </label>

          <div className="flex flex-col gap-1.5 xl:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500" style={{ fontWeight: 600 }}>
              Fecha de creación
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Desde"
                className={FIELD_CLASS}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Hasta"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <label className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-6">
            <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500" style={{ fontWeight: 600 }}>
              Propiedad / desarrollo
            </span>
            <select
              value={inventoryFilter}
              onChange={(e) => setInventoryFilter(e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="all">Todas las propiedades y desarrollos</option>
              <optgroup label="Propiedades">
                {inventoryOptions
                  .filter((o) => o.kind === "property")
                  .map((o) => (
                    <option key={`p:${o.id}`} value={`property:${o.id}`}>
                      {o.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Desarrollos">
                {inventoryOptions
                  .filter((o) => o.kind === "development")
                  .map((o) => (
                    <option key={`d:${o.id}`} value={`development:${o.id}`}>
                      {o.label}
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>
        </div>

        {filtersActive && (
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
              Mostrando <span className="font-semibold text-brand-navy">{filteredLeads.length}</span> de{" "}
              <span className="font-semibold text-brand-navy">{tabSourceLeads.length}</span> leads en este tab.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-brand-navy"
              style={{ fontWeight: 600 }}
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
            Cargando leads…
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-slate-500">
            <ClipboardList className="h-8 w-8 text-slate-400" strokeWidth={1.5} aria-hidden />
            <p className="text-sm" style={{ fontWeight: 500 }}>
              {tabSourceLeads.length === 0
                ? tab === "descartados"
                  ? "No hay leads descartados todavía."
                  : tab === "asignados"
                    ? "Aún no hay leads asignados."
                    : "Aún no se han creado leads."
                : "No hay leads que coincidan con los filtros."}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-brand-navy"
                style={{ fontWeight: 600 }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => {
              const advisor = userByLead.get(lead.id);
              const advisorDisplay = advisor?.name
                ? advisor.name
                : lead.assignedTo && lead.assignedTo !== "Sin asignar"
                  ? lead.assignedTo
                  : resolveAssigneeName(lead.assignedToUserId, []);
              const stageLabel = labelForLeadStatus(lead.status, customStages);
              const linkedProperty = lead.relatedPropertyId
                ? propertyById.get(lead.relatedPropertyId)
                : undefined;
              const linkedDevelopment = lead.relatedDevelopmentId
                ? developmentById.get(lead.relatedDevelopmentId)
                : undefined;
              const inventoryKind: "property" | "development" | null = lead.relatedPropertyId
                ? "property"
                : lead.relatedDevelopmentId
                  ? "development"
                  : null;
              const inventoryName =
                linkedProperty?.title ??
                linkedDevelopment?.name ??
                (lead.relatedPropertyId
                  ? "Propiedad eliminada"
                  : lead.relatedDevelopmentId
                    ? "Desarrollo eliminado"
                    : "Sin inventario vinculado");
              const inventoryImage = linkedProperty?.image ?? linkedDevelopment?.image ?? "";
              const teamLabel = groupNameForLead(lead);
              const isDeleted = isLeadDeleted(lead);
              const isLost = lead.status === "perdido";

              return (
                <li key={lead.id} className="px-4 py-4 transition hover:bg-slate-50/60 sm:px-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Imagen de la propiedad / desarrollo (o placeholder) */}
                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-24 sm:w-32 lg:h-24 lg:w-36">
                      {inventoryImage ? (
                        <img
                          src={inventoryImage}
                          alt={inventoryName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                          {inventoryKind === "development" ? (
                            <Building2 className="h-8 w-8" strokeWidth={1.4} aria-hidden />
                          ) : inventoryKind === "property" ? (
                            <Home className="h-8 w-8" strokeWidth={1.4} aria-hidden />
                          ) : (
                            <ImageOff className="h-8 w-8" strokeWidth={1.4} aria-hidden />
                          )}
                        </div>
                      )}
                      {inventoryKind && (
                        <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white" style={{ fontWeight: 600 }}>
                          {inventoryKind === "property" ? (
                            <>
                              <Home className="h-2.5 w-2.5" strokeWidth={2} />
                              Propiedad
                            </>
                          ) : (
                            <>
                              <Building2 className="h-2.5 w-2.5" strokeWidth={2} />
                              Desarrollo
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Contenido principal */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base text-brand-navy" style={{ fontWeight: 700 }}>
                              {lead.name || "Cliente sin nombre"}
                            </h3>
                            {isDeleted && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-red-700" style={{ fontWeight: 600 }}>
                                <Trash2 className="h-3 w-3" strokeWidth={1.8} />
                                Eliminado
                              </span>
                            )}
                            {!isDeleted && isLost && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-amber-700" style={{ fontWeight: 600 }}>
                                Perdido
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            {lead.email && (
                              <span className="inline-flex max-w-full items-center gap-1 truncate">
                                <Mail className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                                <span className="truncate">{lead.email}</span>
                              </span>
                            )}
                            {lead.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                                {lead.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(lead)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-brand-navy"
                            style={{ fontWeight: 600 }}
                            title="Ver todos los detalles"
                          >
                            <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                            Detalle
                          </button>
                          <button
                            type="button"
                            onClick={() => setReassignTarget(lead)}
                            disabled={isDeleted}
                            className={cn(
                              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs shadow-sm transition",
                              isDeleted
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                            )}
                            style={{ fontWeight: 600 }}
                            title={isDeleted ? "El lead fue eliminado y no se puede reasignar" : "Reasignar a otro asesor"}
                          >
                            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
                            Reasignar
                          </button>
                        </div>
                      </div>

                      {/* Detalles de interés */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700" style={{ fontWeight: 600 }}>
                          {interestLabel(lead.interest)}
                        </span>
                        {lead.propertyType && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>{lead.propertyType}</span>
                          </>
                        )}
                        {lead.location && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="truncate">{lead.location}</span>
                          </>
                        )}
                        {lead.budget > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span style={{ fontWeight: 600 }}>{formatBudget(lead.budget)}</span>
                          </>
                        )}
                      </div>

                      {/* Asignación, etapa y prioridad */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-1 text-slate-700" style={{ fontWeight: 600 }}>
                          <Users className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                          {teamLabel}
                        </span>
                        {isLeadAssigned(lead) ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary" style={{ fontWeight: 600 }}>
                            <UserCheck className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                            {advisorDisplay}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-slate-500">
                            Sin asignar
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-slate-700" style={{ fontWeight: 600 }}>
                          {stageLabel}
                        </span>
                        <LeadPriorityBadge stars={lead.priorityStars} />
                      </div>

                      {/* Inventario, origen y creación */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        {inventoryKind && (
                          <span
                            className="inline-flex max-w-full items-center gap-1.5 truncate"
                            title={inventoryName}
                          >
                            {inventoryKind === "property" ? (
                              <Home className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                            ) : (
                              <Building2 className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                            )}
                            <span className="truncate text-slate-600" style={{ fontWeight: 600 }}>
                              {inventoryName}
                            </span>
                          </span>
                        )}
                        {lead.source && (
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                            {lead.source}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                          {formatCreatedAt(lead)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ReassignLeadDialog
        lead={reassignTarget}
        users={users}
        groups={groups}
        currentUserName={currentUserName}
        onOpenChange={(o) => {
          if (!o) setReassignTarget(null);
        }}
        onConfirm={async (lead, newId, newName) => {
          const ok = await onReassign(lead, newId, newName);
          if (ok) setReassignTarget(null);
          return ok;
        }}
      />
    </div>
  );
}

type ReassignProps = {
  lead: Lead | null;
  users: User[];
  groups: UserGroup[];
  currentUserName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lead: Lead, newAssigneeUserId: string, newAssigneeName: string) => Promise<boolean>;
};

function ReassignLeadDialog({
  lead,
  users,
  groups,
  currentUserName,
  onOpenChange,
  onConfirm,
}: ReassignProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (lead) {
      const u = users.find((x) => userMatchesAssignee(x, lead.assignedToUserId));
      setSelectedId(u?.id ?? "");
      setSubmitting(false);
      setSearchQuery("");
    }
  }, [lead, users]);

  const advisorOptions = useMemo(() => {
    return users
      .filter((u) => u.isActive && (u.role === "asesor" || u.role === "lider_grupo"))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [users]);

  /** Mapa userId → ids de equipos a los que pertenece, para mostrar el equipo junto al asesor. */
  const groupNamesByUser = useMemo(() => {
    const out = new Map<string, string>();
    for (const u of advisorOptions) {
      const ids = groupIdsForUser(u.id, groups);
      if (ids.length > 0) {
        const names = ids
          .map((id) => groups.find((g) => g.id === id)?.name)
          .filter((x): x is string => Boolean(x));
        if (names.length > 0) out.set(u.id, names.join(", "));
      }
    }
    return out;
  }, [advisorOptions, groups]);

  const filteredAdvisors = useMemo(() => {
    const q = foldSearchText(searchQuery);
    if (!q) return advisorOptions;
    return advisorOptions.filter((u) => {
      const team = groupNamesByUser.get(u.id) ?? "";
      const haystack = foldSearchText(`${u.name} ${u.email} ${team}`);
      return haystack.includes(q);
    });
  }, [advisorOptions, groupNamesByUser, searchQuery]);

  const open = lead != null;
  const currentAssignee =
    lead && lead.assignedTo && lead.assignedTo !== "Sin asignar" ? lead.assignedTo : "Sin asignar";

  const handleConfirm = async () => {
    if (!lead || !selectedId) return;
    const u = users.find((x) => x.id === selectedId);
    if (!u) return;
    setSubmitting(true);
    try {
      await onConfirm(lead, u.id, u.name);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border border-stone-200/90 p-0 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.22)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy" aria-hidden />
        <div className="px-6 pb-2 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary" style={{ fontWeight: 600 }}>
            Consultas · Reasignar lead
          </p>
          <DialogHeader className="mt-2 space-y-2 text-left">
            <DialogTitle className="font-heading text-xl text-brand-navy" style={{ fontWeight: 600 }}>
              Reasignar a otro asesor
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
              {lead ? (
                <>
                  Lead de <span className="font-semibold text-brand-navy">{lead.name || "Cliente sin nombre"}</span>.
                  Asignado actualmente a <span className="font-semibold text-brand-navy">{currentAssignee}</span>.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-3 px-6 pb-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="reassign-search" className="text-[11px] uppercase tracking-[0.12em] text-slate-500" style={{ fontWeight: 600 }}>
              Nuevo asesor
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                id="reassign-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, correo o equipo…"
                autoFocus
                className={cn(FIELD_CLASS, "pl-9 pr-9")}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              )}
            </div>
          </div>

          {advisorOptions.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
              No hay asesores activos disponibles. Crea o reactiva uno desde Mi empresa → Usuarios.
            </p>
          ) : (
            <div
              role="listbox"
              aria-label="Asesores disponibles"
              className="max-h-[18rem] overflow-y-auto rounded-xl border border-slate-200 bg-white"
            >
              {filteredAdvisors.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 px-4 py-6 text-center text-xs text-slate-500">
                  <Search className="h-4 w-4 text-slate-400" strokeWidth={1.6} aria-hidden />
                  <p style={{ fontWeight: 500 }}>
                    No se encontraron asesores que coincidan con «{searchQuery}».
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredAdvisors.map((u) => {
                    const team = groupNamesByUser.get(u.id);
                    const isSelected = u.id === selectedId;
                    const initials = u.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("");
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => setSelectedId(u.id)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                            isSelected
                              ? "bg-primary/5 text-brand-navy"
                              : "hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-slate-100 text-slate-600"
                            )}
                            style={{ fontWeight: 700 }}
                            aria-hidden
                          >
                            {initials || "?"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm" style={{ fontWeight: 600 }}>
                              {u.name}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                              {u.email && <span className="truncate">{u.email}</span>}
                              {team && (
                                <>
                                  {u.email && <span className="text-slate-300">·</span>}
                                  <span className="inline-flex items-center gap-1 truncate">
                                    <Users className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                                    <span className="truncate">{team}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-primary" style={{ fontWeight: 600 }}>
                              Seleccionado
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {lead && currentUserName && (
            <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>
              Quedará registrado en el historial del lead que <span className="font-semibold text-slate-700">{currentUserName}</span> realizó la reasignación.
            </p>
          )}
        </div>
        <DialogFooter className="flex-col-reverse gap-2 border-t border-stone-200/80 bg-stone-50/90 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-stone-300 bg-white text-slate-700 hover:bg-stone-50 hover:text-slate-800"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-brand-red-hover"
            style={{ fontWeight: 600 }}
            onClick={handleConfirm}
            disabled={!selectedId || submitting || !lead}
          >
            {submitting ? "Guardando…" : "Reasignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

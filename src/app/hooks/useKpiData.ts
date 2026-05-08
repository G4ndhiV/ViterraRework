import { useEffect, useMemo, useState } from "react";
import type { Lead, CustomKanbanStage } from "../data/leads";
import type { Property } from "../components/PropertyCard";
import type { AgendaAppointment } from "../data/agenda";
import type { User } from "../contexts/AuthContext";
import type { UserGroup } from "../lib/userGroups";
import { getSupabaseClient } from "../lib/supabaseClient";
import {
  fetchKpiSnapshots,
  fetchKpiTargets,
  type KpiSnapshot,
  type KpiTarget,
  type KpiTargetMetric,
} from "../lib/supabaseKpis";
import {
  buildDateRange,
  comparePeriods,
  computeAdvisorRanking,
  computeAppointmentStats,
  computeCoreKpis,
  computeFunnelRates,
  computeOperationDistribution,
  computePropertiesStale,
  computePropertyTypeDistribution,
  computeSourceBreakdown,
  computeTrendFromLeads,
  pctDelta,
  shiftMonths,
  type DateRange,
  type DateRangeKey,
  type AdvisorRow,
  type AppointmentStats,
  type CoreKpis,
  type FunnelStageStat,
  type SourceBucket,
  type TrendPoint,
} from "../lib/kpiCompute";
import {
  filterAppointmentsByKpiScope,
  filterLeadsByKpiScope,
  type KpiScope,
} from "../lib/kpiAccess";

export interface KpiFiltersState {
  rangeKey: DateRangeKey;
  customFrom?: string;
  customTo?: string;
  /** Filtro adicional aplicado por el usuario (admin/líder). */
  selectedGroupId: string | null;
  selectedAdvisorId: string | null;
  /** Toggle "vs año anterior" en lugar de "vs período anterior" en deltas. */
  compareYearOverYear: boolean;
}

export const KPI_FILTERS_DEFAULT: KpiFiltersState = {
  rangeKey: "month",
  customFrom: undefined,
  customTo: undefined,
  selectedGroupId: null,
  selectedAdvisorId: null,
  compareYearOverYear: false,
};

export interface KpiBundle {
  range: DateRange;
  comparison: ReturnType<typeof comparePeriods>;
  /** Leads visibles según scope + filtros del usuario. */
  scopedLeads: Lead[];
  scopedProperties: Property[];
  scopedAppointments: AgendaAppointment[];
  current: CoreKpis;
  previous: CoreKpis;
  yearAgo: CoreKpis;
  funnel: FunnelStageStat[];
  sources: SourceBucket[];
  propertyTypes: SourceBucket[];
  operations: SourceBucket[];
  staleProperties: Property[];
  trend: TrendPoint[];
  advisorRanking: AdvisorRow[];
  appointments: AppointmentStats;
  appointmentsPrev: AppointmentStats;
  targets: KpiTarget[];
  snapshots: KpiSnapshot[];
  targetsLoading: boolean;
  snapshotsLoading: boolean;
  targetsError: string | null;
  snapshotsError: string | null;
  reloadTargets: () => Promise<void>;
  reloadSnapshots: () => Promise<void>;
}

/** Devuelve la meta vigente más reciente para un metric/scope/scope_id si existe. */
export function findActiveTarget(
  targets: KpiTarget[],
  metric: KpiTargetMetric,
  scope: "user" | "group" | "company",
  scopeId: string | null,
  rangeStartIso: string
): KpiTarget | null {
  const candidates = targets
    .filter((t) => t.metric === metric && t.scope === scope && (t.scopeId ?? null) === (scopeId ?? null))
    .filter((t) => t.effectiveFrom <= rangeStartIso)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  return candidates[0] ?? null;
}

interface UseKpiDataParams {
  user: User | null;
  users: User[];
  groups: UserGroup[];
  leads: Lead[];
  properties: Property[];
  appointments: AgendaAppointment[];
  customStages: CustomKanbanStage[];
  stageOrder: string[];
  scope: KpiScope;
  filters: KpiFiltersState;
}

export function useKpiData(params: UseKpiDataParams): KpiBundle {
  const {
    user,
    users,
    groups,
    leads,
    properties,
    appointments,
    customStages,
    stageOrder,
    scope,
    filters,
  } = params;

  const range = useMemo(
    () => buildDateRange(filters.rangeKey, filters.customFrom, filters.customTo),
    [filters.rangeKey, filters.customFrom, filters.customTo]
  );

  const comparison = useMemo(() => comparePeriods(range), [range]);

  const scopedLeads = useMemo(() => {
    let out = filterLeadsByKpiScope(leads, scope);
    if (filters.selectedGroupId) {
      const group = groups.find((g) => g.id === filters.selectedGroupId);
      if (group) {
        const memberIds = new Set(group.memberIds);
        const tokkos = new Set(
          users
            .filter((u) => memberIds.has(u.id))
            .map((u) => u.tokkoUserId?.trim() ?? "")
            .filter(Boolean)
        );
        out = out.filter((l) => {
          const aid = l.assignedToUserId?.trim() ?? "";
          return memberIds.has(aid) || tokkos.has(aid);
        });
      }
    }
    if (filters.selectedAdvisorId) {
      const u = users.find((x) => x.id === filters.selectedAdvisorId);
      const tokko = u?.tokkoUserId?.trim() ?? "";
      out = out.filter((l) => {
        const aid = l.assignedToUserId?.trim() ?? "";
        return aid === filters.selectedAdvisorId || (!!tokko && aid === tokko);
      });
    }
    return out;
  }, [leads, scope, filters.selectedGroupId, filters.selectedAdvisorId, groups, users]);

  const scopedProperties = useMemo(() => properties, [properties]);

  const scopedAppointments = useMemo(
    () => filterAppointmentsByKpiScope(appointments, scope, users),
    [appointments, scope, users]
  );

  const current = useMemo(
    () => computeCoreKpis(scopedLeads, customStages, range),
    [scopedLeads, customStages, range]
  );
  const previous = useMemo(
    () => computeCoreKpis(scopedLeads, customStages, comparison.previous),
    [scopedLeads, customStages, comparison.previous]
  );
  const yearAgo = useMemo(
    () => computeCoreKpis(scopedLeads, customStages, comparison.yearAgo),
    [scopedLeads, customStages, comparison.yearAgo]
  );

  const funnel = useMemo(
    () => computeFunnelRates(scopedLeads, stageOrder, customStages),
    [scopedLeads, stageOrder, customStages]
  );
  const sources = useMemo(() => computeSourceBreakdown(scopedLeads), [scopedLeads]);
  const propertyTypes = useMemo(
    () => computePropertyTypeDistribution(scopedProperties),
    [scopedProperties]
  );
  const operations = useMemo(
    () => computeOperationDistribution(scopedProperties),
    [scopedProperties]
  );
  const staleProperties = useMemo(() => computePropertiesStale(scopedProperties, 60), [
    scopedProperties,
  ]);

  const monthsBack = useMemo(() => {
    if (filters.rangeKey === "12m" || filters.rangeKey === "ytd") return 12;
    if (filters.rangeKey === "6m") return 6;
    if (filters.rangeKey === "3m") return 3;
    return 6;
  }, [filters.rangeKey]);

  const trend = useMemo(
    () => computeTrendFromLeads(scopedLeads, customStages, monthsBack),
    [scopedLeads, customStages, monthsBack]
  );

  const advisorRanking = useMemo(
    () =>
      computeAdvisorRanking(scopedLeads, customStages, range, (lead) => {
        const aid = lead.assignedToUserId?.trim() ?? "";
        const u =
          users.find((x) => x.id === aid) ??
          users.find((x) => x.tokkoUserId?.trim() === aid);
        return {
          id: u?.id ?? aid,
          name: u?.name?.trim() || lead.assignedTo?.trim() || "Sin asignar",
        };
      }),
    [scopedLeads, customStages, range, users]
  );

  const appointmentsStats = useMemo(
    () => computeAppointmentStats(scopedAppointments, range),
    [scopedAppointments, range]
  );
  const appointmentsPrev = useMemo(
    () => computeAppointmentStats(scopedAppointments, comparison.previous),
    [scopedAppointments, comparison.previous]
  );

  // -------------------------------------------------------------------------
  // Datos remotos: targets + snapshots
  // -------------------------------------------------------------------------
  const [targets, setTargets] = useState<KpiTarget[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  const [snapshots, setSnapshots] = useState<KpiSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [snapshotsError, setSnapshotsError] = useState<string | null>(null);

  const reloadTargets = useMemo(
    () => async () => {
      const client = getSupabaseClient();
      if (!client || !user) {
        setTargets([]);
        setTargetsLoading(false);
        return;
      }
      setTargetsLoading(true);
      const res = await fetchKpiTargets(client);
      if (res.error) {
        setTargetsError(res.error.message);
        setTargets([]);
      } else {
        setTargetsError(null);
        setTargets(res.data);
      }
      setTargetsLoading(false);
    },
    [user]
  );

  const reloadSnapshots = useMemo(
    () => async () => {
      const client = getSupabaseClient();
      if (!client || !user) {
        setSnapshots([]);
        setSnapshotsLoading(false);
        return;
      }
      setSnapshotsLoading(true);
      const now = new Date();
      const from = shiftMonths(now, -11);
      const to = now;
      const fromIso = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-01`;
      const toIso = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-01`;
      const res = await fetchKpiSnapshots(client, fromIso, toIso);
      if (res.error) {
        setSnapshotsError(res.error.message);
        setSnapshots([]);
      } else {
        setSnapshotsError(null);
        setSnapshots(res.data);
      }
      setSnapshotsLoading(false);
    },
    [user]
  );

  useEffect(() => {
    void reloadTargets();
  }, [reloadTargets]);

  useEffect(() => {
    void reloadSnapshots();
  }, [reloadSnapshots]);

  // suppress unused warning for groups param via ref-equivalence
  void groups;
  void pctDelta;

  return {
    range,
    comparison,
    scopedLeads,
    scopedProperties,
    scopedAppointments,
    current,
    previous,
    yearAgo,
    funnel,
    sources,
    propertyTypes,
    operations,
    staleProperties,
    trend,
    advisorRanking,
    appointments: appointmentsStats,
    appointmentsPrev,
    targets,
    snapshots,
    targetsLoading,
    snapshotsLoading,
    targetsError,
    snapshotsError,
    reloadTargets,
    reloadSnapshots,
  };
}

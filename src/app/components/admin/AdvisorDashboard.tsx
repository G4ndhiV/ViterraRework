import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Calendar, Clock, LayoutGrid, PieChart as PieChartIcon, Sparkles, Target, Users } from "lucide-react";
import type { Lead } from "../../data/leads";
import { labelForLeadStatus, type CustomKanbanStage } from "../../data/leads";
import type { Property } from "../PropertyCard";
import { foldSearchText } from "../../lib/searchText";
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "../ui/utils";

type Props = {
  leads: Lead[];
  properties: Property[];
  customStages: CustomKanbanStage[];
};

const FUNNEL_LABELS = [
  "Lead nuevo",
  "Contactado",
  "Cita",
  "Visita",
  "Oferta",
  "Cierre",
] as const;

function classifyLeadFunnelIndex(lead: Lead, customStages: CustomKanbanStage[]): number {
  const id = foldStage(lead.status);
  const label = foldStage(labelForLeadStatus(lead.status, customStages));
  if (/perdid/.test(id) || label.includes("perdid")) return -1;
  if (/^nuevo\b|^nuevo$/.test(id) || /^nuevo\b/.test(label)) return 0;
  if (/contactad/.test(id) || label.includes("contactad")) return 1;
  if (/cita|programad/.test(id) || label.includes("cita") || label.includes("programad")) return 2;
  if (/visita/.test(id) || label.includes("visita")) return 3;
  if (/oferta|negociac/.test(id) || label.includes("oferta") || label.includes("negoci")) return 4;
  if (/cerrad/.test(id) || label.includes("cerrad")) return 5;
  if (/calificad/.test(id) || label.includes("calific")) return 1;
  return 0;
}

function foldStage(s: string): string {
  return foldSearchText(s).replace(/\s+/g, " ").trim();
}

function startOfCurrentMonthMs(): number {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).getTime();
}

function parseLeadTime(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const t = Date.parse(raw.includes("T") ? raw : `${raw}T12:00:00`);
  return Number.isNaN(t) ? null : t;
}

function closedTimestamp(lead: Lead): number | null {
  const raw = lead.updatedAt ?? lead.lastContact ?? lead.createdAt;
  return parseLeadTime(raw);
}

function createdThisMonth(lead: Lead): boolean {
  const start = startOfCurrentMonthMs();
  const t = parseLeadTime(lead.createdAt);
  return t != null && t >= start;
}

function avgDaysOnBooks(properties: Property[]): number | null {
  const now = Date.now();
  const days: number[] = [];
  for (const p of properties) {
    const iso = p.listedAtIso;
    if (!iso) continue;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) continue;
    days.push((now - t) / 86400000);
  }
  if (days.length === 0) return null;
  return days.reduce((a, b) => a + b, 0) / days.length;
}

const SOURCE_GROUPS: { label: string; test: (src: string) => boolean }[] = [
  { label: "Facebook / Meta", test: (s) => /facebook|meta|instagram/i.test(s) },
  { label: "Portales / Web", test: (s) => /website|google|portal|inmuebl|seo|zonaprop|lamudi|easybroker/i.test(s) },
  { label: "Recomendaciones", test: (s) => /referid|recomend|amigo|boca/i.test(s) },
  { label: "Cartas / campo", test: (s) => /carta|físic|volante|puerta|folleto/i.test(s) },
];

const INVENTORY_KEYS = ["disponible", "enApartado", "vendida", "renta"] as const;
const INVENTORY_LABELS: Record<(typeof INVENTORY_KEYS)[number], string> = {
  disponible: "Disponible",
  enApartado: "Apartado",
  vendida: "Vendida",
  renta: "Renta",
};

/** Escala única (slate): mismos tonos que donut para coherencia visual */
const INVENTORY_UI: Record<(typeof INVENTORY_KEYS)[number], string> = {
  disponible: "bg-slate-400/95",
  enApartado: "bg-slate-500/95",
  vendida: "bg-slate-600/95",
  renta: "bg-slate-700/95",
};

/** Donut: variaciones de un solo color (legible y uniforme con el resto del dashboard) */
const CHART_SEGMENT_FILLS = ["#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155"];

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.96)",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px -6px rgb(15 23 42 / 0.12)",
  fontSize: "12px",
  fontWeight: 500,
} as const;

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const ring = "bg-slate-100 text-slate-600";
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:border-slate-300/80 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", ring)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="font-heading mt-3 text-2xl tracking-tight text-brand-navy sm:text-[1.65rem]" style={{ fontWeight: 700 }}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function AdvisorDashboard({ leads, properties, customStages }: Props) {
  const [disp, setDisp] = useState({ avg: 0, sales: 0, newM: 0, active: 0 });

  const avgDays = useMemo(() => avgDaysOnBooks(properties), [properties]);

  const salesThisMonth = useMemo(() => {
    const start = startOfCurrentMonthMs();
    let count = 0;
    let volume = 0;
    for (const lead of leads) {
      const id = foldStage(lead.status);
      const isClosed = lead.status === "cerrado" || id.includes("cerrad");
      if (!isClosed) continue;
      const ts = closedTimestamp(lead);
      if (ts == null || ts < start) continue;
      count += 1;
      volume += Number(lead.budget) || 0;
    }
    return { count, volume };
  }, [leads]);

  const newLeadsMonth = useMemo(() => leads.filter(createdThisMonth).length, [leads]);

  const activePipeline = useMemo(
    () =>
      leads.filter((l) => {
        const id = foldStage(l.status);
        return !id.includes("cerrad") && !id.includes("perdid");
      }).length,
    [leads]
  );

  useEffect(() => {
    const target = {
      avg: avgDays ?? 0,
      sales: salesThisMonth.count,
      newM: newLeadsMonth,
      active: activePipeline,
    };
    const durationMs = 650;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp({
        avg: target.avg * e,
        sales: target.sales * e,
        newM: target.newM * e,
        active: target.active * e,
      });
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [avgDays, salesThisMonth.count, newLeadsMonth, activePipeline]);

  const funnelCounts = useMemo(() => {
    const counts = Array.from({ length: FUNNEL_LABELS.length }, () => 0);
    for (const lead of leads) {
      const idx = classifyLeadFunnelIndex(lead, customStages);
      if (idx >= 0 && idx < counts.length) counts[idx] += 1;
    }
    return counts;
  }, [leads, customStages]);

  const funnelData = useMemo(
    () => FUNNEL_LABELS.map((name, i) => ({ name, value: funnelCounts[i] })),
    [funnelCounts]
  );

  const maxFunnel = Math.max(...funnelCounts, 1);

  const sourceDonutData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const g of SOURCE_GROUPS) buckets.set(g.label, 0);
    buckets.set("Otros", 0);
    for (const lead of leads) {
      const src = (lead.source || "").trim();
      let placed = false;
      for (const g of SOURCE_GROUPS) {
        if (g.test(src)) {
          buckets.set(g.label, (buckets.get(g.label) ?? 0) + 1);
          placed = true;
          break;
        }
      }
      if (!placed) buckets.set("Otros", (buckets.get("Otros") ?? 0) + 1);
    }
    return [...buckets.entries()]
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  const inventoryParts = useMemo(() => {
    const acc: Record<(typeof INVENTORY_KEYS)[number], number> = {
      disponible: 0,
      enApartado: 0,
      vendida: 0,
      renta: 0,
    };
    for (const p of properties) {
      const inv = p.listingInventory ?? "disponible";
      if (inv === "disponible") acc.disponible += 1;
      else if (inv === "en_apartado") acc.enApartado += 1;
      else if (inv === "vendida") acc.vendida += 1;
      else acc.renta += 1;
    }
    const total = acc.disponible + acc.enApartado + acc.vendida + acc.renta;
    return { acc, total };
  }, [properties]);

  const totalLeads = leads.length;

  return (
    <div className="space-y-6">
      {/* KPIs — 4 columnas en desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Días prom. en inventario"
          value={avgDays == null ? "—" : `${disp.avg.toFixed(0)} días`}
          hint="Media desde última sync en catálogo."
          icon={Clock}
        />
        <StatCard
          label="Ventas del mes"
          value={Math.round(disp.sales).toString()}
          hint={
            salesThisMonth.volume > 0
              ? `Presupuesto acum. $${salesThisMonth.volume.toLocaleString("es-MX")}`
              : "Cierres con fecha en el mes actual."
          }
          icon={Calendar}
        />
        <StatCard
          label="Nuevos leads (mes)"
          value={Math.round(disp.newM).toString()}
          hint="Altas registradas este mes."
          icon={Sparkles}
        />
        <StatCard
          label="Activos en pipeline"
          value={Math.round(disp.active).toString()}
          hint={`${totalLeads} leads en tu alcance · sin cerrar ni perdidos`}
          icon={Target}
        />
      </div>

      {/* Embudo + Origen — mitad / mitad en lg */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
        <section className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-brand-navy">Embudo de ventas</h3>
              <p className="text-xs text-slate-500">Prospectos por etapa</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {funnelData.map((row, i) => (
              <div
                key={row.name}
                className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-center transition hover:border-slate-200 hover:bg-white"
              >
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{row.name}</span>
                <span className="font-heading mt-1 text-xl text-brand-navy" style={{ fontWeight: 700 }}>
                  {row.value}
                </span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-slate-600 transition-all duration-500"
                    style={{ width: `${Math.max(8, (row.value / maxFunnel) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <PieChartIcon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-brand-navy">Origen de leads</h3>
              <p className="text-xs text-slate-500">Distribución por canal</p>
            </div>
          </div>
          {sourceDonutData.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-12 text-sm text-slate-400">Sin datos de origen</p>
          ) : (
            <div className="grid flex-1 grid-cols-1 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="mx-auto aspect-square w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={92}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {sourceDonutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_SEGMENT_FILLS[index % CHART_SEGMENT_FILLS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                {sourceDonutData.map((row, i) => {
                  const pct = leads.length ? Math.round((row.value / leads.length) * 100) : 0;
                  return (
                    <li key={row.name} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CHART_SEGMENT_FILLS[i % CHART_SEGMENT_FILLS.length] }}
                          aria-hidden
                        />
                        <span className="truncate text-slate-700">{row.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums font-semibold text-brand-navy">
                        {row.value}{" "}
                        <span className="font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Inventario — barra única + chips */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Users className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-brand-navy">Estado del inventario</h3>
            <p className="text-xs text-slate-500">
              {inventoryParts.total} propiedades en catálogo · vista rápida por estado
            </p>
          </div>
        </div>

        {inventoryParts.total === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No hay propiedades cargadas.</p>
        ) : (
          <>
            <div className="flex h-11 w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200/80">
              {INVENTORY_KEYS.map((key) => {
                const n = inventoryParts.acc[key];
                const pct = (n / inventoryParts.total) * 100;
                if (pct <= 0) return null;
                return (
                  <div
                    key={key}
                    title={`${INVENTORY_LABELS[key]}: ${n}`}
                    className={cn(
                      "flex min-w-[2px] items-center justify-center text-[10px] font-semibold text-white/95 shadow-inner first:rounded-l-xl last:rounded-r-xl",
                      INVENTORY_UI[key]
                    )}
                    style={{ width: `${pct}%` }}
                  >
                    {pct >= 12 ? <span className="drop-shadow-sm">{n}</span> : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              {INVENTORY_KEYS.map((key) => (
                <span key={key} className="inline-flex items-center gap-2 text-slate-600">
                  <span className={cn("h-2 w-2 rounded-full", INVENTORY_UI[key])} aria-hidden />
                  {INVENTORY_LABELS[key]}
                  <span className="font-semibold tabular-nums text-brand-navy">{inventoryParts.acc[key]}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

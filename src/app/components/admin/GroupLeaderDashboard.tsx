import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import { Activity, Timer } from "lucide-react";
import type { Lead } from "../../data/leads";
import { labelForLeadStatus, type CustomKanbanStage } from "../../data/leads";
import type { Property } from "../PropertyCard";
import type { User } from "../../contexts/AuthContext";
import { foldSearchText } from "../../lib/searchText";
import { cn } from "../ui/utils";

type Props = {
  leads: Lead[];
  properties: Property[];
  customStages: CustomKanbanStage[];
  users: User[];
};

const tooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px -8px rgb(15 23 42 / 0.12)",
  fontSize: "12px",
  fontWeight: 500,
} as const;

function foldStage(s: string): string {
  return foldSearchText(s).replace(/\s+/g, " ").trim();
}

function parseLeadTime(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const t = Date.parse(raw.includes("T") ? raw : `${raw}T12:00:00`);
  return Number.isNaN(t) ? null : t;
}

function startEndCurrentMonthMs(): { start: number; end: number } {
  const n = new Date();
  const start = new Date(n.getFullYear(), n.getMonth(), 1).getTime();
  const end = new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

function isClosedLead(lead: Lead, customStages: CustomKanbanStage[]): boolean {
  const id = foldStage(lead.status);
  const label = foldStage(labelForLeadStatus(lead.status, customStages));
  return lead.status === "cerrado" || id.includes("cerrad") || label.includes("cerrad");
}

function closedTimestamp(lead: Lead): number | null {
  const raw = lead.updatedAt ?? lead.lastContact ?? lead.createdAt;
  return parseLeadTime(raw);
}

function closedThisMonth(lead: Lead, customStages: CustomKanbanStage[]): boolean {
  if (!isClosedLead(lead, customStages)) return false;
  const ts = closedTimestamp(lead);
  if (ts == null) return false;
  const { start, end } = startEndCurrentMonthMs();
  return ts >= start && ts <= end;
}

function advisorLabel(lead: Lead, users: User[]): string {
  const uid = lead.assignedToUserId?.trim();
  if (uid) {
    const u = users.find((x) => x.id.toLowerCase() === uid.toLowerCase());
    if (u?.name?.trim()) return u.name.trim();
    if (u?.email?.trim()) return u.email.trim();
  }
  const name = lead.assignedTo?.trim();
  return name || "Sin asignar";
}

function advisorKey(lead: Lead): string {
  return lead.assignedToUserId?.trim().toLowerCase() || `name:${foldSearchText(lead.assignedTo || "")}` || "unassigned";
}

/** Valor reconocido en promesa / contrato (pipeline avanzado, sin cierre). */
function isContractPromise(lead: Lead, customStages: CustomKanbanStage[]): boolean {
  if (isClosedLead(lead, customStages)) return false;
  const lab = foldSearchText(labelForLeadStatus(lead.status, customStages));
  return /promes|contrato|escritur|oferta\s*acept|firma|apartado\s*formal|soy\s*comprador/i.test(lab);
}

/** Valor en riesgo de no concretarse (no solapa con promesa). */
function isRiskPipeline(lead: Lead, customStages: CustomKanbanStage[]): boolean {
  if (isClosedLead(lead, customStages)) return false;
  if (isContractPromise(lead, customStages)) return false;
  const lab = foldSearchText(labelForLeadStatus(lead.status, customStages));
  return /riesgo|cancel|desist|retract|incumpl|no\s*califica|descart/i.test(lab);
}

function responseHours(lead: Lead): number | null {
  const c0 = parseLeadTime(lead.createdAt);
  const c1 = parseLeadTime(lead.lastContact);
  if (c0 == null || c1 == null) return null;
  const h = (c1 - c0) / 3600000;
  if (!Number.isFinite(h) || h < 0) return null;
  return h;
}

function bucketResponseHours(h: number): string {
  if (h < 1) return "< 1 h";
  if (h < 4) return "1–4 h";
  if (h < 24) return "4–24 h";
  if (h < 72) return "1–3 d";
  return "3 d+";
}

function formatMoney(n: number): string {
  return n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function trafficLightClass(rate: number, volume: number): { cls: string; label: string } {
  if (volume < 3) return { cls: "bg-slate-200 text-slate-600", label: "—" };
  if (rate >= 0.2) return { cls: "bg-emerald-100 text-emerald-800", label: "Alto" };
  if (rate >= 0.1) return { cls: "bg-amber-100 text-amber-900", label: "Medio" };
  return { cls: "bg-rose-100 text-rose-800", label: "Bajo" };
}

export function GroupLeaderDashboard({ leads, properties, customStages, users }: Props) {
  const salesByAdvisor = useMemo(() => {
    const map = new Map<string, { key: string; name: string; total: number }>();
    for (const lead of leads) {
      if (!isClosedLead(lead, customStages)) continue;
      const key = advisorKey(lead);
      const name = advisorLabel(lead, users);
      const amt = Number(lead.budget) || 0;
      const prev = map.get(key) ?? { key, name, total: 0 };
      prev.total += amt;
      prev.name = name;
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [leads, customStages, users]);

  const conversionRows = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; total: number; closed: number }
    >();
    for (const lead of leads) {
      const key = advisorKey(lead);
      const name = advisorLabel(lead, users);
      const row = map.get(key) ?? { key, name, total: 0, closed: 0 };
      row.total += 1;
      if (isClosedLead(lead, customStages)) row.closed += 1;
      row.name = name;
      map.set(key, row);
    }
    const rows = [...map.values()].map((r) => ({
      ...r,
      rate: r.total > 0 ? r.closed / r.total : 0,
    }));
    return rows.sort((a, b) => b.rate - a.rate || b.total - a.total);
  }, [leads, customStages, users]);

  const scatterData = useMemo(() => {
    const now = Date.now();
    const out: { id: string; x: number; y: number; title: string }[] = [];
    for (const p of properties) {
      const iso = p.listedAtIso;
      if (!iso) continue;
      const t = Date.parse(iso);
      if (Number.isNaN(t)) continue;
      const days = (now - t) / 86400000;
      if (days < 0) continue;
      out.push({
        id: p.id,
        x: Math.round(days * 10) / 10,
        y: p.price,
        title: p.title,
      });
    }
    return out;
  }, [properties]);

  const responseStats = useMemo(() => {
    const hours: number[] = [];
    for (const lead of leads) {
      const h = responseHours(lead);
      if (h != null) hours.push(h);
    }
    const avg = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;
    const buckets = new Map<string, number>();
    for (const h of hours) {
      const b = bucketResponseHours(h);
      buckets.set(b, (buckets.get(b) ?? 0) + 1);
    }
    const order = ["< 1 h", "1–4 h", "4–24 h", "1–3 d", "3 d+"];
    const hist = order.map((name) => ({ name, count: buckets.get(name) ?? 0 }));
    return { avg, hist, n: hours.length };
  }, [leads]);

  const waterfall = useMemo(() => {
    let ventasMes = 0;
    let promesas = 0;
    let riesgo = 0;
    for (const lead of leads) {
      const amt = Number(lead.budget) || 0;
      if (closedThisMonth(lead, customStages)) ventasMes += amt;
      else if (isContractPromise(lead, customStages)) promesas += amt;
      else if (isRiskPipeline(lead, customStages)) riesgo += amt;
    }
    const proyeccion = ventasMes + promesas - riesgo;
    return { ventasMes, promesas, riesgo, proyeccion };
  }, [leads, customStages]);

  const wfBars = useMemo(
    () => [
      { name: "Cerradas (mes)", value: waterfall.ventasMes, kind: "up" as const },
      { name: "Promesas / contrato", value: waterfall.promesas, kind: "up" as const },
      { name: "Riesgo / baja", value: -waterfall.riesgo, kind: "risk" as const },
    ],
    [waterfall]
  );

  const maxScatterX = useMemo(() => {
    if (!scatterData.length) return 1;
    return Math.max(...scatterData.map((d) => d.x), 1);
  }, [scatterData]);
  const maxScatterY = useMemo(() => {
    if (!scatterData.length) return 1;
    return Math.max(...scatterData.map((d) => d.y), 1);
  }, [scatterData]);

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        Vista consolidada del pipeline activo: desempeño por asesor, inventario y ritmo de contacto.
      </p>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Ventas por asesor */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>
            Ventas por asesor
          </h3>
          <p className="mt-1 text-xs text-slate-500">Monto cerrado total (presupuesto del lead en cierre).</p>
          {salesByAdvisor.length === 0 ? (
            <p className="mt-8 py-10 text-center text-sm text-slate-400">Sin cierres registrados en este pipeline.</p>
          ) : (
            <div
              className="mt-4 min-h-[220px] w-full"
              style={{ height: Math.min(440, Math.max(220, 72 + salesByAdvisor.length * 40)) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={salesByAdvisor}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${formatMoney(Number(v))}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={108}
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`$${formatMoney(v)}`, "Monto"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {salesByAdvisor.map((_, i) => (
                      <Cell key={i} fill="#475569" />
                    ))}
                    <LabelList
                      dataKey="total"
                      position="right"
                      formatter={(v: number) => `$${formatMoney(v)}`}
                      style={{ fill: "#334155", fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Ranking conversión */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>
            Ranking de conversión
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Leads cerrados ÷ leads con carga en el equipo. Semáforo por tasa (mín. 3 leads para calificar).
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5">Asesor</th>
                  <th className="px-3 py-2.5 text-right">Leads</th>
                  <th className="px-3 py-2.5 text-right">Cierres</th>
                  <th className="px-3 py-2.5 text-right">Tasa</th>
                  <th className="px-3 py-2.5 text-center">Semáforo</th>
                </tr>
              </thead>
              <tbody>
                {conversionRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                      Sin leads en el pipeline.
                    </td>
                  </tr>
                ) : (
                  conversionRows.map((row) => {
                    const tl = trafficLightClass(row.rate, row.total);
                    return (
                      <tr key={row.key} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-brand-navy">{row.name}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{row.total}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{row.closed}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-800">
                          {(row.rate * 100).toFixed(1)}%
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={cn(
                              "inline-flex min-w-[4.5rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              tl.cls
                            )}
                          >
                            {tl.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Scatter inventario */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>
            Inventario vs. tiempo en mercado
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Cada punto es una propiedad con fecha de publicación (eje X: días, eje Y: precio).
          </p>
          {scatterData.length === 0 ? (
            <p className="mt-8 py-12 text-center text-sm text-slate-400">
              No hay propiedades con fecha de listado para graficar.
            </p>
          ) : (
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Días"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Días publicado", position: "bottom", offset: 0, fill: "#64748b", fontSize: 11 }}
                    domain={[0, Math.ceil(maxScatterX * 1.05)]}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Precio"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${formatMoney(Number(v))}`}
                    domain={[0, Math.ceil(maxScatterY * 1.05)]}
                  />
                  <ZAxis range={[48, 48]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as { x: number; y: number; title: string };
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                          <p className="max-w-[240px] truncate font-medium text-brand-navy">{p.title}</p>
                          <p className="mt-1 text-slate-600">
                            {p.x} d · ${formatMoney(p.y)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter name="Propiedades" data={scatterData} fill="#475569">
                    {scatterData.map((_, i) => (
                      <Cell key={scatterData[i].id} fill="#475569" fillOpacity={0.65} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Velocidad de respuesta */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>
                Velocidad de respuesta
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Tiempo desde alta del lead hasta último contacto registrado (proxy del primer seguimiento).
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <Timer className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Promedio equipo</p>
                <p className="font-heading text-lg tabular-nums text-brand-navy" style={{ fontWeight: 700 }}>
                  {responseStats.avg == null ? "—" : `${responseStats.avg < 24 ? responseStats.avg.toFixed(1) + " h" : (responseStats.avg / 24).toFixed(1) + " d"}`}
                </p>
                <p className="text-[10px] text-slate-400">{responseStats.n} leads con fechas válidas</p>
              </div>
            </div>
          </div>

          {responseStats.n === 0 ? (
            <p className="mt-8 py-10 text-center text-sm text-slate-400">
              Sin datos de contacto para calcular tiempos.
            </p>
          ) : (
            <div className="mt-6 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseStats.hist} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Leads"]} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {responseStats.hist.map((_, i) => (
                      <Cell key={i} fill="#64748b" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gauge compacto: 0–72 h como referencia */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
            <Activity className="h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.75} />
            <p>
              La meta típica es contactar en{" "}
              <span className="font-semibold text-brand-navy">&lt; 24 h</span>. Ajusta procesos si la mayoría cae en
              franjas largas.
            </p>
          </div>
        </section>
      </div>

      {/* Waterfall / proyección */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>
          Proyección de cierres (mes)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Cerradas en el mes + valor en promesa/contrato − valor marcado en riesgo ({""}
          heurística por nombre de etapa). Úsalo como guía, no como contabilidad final.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-end">
          <div className="h-[280px] min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wfBars} margin={{ top: 16, right: 16, left: 8, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} interval={0} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${formatMoney(Number(v))}`}
                />
                <Tooltip
                  formatter={(v: number) => [`$${formatMoney(v)}`, "Monto"]}
                  contentStyle={tooltipStyle}
                />
                <ReferenceLine
                  y={0}
                  stroke="#94a3b8"
                />
                <ReferenceLine
                  y={waterfall.proyeccion}
                  stroke="#141c2e"
                  strokeDasharray="4 4"
                  label={{
                    value: `Proyección ${formatMoney(waterfall.proyeccion)}`,
                    position: "right",
                    fill: "#141c2e",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {wfBars.map((row, i) => (
                    <Cell
                      key={row.name}
                      fill={row.kind === "risk" && row.value < 0 ? "#94a3b8" : "#475569"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
            <li className="flex justify-between gap-4">
              <span className="text-slate-600">Ventas cerradas (mes)</span>
              <span className="font-semibold tabular-nums text-brand-navy">${formatMoney(waterfall.ventasMes)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-slate-600">+ Promesas / contrato</span>
              <span className="font-semibold tabular-nums text-slate-800">${formatMoney(waterfall.promesas)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-slate-600">− Riesgo estimado</span>
              <span className="font-semibold tabular-nums text-slate-600">-${formatMoney(waterfall.riesgo)}</span>
            </li>
            <li className="flex justify-between gap-4 border-t border-slate-200 pt-3">
              <span className="font-medium text-brand-navy">Proyección</span>
              <span className="font-heading text-lg tabular-nums text-brand-navy" style={{ fontWeight: 700 }}>
                ${formatMoney(waterfall.proyeccion)}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

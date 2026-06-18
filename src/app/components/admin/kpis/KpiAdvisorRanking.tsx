import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import type { User } from "../../../contexts/AuthContext";
import type { AdvisorRow } from "../../../lib/kpiCompute";
import { csvFromRows, downloadCsv, formatHours, formatMoney } from "../../../lib/kpiCompute";
import { foldSearchText } from "../../../lib/searchText";
import { KpiUserAvatar } from "./KpiUserAvatar";
import { cn } from "../../ui/utils";

interface Props {
  rows: AdvisorRow[];
  users?: User[];
  onSelect?: (userId: string) => void;
}

function trafficLight(rate: number, total: number): { cls: string; label: string } {
  if (total < 3) return { cls: "bg-slate-200 text-slate-600", label: "—" };
  if (rate >= 0.2) return { cls: "bg-emerald-100 text-emerald-800", label: "Alto" };
  if (rate >= 0.1) return { cls: "bg-amber-100 text-amber-900", label: "Medio" };
  return { cls: "bg-rose-100 text-rose-800", label: "Bajo" };
}

export function KpiAdvisorRanking({ rows, users = [], onSelect }: Props) {
  const [search, setSearch] = useState("");

  const userById = useMemo(() => {
    const m = new Map<string, User>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  const visibleRows = useMemo(() => {
    const q = foldSearchText(search);
    if (!q) return rows;
    return rows.filter((r) => foldSearchText(r.name).includes(q));
  }, [rows, search]);

  const handleExport = () => {
    const csv = csvFromRows(
      ["Asesor", "Leads", "Cierres", "Perdidos", "Tasa", "Monto", "Ticket prom.", "Resp. h"],
      visibleRows.map((r) => ({
        Asesor: r.name,
        Leads: r.totalLeads,
        Cierres: r.closed,
        Perdidos: r.lost,
        Tasa: `${(r.conversionRate * 100).toFixed(1)}%`,
        Monto: r.salesVolume,
        "Ticket prom.": r.ticketAverage,
        "Resp. h": r.avgResponseHours == null ? "" : r.avgResponseHours.toFixed(1),
      }))
    );
    downloadCsv("kpi-ranking-asesores.csv", csv);
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-navy">Ranking de asesores</h3>
          <p className="mt-0.5 text-xs text-slate-500">Cierres, monto, conversión y velocidad de respuesta.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative min-w-[200px] flex-1 sm:w-56">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en el ranking…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-brand-navy shadow-sm placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              aria-label="Buscar asesor en el ranking"
            />
          </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300"
          title="Exportar CSV"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          CSV
        </button>
        </div>
      </div>

      {search.trim() ? (
        <p className="mb-2 text-[11px] text-slate-500">
          Mostrando {visibleRows.length} de {rows.length} asesores
        </p>
      ) : null}

      <div className="crm-horizontal-scroll overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5">Asesor</th>
              <th className="px-3 py-2.5 text-right">Leads</th>
              <th className="px-3 py-2.5 text-right">Cierres</th>
              <th className="px-3 py-2.5 text-right">Tasa</th>
              <th className="px-3 py-2.5 text-right">Monto</th>
              <th className="px-3 py-2.5 text-right">Ticket prom.</th>
              <th className="px-3 py-2.5 text-right">Resp.</th>
              <th className="px-3 py-2.5 text-center">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                  {rows.length === 0
                    ? "Sin datos en el rango actual."
                    : "Ningún asesor coincide con la búsqueda."}
                </td>
              </tr>
            ) : (
              visibleRows.map((r) => {
                const tl = trafficLight(r.conversionRate, r.totalLeads);
                const clickable = !!onSelect && !!r.userId;
                return (
                  <tr
                    key={r.userId || r.name}
                    className={cn(
                      "border-b border-slate-50 last:border-0",
                      clickable && "cursor-pointer transition hover:bg-slate-50/70"
                    )}
                    onClick={clickable ? () => onSelect?.(r.userId) : undefined}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {r.userId && userById.get(r.userId) ? (
                          <KpiUserAvatar user={userById.get(r.userId)!} size="sm" />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                            ?
                          </span>
                        )}
                        <span className="font-medium text-brand-navy">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{r.totalLeads}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{r.closed}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-800">
                      {(r.conversionRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      ${formatMoney(r.salesVolume)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      ${formatMoney(r.ticketAverage)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {formatHours(r.avgResponseHours)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("inline-flex min-w-[4.5rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold", tl.cls)}>
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
  );
}

import { useState, type RefObject } from "react";
import { Download, FileImage } from "lucide-react";
import { csvFromRows, downloadCsv, formatMoney } from "../../../lib/kpiCompute";
import type { CoreKpis } from "../../../lib/kpiCompute";
import type { AdvisorRow, AppointmentStats } from "../../../lib/kpiCompute";

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
  current: CoreKpis;
  advisorRanking: AdvisorRow[];
  appointments: AppointmentStats;
  scopeLabel: string;
  rangeLabel: string;
}

export function KpiExportButtons({
  containerRef,
  current,
  advisorRanking,
  appointments,
  scopeLabel,
  rangeLabel,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleExportCsv = () => {
    const summary = csvFromRows(
      ["Métrica", "Valor"],
      [
        { Métrica: "Scope", Valor: scopeLabel },
        { Métrica: "Rango", Valor: rangeLabel },
        { Métrica: "Leads totales", Valor: current.totalLeads },
        { Métrica: "Nuevos leads", Valor: current.newLeads },
        { Métrica: "Cierres", Valor: current.salesCount },
        { Métrica: "Monto vendido", Valor: current.salesVolume },
        { Métrica: "Ticket promedio", Valor: current.ticketAverage },
        { Métrica: "Conversión", Valor: `${(current.conversionRate * 100).toFixed(1)}%` },
        { Métrica: "Tiempo en pipeline (d)", Valor: current.avgPipelineDays?.toFixed(1) ?? "—" },
        { Métrica: "1° contacto (h)", Valor: current.avgFirstContactHours?.toFixed(1) ?? "—" },
        { Métrica: "Pipeline ponderado", Valor: current.weightedPipelineValue },
        { Métrica: "Stale leads", Valor: current.staleLeads },
        { Métrica: "Citas completadas", Valor: appointments.completed },
        { Métrica: "Citas canceladas", Valor: appointments.cancelled },
      ].map((row) => ({
        ...row,
        Valor:
          typeof row.Valor === "number" && row.Métrica.includes("Monto")
            ? formatMoney(row.Valor)
            : row.Valor,
      }))
    );
    downloadCsv(`kpi-resumen.csv`, summary);

    const ranking = csvFromRows(
      ["Asesor", "Leads", "Cierres", "Tasa", "Monto", "Ticket prom."],
      advisorRanking.map((r) => ({
        Asesor: r.name,
        Leads: r.totalLeads,
        Cierres: r.closed,
        Tasa: `${(r.conversionRate * 100).toFixed(1)}%`,
        Monto: r.salesVolume,
        "Ticket prom.": r.ticketAverage,
      }))
    );
    downloadCsv(`kpi-ranking.csv`, ranking);
  };

  /**
   * Captura el contenedor a PNG sin requerir dependencias externas: usa la API
   * `Blob` + `data:image/svg+xml` con `foreignObject`. Funciona razonablemente
   * para bloques con estilos básicos (es mejor que nada y evita instalar libs).
   */
  const handleExportImage = async () => {
    if (!containerRef.current) return;
    setBusy(true);
    try {
      const node = containerRef.current;
      const rect = node.getBoundingClientRect();
      const width = Math.max(1024, Math.ceil(rect.width));
      const height = Math.max(1024, Math.ceil(node.scrollHeight));
      const clone = node.cloneNode(true) as HTMLElement;
      clone.style.width = `${width}px`;
      clone.style.background = "white";
      const xml = new XMLSerializer().serializeToString(clone);
      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Poppins', system-ui, sans-serif; padding:24px; background:white;">
      ${xml}
    </div>
  </foreignObject>
</svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kpi-dashboard.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExportCsv}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
        Exportar CSV
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={handleExportImage}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60"
      >
        <FileImage className="h-3.5 w-3.5" strokeWidth={1.75} />
        Exportar SVG
      </button>
    </div>
  );
}

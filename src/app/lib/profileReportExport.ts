import type { User } from "../contexts/AuthContext";
import { roleLabelEs } from "./leadsAccess";
import type { ProfileInsights } from "./profileInsights";
import { csvFromRows, downloadCsv, formatMoney } from "./kpiCompute";
import * as XLSX from "xlsx";

export type ProfileReportSheet = {
  /** Nombre de hoja (máx. 31 caracteres en Excel) */
  name: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

function safeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Hoja";
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n}%`;
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function reportBaseFilename(user: User): string {
  const safeName = user.name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ_-]/g, "")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `reporte-perfil-${safeName || "usuario"}-${date}`;
}

export function buildProfileReportSheets(
  insights: ProfileInsights,
  user: User,
): ProfileReportSheet[] {
  const generatedAt = new Date().toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const role = roleLabelEs(user.role);
  const { stats } = insights;

  const sheets: ProfileReportSheet[] = [
    {
      name: "Información",
      headers: ["Campo", "Valor"],
      rows: [
        ["Nombre", user.name],
        ["Correo", user.email],
        ["Rol", role],
        ["Período", insights.rangeLabel],
        ["Generado", generatedAt],
      ],
    },
    {
      name: "Resumen",
      headers: ["Métrica", "Valor"],
      rows: [
        ["Pipeline activo (leads abiertos)", stats.activePipeline],
        ["Nuevos leads (mes)", stats.newLeadsMonth],
        ["Cierres (mes)", stats.closedMonth],
        ["Conversión (%)", stats.conversionPct],
        ["Sin seguimiento (+7 días)", stats.staleLeads],
        ["Citas (mes)", stats.appointmentsMonth],
        ["Valor estimado del pipeline", formatMoney(stats.pipelineValue)],
        [
          "Ticket promedio",
          stats.ticketAverage > 0 ? formatMoney(stats.ticketAverage) : "—",
        ],
        [
          "Tiempo 1.er contacto (h)",
          stats.avgFirstContactHours != null ? stats.avgFirstContactHours.toFixed(1) : "—",
        ],
        [
          "Días en pipeline (cierres)",
          stats.avgPipelineDays != null ? stats.avgPipelineDays.toFixed(0) : "—",
        ],
        [
          "Nota pipeline",
          "Proyección según presupuesto × probabilidad por etapa; no es ingreso confirmado.",
        ],
      ],
    },
    {
      name: "Comparación mes",
      headers: ["Indicador", "Mes actual", "Mes anterior", "Variación %"],
      rows: insights.monthComparison.map((r) => [
        r.label,
        r.format === "percent" ? `${r.current}%` : r.current,
        r.format === "percent" ? `${r.previous}%` : r.previous,
        fmtPct(r.deltaPct),
      ]),
    },
    {
      name: "Equipos",
      headers: ["Equipo", "Tu rol", "Líder", "Integrantes", "Compañeros"],
      rows:
        insights.groups.length === 0
          ? [["—", "—", "—", "—", "Sin grupos asignados"]]
          : insights.groups.map((g) => [
              g.name,
              g.role === "leader" ? "Líder" : "Miembro",
              g.leaderName,
              g.memberCount,
              g.teammates.map((t) => t.name).join("; ") || "—",
            ]),
    },
    {
      name: "Pipeline etapas",
      headers: ["Etapa", "Leads", "Prob. cierre %", "Valor ponderado"],
      rows: insights.pipelineByStage.map((r) => [
        r.stageLabel,
        r.leadCount,
        r.probabilityPct,
        formatMoney(r.weightedValue),
      ]),
    },
    {
      name: "Embudo",
      headers: ["Etapa", "Leads", "Conv. siguiente %"],
      rows: insights.funnel.map((f) => [
        f.label,
        f.count,
        f.conversionToNext != null ? Math.round(f.conversionToNext * 1000) / 10 : "—",
      ]),
    },
    {
      name: "Origen leads",
      headers: ["Origen", "Leads", "Participación %"],
      rows: insights.sources.map((s) => [
        s.name,
        s.count,
        Math.round(s.share * 1000) / 10,
      ]),
    },
    {
      name: "Tendencia 6 meses",
      headers: ["Mes", "Nuevos leads", "Cierres", "Monto vendido"],
      rows: insights.trend.map((t) => [
        t.label,
        t.newLeads,
        t.closedLeads,
        formatMoney(t.salesVolume),
      ]),
    },
    {
      name: "Metas KPI",
      headers: ["Meta", "Actual", "Objetivo", "Avance %"],
      rows: insights.kpiProgress.map((k) => [
        k.label,
        k.displayActual,
        k.displayTarget,
        k.progress != null ? Math.round(k.progress * 100) : "—",
      ]),
    },
    {
      name: "Prioridades",
      headers: ["Lead", "Etapa", "Días sin contacto", "Presupuesto", "Motivo"],
      rows: insights.priorityLeads.map((l) => [
        l.name,
        l.stageLabel,
        l.daysSinceContact,
        l.budget > 0 ? formatMoney(l.budget) : "—",
        l.reason === "stale" ? "Sin seguimiento" : "Alto valor",
      ]),
    },
    {
      name: "Próximas citas",
      headers: ["Título", "Cliente", "Inicio", "Estado"],
      rows: insights.upcomingAppointments.map((a) => [
        a.title,
        a.clientName,
        new Date(a.start).toLocaleString("es-MX"),
        a.status,
      ]),
    },
  ];

  return sheets;
}

function sectionBlock(title: string, csv: string): string {
  return [`=== ${title} ===`, csv].join("\n");
}

export function buildProfilePerformanceReportCsv(
  insights: ProfileInsights,
  user: User,
): string {
  const sheets = buildProfileReportSheets(insights, user);
  const blocks = sheets.map((s) =>
    sectionBlock(s.name, csvFromRows(s.headers, rowsToRecords(s.headers, s.rows))),
  );
  return ["REPORTE DE RENDIMIENTO — VITERRA CRM", ...blocks].join("\n\n");
}

function rowsToRecords(
  headers: string[],
  rows: Array<Array<string | number>>,
): Array<Record<string, unknown>> {
  return rows.map((row) => {
    const rec: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      rec[h] = row[i] ?? "";
    });
    return rec;
  });
}

export function downloadProfilePerformanceReportCsv(
  insights: ProfileInsights,
  user: User,
): void {
  const csv = buildProfilePerformanceReportCsv(insights, user);
  const bom = "\uFEFF";
  downloadCsv(`${reportBaseFilename(user)}.csv`, bom + csv);
}

export function downloadProfilePerformanceReportExcel(
  insights: ProfileInsights,
  user: User,
): void {
  const sheets = buildProfileReportSheets(insights, user);
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const data = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths = sheet.headers.map((h, colIdx) => {
      let max = h.length;
      for (const row of sheet.rows) {
        const cell = String(row[colIdx] ?? "");
        if (cell.length > max) max = cell.length;
      }
      return { wch: Math.min(Math.max(max + 2, 10), 48) };
    });
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(sheet.name));
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(`${reportBaseFilename(user)}.xlsx`, blob);
}

/** @deprecated Usar downloadProfilePerformanceReportExcel */
export function downloadProfilePerformanceReport(
  insights: ProfileInsights,
  user: User,
): void {
  downloadProfilePerformanceReportCsv(insights, user);
}

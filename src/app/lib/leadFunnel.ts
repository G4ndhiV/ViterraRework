import type { Lead } from "../data/leads";
import { labelForLeadStatus, type CustomKanbanStage } from "../data/leads";
import { foldSearchText } from "./searchText";

export const FUNNEL_LABELS = [
  "Lead nuevo",
  "Contactado",
  "Cita",
  "Visita",
  "Oferta",
  "Cierre",
] as const;

export function foldStage(s: string): string {
  return foldSearchText(s).replace(/\s+/g, " ").trim();
}

export function parseLeadTime(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const t = Date.parse(raw.includes("T") ? raw : `${raw}T12:00:00`);
  return Number.isNaN(t) ? null : t;
}

export function startOfCurrentMonthMs(): number {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).getTime();
}

export function createdThisMonth(lead: Lead): boolean {
  const start = startOfCurrentMonthMs();
  const t = parseLeadTime(lead.createdAt);
  return t != null && t >= start;
}

export function classifyLeadFunnelIndex(lead: Lead, customStages: CustomKanbanStage[]): number {
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

export function countFunnelStages(leads: Lead[], customStages: CustomKanbanStage[]): number[] {
  const counts = Array.from({ length: FUNNEL_LABELS.length }, () => 0);
  for (const lead of leads) {
    const idx = classifyLeadFunnelIndex(lead, customStages);
    if (idx >= 0 && idx < counts.length) counts[idx] += 1;
  }
  return counts;
}

export function funnelChartData(leads: Lead[], customStages: CustomKanbanStage[]) {
  const counts = countFunnelStages(leads, customStages);
  return FUNNEL_LABELS.map((name, i) => ({ name, value: counts[i] }));
}

export function isActivePipelineLead(lead: Lead): boolean {
  const id = foldStage(lead.status);
  return !id.includes("cerrad") && !id.includes("perdid");
}

export function countActivePipeline(leads: Lead[]): number {
  return leads.filter(isActivePipelineLead).length;
}

export const SOURCE_GROUPS: { label: string; test: (src: string) => boolean }[] = [
  { label: "Facebook / Meta", test: (s) => /facebook|meta|instagram/i.test(s) },
  { label: "Portales / Web", test: (s) => /website|google|portal|inmuebl|seo|zonaprop|lamudi|easybroker/i.test(s) },
  { label: "Recomendaciones", test: (s) => /referid|recomend|amigo|boca/i.test(s) },
  { label: "Cartas / campo", test: (s) => /carta|físic|volante|puerta|folleto/i.test(s) },
];

export function groupLeadsBySource(leads: Lead[]): { name: string; value: number }[] {
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
}

/** Leads activos sin contacto en más de `days` días. */
export function leadsNeedingAttention(leads: Lead[], days = 7): Lead[] {
  const threshold = Date.now() - days * 86400000;
  return leads.filter((lead) => {
    if (!isActivePipelineLead(lead)) return false;
    const last = parseLeadTime(lead.lastContact);
    if (last == null) {
      const created = parseLeadTime(lead.createdAt);
      return created != null && created < threshold;
    }
    return last < threshold;
  });
}

export function dashboardTimeGreetingEs(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Buenos días";
  if (h >= 12 && h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function firstNameFromDisplayName(name: string | undefined): string {
  const t = name?.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? "";
}

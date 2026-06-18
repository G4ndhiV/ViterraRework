import type { AgendaAppointment } from "../data/agenda";
import type { Lead } from "../data/leads";
import { parseAppointment } from "../data/agenda";
import {
  createdThisMonth,
  firstNameFromDisplayName,
  foldStage,
  isActivePipelineLead,
  leadsNeedingAttention,
  parseLeadTime,
  startOfCurrentMonthMs,
} from "./leadFunnel";

const GENERIC_GREETING_NAMES = new Set(["hola", "admin", "usuario", "user", "test"]);

/** Nombre para saludo; evita placeholders como «hola». */
export function displayFirstNameForGreeting(name: string | undefined, email?: string): string {
  const raw = name?.trim();
  const first = firstNameFromDisplayName(raw);
  if (first && !GENERIC_GREETING_NAMES.has(first.toLowerCase())) {
    return first;
  }
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.trim();
    if (local && !GENERIC_GREETING_NAMES.has(local.toLowerCase())) {
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
  }
  return "";
}

function closedTimestamp(lead: Lead): number | null {
  return parseLeadTime(lead.updatedAt ?? lead.lastContact ?? lead.createdAt);
}

export function countClosedThisMonth(leads: Lead[]): number {
  const start = startOfCurrentMonthMs();
  let count = 0;
  for (const lead of leads) {
    const id = foldStage(lead.status);
    const isClosed = lead.status === "cerrado" || id.includes("cerrad");
    if (!isClosed) continue;
    const ts = closedTimestamp(lead);
    if (ts != null && ts >= start) count += 1;
  }
  return count;
}

export function countUpcomingAppointments(
  list: AgendaAppointment[],
  options?: { withinMs?: number; includeTodayPastHours?: number },
): number {
  const now = Date.now();
  const windowMs = options?.withinMs ?? 7 * 86400000;
  const pastSlack = (options?.includeTodayPastHours ?? 24) * 3600000;
  return list.filter((a) => {
    if (a.status === "cancelled" || a.status === "completed") return false;
    const { start } = parseAppointment(a);
    const t = start.getTime();
    return t >= now - pastSlack && t <= now + windowMs;
  }).length;
}

export function appointmentsNext48h(list: AgendaAppointment[]): AgendaAppointment[] {
  const now = Date.now();
  const end = now + 48 * 3600000;
  return list
    .filter((a) => a.status !== "cancelled" && a.status !== "completed")
    .filter((a) => {
      const t = parseAppointment(a).start.getTime();
      return t >= now - 3600000 && t <= end;
    })
    .sort((a, b) => parseAppointment(a).start.getTime() - parseAppointment(b).start.getTime());
}

export function buildDashboardPrioritySummary(
  leads: Lead[],
  appointments: AgendaAppointment[],
  staleDays = 7,
): string {
  const stale = leadsNeedingAttention(leads, staleDays).length;
  const appts = countUpcomingAppointments(appointments);
  const newMonth = leads.filter(createdThisMonth).length;
  const parts: string[] = [];
  if (stale > 0) parts.push(`${stale} lead${stale === 1 ? "" : "s"} sin seguimiento`);
  if (appts > 0) parts.push(`${appts} cita${appts === 1 ? "" : "s"} esta semana`);
  if (newMonth > 0) parts.push(`${newMonth} alta${newMonth === 1 ? "" : "s"} este mes`);
  if (parts.length === 0) return "Nada urgente pendiente · revisa el pipeline cuando quieras";
  return parts.join(" · ");
}

export function newLeadsWithoutContact(leads: Lead[], withinDays = 3): Lead[] {
  const threshold = Date.now() - withinDays * 86400000;
  return leads.filter((lead) => {
    if (!isActivePipelineLead(lead)) return false;
    const created = parseLeadTime(lead.createdAt);
    if (created == null || created < threshold) return false;
    const last = parseLeadTime(lead.lastContact);
    return last == null;
  });
}

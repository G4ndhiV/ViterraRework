import { Calendar, ChevronRight } from "lucide-react";
import type { AgendaAppointment } from "../../../data/agenda";
import { parseAppointment, AGENDA_STATUS_LABEL } from "../../../data/agenda";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

type Props = {
  appointments: AgendaAppointment[];
  onOpenAgenda: () => void;
  limit?: number;
};

function upcomingAppointments(list: AgendaAppointment[], limit = 8): AgendaAppointment[] {
  const now = Date.now();
  const weekEnd = now + 7 * 86400000;
  return list
    .filter((a) => a.status !== "cancelled" && a.status !== "completed")
    .filter((a) => {
      const { start } = parseAppointment(a);
      const t = start.getTime();
      return t >= now - 86400000 && t <= weekEnd;
    })
    .sort((a, b) => parseAppointment(a).start.getTime() - parseAppointment(b).start.getTime())
    .slice(0, limit);
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function DashboardUpcomingAppointments({ appointments, onOpenAgenda, limit = 8 }: Props) {
  const rows = upcomingAppointments(appointments, limit);

  return (
    <section className={dashboardCard}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <DashboardSectionHeader title="Citas próximas" description="Hoy y próximos 7 días" />
        <button type="button" onClick={onOpenAgenda} className="shrink-0 text-xs font-medium text-primary hover:underline">
          Agenda
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-600">Sin citas en los próximos 7 días</p>
          <p className="mt-1 text-xs text-slate-500">Abre la agenda para programar visitas o seguimientos.</p>
          <button
            type="button"
            onClick={onOpenAgenda}
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            Ir a agenda
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((apt) => (
            <li key={apt.id}>
              <button
                type="button"
                onClick={onOpenAgenda}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-slate-50/80"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-navy">{apt.title || apt.clientName}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {formatWhen(apt.start)} · {AGENDA_STATUS_LABEL[apt.status]}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

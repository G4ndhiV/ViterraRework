import type { AppointmentStats } from "../../../lib/kpiCompute";
import { pctDelta, formatDelta } from "../../../lib/kpiCompute";
import { cn } from "../../ui/utils";

interface Props {
  current: AppointmentStats;
  previous: AppointmentStats;
}

function row(label: string, cur: number, prev: number) {
  const d = formatDelta(pctDelta(cur, prev));
  return (
    <div className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="font-heading mt-1 text-xl text-brand-navy" style={{ fontWeight: 700 }}>
        {cur}
      </span>
      <span
        className={cn(
          "mt-1 inline-flex justify-center text-[11px] font-semibold",
          d.sign === "up" && "text-emerald-700",
          d.sign === "down" && "text-rose-700",
          (d.sign === "flat" || d.sign === "na") && "text-slate-500"
        )}
      >
        {d.label}
      </span>
    </div>
  );
}

export function KpiAppointmentsBlock({ current, previous }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-brand-navy">Citas</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Conteo en el rango. La agenda se calcula con datos del navegador hasta migrarla a Supabase.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {row("Total", current.total, previous.total)}
        {row("Agendadas", current.scheduled, previous.scheduled)}
        {row("Completadas", current.completed, previous.completed)}
        {row("Canceladas", current.cancelled, previous.cancelled)}
      </div>
    </section>
  );
}

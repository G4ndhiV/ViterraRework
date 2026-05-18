import { cn } from "../../ui/utils";

export const dashboardShell = "space-y-6";

export const dashboardCard =
  "flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6";

export function DashboardSectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:border-slate-300/80 hover:shadow-md sm:p-5",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="font-heading mt-3 text-2xl tracking-tight text-brand-navy sm:text-[1.65rem]" style={{ fontWeight: 700 }}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

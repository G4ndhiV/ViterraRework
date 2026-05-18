import { BarChart3, Home, Plus, Users } from "lucide-react";

type Props = {
  layout?: "bar" | "stack";
  onNewLead: () => void;
  onOpenKpis: () => void;
  onOpenProperties: () => void;
  onOpenUsers: () => void;
};

const chipClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-brand-navy";

export function DashboardQuickActions({
  layout = "bar",
  onNewLead,
  onOpenKpis,
  onOpenProperties,
  onOpenUsers,
}: Props) {
  if (layout === "stack") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Accesos rápidos</p>
        <button type="button" className={chipClass} onClick={onNewLead}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nuevo lead
        </button>
        <button type="button" className={chipClass} onClick={onOpenProperties}>
          <Home className="h-4 w-4" strokeWidth={1.75} />
          Propiedades
        </button>
        <button type="button" className={chipClass} onClick={onOpenUsers}>
          <Users className="h-4 w-4" strokeWidth={1.75} />
          Usuarios
        </button>
        <button type="button" className={chipClass} onClick={onOpenKpis}>
          <BarChart3 className="h-4 w-4" strokeWidth={1.75} />
          KPI&apos;s
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        <span className="font-medium text-brand-navy">Accesos rápidos</span>
        <span className="mx-2 text-slate-300">·</span>
        <span className="text-slate-500">Para análisis profundo, abre KPI&apos;s</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chipClass + " w-auto"} onClick={onNewLead}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nuevo lead
        </button>
        <button type="button" className={chipClass + " w-auto"} onClick={onOpenKpis}>
          <BarChart3 className="h-4 w-4" strokeWidth={1.75} />
          KPI&apos;s
        </button>
        <button type="button" className={chipClass + " w-auto"} onClick={onOpenProperties}>
          <Home className="h-4 w-4" strokeWidth={1.75} />
          Propiedades
        </button>
        <button type="button" className={chipClass + " w-auto"} onClick={onOpenUsers}>
          <Users className="h-4 w-4" strokeWidth={1.75} />
          Usuarios
        </button>
      </div>
    </div>
  );
}

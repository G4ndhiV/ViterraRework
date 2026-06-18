import { Home } from "lucide-react";
import type { Property } from "../../PropertyCard";
import { countPropertyInventory } from "../../../lib/propertyInventory";
import { dashboardCard } from "./dashboardUi";

type Props = {
  properties: Property[];
  onOpenProperties: () => void;
};

export function DashboardCatalogStatus({ properties, onOpenProperties }: Props) {
  const { acc } = countPropertyInventory(properties);
  const line = `${acc.disponible} disponible${acc.disponible === 1 ? "" : "s"} · ${acc.renta} renta`;

  return (
    <section className={dashboardCard}>
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Home className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-navy">Catálogo</p>
          <p className="mt-0.5 text-xs text-slate-500">{line}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenProperties}
        className="mt-4 w-full rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-brand-navy transition hover:border-slate-300 hover:bg-white"
      >
        Ver catálogo
      </button>
    </section>
  );
}

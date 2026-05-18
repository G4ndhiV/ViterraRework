import { Home } from "lucide-react";
import type { Property } from "../../PropertyCard";
import { countPropertyInventory, INVENTORY_KEYS, INVENTORY_LABELS } from "../../../lib/propertyInventory";
import { dashboardCard, DashboardSectionHeader } from "./dashboardUi";

const INVENTORY_BAR = {
  disponible: "bg-slate-400/95",
  enApartado: "bg-slate-500/95",
  vendida: "bg-slate-600/95",
  renta: "bg-slate-700/95",
} as const;

type Props = {
  properties: Property[];
  onOpenProperties: () => void;
};

export function DashboardInventory({ properties, onOpenProperties }: Props) {
  const { acc, total } = countPropertyInventory(properties);

  return (
    <section className={dashboardCard}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <DashboardSectionHeader title="Inventario" description="Estado del catálogo" />
        <button
          type="button"
          onClick={onOpenProperties}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Catálogo
        </button>
      </div>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Sin propiedades en catálogo</p>
      ) : (
        <div className="space-y-3">
          {INVENTORY_KEYS.map((key) => {
            const n = acc[key];
            const pct = total > 0 ? (n / total) * 100 : 0;
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{INVENTORY_LABELS[key]}</span>
                  <span className="font-semibold text-brand-navy">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${INVENTORY_BAR[key]}`}
                    style={{ width: `${Math.max(n > 0 ? 4 : 0, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

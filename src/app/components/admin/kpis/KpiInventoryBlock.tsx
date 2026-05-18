import type { ReactNode } from "react";
import type { Property } from "../../PropertyCard";
import type { SourceBucket } from "../../../lib/kpiCompute";
import { formatMoney } from "../../../lib/kpiCompute";

interface Props {
  propertyTypes: SourceBucket[];
  operations: SourceBucket[];
  staleProperties: Property[];
  showStale: boolean;
}

function bar(rows: SourceBucket[], color: string) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">Sin datos.</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="truncate">{r.name}</span>
            <span className="tabular-nums">
              {r.count} <span className="text-slate-400">({(r.share * 100).toFixed(0)}%)</span>
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function SectionHeader({
  title,
  description,
  trailing,
}: {
  title: string;
  description: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      {trailing}
    </div>
  );
}

export function KpiInventoryBlock({ propertyTypes, operations, staleProperties, showStale }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeader title="Distribución por tipo" description="Inventario actual del catálogo." />
        {bar(propertyTypes.slice(0, 8), "#475569")}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeader title="Operación" description="Venta vs alquiler." />
        {bar(operations, "#1e293b")}
      </section>

      {showStale ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <SectionHeader
            title="Propiedades sin movimiento (60d+)"
            description="Listadas hace más de 60 días que siguen disponibles. Considera refrescar precio o foto."
            trailing={
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {staleProperties.length}
              </span>
            }
          />
          {staleProperties.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">No hay propiedades estancadas.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Propiedad</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Precio</th>
                    <th className="px-3 py-2 text-right">Días publicada</th>
                  </tr>
                </thead>
                <tbody>
                  {staleProperties.slice(0, 12).map((p) => {
                    const days = p.listedAtIso
                      ? Math.round((Date.now() - Date.parse(p.listedAtIso)) / 86400000)
                      : 0;
                    return (
                      <tr key={p.id} className="border-t border-slate-50">
                        <td className="px-3 py-2 font-medium text-brand-navy">{p.title}</td>
                        <td className="px-3 py-2 text-slate-700">{p.type}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                          ${formatMoney(p.price)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">{days}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

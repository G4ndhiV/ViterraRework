import { Activity, Briefcase, TrendingUp } from "lucide-react";

type Props = {
  totalProperties: number;
  propertiesForSale: number;
  propertiesForRent: number;
  avgPropertyPrice: number;
};

/** Tarjetas resumen del catálogo de propiedades (inventario, venta, alquiler, valor promedio). */
export function AdminPropertyStatsCards({
  totalProperties,
  propertiesForSale,
  propertiesForRent,
  avgPropertyPrice,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <div className="flex flex-col border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Inventario</p>
          <TrendingUp className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-3xl font-light text-slate-900">{totalProperties}</p>
      </div>

      <div className="flex flex-col border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">En venta</p>
          <Activity className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-3xl font-light text-slate-900">{propertiesForSale}</p>
      </div>

      <div className="flex flex-col border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">En renta</p>
          <Briefcase className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-3xl font-light text-slate-900">{propertiesForRent}</p>
      </div>

      <div className="flex flex-col border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Valor prom.</p>
          <TrendingUp className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-3xl font-light text-slate-900">
          ${Math.round(avgPropertyPrice).toLocaleString("es-MX")}
        </p>
      </div>
    </div>
  );
}

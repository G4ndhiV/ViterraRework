import { useEffect, useState } from "react";
import { StatCard } from "./dashboardUi";

export type DashboardKpiTargets = {
  totalLeads: number;
  conversionRate: number;
  totalProperties: number;
  avgPropertyPrice: number;
  activePipeline: number;
  newLeadsMonth: number;
  propertiesForSale: number;
  propertiesForRent: number;
  closedDeals: number;
};

type Props = {
  targets: DashboardKpiTargets;
  animate?: boolean;
};

export function DashboardKpiGrid({ targets, animate = true }: Props) {
  const [disp, setDisp] = useState({
    totalLeads: 0,
    conversionRate: 0,
    totalProperties: 0,
    avgPropertyPrice: 0,
    activePipeline: 0,
    newLeadsMonth: 0,
  });

  useEffect(() => {
    if (!animate) {
      setDisp({
        totalLeads: targets.totalLeads,
        conversionRate: targets.conversionRate,
        totalProperties: targets.totalProperties,
        avgPropertyPrice: targets.avgPropertyPrice,
        activePipeline: targets.activePipeline,
        newLeadsMonth: targets.newLeadsMonth,
      });
      return;
    }
    const t = {
      totalLeads: targets.totalLeads,
      conversionRate: targets.conversionRate,
      totalProperties: targets.totalProperties,
      avgPropertyPrice: targets.avgPropertyPrice,
      activePipeline: targets.activePipeline,
      newLeadsMonth: targets.newLeadsMonth,
    };
    const durationMs = 900;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp({
        totalLeads: t.totalLeads * e,
        conversionRate: t.conversionRate * e,
        totalProperties: t.totalProperties * e,
        avgPropertyPrice: t.avgPropertyPrice * e,
        activePipeline: t.activePipeline * e,
        newLeadsMonth: t.newLeadsMonth * e,
      });
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, targets]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard
        label="Total leads"
        value={Math.round(disp.totalLeads).toLocaleString("es-MX")}
        hint={`+${targets.newLeadsMonth} nuevos este mes`}
      />
      <StatCard
        label="Conversión"
        value={`${disp.conversionRate.toFixed(1)}%`}
        hint={`${targets.closedDeals} cerrados`}
      />
      <StatCard
        label="Propiedades"
        value={Math.round(disp.totalProperties).toLocaleString("es-MX")}
        hint={`${targets.propertiesForSale} venta · ${targets.propertiesForRent} renta`}
      />
      <StatCard
        label="Valor promedio"
        value={`$${Math.round(disp.avgPropertyPrice).toLocaleString("es-MX")}`}
        hint="por propiedad"
      />
      <StatCard
        label="Pipeline activo"
        value={Math.round(disp.activePipeline).toLocaleString("es-MX")}
        hint="Sin cerrar ni perdidos"
      />
      <StatCard
        label="Nuevos este mes"
        value={Math.round(disp.newLeadsMonth).toLocaleString("es-MX")}
        hint="Altas por fecha de creación"
      />
    </div>
  );
}

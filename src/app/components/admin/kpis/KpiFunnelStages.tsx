import type { FunnelStageStat } from "../../../lib/kpiCompute";

interface Props {
  funnel: FunnelStageStat[];
}

export function KpiFunnelStages({ funnel }: Props) {
  if (!funnel.length) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-brand-navy">Embudo de ventas (paso a paso)</h3>
        <p className="mt-2 text-sm text-slate-400">No hay etapas configuradas en este pipeline.</p>
      </section>
    );
  }

  const max = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-brand-navy">Embudo de ventas (paso a paso)</h3>
        <p className="mt-0.5 text-xs text-slate-500">Conteo por etapa y % que avanza a la siguiente.</p>
      </div>

      <ul className="space-y-2.5">
        {funnel.map((stage, i) => {
          const width = `${Math.max(8, (stage.count / max) * 100)}%`;
          const conversion = stage.conversionToNext;
          const last = i === funnel.length - 1;
          return (
            <li key={stage.id}>
              <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                <span className="truncate font-medium text-brand-navy">{stage.label}</span>
                <span className="shrink-0 tabular-nums">
                  {stage.count} {!last && conversion != null ? <span className="ml-2 text-slate-400">→ {(conversion * 100).toFixed(0)}%</span> : null}
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-600" style={{ width }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

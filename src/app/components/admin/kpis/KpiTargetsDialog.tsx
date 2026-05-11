import { useEffect, useMemo, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import {
  deleteKpiTarget,
  upsertKpiTarget,
  type KpiTarget,
  type KpiTargetMetric,
  type KpiTargetPeriod,
} from "../../../lib/supabaseKpis";
import type { User } from "../../../contexts/AuthContext";
import type { UserGroup } from "../../../lib/userGroups";
import { canEditKpiTarget } from "../../../lib/kpiAccess";
import { findActiveTarget } from "../../../hooks/useKpiData";

const METRIC_LABELS: Record<KpiTargetMetric, string> = {
  sales_count: "Ventas (cierres)",
  sales_volume: "Monto vendido ($)",
  new_leads: "Nuevos leads",
  conversion_rate: "Tasa de conversión (%)",
  response_time_hours: "Tiempo de 1° contacto (h, máximo)",
  appointments_completed: "Citas completadas",
};

const PERIOD_LABELS: Record<KpiTargetPeriod, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};

interface Props {
  open: boolean;
  onClose: () => void;
  metric: KpiTargetMetric;
  scope: "user" | "group" | "company";
  scopeId: string | null;
  scopeLabel: string;
  rangeStartIso: string;
  user: User | null;
  groups: UserGroup[];
  targets: KpiTarget[];
  onSaved: () => void;
}

export function KpiTargetsDialog({
  open,
  onClose,
  metric,
  scope,
  scopeId,
  scopeLabel,
  rangeStartIso,
  user,
  groups,
  targets,
  onSaved,
}: Props) {
  const existing = useMemo(
    () => findActiveTarget(targets, metric, scope, scopeId, rangeStartIso),
    [targets, metric, scope, scopeId, rangeStartIso]
  );
  const [period, setPeriod] = useState<KpiTargetPeriod>(existing?.period ?? "monthly");
  const [value, setValue] = useState<string>(existing ? String(existing.targetValue) : "");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    existing?.effectiveFrom ?? rangeStartIso.slice(0, 10)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPeriod(existing?.period ?? "monthly");
    setValue(existing ? String(existing.targetValue) : "");
    setEffectiveFrom(existing?.effectiveFrom ?? rangeStartIso.slice(0, 10));
    setError(null);
  }, [existing, rangeStartIso, open]);

  const canEdit = canEditKpiTarget(user, groups, scope, scopeId);

  const handleSave = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setError("Falta configurar Supabase (.env).");
      return;
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      setError("Ingresa un valor numérico válido.");
      return;
    }
    if (!effectiveFrom) {
      setError("Selecciona la fecha desde la que aplica la meta.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await upsertKpiTarget(client, {
      id: existing?.id,
      scope,
      scopeId,
      metric,
      period,
      targetValue: num,
      effectiveFrom,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (!existing) return;
    const client = getSupabaseClient();
    if (!client) return;
    setBusy(true);
    setError(null);
    const res = await deleteKpiTarget(client, existing.id);
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar meta · {METRIC_LABELS[metric]}</DialogTitle>
          <DialogDescription>{scopeLabel}</DialogDescription>
        </DialogHeader>

        {!canEdit ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            No tienes permiso para modificar esta meta. Contacta a un administrador.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Periodo
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as KpiTargetPeriod)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-brand-navy focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                {(Object.keys(PERIOD_LABELS) as KpiTargetPeriod[]).map((k) => (
                  <option key={k} value={k}>
                    {PERIOD_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Valor objetivo
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min={0}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-brand-navy focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vigente desde
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-brand-navy focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {existing ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  Eliminar
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
              >
                <Save className="h-4 w-4" strokeWidth={1.75} />
                {busy ? "Guardando..." : "Guardar meta"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

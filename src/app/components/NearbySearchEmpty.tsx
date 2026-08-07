import { useState } from "react";

export const NEARBY_RADIUS_KM_OPTIONS = [1, 2, 5, 10, 25, 50] as const;

type Props = {
  /** Si false, no muestra el selector (p. ej. falta zona o query). */
  enabled?: boolean;
  busy?: boolean;
  error?: string | null;
  hint?: string;
  onSearch: (km: number) => void | Promise<void>;
  className?: string;
};

/** CTA compartido para ampliar búsqueda por radio en km. */
export function NearbySearchEmpty({
  enabled = true,
  busy = false,
  error = null,
  hint,
  onSearch,
  className,
}: Props) {
  const [km, setKm] = useState<(typeof NEARBY_RADIUS_KM_OPTIONS)[number]>(5);

  if (!enabled) return null;

  return (
    <div className={className ?? "mt-6 space-y-3"}>
      {hint && <p className="px-1 text-[12px] leading-relaxed text-slate-500 sm:text-[13px]">{hint}</p>}
      <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <label className="sr-only" htmlFor="nearby-radius-km">
          Radio en kilómetros
        </label>
        <select
          id="nearby-radius-km"
          value={km}
          disabled={busy}
          onChange={(e) => setKm(Number(e.target.value) as (typeof NEARBY_RADIUS_KM_OPTIONS)[number])}
          className="min-h-11 w-full rounded-none border-2 border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-800 sm:w-auto"
        >
          {NEARBY_RADIUS_KM_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} km
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSearch(km)}
          className="font-heading min-h-11 w-full rounded-none bg-brand-navy px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand-navy/90 disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Buscando…" : "Buscar ubicaciones cercanas"}
        </button>
      </div>
      {error && <p className="text-[13px] text-primary">{error}</p>}
    </div>
  );
}

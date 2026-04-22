import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Slider } from "./ui/slider";
import { cn } from "./ui/utils";

export type SearchBarPriceVariant = "default" | "premium" | "ambient";

function formatMxnLong(n: number): string {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n).toLocaleString("es-MX")} MXN`;
  }
}

function formatAxis(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
}

function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) return 1;
  const exp = Math.floor(Math.log10(rough));
  const f = rough / 10 ** exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * 10 ** exp;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function parseDigits(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function computeDomain(prices: number[]): { min: number; max: number; step: number } {
  const valid = prices.filter((p) => Number.isFinite(p) && p >= 0);
  if (valid.length === 0) return { min: 0, max: 10_000_000, step: 50_000 };
  let mn = Math.min(...valid);
  let mx = Math.max(...valid);
  if (mx <= mn) mx = mn + Math.max(50_000, mn * 0.05);
  const pad = (mx - mn) * 0.06;
  const rawMin = Math.max(0, mn - pad);
  const rawMax = mx + pad;
  const range = rawMax - rawMin;
  /** Paso fino para drag fluido (más posiciones en la pista). */
  const step = Math.max(1, niceStep(range / 320));
  const min = Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step;
  return { min, max, step };
}

type Props = {
  prices: number[];
  minPrice: string;
  maxPrice: string;
  onChange: (next: { minPrice: string; maxPrice: string }) => void;
  variant: SearchBarPriceVariant;
};

export type SearchBarCatalogPriceRangeHandle = {
  /** Valores de filtro equivalentes al estado actual del slider (p. ej. al enviar el formulario sin soltar). */
  getPriceFilterPatch: () => { minPrice: string; maxPrice: string };
};

function rangeToPriceStrings(
  v: [number, number],
  domMin: number,
  domMax: number,
  step: number
): { minPrice: string; maxPrice: string } {
  const [rawA, rawB] = v;
  const a = clamp(rawA, domMin, domMax);
  const b = clamp(rawB, domMin, domMax);
  const eps = step * 0.2;
  const atFloor = a <= domMin + eps;
  const atCeil = b >= domMax - eps;
  return {
    minPrice: atFloor ? "" : String(Math.round(a)),
    maxPrice: atCeil ? "" : String(Math.round(b)),
  };
}

export const SearchBarCatalogPriceRange = forwardRef<SearchBarCatalogPriceRangeHandle, Props>(
  function SearchBarCatalogPriceRange({ prices, minPrice, maxPrice, onChange, variant }, ref) {
  const isAmbient = variant === "ambient";
  const isPremium = variant === "premium";

  const { min: domMin, max: domMax, step } = useMemo(() => computeDomain(prices), [prices]);

  const avg = useMemo(() => {
    const v = prices.filter((p) => Number.isFinite(p) && p >= 0);
    if (!v.length) return 0;
    return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
  }, [prices]);

  const fromProps = useMemo((): [number, number] => {
    const lo = parseDigits(minPrice);
    const hi = parseDigits(maxPrice);
    let a = lo != null ? clamp(lo, domMin, domMax) : domMin;
    let b = hi != null ? clamp(hi, domMin, domMax) : domMax;
    if (a > b) [a, b] = [b, a];
    return [a, b];
  }, [minPrice, maxPrice, domMin, domMax]);

  /** Estado local: el padre solo se actualiza al soltar (onValueCommit) → drag fluido. */
  const [local, setLocal] = useState<[number, number]>(fromProps);

  useEffect(() => {
    setLocal(fromProps);
  }, [fromProps[0], fromProps[1], domMin, domMax]);

  const commitToParent = useCallback(
    (v: number[]) => {
      const pair: [number, number] =
        v.length >= 2 ? [v[0], v[1]] : [domMin, domMax];
      onChange(rangeToPriceStrings(pair, domMin, domMax, step));
    },
    [domMin, domMax, step, onChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      getPriceFilterPatch: () => rangeToPriceStrings(local, domMin, domMax, step),
    }),
    [local, domMin, domMax, step]
  );

  const setMinStr = (s: string) => {
    const n = parseDigits(s);
    if (n == null) {
      onChange({ minPrice: "", maxPrice });
      return;
    }
    const capped = clamp(n, domMin, local[1]);
    const next = [capped, local[1]] as [number, number];
    setLocal(next);
    onChange({ minPrice: String(Math.round(capped)), maxPrice });
  };

  const setMaxStr = (s: string) => {
    const n = parseDigits(s);
    if (n == null) {
      onChange({ minPrice, maxPrice: "" });
      return;
    }
    const capped = clamp(n, local[0], domMax);
    const next = [local[0], capped] as [number, number];
    setLocal(next);
    onChange({ minPrice, maxPrice: String(Math.round(capped)) });
  };

  const cardClass = cn(
    "rounded-2xl",
    isAmbient && "bg-white/[0.04] backdrop-blur-sm",
    isPremium && !isAmbient && "bg-white shadow-sm",
    !isPremium && !isAmbient && "bg-white shadow-sm"
  );

  const titleClass = cn(
    "text-lg tracking-tight sm:text-xl",
    isAmbient && "text-white",
    !isAmbient && "text-slate-900"
  );

  const subClass = cn(
    "mt-1 text-sm",
    isAmbient && "text-white/70",
    !isAmbient && "text-slate-500"
  );

  const fieldWrap = cn(
    "flex min-h-[2.75rem] items-stretch overflow-hidden rounded-xl border text-sm transition-[border-color,box-shadow] duration-200",
    isAmbient && "border-white/20 bg-black/20 focus-within:border-white/50 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.35)]",
    !isAmbient && "border-slate-200 bg-white focus-within:border-neutral-900 focus-within:shadow-[0_0_0_1px_rgb(23_23_23)]"
  );

  const innerInput = cn(
    "min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-[15px] outline-none tabular-nums transition-[color,font-weight] duration-200",
    isAmbient && "text-white placeholder:text-white/40",
    !isAmbient && "text-slate-600 placeholder:text-slate-400 focus:text-neutral-900"
  );

  const mxnChip = cn(
    "flex items-center border-l px-2.5 text-[10px] font-semibold uppercase tracking-wider",
    isAmbient && "border-white/20 text-white/75",
    !isAmbient && "border-slate-200 bg-slate-50 text-slate-500"
  );

  /** Pista fina + rango sólido; thumbs circulares (aspect-square + rounded-full). */
  const sliderLook = cn(
    "w-full touch-pan-x py-3",
    "[&_[data-slot=slider-track]]:relative [&_[data-slot=slider-track]]:mx-2 [&_[data-slot=slider-track]]:h-px [&_[data-slot=slider-track]]:rounded-none [&_[data-slot=slider-track]]:bg-neutral-300",
    "[&_[data-slot=slider-range]]:rounded-none",
    "[&_[data-slot=slider-thumb]]:box-border [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:min-h-5 [&_[data-slot=slider-thumb]]:min-w-5 [&_[data-slot=slider-thumb]]:shrink-0 [&_[data-slot=slider-thumb]]:rounded-full [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-neutral-900 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-sm [&_[data-slot=slider-thumb]]:outline-none [&_[data-slot=slider-thumb]]:transition-shadow [&_[data-slot=slider-thumb]]:duration-150 [&_[data-slot=slider-thumb]]:hover:shadow-[0_0_0_7px_rgba(0,0,0,0.06)] [&_[data-slot=slider-thumb]]:focus-visible:shadow-[0_0_0_7px_rgba(0,0,0,0.08)]",
    isAmbient &&
      "[&_[data-slot=slider-track]]:bg-white/35 [&_[data-slot=slider-range]]:h-0.5 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:bg-neutral-950 [&_[data-slot=slider-thumb]]:hover:shadow-[0_0_0_7px_rgba(255,255,255,0.12)]",
    !isAmbient &&
      "[&_[data-slot=slider-range]]:h-0.5 [&_[data-slot=slider-range]]:bg-neutral-900 [&_[data-slot=slider-thumb]]:ring-0 [&_[data-slot=slider-thumb]]:hover:ring-0 [&_[data-slot=slider-thumb]]:focus-visible:ring-0"
  );

  return (
    <div
      className={cn(
        "mt-4 border-t pt-4",
        isAmbient && "border-white/10",
        isPremium && "border-brand-navy/10",
        !isPremium && !isAmbient && "border-slate-200"
      )}
    >
      <div className={cn(cardClass, "px-4 py-4 sm:px-5 sm:py-5")}>
        <div className="mb-3">
          <h3 className={cn(titleClass, "text-base sm:text-lg")}>
            <span className="font-semibold">Precio</span>
            <span className={cn("font-normal", isAmbient ? "text-white/80" : "text-slate-500")}> · rango</span>
            <span className={cn("ml-2 text-[10px] font-medium uppercase tracking-wider", isAmbient ? "text-white/45" : "text-slate-400")}>
              MXN
            </span>
          </h3>
        </div>

        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] tabular-nums sm:text-[11px]">
          <span className={isAmbient ? "text-white/55" : "text-slate-400"}>{formatAxis(domMin)}</span>
          <span className={isAmbient ? "text-white/55" : "text-slate-400"}>{formatAxis(domMax)}</span>
        </div>

        <Slider
          className={cn(sliderLook, "py-2")}
          min={domMin}
          max={domMax}
          step={step}
          value={local}
          onValueChange={(v) => {
            if (v.length >= 2) setLocal([v[0], v[1]]);
          }}
          onValueCommit={(v) => {
            if (v.length >= 2) {
              setLocal([v[0], v[1]]);
              commitToParent(v);
            }
          }}
          minStepsBetweenThumbs={1}
          aria-label="Rango de precio en pesos mexicanos"
        />

        <p
          className={cn(
            "mt-2 text-center text-[12px] tabular-nums leading-snug sm:text-[13px]",
            isAmbient ? "text-white/90" : "text-slate-800"
          )}
          aria-live="polite"
        >
          <span className="font-semibold">{formatMxnLong(local[0])}</span>
          <span className={cn("mx-2 font-light", isAmbient ? "text-white/45" : "text-slate-400")}>—</span>
          <span className="font-semibold">{formatMxnLong(local[1])}</span>
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                isAmbient ? "text-white/60" : "text-slate-400"
              )}
            >
              Desde
            </span>
            <div className={cn(fieldWrap, "min-w-0 flex-1")}>
              <input
                type="text"
                inputMode="numeric"
                className={innerInput}
                placeholder="—"
                value={minPrice}
                onChange={(e) => setMinStr(e.target.value)}
                aria-label="Precio mínimo en MXN"
              />
              <span className={mxnChip}>MXN</span>
            </div>
          </div>

          <div className={cn("hidden pb-2 text-center text-slate-300 sm:block", isAmbient && "text-white/35")} aria-hidden>
            —
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                isAmbient ? "text-white/60" : "text-slate-400"
              )}
            >
              Hasta
            </span>
            <div className={cn(fieldWrap, "min-w-0 flex-1")}>
              <input
                type="text"
                inputMode="numeric"
                className={innerInput}
                placeholder="—"
                value={maxPrice}
                onChange={(e) => setMaxStr(e.target.value)}
                aria-label="Precio máximo en MXN"
              />
              <span className={mxnChip}>MXN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

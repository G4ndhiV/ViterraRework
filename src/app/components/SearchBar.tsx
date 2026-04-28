import { Search } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { cn } from "./ui/utils";
import {
  SearchBarCatalogPriceRange,
  type SearchBarCatalogPriceRangeHandle,
} from "./SearchBarCatalogPriceRange";

interface SearchBarProps {
  onSearch?: (filters: SearchFilters) => void;
  className?: string;
  /** premium: bordes rectos, tipografía manual Viterra (Poppins) · ambient: sobre fondo oscuro, solo líneas (landing) */
  variant?: "default" | "premium" | "ambient";
  /** Si la URL no define `status`, se usa este valor (p. ej. alquiler en /renta). */
  defaultStatus?: "" | "alquiler" | "venta";
  /** Enlace a dibujar zona en mapa (`/propiedades/mapa`). */
  showMapZoneLink?: boolean;
  /** Precios del catálogo (MXN). Vacío si usas `catalogPriceSlices`. */
  catalogPrices?: number[];
  /** Precios por operación: si ambos tienen datos, se muestra toggle Venta / Alquiler para el dominio del slider. */
  catalogPriceSlices?: { venta: number[]; alquiler: number[] };
}

export interface SearchFilters {
  query: string;
  type: string;
  status: string;
  minPrice: string;
  maxPrice: string;
}

/** Altura unificada para inputs, selects y botón principal (evita desalineación). */
const CONTROL_H = "h-12 min-h-[3rem]";

const fieldBase = cn(
  "box-border w-full border px-4 text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-offset-0",
  CONTROL_H,
  "py-0 leading-[3rem]"
);

export function SearchBar({
  onSearch,
  className,
  variant = "default",
  defaultStatus = "",
  showMapZoneLink = true,
  catalogPrices,
  catalogPriceSlices,
}: SearchBarProps) {
  const [searchParams] = useSearchParams();
  const [priceOp, setPriceOp] = useState<"venta" | "alquiler">("venta");
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: "",
    status: "",
    minPrice: "",
    maxPrice: "",
  });

  const isPremium = variant === "premium";
  const isAmbient = variant === "ambient";

  const { effectiveCatalogPrices, showPriceOperationToggle } = useMemo(() => {
    if (catalogPriceSlices) {
      const v = catalogPriceSlices.venta.filter((n) => Number.isFinite(n) && n >= 0);
      const a = catalogPriceSlices.alquiler.filter((n) => Number.isFinite(n) && n >= 0);
      if (v.length > 0 && a.length > 0) {
        return { effectiveCatalogPrices: priceOp === "venta" ? v : a, showPriceOperationToggle: true };
      }
      if (v.length > 0) return { effectiveCatalogPrices: v, showPriceOperationToggle: false };
      if (a.length > 0) return { effectiveCatalogPrices: a, showPriceOperationToggle: false };
      return { effectiveCatalogPrices: [] as number[], showPriceOperationToggle: false };
    }
    const flat = catalogPrices?.filter((n) => Number.isFinite(n) && n >= 0) ?? [];
    return { effectiveCatalogPrices: flat, showPriceOperationToggle: false };
  }, [catalogPriceSlices, catalogPrices, priceOp]);

  const showCatalogPriceRange = effectiveCatalogPrices.length > 0;
  const catalogRangeRef = useRef<SearchBarCatalogPriceRangeHandle>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("status") || "";
    const urlFilters: SearchFilters = {
      query: searchParams.get("query") || "",
      type: searchParams.get("type") || "",
      status: fromUrl || defaultStatus || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
    };

    setFilters(urlFilters);
    if (urlFilters.status === "alquiler") setPriceOp("alquiler");
    else if (urlFilters.status === "venta") setPriceOp("venta");
  }, [searchParams, defaultStatus]);

  const setPriceOperation = (op: "venta" | "alquiler") => {
    setPriceOp(op);
    setFilters((f) => ({ ...f, status: op, minPrice: "", maxPrice: "" }));
  };

  const mapZoneHref = useMemo(() => {
    const s =
      showPriceOperationToggle ? priceOp : filters.status || defaultStatus;
    const q = s ? `?status=${encodeURIComponent(s)}` : "";
    return `/propiedades/mapa${q}`;
  }, [filters.status, defaultStatus, showPriceOperationToggle, priceOp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pricePatch = catalogRangeRef.current?.getPriceFilterPatch() ?? {};
    const next = {
      ...filters,
      ...pricePatch,
      ...(showPriceOperationToggle ? { status: priceOp } : {}),
    };
    setFilters(next);
    onSearch?.(next);
  };

  const labelClass = cn(
    "block mb-2 uppercase tracking-[0.16em]",
    isAmbient && "mb-3 text-[10px] font-medium text-white/75",
    isPremium && !isAmbient && "text-[10px] text-brand-navy/60 font-medium",
    !isPremium && !isAmbient && "text-sm font-medium text-slate-700"
  );

  const ambientField = cn(
    "box-border w-full border-0 border-b border-white/55 bg-transparent px-0 text-sm text-white placeholder:text-white/55",
    "h-11 pb-2.5 pt-1 outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-primary focus-visible:shadow-[0_1px_0_0_rgb(200_16_46_/_0.85)] focus-visible:ring-0",
    "[text-shadow:0_1px_2px_rgb(0_0_0/0.45)]"
  );

  const fieldClass = cn(
    !isAmbient && fieldBase,
    isAmbient && ambientField,
    isPremium && !isAmbient
      ? "rounded-none border-brand-navy/20 bg-brand-canvas text-brand-navy placeholder:text-brand-navy/45 focus-visible:border-brand-navy focus-visible:ring-brand-navy/20"
      : !isPremium && !isAmbient && "rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
  );

  const selectChevronStyle = isAmbient
    ? {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-opacity='0.65' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      }
    : isPremium
      ? {
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        }
      : undefined;

  const btnClass = cn(
    !isAmbient && CONTROL_H,
    isAmbient && "h-11 min-h-[2.75rem]",
    "inline-flex w-full shrink-0 items-center justify-center gap-2 font-medium transition-colors",
    isAmbient &&
      "rounded-none border border-primary/70 bg-primary/[0.14] px-5 text-[11px] uppercase tracking-[0.14em] text-white shadow-[0_2px_14px_rgb(0_0_0/0.4),0_0_0_1px_rgb(200_16_46_/_0.25)_inset] hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_4px_20px_rgb(200_16_46_/_0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isPremium &&
      !isAmbient &&
      "rounded-none bg-primary px-5 text-white tracking-[0.12em] text-[11px] uppercase hover:bg-brand-red-hover focus-visible:ring-1 focus-visible:ring-brand-burgundy focus-visible:ring-offset-2",
    !isPremium && !isAmbient && "rounded-lg bg-primary px-5 text-sm text-white hover:bg-brand-red-hover"
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "min-w-0 w-full overflow-visible",
        isAmbient && "border-0 bg-transparent p-0 shadow-none",
        !isAmbient && "border bg-white px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8",
        isPremium && !isAmbient && "border-white/25 md:rounded-sm",
        !isPremium && !isAmbient && "rounded-lg border-slate-200",
        className
      )}
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:gap-4",
          showPriceOperationToggle
            ? "lg:grid-cols-[minmax(10.25rem,auto)_minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(11rem,auto)] lg:items-end lg:gap-x-5"
            : "lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(10.5rem,auto)] lg:items-end lg:gap-x-5",
          isAmbient && "gap-y-5 lg:gap-y-0"
        )}
      >
        {showPriceOperationToggle ? (
          <div className="min-w-0">
            <label className={labelClass}>Operación</label>
            <div
              role="group"
              aria-label="Venta o alquiler"
              className={cn(
                "flex w-full max-w-md rounded-xl border p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]",
                isAmbient
                  ? "border-white/25 bg-black/35 backdrop-blur-sm"
                  : "border-slate-200 bg-slate-100/90"
              )}
            >
              <button
                type="button"
                onClick={() => setPriceOperation("venta")}
                className={cn(
                  "relative flex-1 rounded-lg px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] transition-[color,background,box-shadow,transform] duration-200",
                  priceOp === "venta"
                    ? isAmbient
                      ? "bg-white text-brand-navy shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                      : "bg-white text-brand-navy shadow-sm"
                    : isAmbient
                      ? "text-white/65 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                )}
              >
                Venta
              </button>
              <button
                type="button"
                onClick={() => setPriceOperation("alquiler")}
                className={cn(
                  "relative flex-1 rounded-lg px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] transition-[color,background,box-shadow,transform] duration-200",
                  priceOp === "alquiler"
                    ? isAmbient
                      ? "bg-white text-brand-navy shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                      : "bg-white text-brand-navy shadow-sm"
                    : isAmbient
                      ? "text-white/65 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                )}
              >
                Alquiler
              </button>
            </div>
          </div>
        ) : null}

        <div className="min-w-0 lg:min-w-[12rem]">
          <label className={labelClass}>Ubicación o palabra clave</label>
          <input
            type="text"
            placeholder="Ej: Centro, apartamento…"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className={cn(
              fieldClass,
              "cursor-pointer appearance-none bg-[length:12px] bg-[right_0.25rem_center] bg-no-repeat pr-9"
            )}
            style={selectChevronStyle}
          >
            <option value="">Todos</option>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="villa">Villa</option>
            <option value="penthouse">Penthouse</option>
            <option value="oficina">Oficina</option>
          </select>
        </div>

        {!showPriceOperationToggle ? (
          <div className="min-w-0">
            <label className={labelClass}>Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={cn(
                fieldClass,
                "cursor-pointer appearance-none bg-[length:12px] bg-[right_0.25rem_center] bg-no-repeat pr-9"
              )}
              style={selectChevronStyle}
            >
              <option value="">Todos</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-2">
          <label className={cn(labelClass, "text-transparent")} aria-hidden="true">
            Buscar
          </label>
          <button type="submit" className={cn(btnClass, "lg:w-full min-w-0")}>
            <Search className={cn("h-5 w-5 shrink-0", isAmbient ? "opacity-80" : "opacity-95")} strokeWidth={1.5} aria-hidden />
            <span>Buscar</span>
          </button>
        </div>
      </div>

      {showMapZoneLink && (
        <div
          className={cn(
            "mt-4 flex justify-center",
            showCatalogPriceRange ? "pt-1" : "border-t pt-5 mt-5",
            !showCatalogPriceRange && isAmbient && "border-white/15",
            !showCatalogPriceRange && isPremium && !isAmbient && "border-brand-navy/10",
            !showCatalogPriceRange && !isPremium && !isAmbient && "border-slate-200"
          )}
        >
          <Link
            to={mapZoneHref}
            aria-label="Ir a la búsqueda en mapa"
            className={cn(
              "group font-heading text-[15px] tracking-tight transition-colors duration-200 sm:text-base",
              isAmbient ? "text-white/90" : "text-brand-navy"
            )}
            style={{ fontWeight: isAmbient ? 500 : 600 }}
          >
            <span
              className={cn(
                "border-b border-current pb-0.5 transition-[border-color,color] duration-200",
                isAmbient &&
                  "border-white/40 text-white/90 group-hover:border-white group-hover:text-white",
                isPremium &&
                  !isAmbient &&
                  "border-brand-navy/30 group-hover:border-primary group-hover:text-primary",
                !isPremium && !isAmbient && "border-slate-400 group-hover:border-primary group-hover:text-primary"
              )}
            >
              Explorar en mapa
            </span>
          </Link>
        </div>
      )}

      {showCatalogPriceRange ? (
        <SearchBarCatalogPriceRange
          ref={catalogRangeRef}
          prices={effectiveCatalogPrices}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
          variant={variant}
        />
      ) : (
        <div
          className={cn(
            "mt-5 grid grid-cols-1 gap-4 border-t pt-5 md:grid-cols-2 md:gap-x-6",
            isAmbient && "border-white/15",
            isPremium && !isAmbient && "border-brand-navy/10",
            !isPremium && !isAmbient && "border-slate-200"
          )}
        >
          <div>
            <label className={labelClass}>Precio mínimo (MXN)</label>
            <input
              type="number"
              placeholder="Ej. 500000"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Precio máximo (MXN)</label>
            <input
              type="number"
              placeholder="Ej. 15000000"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
      )}
    </form>
  );
}

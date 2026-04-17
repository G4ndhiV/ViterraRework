import { Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { cn } from "./ui/utils";

interface SearchBarProps {
  onSearch?: (filters: SearchFilters) => void;
  className?: string;
  /** premium: bordes rectos, tipografía manual Viterra (Poppins) */
  variant?: "default" | "premium";
  /** Si la URL no define `status`, se usa este valor (p. ej. alquiler en /renta). */
  defaultStatus?: "" | "alquiler" | "venta";
  /** Enlace a dibujar zona en mapa (`/propiedades/mapa`). */
  showMapZoneLink?: boolean;
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
}: SearchBarProps) {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: "",
    status: "",
    minPrice: "",
    maxPrice: "",
  });

  const isPremium = variant === "premium";

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
  }, [searchParams, defaultStatus]);

  const mapZoneHref = useMemo(() => {
    const s = filters.status || defaultStatus;
    const q = s ? `?status=${encodeURIComponent(s)}` : "";
    return `/propiedades/mapa${q}`;
  }, [filters.status, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(filters);
  };

  const labelClass = cn(
    "block mb-2 uppercase tracking-[0.16em]",
    isPremium ? "text-[10px] text-neutral-600 font-medium" : "text-sm font-medium text-slate-700"
  );

  const fieldClass = cn(
    fieldBase,
    isPremium
      ? "rounded-none border-neutral-300 bg-[#faf9f7] text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-neutral-900/25"
      : "rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
  );

  const btnClass = cn(
    CONTROL_H,
    "inline-flex w-full shrink-0 items-center justify-center gap-2 text-sm font-medium transition-colors",
    isPremium
      ? "rounded-none bg-[#C8102E] px-5 text-white tracking-[0.12em] text-[11px] uppercase hover:bg-[#a00d25] focus-visible:ring-1 focus-visible:ring-[#7f1d1d] focus-visible:ring-offset-2"
      : "rounded-lg bg-[#C8102E] px-5 text-white hover:bg-[#a00d25]"
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "min-w-0 w-full border bg-white px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8",
        isPremium ? "border-white/25 md:rounded-sm" : "rounded-lg border-slate-200",
        className
      )}
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:gap-4",
          "lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(10.5rem,auto)] lg:items-end lg:gap-x-4"
        )}
      >
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
              "cursor-pointer appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
            )}
            style={
              isPremium
                ? {
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  }
                : undefined
            }
          >
            <option value="">Todos</option>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="villa">Villa</option>
            <option value="penthouse">Penthouse</option>
            <option value="oficina">Oficina</option>
          </select>
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Estado</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={cn(
              fieldClass,
              "cursor-pointer appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
            )}
            style={
              isPremium
                ? {
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  }
                : undefined
            }
          >
            <option value="">Todos</option>
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label className={cn(labelClass, "text-transparent")} aria-hidden="true">
            Buscar
          </label>
          <button type="submit" className={cn(btnClass, "lg:w-full")}>
            <Search className="h-5 w-5 shrink-0 opacity-95" strokeWidth={1.5} aria-hidden />
            <span>Buscar</span>
          </button>
        </div>
      </div>

      {showMapZoneLink && (
        <div
          className={cn(
            "mt-6 flex justify-center border-t pt-6",
            isPremium ? "border-neutral-200/70" : "border-slate-200"
          )}
        >
          <Link
            to={mapZoneHref}
            aria-label="Ir a la búsqueda en mapa"
            className={cn(
              "group font-heading text-[15px] tracking-tight transition-colors duration-200 sm:text-base",
              isPremium ? "text-neutral-900" : "text-brand-navy"
            )}
            style={{ fontWeight: 600 }}
          >
            <span
              className={cn(
                "border-b border-current pb-0.5 transition-[border-color,color] duration-200",
                isPremium
                  ? "border-neutral-400/90 group-hover:border-primary group-hover:text-primary"
                  : "border-slate-400 group-hover:border-primary group-hover:text-primary"
              )}
            >
              Explorar en mapa
            </span>
          </Link>
        </div>
      )}

      <div
        className={cn(
          "mt-6 grid grid-cols-1 gap-4 border-t pt-6 md:grid-cols-2 md:gap-6",
          isPremium ? "border-neutral-200/90" : "border-slate-200"
        )}
      >
        <div>
          <label className={labelClass}>Precio mínimo</label>
          <input
            type="number"
            placeholder="$0"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Precio máximo</label>
          <input
            type="number"
            placeholder="Sin límite"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className={fieldClass}
          />
        </div>
      </div>
    </form>
  );
}

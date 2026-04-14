import { Search, MapPinned } from "lucide-react";
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

const fieldBase =
  "w-full px-4 py-3 border text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-offset-0";

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
    "w-full flex items-center justify-center gap-2 text-sm font-medium transition-colors",
    isPremium
      ? "rounded-none bg-[#C8102E] text-white px-6 py-3 tracking-[0.12em] uppercase text-xs hover:bg-[#a00d25] focus-visible:ring-1 focus-visible:ring-[#7f1d1d] focus-visible:ring-offset-2"
      : "bg-[#C8102E] text-white px-6 py-2.5 rounded-lg hover:bg-[#a00d25]"
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "min-w-0 w-full border border-slate-200 bg-white p-4 sm:p-6",
        isPremium ? "rounded-none shadow-[0_1px_0_rgba(0,0,0,0.06)]" : "rounded-lg",
        className
      )}
    >
      <div className={cn("grid grid-cols-1 gap-4", "md:grid-cols-2 lg:grid-cols-5")}>
        <div className="lg:col-span-2">
          <label className={labelClass}>Ubicación o palabra clave</label>
          <input
            type="text"
            placeholder="Ej: Centro, apartamento…"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className={cn(fieldClass, "cursor-pointer appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10")}
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

        <div>
          <label className={labelClass}>Estado</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={cn(fieldClass, "cursor-pointer appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10")}
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

        <div className="flex items-end">
          <button type="submit" className={btnClass}>
            <Search className="w-5 h-5 shrink-0 opacity-95" strokeWidth={1.5} />
            <span>Buscar</span>
          </button>
        </div>
      </div>

      {showMapZoneLink && (
        <div
          className={cn(
            "mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-5",
            isPremium ? "border-neutral-200" : "border-slate-200"
          )}
        >
          <p className={cn("text-sm leading-snug", isPremium ? "text-neutral-600" : "text-slate-600")}>
            <span className={cn("font-medium", isPremium ? "text-neutral-900" : "text-slate-900")}>
              Buscar solo en un área del mapa:
            </span>{" "}
            trace la zona a mano alzada sobre el mapa; el listado se filtra a lo que quede dentro.
          </p>
          <Link
            to={mapZoneHref}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium transition-colors",
              isPremium
                ? "border border-neutral-900/20 bg-white px-4 py-2.5 uppercase tracking-[0.14em] text-[11px] text-neutral-900 hover:border-primary hover:text-primary"
                : "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 hover:border-primary hover:text-primary"
            )}
          >
            <MapPinned className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
            Abrir mapa y dibujar zona
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

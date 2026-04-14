import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SearchBar, SearchFilters } from "../components/SearchBar";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyMap } from "../components/PropertyMap";
import { mockProperties } from "../data/properties";
import { SlidersHorizontal, Map, LayoutGrid, ChevronsDown } from "lucide-react";
import { cn } from "../components/ui/utils";

export function RentPage() {
  const [searchParams] = useSearchParams();
  const rentProperties = mockProperties.filter(p => p.status === "alquiler");
  const [filteredProperties, setFilteredProperties] = useState(rentProperties);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  useEffect(() => {
    const filters: SearchFilters = {
      query: searchParams.get('query') || '',
      type: searchParams.get('type') || '',
      status: 'alquiler',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };

    const hasFilters = filters.query || filters.type || filters.minPrice || filters.maxPrice;
    if (hasFilters) {
      handleSearch(filters);
    }
  }, [searchParams]);

  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...rentProperties];

    if (filters.query) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          property.location.toLowerCase().includes(filters.query.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(
        (property) => property.type.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter((property) => property.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((property) => property.price <= Number(filters.maxPrice));
    }

    setFilteredProperties(filtered);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    let sorted = [...filteredProperties];

    switch (value) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "area-large":
        sorted.sort((a, b) => b.area - a.area);
        break;
      case "area-small":
        sorted.sort((a, b) => a.area - b.area);
        break;
      default:
        break;
    }

    setFilteredProperties(sorted);
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white" >
      <Header />

      <section className="relative flex min-h-[58vh] flex-col justify-center overflow-hidden bg-brand-navy py-14 sm:min-h-[64vh] md:min-h-[72vh] md:py-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1758448511322-8bfc73daf606?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBwZW50aG91c2UlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzc2MDk1NzU3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Propiedades en Renta"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-brand-navy/75 via-black/45 to-brand-burgundy/35"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 text-center lg:px-8">
          <p
            className="font-tertiary text-[11px] font-normal uppercase tracking-[0.28em] text-white/75 md:text-xs"
            style={{ fontWeight: 400 }}
          >
            Viterra · Listados
          </p>
          <span className="mx-auto mt-3 block h-px w-12 bg-primary" aria-hidden />
          <div className="mt-5 flex justify-center text-primary" aria-hidden>
            <ChevronsDown className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1
            className="font-heading mt-6 text-4xl font-light tracking-tight text-white sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.02em", fontWeight: 300 }}
          >
            Propiedades en Renta
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
          >
            Encuentra tu hogar ideal en las mejores ubicaciones de Guadalajara
          </p>
        </div>
      </section>

      <section className="border-b border-brand-navy/10 bg-brand-canvas py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} defaultStatus="alquiler" />
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <p className="text-sm text-slate-700" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}>
                {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? "es" : ""} disponible
                {filteredProperties.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-md px-3 py-2 transition-colors",
                    viewMode === "grid"
                      ? "bg-white text-brand-navy shadow-sm ring-1 ring-primary/25"
                      : "text-slate-600 hover:text-brand-navy"
                  )}
                  aria-pressed={viewMode === "grid"}
                  aria-label="Vista en cuadrícula"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={cn(
                    "rounded-md px-3 py-2 transition-colors",
                    viewMode === "map"
                      ? "bg-white text-brand-navy shadow-sm ring-1 ring-primary/25"
                      : "text-slate-600 hover:text-brand-navy"
                  )}
                  aria-pressed={viewMode === "map"}
                  aria-label="Vista en mapa"
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}
              >
                <option value="newest">Más recientes</option>
                <option value="price-low">Precio: Menor a mayor</option>
                <option value="price-high">Precio: Mayor a menor</option>
                <option value="area-large">Área: Mayor a menor</option>
                <option value="area-small">Área: Menor a mayor</option>
              </select>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <PropertyMap properties={filteredProperties} />
          )}

          {filteredProperties.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-tertiary text-lg italic text-slate-600" style={{ fontWeight: 400 }}>
                No se encontraron propiedades que coincidan con tu búsqueda
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

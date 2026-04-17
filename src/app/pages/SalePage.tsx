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

export function SalePage() {
  const [searchParams] = useSearchParams();
  const saleProperties = mockProperties.filter(p => p.status === "venta");
  const [filteredProperties, setFilteredProperties] = useState(saleProperties);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  useEffect(() => {
    const filters: SearchFilters = {
      query: searchParams.get('query') || '',
      type: searchParams.get('type') || '',
      status: 'venta',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };

    const hasFilters = filters.query || filters.type || filters.minPrice || filters.maxPrice;
    if (hasFilters) {
      handleSearch(filters);
    }
  }, [searchParams]);

  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...saleProperties];

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

      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-brand-navy pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+5.25rem)] sm:pb-16 sm:pt-[calc(env(safe-area-inset-top,0px)+6.5rem)] md:pb-24 md:pt-52">
        <div className="absolute inset-0 z-0">
          <img
            src="https://plus.unsplash.com/premium_photo-1661954372617-15780178eb2e?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bHV4dXJ5JTIwaG91c2V8ZW58MHx8MHx8fDA%3D"
            alt="Propiedades en Venta"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-brand-navy/78 via-black/48 to-black/60"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 text-center lg:px-8">
          <p className="font-heading text-[11px] font-normal uppercase tracking-[0.28em] text-white/75 md:text-xs not-italic">
            Viterra · Listados
          </p>
          <span className="mx-auto mt-3 block h-px w-12 bg-primary" aria-hidden />
          <div className="mt-5 flex justify-center text-primary" aria-hidden>
            <ChevronsDown className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading mt-6 text-4xl font-light tracking-[-0.02em] text-white sm:text-5xl md:text-6xl">
            Propiedades en Venta
          </h1>
          <p className="font-heading mx-auto mt-4 max-w-2xl text-lg font-light leading-relaxed text-white/90 md:text-xl not-italic">
            Invierte en tu patrimonio con las mejores opciones del mercado
          </p>
        </div>
      </section>

      <section className="border-b border-brand-navy/10 bg-brand-canvas py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} defaultStatus="venta" />
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <p className="font-heading text-sm font-medium text-brand-navy/90 not-italic">
                {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? "es" : ""} disponible
                {filteredProperties.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 rounded-lg border border-brand-navy/10 bg-brand-canvas p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-md px-3 py-2 transition-colors",
                    viewMode === "grid"
                      ? "bg-white text-brand-navy shadow-sm ring-1 ring-primary/25"
                      : "text-brand-navy/60 hover:text-brand-navy"
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
                      : "text-brand-navy/60 hover:text-brand-navy"
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
                className="font-heading rounded-lg border border-brand-navy/15 bg-white px-4 py-2 text-sm font-normal text-brand-navy not-italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                <PropertyCard key={property.id} property={property} disablePreview />
              ))}
            </div>
          ) : (
            <PropertyMap properties={filteredProperties} mapHeightClassName="h-[58vh] min-h-[320px] max-h-[460px]" />
          )}

          {filteredProperties.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-heading text-lg font-light not-italic text-brand-navy/65">
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

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SearchBar, SearchFilters } from "../components/SearchBar";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyMap } from "../components/PropertyMap";
import { mockProperties } from "../data/properties";
import { SlidersHorizontal, Map, LayoutGrid } from "lucide-react";

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

      <section className="relative min-h-[58vh] sm:min-h-[64vh] md:min-h-[72vh] flex flex-col justify-center bg-brand-navy overflow-hidden py-14 md:py-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1774685110718-c5b4fe026144?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBob21lJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc2MDk1NzU3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Propiedades en Venta"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center py-6">
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4 tracking-tight font-light" style={{ letterSpacing: "-0.02em" }}>
            Propiedades en Venta
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto" style={{ fontWeight: 300 }}>
            Invierte en tu patrimonio con las mejores opciones del mercado
          </p>
        </div>
      </section>

      <section className="py-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} defaultStatus="venta" />
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-5 h-5 text-slate-600" />
              <p className="text-sm text-slate-600" style={{ fontWeight: 400 }}>
                {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? 'es' : ''} disponible{filteredProperties.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    viewMode === "map" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                  }`}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                style={{ fontWeight: 400 }}
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
            <div className="text-center py-20">
              <p className="text-slate-600 text-lg" style={{ fontWeight: 300 }}>
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

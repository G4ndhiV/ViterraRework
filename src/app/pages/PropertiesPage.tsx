import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SearchBar, SearchFilters } from "../components/SearchBar";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyMap } from "../components/PropertyMap";
import { mockProperties } from "../data/properties";
import { SlidersHorizontal, Building2, Map, LayoutGrid, MapPinned } from "lucide-react";

export function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const [filteredProperties, setFilteredProperties] = useState(mockProperties);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Aplicar filtros desde URL cuando la página carga
  useEffect(() => {
    const filters: SearchFilters = {
      query: searchParams.get('query') || '',
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };

    // Solo aplicar filtros si hay algún parámetro en la URL
    const hasFilters = filters.query || filters.type || filters.status || filters.minPrice || filters.maxPrice;
    
    if (hasFilters) {
      handleSearch(filters);
    }
  }, [searchParams]);

  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...mockProperties];

    // Filter by query
    if (filters.query) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          property.location.toLowerCase().includes(filters.query.toLowerCase())
      );
    }

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(
        (property) => property.type.toLowerCase() === filters.type.toLowerCase()
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((property) => property.status === filters.status);
    }

    // Filter by price range
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
        // newest - keep original order
        break;
    }

    setFilteredProperties(sorted);
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white" >
      <Header />

      {/* Page Header */}
      <section className="relative min-h-[58vh] sm:min-h-[64vh] md:min-h-[72vh] flex flex-col justify-center bg-brand-navy overflow-hidden py-14 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-burgundy/40 to-brand-navy" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center py-6">
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
            Propiedades exclusivas
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto" style={{ fontWeight: 400 }}>
            Explora nuestra selección premium de propiedades en las mejores ubicaciones
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-6 lg:px-8 w-full mb-16">
        <SearchBar onSearch={handleSearch} />
      </section>

      {/* Results Section */}
      <section className="flex-1 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <p className="text-slate-600 font-medium" style={{ fontWeight: 500 }}>
                Mostrando <span className="text-slate-900 font-semibold" style={{ fontWeight: 700 }}>{filteredProperties.length}</span>{" "}
                {filteredProperties.length === 1 ? "propiedad" : "propiedades"}
              </p>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                    viewMode === "grid" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-sm font-medium" style={{ fontWeight: 500 }}>Cuadrícula</span>
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                    viewMode === "map" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Map className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-sm font-medium" style={{ fontWeight: 500 }}>Mapa</span>
                </button>
                <Link
                  to="/propiedades/mapa"
                  className="px-3 py-2 rounded-md transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent hover:border-slate-200"
                >
                  <MapPinned className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-sm font-medium" style={{ fontWeight: 500 }}>Zona en mapa</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
                <label className="text-sm font-medium text-slate-700" style={{ fontWeight: 500 }}>Ordenar por:</label>
              </div>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-sm font-medium"
                style={{ fontWeight: 500 }}
              >
                <option value="newest">Más Recientes</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="area-large">Área: Mayor a Menor</option>
                <option value="area-small">Área: Menor a Mayor</option>
              </select>
            </div>
          </div>

          {/* Map View */}
          {viewMode === "map" && filteredProperties.length > 0 && (
            <div className="mb-8">
              <PropertyMap properties={filteredProperties} />
            </div>
          )}

          {/* Properties Grid */}
          {viewMode === "grid" && filteredProperties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredProperties.length === 0 && (
            <div className="text-center py-24 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight" style={{ fontWeight: 600 }}>
                No se encontraron propiedades
              </h3>
              <p className="text-slate-600 font-medium" style={{ fontWeight: 400 }}>
                Intenta ajustar tus filtros de búsqueda
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
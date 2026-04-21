import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import type { Map as LeafletMap } from "leaflet";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { mockProperties } from "../data/properties";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Calendar,
  Share2,
  Heart,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function PropertyDetailPage() {
  const { id } = useParams();
  const property = mockProperties.find((p) => p.id === id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("descripcion");
  const reduceMotion = useReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  const propertyImages = useMemo(() => {
    if (!property) return [];
    const alternatives = mockProperties
      .filter((p) => p.id !== property.id)
      .slice(0, 3)
      .map((p) => p.image);
    return [property.image, ...alternatives];
  }, [property]);

  const features = useMemo(() => {
    const base = [
      "Cocina equipada",
      "Seguridad 24/7",
      "Balcón / terraza",
      "Acabados premium",
      "Iluminación natural",
      "Área de lavandería",
    ];
    if (!property) return base;
    if (property.type.toLowerCase() === "casa") return [...base, "Jardín privado", "Cochera techada"];
    if (property.type.toLowerCase() === "penthouse") return [...base, "Roof garden", "Vista panorámica"];
    return [...base, "Acceso controlado", "Amenidades comunes"];
  }, [property]);

  useEffect(() => {
    const initMap = async () => {
      if (!property?.coordinates || !mapRef.current || mapInstanceRef.current) return;
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        const map = L.map(mapRef.current).setView([property.coordinates.lat, property.coordinates.lng], 15);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(map);
        const marker = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="position: relative; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#141c2e" stroke="white" stroke-width="3"/>
                <path d="M20 13L14 17V25H26V17L20 13Z" fill="white"/>
              </svg>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        L.marker([property.coordinates.lat, property.coordinates.lng], { icon: marker }).addTo(map);
        mapInstanceRef.current = map;
      } catch (error) {
        console.error("Error initializing property map:", error);
      }
    };

    if (activeTab !== "ubicacion") {
      try {
        mapInstanceRef.current?.remove();
      } catch (error) {
        console.error("Error removing property map:", error);
      }
      mapInstanceRef.current = null;
      return;
    }

    let cancelled = false;
    let rafId: number | null = null;
    let invalidateId: number | null = null;

    const mountWhenReady = () => {
      if (cancelled) return;
      if (!mapRef.current) {
        rafId = requestAnimationFrame(mountWhenReady);
        return;
      }
      void initMap();
      invalidateId = window.setTimeout(() => mapInstanceRef.current?.invalidateSize(), 180);
    };

    mountWhenReady();
    return () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (invalidateId != null) window.clearTimeout(invalidateId);
    };
  }, [activeTab, property]);

  useEffect(() => {
    return () => {
      try {
        mapInstanceRef.current?.remove();
      } catch (error) {
        console.error("Error removing property map:", error);
      }
      mapInstanceRef.current = null;
    };
  }, []);

  if (!property) {
    return (
      <div className="viterra-page min-h-screen flex flex-col" >
        <Header />
        <div data-reveal className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight" style={{ fontWeight: 600 }}>
              Propiedad no encontrada
            </h2>
            <Link to="/renta" className="text-slate-900 hover:text-slate-700 font-medium" style={{ fontWeight: 500 }}>
              Volver a propiedades
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusBadgeClass =
    property.status === "venta"
      ? "border border-black/15 bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
      : "border border-black/15 bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]";

  const nextImage = () => {
    if (propertyImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === propertyImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (propertyImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === 0 ? propertyImages.length - 1 : prev - 1));
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <Link
            to={property.status === "venta" ? "/venta" : "/renta"}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Volver a Propiedades
          </Link>
        </div>
      </div>

      <div data-reveal className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <div className="relative h-[320px] md:h-[360px] lg:h-[400px] bg-slate-200 group">
                <ImageWithFallback
                  src={propertyImages[currentImageIndex] ?? property.image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />

                {propertyImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-900" strokeWidth={2} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-900" strokeWidth={2} />
                    </button>
                  </>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`}>
                    {property.status === "venta" ? "En venta" : "En alquiler"}
                  </span>
                  <span className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                    {property.type}
                  </span>
                </div>

                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-600 text-red-600" : "text-slate-700"}`} strokeWidth={1.5} />
                  </button>
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all">
                    <Share2 className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-brand-navy/80 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                  {currentImageIndex + 1} / {propertyImages.length}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {propertyImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all md:h-[4.5rem] md:w-[4.5rem] ${
                        idx === currentImageIndex
                          ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <ImageWithFallback src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2 tracking-tight" style={{ fontWeight: 700 }}>
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-600 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-medium" style={{ fontWeight: 500 }}>{property.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: "0.05em", fontWeight: 500 }}>
                    {property.status === "venta" ? "Precio" : "Renta mensual"}
                  </p>
                  <p className="text-xl md:text-2xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                    ${property.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-center">
                  <Bed className="w-5 h-5 text-slate-600 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="text-base md:text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{property.bedrooms}</p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>Recámaras</p>
                </div>
                <div className="text-center border-x border-slate-200">
                  <Bath className="w-5 h-5 text-slate-600 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="text-base md:text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{property.bathrooms}</p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>Baños</p>
                </div>
                <div className="text-center">
                  <Square className="w-5 h-5 text-slate-600 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="text-base md:text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{property.area}</p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>m²</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200">
                <div className="flex overflow-x-auto">
                  {[
                    { id: "descripcion", label: "Descripción" },
                    { id: "caracteristicas", label: "Características" },
                    { id: "ubicacion", label: "Ubicación" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "text-slate-900 border-b-2 border-slate-900 bg-slate-50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      style={{ fontWeight: activeTab === tab.id ? 600 : 500 }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {activeTab === "descripcion" && (
                      <div className="space-y-4">
                        <p className="text-base text-slate-700 leading-relaxed" style={{ fontWeight: 400 }}>
                          {property.title} es una oportunidad excelente para quienes buscan una propiedad con distribución funcional,
                          buena iluminación natural y acabados modernos.
                        </p>
                        <p className="text-base text-slate-700 leading-relaxed" style={{ fontWeight: 400 }}>
                          Ubicada en {property.location}, esta propiedad combina conectividad, plusvalía y comodidad para vivir
                          o invertir con visión de largo plazo.
                        </p>
                      </div>
                    )}

                    {activeTab === "caracteristicas" && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontWeight: 600 }}>
                          Características destacadas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-white" strokeWidth={2} />
                              </div>
                              <p className="text-sm font-medium text-slate-900" style={{ fontWeight: 500 }}>
                                {feature}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "ubicacion" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                          Ubicación
                        </h3>
                        <p className="text-sm text-slate-600" style={{ fontWeight: 400 }}>
                          {property.location}
                        </p>
                        <style>{`
                          .custom-marker {
                            background: none;
                            border: none;
                          }
                        `}</style>
                        <div
                          ref={mapRef}
                          className="h-[360px] w-full rounded-lg overflow-hidden border border-slate-200"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: "0.05em", fontWeight: 500 }}>
                  {property.status === "venta" ? "Precio" : "Renta mensual"}
                </p>
                <p className="text-3xl font-semibold text-slate-900 mb-6" style={{ fontWeight: 700 }}>
                  ${property.price.toLocaleString()}
                </p>

                <div className="space-y-3">
                  <Link
                    to="/contacto"
                    className="block text-center w-full bg-[#C8102E] text-white px-6 py-3 rounded-lg hover:bg-[#a00d25] hover:shadow-lg transition-all duration-300 font-medium"
                    style={{ fontWeight: 600 }}
                  >
                    Agendar visita
                  </Link>
                  <Link
                    to="/contacto"
                    className="block text-center w-full border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    style={{ fontWeight: 600 }}
                  >
                    Contactar asesor
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>ID:</span>
                    <span className="text-slate-900" style={{ fontWeight: 600 }}>VT-{property.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>Tipo:</span>
                    <span className="text-slate-900 capitalize" style={{ fontWeight: 600 }}>{property.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>Estado:</span>
                    <span className="text-slate-900" style={{ fontWeight: 600 }}>
                      {property.status === "venta" ? "En venta" : "En alquiler"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>Publicado:</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-900" style={{ fontWeight: 600 }}>
                      <Calendar className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                      Hace 2 días
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

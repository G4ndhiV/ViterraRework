import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import type { Map as LeafletMap } from "leaflet";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCatalogProperties } from "../hooks/useCatalogProperties";
import { getSupabaseClient, syncSupabaseAuthSession } from "../lib/supabaseClient";
import { fetchDevelopmentByTokkoId } from "../lib/supabaseDevelopments";
import type { Development } from "../data/developments";
import type { LucideIcon } from "lucide-react";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Calendar,
  Share2,
  Heart,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Car,
  Building2,
  Sparkles,
  Package,
  Wrench,
  Waves,
  Dumbbell,
  Shield,
  Flame,
  Dog,
  Wifi,
  Droplets,
  Zap,
  Wind,
  Trees,
  Mountain,
  UtensilsCrossed,
  Briefcase,
  Baby,
  Volleyball,
  Home,
  Sun,
  Fence,
  Users,
  Landmark,
  Store,
  TreePine,
  Cctv,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../components/ui/utils";

function listingActivityLabel(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 0) return "Reciente";
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.round(days / 7)} semanas`;
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

function formatDeliveryDateEs(raw: string): string {
  const t = raw.trim();
  if (!t || t.toUpperCase() === "EMPTY") return "";
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  }
  return t;
}

function isMeaningfulText(s: string | undefined): boolean {
  if (!s) return false;
  const t = s.trim();
  return t.length > 0 && t.toUpperCase() !== "EMPTY";
}

/** Normaliza texto para buscar palabras clave (acentos → ASCII). */
function foldFeatureLabel(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Icono sugerido según el texto del ítem (amenidad/servicio/extra).
 * Cubre términos frecuentes en español de catálogos Tokko.
 */
function iconForFeatureLabel(label: string): LucideIcon | null {
  const n = foldFeatureLabel(label);
  const rules: { test: RegExp; Icon: LucideIcon }[] = [
    { test: /alberca|piscina|pool/, Icon: Waves },
    { test: /pileta/, Icon: Waves },
    { test: /gimnasio|\bgym\b/, Icon: Dumbbell },
    { test: /seguridad|vigilancia|portero|caseta/, Icon: Shield },
    { test: /cctv|camara|videovigilancia/, Icon: Cctv },
    { test: /parrill|asador|bbq/, Icon: Flame },
    { test: /mascota|pet/, Icon: Dog },
    { test: /wifi|internet|fibra/, Icon: Wifi },
    { test: /agua|cloaca|desague|drenaje|potable/, Icon: Droplets },
    { test: /electric|luz\b|alumbrad/, Icon: Zap },
    { test: /gas\b|natural/, Icon: Flame },
    { test: /aire|acondicionado|climat|minisplit/, Icon: Wind },
    { test: /parque|jardin|verde|arbol|pet park/, Icon: TreePine },
    { test: /estacion|cochera|parking|garage/, Icon: Car },
    { test: /cocina|comedor/, Icon: UtensilsCrossed },
    { test: /spa|hidromas|sauna|jacuzzi/, Icon: Bath },
    { test: /oficina|cowork|escritorio/, Icon: Briefcase },
    { test: /sala de reuniones|reuniones/, Icon: Briefcase },
    { test: /niño|kids|infantil|juego/, Icon: Baby },
    { test: /deport|sport|pickle|padel|cancha|golf|simulador/, Icon: Volleyball },
    { test: /sala de juegos|playroom/, Icon: Volleyball },
    { test: /roof|terraza|balcon|deck/, Icon: Home },
    { test: /patio|jardin/, Icon: TreePine },
    { test: /living|comedor diario/, Icon: Home },
    { test: /vista|panoram|montaña/, Icon: Mountain },
    { test: /sum|salon|eventos/, Icon: Users },
    { test: /centro comercial|plaza|comercial/, Icon: Store },
    { test: /yoga|pilates|meditacion/, Icon: Home },
    { test: /lavander|lavadero|lavado/, Icon: Droplets },
    { test: /vestidor/, Icon: Home },
    { test: /biblioteca/, Icon: Landmark },
    { test: /dependencia|baño de servicio|bano de servicio/, Icon: Bath },
    { test: /baulera|altillo|sotano|deposito/, Icon: Package },
    { test: /paviment|via publica|alumbrad public/, Icon: Fence },
    { test: /escritura|notaria|potencial alto para alquilar/, Icon: Landmark },
    { test: /ilumin|natural|luminosidad/, Icon: Sun },
    { test: /elevador|ascensor/, Icon: Building2 },
  ];
  for (const { test, Icon } of rules) {
    if (test.test(n)) return Icon;
  }
  return null;
}

const CATEGORY_STYLES = {
  amenity: {
    sectionIcon: "text-slate-600",
    cardIcon: "text-slate-500",
  },
  service: {
    sectionIcon: "text-slate-600",
    cardIcon: "text-slate-500",
  },
  extra: {
    sectionIcon: "text-slate-600",
    cardIcon: "text-slate-500",
  },
} as const;

function FeatureSection({
  variant,
  title,
  items,
  keyPrefix,
}: {
  variant: keyof typeof CATEGORY_STYLES;
  title: string;
  items: string[];
  keyPrefix: string;
}) {
  if (items.length === 0) return null;
  const meta = CATEGORY_STYLES[variant];
  const SectionIcon = variant === "amenity" ? Home : variant === "service" ? Wrench : Package;
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <SectionIcon className={cn("h-5 w-5 shrink-0", meta.sectionIcon)} strokeWidth={1.8} aria-hidden />
        <h4 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>
          {title}
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((feature, idx) => {
          const ItemIcon = iconForFeatureLabel(feature);
          return (
            <div
              key={`${keyPrefix}-${idx}`}
              className={cn(
                "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                ItemIcon ? "flex items-center gap-3" : "block"
              )}
            >
              {ItemIcon ? <ItemIcon className={cn("h-4.5 w-4.5 shrink-0", meta.cardIcon)} strokeWidth={1.8} /> : null}
              <p className="min-w-0 flex-1 text-sm font-medium leading-normal text-slate-900" style={{ fontWeight: 500 }}>
                {feature}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export function PropertyDetailPage() {
  const { id } = useParams();
  const { properties, loading } = useCatalogProperties();
  const property = useMemo(() => properties.find((p) => p.id === id), [properties, id]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("descripcion");
  const reduceMotion = useReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [linkedDevelopment, setLinkedDevelopment] = useState<Development | null>(null);
  const [developmentLoading, setDevelopmentLoading] = useState(false);

  const propertyImages = useMemo(() => {
    if (!property) return [];
    const unitUrls =
      property.galleryImages && property.galleryImages.length > 0
        ? [...property.galleryImages]
        : [property.image].filter((u) => typeof u === "string" && u.trim() !== "");

    const seen = new Set(unitUrls.map((u) => u.trim()));
    const merged: string[] = [...unitUrls];
    const devUrls = linkedDevelopment?.images?.filter((u) => typeof u === "string" && u.trim() !== "") ?? [];
    for (const u of devUrls) {
      const t = u.trim();
      if (!seen.has(t)) {
        seen.add(t);
        merged.push(u);
      }
    }
    if (merged.length > 0) return merged;

    const alternatives = properties
      .filter((p) => p.id !== property.id)
      .slice(0, 3)
      .map((p) => p.image);
    return [property.image, ...alternatives].filter(Boolean);
  }, [property, properties, linkedDevelopment]);

  const displayTitle = property?.publicationTitle?.trim() || property?.title || "";

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property?.id, linkedDevelopment?.id]);

  const hasCatalogFeatureLists = useMemo(() => {
    if (!property) return false;
    const a = property.amenities?.length ?? 0;
    const s = property.services?.length ?? 0;
    const f = property.additionalFeatures?.length ?? 0;
    return a + s + f > 0;
  }, [property]);

  const hasLinkedProject = Boolean(property?.developmentTokkoId?.trim());

  const propertyDetailTabs = useMemo(() => {
    const core = [
      { id: "descripcion" as const, label: "Descripción" },
      { id: "unidad" as const, label: "Esta publicación" },
      { id: "ubicacion" as const, label: "Ubicación" },
    ];
    if (!hasLinkedProject) return core;
    return [
      { id: "descripcion" as const, label: "Descripción" },
      { id: "desarrollo" as const, label: "Proyecto" },
      { id: "unidad" as const, label: "Esta publicación" },
      { id: "ubicacion" as const, label: "Ubicación" },
    ];
  }, [hasLinkedProject]);

  useEffect(() => {
    if (!hasLinkedProject && activeTab === "desarrollo") {
      setActiveTab("descripcion");
    }
  }, [hasLinkedProject, activeTab, property?.id]);

  useEffect(() => {
    const tokko = property?.developmentTokkoId?.trim();
    if (!tokko) {
      setLinkedDevelopment(null);
      setDevelopmentLoading(false);
      return;
    }
    let cancelled = false;
    setDevelopmentLoading(true);
    setLinkedDevelopment(null);
    void (async () => {
      const client = getSupabaseClient();
      if (!client) {
        if (!cancelled) setDevelopmentLoading(false);
        return;
      }
      await syncSupabaseAuthSession(client);
      const { data, error } = await fetchDevelopmentByTokkoId(client, tokko, { publicOnly: false });
      if (cancelled) return;
      setDevelopmentLoading(false);
      if (error) {
        setLinkedDevelopment(null);
        return;
      }
      setLinkedDevelopment(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [property?.developmentTokkoId]);

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

  if (loading) {
    return (
      <div className="viterra-page flex min-h-screen flex-col">
        <Header />
        <div data-reveal className="flex flex-1 items-center justify-center">
          <p className="text-slate-600" style={{ fontWeight: 500 }}>
            Cargando…
          </p>
        </div>
        <Footer />
      </div>
    );
  }

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
                  alt={displayTitle}
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

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`}>
                    {property.status === "venta" ? "En venta" : "En alquiler"}
                  </span>
                  <span className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                    {property.type}
                  </span>
                  {property.featured ? (
                    <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                      Destacada
                    </span>
                  ) : null}
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
                    {displayTitle}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-medium" style={{ fontWeight: 500 }}>{property.location}</span>
                  </div>
                  {property.colony ? (
                    <p className="mb-3 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                      <span className="text-slate-500">Colonia:</span>{" "}
                      <span className="text-slate-900">{property.colony}</span>
                    </p>
                  ) : null}
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
                  <p className="text-base md:text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                    {property.area.toLocaleString()} m²
                  </p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>Cubierta</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200">
                <div className="flex overflow-x-auto">
                  {propertyDetailTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-w-0 flex-1 items-center justify-center px-3 py-4 text-xs font-medium transition-all sm:px-5 sm:text-sm ${
                        activeTab === tab.id
                          ? "border-b-2 border-slate-900 bg-slate-50 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      style={{ fontWeight: activeTab === tab.id ? 600 : 500 }}
                      type="button"
                    >
                      <span className="truncate">{tab.label}</span>
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
                        {property.description ? (
                          <p
                            className="whitespace-pre-line text-base text-slate-700 leading-relaxed"
                            style={{ fontWeight: 400 }}
                          >
                            {property.description}
                          </p>
                        ) : property.richDescription ? (
                          <div
                            className="prose prose-slate max-w-none text-base text-slate-700 prose-headings:font-semibold prose-p:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: property.richDescription }}
                          />
                        ) : (
                          <>
                            <p className="text-base text-slate-700 leading-relaxed" style={{ fontWeight: 400 }}>
                              {displayTitle} es una oportunidad excelente para quienes buscan una propiedad con distribución
                              funcional, buena iluminación natural y acabados modernos.
                            </p>
                            <p className="text-base text-slate-700 leading-relaxed" style={{ fontWeight: 400 }}>
                              Ubicada en {property.location}, esta propiedad combina conectividad, plusvalía y comodidad para
                              vivir o invertir con visión de largo plazo.
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === "desarrollo" && hasLinkedProject && (
                      <div className="space-y-6">
                        {developmentLoading ? (
                          <p className="text-sm text-slate-500" style={{ fontWeight: 500 }}>
                            Cargando datos del proyecto…
                          </p>
                        ) : linkedDevelopment ? (
                          <section className="space-y-6 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/90 to-white p-5 shadow-sm md:p-7">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                                    {linkedDevelopment.name}
                                  </p>
                                  {isMeaningfulText(linkedDevelopment.type) ? (
                                    <p className="mt-1 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                                      {linkedDevelopment.type}
                                      {isMeaningfulText(linkedDevelopment.location) ? ` · ${linkedDevelopment.location}` : ""}
                                    </p>
                                  ) : isMeaningfulText(linkedDevelopment.location) ? (
                                    <p className="mt-1 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                                      {linkedDevelopment.location}
                                    </p>
                                  ) : null}
                                  <p className="mt-2 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                                    <span className="text-slate-500">Estado del proyecto:</span>{" "}
                                    <span className="font-medium text-slate-900">{linkedDevelopment.status}</span>
                                  </p>
                                </div>
                                <Link
                                  to={`/desarrollos/${linkedDevelopment.id}`}
                                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
                                  style={{ fontWeight: 600 }}
                                >
                                  Ver ficha del proyecto
                                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                                </Link>
                              </div>

                              {formatDeliveryDateEs(linkedDevelopment.deliveryDate) ? (
                                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                                  <Calendar className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                                  <span className="text-slate-600" style={{ fontWeight: 500 }}>
                                    Entrega estimada:
                                  </span>
                                  <span className="text-slate-900" style={{ fontWeight: 600 }}>
                                    {formatDeliveryDateEs(linkedDevelopment.deliveryDate)}
                                  </span>
                                </div>
                              ) : null}

                              {isMeaningfulText(linkedDevelopment.priceRange) ? (
                                <p className="text-sm text-slate-700" style={{ fontWeight: 500 }}>
                                  <span className="text-slate-500">Rango referencial: </span>
                                  {linkedDevelopment.priceRange}
                                </p>
                              ) : null}

                              <div className="space-y-8 border-t border-slate-200/80 pt-6">
                                <FeatureSection
                                  variant="amenity"
                                  title="Amenidades"
                                  items={linkedDevelopment.amenities}
                                  keyPrefix="dev-am"
                                />
                                <FeatureSection
                                  variant="service"
                                  title="Servicios"
                                  items={linkedDevelopment.services}
                                  keyPrefix="dev-sv"
                                />
                                <FeatureSection
                                  variant="extra"
                                  title="Características adicionales"
                                  items={linkedDevelopment.additionalFeatures}
                                  keyPrefix="dev-af"
                                />
                              </div>
                            </section>
                        ) : (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                            Hay un vínculo a desarrollo (Tokko {property.developmentTokkoId}), pero no encontramos la ficha en
                            la tabla <span className="font-mono">developments</span>. Revisa que exista la misma fila con{" "}
                            <span className="font-mono">tokko_id</span> coincidente.
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "unidad" && (
                      <div className="space-y-6">
                        {hasCatalogFeatureLists ? (
                          <div className="space-y-8">
                            <FeatureSection
                              variant="amenity"
                              title="Amenidades"
                              items={property.amenities ?? []}
                              keyPrefix="u-am"
                            />
                            <FeatureSection
                              variant="service"
                              title="Servicios"
                              items={property.services ?? []}
                              keyPrefix="u-sv"
                            />
                            <FeatureSection
                              variant="extra"
                              title="Características adicionales"
                              items={property.additionalFeatures ?? []}
                              keyPrefix="u-af"
                            />
                          </div>
                        ) : property.developmentTokkoId ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center">
                            <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                              No hay listas de amenidades, servicios ni extras solo para esta publicación.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
                            <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                              No hay listas de amenidades, servicios ni extras registradas para esta publicación.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "ubicacion" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                          Ubicación
                        </h3>
                        {property.colony ? (
                          <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                            Colonia: {property.colony}
                          </p>
                        ) : null}
                        {property.fullAddress ? (
                          <p className="text-sm text-slate-700" style={{ fontWeight: 500 }}>
                            {property.fullAddress}
                          </p>
                        ) : null}
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

                <div className="mt-6 space-y-2.5 border-t border-slate-200 pt-5 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-600 shrink-0" style={{ fontWeight: 500 }}>Referencia:</span>
                    <span className="text-right text-slate-900 break-all" style={{ fontWeight: 600 }}>
                      {property.referenceCode ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>Tipo:</span>
                    <span className="text-slate-900 capitalize" style={{ fontWeight: 600 }}>{property.type}</span>
                  </div>
                  {property.colony ? (
                    <div className="flex justify-between gap-3">
                      <span className="shrink-0 text-slate-600" style={{ fontWeight: 500 }}>
                        Colonia:
                      </span>
                      <span className="text-right text-slate-900" style={{ fontWeight: 600 }}>
                        {property.colony}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>Estado:</span>
                    <span className="text-slate-900" style={{ fontWeight: 600 }}>
                      {property.status === "venta" ? "En venta" : "En alquiler"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-600 shrink-0" style={{ fontWeight: 500 }}>Actualizado:</span>
                    <span className="inline-flex items-center gap-1.5 text-right text-slate-900" style={{ fontWeight: 600 }}>
                      <Calendar className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={1.5} />
                      {listingActivityLabel(property.listingUpdatedAt)}
                    </span>
                  </div>
                  {linkedDevelopment && formatDeliveryDateEs(linkedDevelopment.deliveryDate) ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-600 shrink-0" style={{ fontWeight: 500 }}>
                        Fecha de entrega:
                      </span>
                      <span className="text-right text-slate-900" style={{ fontWeight: 600 }}>
                        {formatDeliveryDateEs(linkedDevelopment.deliveryDate)}
                      </span>
                    </div>
                  ) : null}
                  {property.parkingSpaces !== undefined ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-600 shrink-0" style={{ fontWeight: 500 }}>
                        Estacionamientos:
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-900" style={{ fontWeight: 600 }}>
                        <Car className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                        {property.parkingSpaces}
                      </span>
                    </div>
                  ) : null}
                  {property.age !== undefined ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600" style={{ fontWeight: 500 }}>
                        Antigüedad:
                      </span>
                      <span className="text-slate-900" style={{ fontWeight: 600 }}>
                        {property.age === 0 ? "A estrenar" : `${property.age} años`}
                      </span>
                    </div>
                  ) : null}
                  {property.expenses != null && property.expenses > 0 ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-600 shrink-0" style={{ fontWeight: 500 }}>
                        {property.status === "alquiler" ? "Mantenimiento:" : "Gastos / expensas:"}
                      </span>
                      <span className="text-right text-slate-900" style={{ fontWeight: 600 }}>
                        ${property.expenses.toLocaleString()}
                      </span>
                    </div>
                  ) : null}
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

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router";
import type { Map as LeafletMap } from "leaflet";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCatalogProperties } from "../hooks/useCatalogProperties";
import { getSupabaseClient, syncSupabaseAuthSession } from "../lib/supabaseClient";
import { fetchDevelopmentByTokkoId } from "../lib/supabaseDevelopments";
import { displayDeliveryDate, type Development } from "../data/developments";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Calendar,
  Phone,
  Send,
  Share2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Car,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../components/ui/utils";
import { FeatureSection } from "../components/FeatureSectionBlocks";
import { WhatsAppGlyph } from "../components/WhatsAppGlyph";
import type { Property } from "../components/PropertyCard";

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

export function PropertyDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { properties, loading } = useCatalogProperties();
  const seededProperty = useMemo(() => {
    const maybe = (location.state as { property?: Property } | null)?.property;
    return maybe?.id === id ? maybe : undefined;
  }, [location.state, id]);
  const property = useMemo(() => properties.find((p) => p.id === id) ?? seededProperty, [properties, id, seededProperty]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("descripcion");
  const reduceMotion = useReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [linkedDevelopment, setLinkedDevelopment] = useState<Development | null>(null);
  const [developmentLoading, setDevelopmentLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

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

  if (loading && !property) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
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

      <div data-reveal className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 lg:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <div className="relative h-[250px] bg-slate-200 group sm:h-[320px] md:h-[360px] lg:h-[400px]">
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
                      className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] ${
                        idx === currentImageIndex
                          ? "border-slate-900 ring-2 ring-slate-900 sm:ring-offset-2"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <ImageWithFallback src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
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
                      className={`flex min-w-[8.8rem] items-center justify-center px-3 py-4 text-xs font-medium transition-all sm:min-w-0 sm:flex-1 sm:px-5 sm:text-sm ${
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

              <div className="p-4 sm:p-6">
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

                              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                                <Calendar className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                                <span className="text-slate-600" style={{ fontWeight: 500 }}>
                                  Entrega estimada:
                                </span>
                                <span className="text-slate-900" style={{ fontWeight: 600 }}>
                                  {formatDeliveryDateEs(linkedDevelopment.deliveryDate) ||
                                    displayDeliveryDate(linkedDevelopment.deliveryDate)}
                                </span>
                              </div>

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

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl" style={{ fontWeight: 700 }}>
                ¿Te interesa esta propiedad?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
                Llama, escribe por WhatsApp o déjanos tus datos y un asesor te contacta.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  to="/contacto"
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
                  style={{ fontWeight: 600 }}
                >
                  <Phone className="h-4 w-4" strokeWidth={2} />
                  Llamar
                </Link>
                <a
                  href="https://wa.me/523318878494"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#20bd5a]"
                  style={{ fontWeight: 600 }}
                >
                  <WhatsAppGlyph className="h-4 w-4 text-white" />
                  WhatsApp
                </a>
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    O completa el formulario
                  </span>
                </div>
              </div>

              {submitted && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-sm font-semibold text-green-900" style={{ fontWeight: 600 }}>
                    ¡Mensaje enviado!
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    placeholder="Nombre"
                    autoComplete="name"
                  />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    placeholder="Tu teléfono"
                    autoComplete="tel"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  placeholder="Correo"
                  autoComplete="email"
                />
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  placeholder="Mensaje (opcional)"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover"
                  style={{ fontWeight: 600 }}
                >
                  <Send className="h-4 w-4" strokeWidth={2} />
                  Enviar consulta
                </button>
              </form>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4">
                  <h1
                    className="mb-2 break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-brand-navy sm:text-2xl md:text-3xl"
                    style={{ fontWeight: 700 }}
                  >
                    {displayTitle}
                  </h1>
                  <div className="mb-2">
                    <p
                      className="mb-1 text-xs uppercase tracking-wide text-slate-500"
                      style={{ letterSpacing: "0.05em", fontWeight: 500 }}
                    >
                      {property.status === "venta" ? "Precio" : "Renta mensual"}
                    </p>
                    <p className="text-xl font-semibold text-brand-navy md:text-2xl" style={{ fontWeight: 700 }}>
                      ${property.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="mb-2 flex items-start gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="break-words text-sm font-medium" style={{ fontWeight: 500 }}>
                      {property.location}
                    </span>
                  </div>
                  {property.colony ? (
                    <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                      <span className="text-slate-500">Colonia:</span>{" "}
                      <span className="text-slate-900">{property.colony}</span>
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:gap-4 md:p-4">
                  <div className="text-center">
                    <Bed className="mx-auto mb-1 h-5 w-5 text-slate-600" strokeWidth={1.5} />
                    <p className="text-base font-semibold text-slate-900 md:text-lg" style={{ fontWeight: 600 }}>
                      {property.bedrooms}
                    </p>
                    <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                      Recámaras
                    </p>
                  </div>
                  <div className="border-x border-slate-200 text-center">
                    <Bath className="mx-auto mb-1 h-5 w-5 text-slate-600" strokeWidth={1.5} />
                    <p className="text-base font-semibold text-slate-900 md:text-lg" style={{ fontWeight: 600 }}>
                      {property.bathrooms}
                    </p>
                    <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                      Baños
                    </p>
                  </div>
                  <div className="text-center">
                    <Square className="mx-auto mb-1 h-5 w-5 text-slate-600" strokeWidth={1.5} />
                    <p className="text-base font-semibold text-slate-900 md:text-lg" style={{ fontWeight: 600 }}>
                      {property.area.toLocaleString()} m²
                    </p>
                    <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                      Cubierta
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="space-y-2.5 text-[13px]">
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
                  {linkedDevelopment ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-600 shrink-0" style={{ fontWeight: 500 }}>
                        Fecha de entrega:
                      </span>
                      <span className="text-right text-slate-900" style={{ fontWeight: 600 }}>
                        {formatDeliveryDateEs(linkedDevelopment.deliveryDate) ||
                          displayDeliveryDate(linkedDevelopment.deliveryDate)}
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

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import {
  MapPin,
  Phone,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  Home,
  Calendar,
  Maximize2,
  Share2,
  Ruler,
  Bed,
  Bath,
  Car,
  Send,
  ArrowRight,
} from "lucide-react";
import { useDevelopmentDetail } from "../hooks/useDevelopmentsCatalog";
import { displayDeliveryDate } from "../data/developments";
import { WhatsAppGlyph } from "../components/WhatsAppGlyph";
import { cn } from "../components/ui/utils";
import type { Property } from "../components/PropertyCard";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FeatureSection } from "../components/FeatureSectionBlocks";

const DEVELOPMENT_DETAIL_TABS = [
  { id: "descripcion" as const, label: "Descripción" },
  { id: "caracteristicas" as const, label: "Características" },
  { id: "unidades" as const, label: "Unidades" },
  { id: "ubicacion" as const, label: "Ubicación" },
];

function precioDesdeTexto(priceRange: string | undefined): string {
  const t = (priceRange ?? "").trim();
  if (!t) return "—";
  const first = t.split(" - ")[0]?.trim();
  return first || t;
}

/** Por encima de esto se muestra “Ver más” en la descripción (detalle). */
const DESCRIPTION_COLLAPSE_THRESHOLD = 420;

const INTRO_LOCATION_BLURB =
  "Ubicado en una de las zonas más cotizadas de mayor plusvalía de Zapopan, a 3 minutos de Andares. Ideal para profesionistas, estudiantes o inversionistas que buscan rentabilidad, ubicación y calidad de vida en una zona en constante crecimiento.";

function propertyCardHeadline(p: Property) {
  return p.publicationTitle?.trim() || p.title;
}

function digitsOnlyPhone(s: string | undefined): string {
  return String(s ?? "").replace(/\D/g, "");
}

/** URI `tel:` con formato internacional (+); 10 dígitos → prefijo México 52. */
function telHrefFromStoredPhone(raw: string | undefined): string {
  const d = digitsOnlyPhone(raw);
  if (d.length < 10) return "";
  const intl = d.length === 10 ? `52${d}` : d;
  return `tel:+${intl}`;
}

/** Mismo número que para WhatsApp (wa.me). */
function whatsappHrefFromStoredPhone(raw: string | undefined): string {
  const d = digitsOnlyPhone(raw);
  if (d.length < 10) return "";
  const intl = d.length === 10 ? `52${d}` : d;
  return `https://wa.me/${intl}`;
}

export function DevelopmentDetailPage() {
  const { id } = useParams();
  const { development, linkedProperties, loading, error } = useDevelopmentDetail(id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("descripcion");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current || !development) return;

      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        const map = (L as any)
          .map(mapRef.current)
          .setView([development.coordinates.lat, development.coordinates.lng], 15);

        (L as any)
          .tileLayer(
            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              subdomains: "abcd",
              maxZoom: 20,
            }
          )
          .addTo(map);

        const customIcon = (L as any).divIcon({
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

        (L as any)
          .marker([development.coordinates.lat, development.coordinates.lng], {
            icon: customIcon,
          })
          .addTo(map);

        mapInstanceRef.current = map;
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    if (activeTab !== "ubicacion") {
      try {
        mapInstanceRef.current?.remove();
      } catch (error) {
        console.error("Error removing map:", error);
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
      invalidateId = window.setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch (error) {
          console.error("Error invalidating map size:", error);
        }
      }, 180);
    };

    mountWhenReady();
    return () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (invalidateId != null) window.clearTimeout(invalidateId);
    };
  }, [activeTab, development]);

  useEffect(() => {
    return () => {
      try {
        mapInstanceRef.current?.remove();
      } catch (error) {
        console.error("Error removing map:", error);
      }
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isImageZoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsImageZoomOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isImageZoomOpen]);

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [id]);

  useEffect(() => {
    setActiveTab((prev) => (prev === "amenidades" ? "caracteristicas" : prev));
  }, [id]);

  const contactPhoneRaw = development?.inChargePhone?.trim() ?? "";
  const telContactHref = useMemo(
    () => telHrefFromStoredPhone(contactPhoneRaw),
    [contactPhoneRaw]
  );
  const whatsappContactHref = useMemo(
    () => whatsappHrefFromStoredPhone(contactPhoneRaw),
    [contactPhoneRaw]
  );

  if (loading) {
    return (
      <div className="viterra-page min-h-screen flex flex-col bg-white">
        <Header />
        <div data-reveal className="flex flex-1 items-center justify-center text-slate-600" style={{ fontWeight: 500 }}>
          Cargando…
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !development) {
    return (
      <div className="viterra-page min-h-screen flex flex-col bg-white">
        <Header />
        <div data-reveal className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-2xl font-semibold text-brand-navy mb-4">
              {error ? "No se pudo cargar el desarrollo" : "Desarrollo no encontrado"}
            </h1>
            {error ? <p className="mb-4 text-sm text-slate-600">{error}</p> : null}
            <Link to="/desarrollos" className="text-slate-600 hover:text-slate-900">
              Volver a desarrollos
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === development.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? development.images.length - 1 : prev - 1
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const statusBadgeClass =
    "border border-black/15 bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]";

  const descriptionNeedsExpand =
    development.description.length > DESCRIPTION_COLLAPSE_THRESHOLD;

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/desarrollos"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Volver a Desarrollos
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div data-reveal className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <div className="relative h-[250px] bg-slate-200 group sm:h-[320px] md:h-[360px] lg:h-[400px]">
                <img
                  src={development.images[currentImageIndex]}
                  alt={development.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows */}
                {development.images.length > 1 && (
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
                  <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`} style={{ fontWeight: 600 }}>
                    {development.status}
                  </span>
                  <span className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                    {development.type}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsImageZoomOpen(true)}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all"
                    aria-label="Ampliar imagen"
                  >
                    <Maximize2 className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </button>
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all">
                    <Share2 className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-brand-navy/80 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                  {currentImageIndex + 1} / {development.images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {development.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] ${
                        idx === currentImageIndex
                          ? "border-slate-900 ring-2 ring-slate-900 sm:ring-offset-2"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h1
                    className="mb-2 break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-3xl"
                    style={{ fontWeight: 700 }}
                  >
                    {development.name}
                  </h1>
                  <div className="mb-2 flex items-start gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="break-words text-sm font-medium" style={{ fontWeight: 500 }}>
                      {development.fullAddress}
                      {development.colony ? `, ${development.colony}` : ""}
                    </span>
                  </div>
                  {development.colony ? (
                    <p className="mb-3 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                      <span className="text-slate-500">Colonia:</span>{" "}
                      <span className="text-slate-900">{development.colony}</span>
                    </p>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <p
                    className="mb-1 text-xs uppercase tracking-wide text-slate-500"
                    style={{ letterSpacing: "0.05em", fontWeight: 500 }}
                  >
                    Desde
                  </p>
                  <p className="text-xl font-semibold text-slate-900 md:text-2xl" style={{ fontWeight: 700 }}>
                    {precioDesdeTexto(development.priceRange)}
                  </p>
                  {(development.priceRange ?? "").includes(" - ") ? (
                    <p className="mt-1 max-w-[18rem] text-xs text-slate-500 sm:ml-auto sm:text-right" style={{ fontWeight: 500 }}>
                      Rango: {development.priceRange}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:gap-4 md:p-4">
                <div className="text-center">
                  <Building2 className="mx-auto mb-1 h-5 w-5 text-slate-600" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-slate-900 md:text-lg" style={{ fontWeight: 600 }}>
                    {development.units}
                  </p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                    Unidades
                  </p>
                </div>
                <div className="border-x border-slate-200 text-center">
                  <Home className="mx-auto mb-1 h-5 w-5 text-slate-600" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-slate-900 md:text-lg" style={{ fontWeight: 600 }}>
                    {development.type}
                  </p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                    Tipo
                  </p>
                </div>
                <div className="text-center">
                  <Calendar className="mx-auto mb-1 h-5 w-5 text-slate-600" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-slate-900 md:text-lg" style={{ fontWeight: 600 }}>
                    {displayDeliveryDate(development.deliveryDate)}
                  </p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                    Entrega
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200">
                <div className="flex overflow-x-auto">
                  {DEVELOPMENT_DETAIL_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-w-[8.8rem] items-center justify-center px-3 py-4 text-xs font-medium transition-all sm:min-w-0 sm:flex-1 sm:px-5 sm:text-sm ${
                        activeTab === tab.id
                          ? "border-b-2 border-slate-900 bg-slate-50 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      style={{ fontWeight: activeTab === tab.id ? 600 : 500 }}
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
                        <div className={cn("relative", descriptionNeedsExpand && !descriptionExpanded && "pb-1")}>
                          <div
                            className={cn(
                              "space-y-4",
                              descriptionNeedsExpand &&
                                !descriptionExpanded &&
                                "max-h-[min(14rem,42vh)] overflow-hidden md:max-h-[min(16rem,38vh)]"
                            )}
                          >
                            <p className="text-base leading-relaxed text-slate-700" style={{ fontWeight: 400 }}>
                              {development.description}
                            </p>
                            <p className="text-base leading-relaxed text-slate-700" style={{ fontWeight: 400 }}>
                              {INTRO_LOCATION_BLURB}
                            </p>
                          </div>
                          {descriptionNeedsExpand && !descriptionExpanded ? (
                            <div
                              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
                              aria-hidden
                            />
                          ) : null}
                        </div>
                        {descriptionNeedsExpand ? (
                          <button
                            type="button"
                            onClick={() => setDescriptionExpanded((e) => !e)}
                            className="text-sm font-medium text-primary hover:text-brand-burgundy hover:underline"
                            style={{ fontWeight: 600 }}
                            aria-expanded={descriptionExpanded}
                          >
                            {descriptionExpanded ? "Ver menos" : "Ver más"}
                          </button>
                        ) : null}
                      </div>
                    )}

                    {activeTab === "caracteristicas" && (
                      <div className="space-y-8">
                        {development.amenities.length + development.services.length + development.additionalFeatures.length >
                        0 ? (
                          <>
                            <FeatureSection
                              variant="amenity"
                              title="Amenidades"
                              items={development.amenities}
                              keyPrefix="dev-am"
                            />
                            <FeatureSection
                              variant="service"
                              title="Servicios"
                              items={development.services}
                              keyPrefix="dev-sv"
                            />
                            <FeatureSection
                              variant="extra"
                              title="Características adicionales"
                              items={development.additionalFeatures}
                              keyPrefix="dev-af"
                            />
                          </>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
                            <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                              No hay listas de amenidades, servicios ni extras registradas para este desarrollo.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "unidades" && (
                  <div>
                    {development.developmentUnits.length > 0 || linkedProperties.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                            Unidades disponibles
                          </h3>
                          <span className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                            {development.developmentUnits.length + linkedProperties.length} en total
                          </span>
                        </div>

                        {development.developmentUnits.length > 0 && (
                          <div className="space-y-3">
                            {linkedProperties.length > 0 && (
                              <p className="text-sm font-medium text-slate-700" style={{ fontWeight: 600 }}>
                                Tipologías (inventario manual)
                              </p>
                            )}
                            {development.developmentUnits.map((unit, idx) => (
                              <div
                                key={`u-${idx}`}
                                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                  <h4 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                                    {unit.type}
                                  </h4>
                                  <span className="text-xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                                    ${unit.price.toLocaleString()} MXN
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Bed className="w-4 h-4" strokeWidth={1.5} />
                                    <span style={{ fontWeight: 500 }}>{unit.bedrooms} rec.</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Ruler className="w-4 h-4" strokeWidth={1.5} />
                                    <span style={{ fontWeight: 500 }}>{unit.totalArea} m²</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Car className="w-4 h-4" strokeWidth={1.5} />
                                    <span style={{ fontWeight: 500 }}>{unit.parking ? "Sí" : "No"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Home className="w-4 h-4" strokeWidth={1.5} />
                                    <span style={{ fontWeight: 500 }}>{unit.spaces} esp.</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {linkedProperties.length > 0 && (
                          <div className="space-y-3">
                            {development.developmentUnits.length > 0 && (
                              <p className="text-sm font-medium text-slate-700 pt-2" style={{ fontWeight: 600 }}>
                                Unidades en catálogo (propiedades vinculadas)
                              </p>
                            )}
                            {linkedProperties.map((p) => (
                              <Link
                                key={p.id}
                                to={`/propiedades/${p.id}`}
                                className="group block p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary/40 hover:bg-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                  <div className="min-w-0">
                                    <h4 className="text-base font-semibold text-slate-900 group-hover:text-primary transition-colors" style={{ fontWeight: 600 }}>
                                      {propertyCardHeadline(p)}
                                    </h4>
                                    {p.referenceCode ? (
                                      <p className="text-xs text-slate-500 mt-0.5" style={{ fontWeight: 500 }}>
                                        Ref. {p.referenceCode}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                                      ${p.price.toLocaleString()} MXN
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors hidden sm:block" strokeWidth={2} />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Bed className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                                    <span style={{ fontWeight: 500 }}>{p.bedrooms} rec.</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Bath className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                                    <span style={{ fontWeight: 500 }}>{p.bathrooms} baños</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Ruler className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                                    <span style={{ fontWeight: 500 }}>{p.area} m²</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <span className="text-xs uppercase tracking-wide text-slate-500" style={{ fontWeight: 600 }}>
                                      {p.status === "alquiler" ? "Renta" : "Venta"}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-primary mt-3 font-medium group-hover:underline" style={{ fontWeight: 600 }}>
                                  Ver ficha completa
                                </p>
                              </Link>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-slate-500 mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200" style={{ fontWeight: 400 }}>
                          La información contenida es a título informativo y no constituye una oferta vinculante.
                          Consulte con nuestros asesores para obtener información actualizada.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                        <p className="text-slate-600" style={{ fontWeight: 500 }}>
                          Información de unidades disponible próximamente
                        </p>
                        <p className="text-sm text-slate-500 mt-1" style={{ fontWeight: 400 }}>
                          Contacta con nuestros asesores para más detalles
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
                        {development.colony ? (
                          <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                            Colonia: {development.colony}
                          </p>
                        ) : null}
                        <p className="text-sm text-slate-700" style={{ fontWeight: 500 }}>
                          {[development.fullAddress, development.colony, "Guadalajara, Jalisco"].filter(Boolean).join(", ")}
                        </p>
                        <style>{`
                          .custom-marker {
                            background: none;
                            border: none;
                          }
                        `}</style>
                        <div
                          ref={mapRef}
                          className="h-[360px] w-full overflow-hidden rounded-lg border border-slate-200"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Lead — mismo patrón que referencia visual: acciones rápidas + formulario */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl" style={{ fontWeight: 700 }}>
                ¿Te interesa este desarrollo?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
                Llama, escribe por WhatsApp o déjanos tus datos y un asesor te contacta.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {telContactHref ? (
                  <a
                    href={telContactHref}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
                    style={{ fontWeight: 600 }}
                  >
                    <Phone className="h-4 w-4" strokeWidth={2} />
                    Llama
                  </a>
                ) : (
                  <span className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-3 text-sm font-medium text-slate-400">
                    <Phone className="h-4 w-4" strokeWidth={2} />
                    Llama
                  </span>
                )}
                {whatsappContactHref ? (
                  <a
                    href={whatsappContactHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#20bd5a]"
                    style={{ fontWeight: 600 }}
                  >
                    <WhatsAppGlyph className="h-4 w-4 text-white" />
                    WhatsApp
                  </a>
                ) : (
                  <span className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-200 py-3 text-sm font-medium text-slate-500">
                    <WhatsAppGlyph className="h-4 w-4" />
                    WhatsApp
                  </span>
                )}
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
                <p
                  className="mb-1 text-xs uppercase tracking-wide text-slate-500"
                  style={{ letterSpacing: "0.05em", fontWeight: 500 }}
                >
                  Desde
                </p>
                <p className="mb-1 text-3xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                  {precioDesdeTexto(development.priceRange)}
                </p>
                {(development.priceRange ?? "").includes(" - ") ? (
                  <p className="mb-6 text-xs text-slate-500" style={{ fontWeight: 500 }}>
                    Rango: {development.priceRange}
                  </p>
                ) : (
                  <div className="mb-6" />
                )}

                <div className="space-y-3">
                  <Link
                    to="/contacto"
                    className="block w-full rounded-lg bg-[#C8102E] px-6 py-3 text-center font-medium text-white transition-all duration-300 hover:bg-[#a00d25] hover:shadow-lg"
                    style={{ fontWeight: 600 }}
                  >
                    Agendar visita
                  </Link>
                  <Link
                    to="/contacto"
                    className="block w-full rounded-lg border-2 border-slate-900 px-6 py-3 text-center font-medium text-slate-900 transition-all hover:bg-slate-50"
                    style={{ fontWeight: 600 }}
                  >
                    Contactar asesor
                  </Link>
                </div>

                <div className="mt-6 space-y-2.5 border-t border-slate-200 pt-5 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <span className="shrink-0 text-slate-600" style={{ fontWeight: 500 }}>
                      Referencia:
                    </span>
                    <span className="break-all text-right text-slate-900" style={{ fontWeight: 600 }}>
                      {development.referenceCode?.trim() || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>
                      Tipo:
                    </span>
                    <span className="capitalize text-slate-900" style={{ fontWeight: 600 }}>
                      {development.type}
                    </span>
                  </div>
                  {development.colony ? (
                    <div className="flex justify-between gap-3">
                      <span className="shrink-0 text-slate-600" style={{ fontWeight: 500 }}>
                        Colonia:
                      </span>
                      <span className="text-right text-slate-900" style={{ fontWeight: 600 }}>
                        {development.colony}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>
                      Estado:
                    </span>
                    <span className="text-slate-900" style={{ fontWeight: 600 }}>
                      {development.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600" style={{ fontWeight: 500 }}>
                      Unidades:
                    </span>
                    <span className="text-slate-900" style={{ fontWeight: 600 }}>
                      {development.units}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="shrink-0 text-slate-600" style={{ fontWeight: 500 }}>
                      Entrega:
                    </span>
                    <span className="text-right text-slate-900" style={{ fontWeight: 600 }}>
                      {displayDeliveryDate(development.deliveryDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isImageZoomOpen && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setIsImageZoomOpen(false)}
        >
          <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={development.images[currentImageIndex]}
              alt={development.name}
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={() => setIsImageZoomOpen(false)}
              className="absolute right-3 top-3 rounded-md bg-black/65 px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
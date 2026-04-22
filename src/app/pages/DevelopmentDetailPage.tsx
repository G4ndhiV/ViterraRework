import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import {
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Home,
  Calendar,
  DollarSign,
  Maximize2,
  Map,
  Share2,
  Ruler,
  Bed,
  Bath,
  Car,
  Send,
  ArrowRight,
} from "lucide-react";
import { useDevelopmentDetail } from "../hooks/useDevelopmentsCatalog";
import { copyPublicPageUrl } from "../lib/copyPublicLink";

function phoneDigitsOnly(raw: string) {
  return raw.replace(/\D/g, "");
}

export function DevelopmentDetailPage() {
  const { id } = useParams();
  const { development, linkedProperties, loading, error } = useDevelopmentDetail(id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("descripcion");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!development || activeTab !== "ubicacion") {
      return;
    }

    let cancelled = false;
    let invalidateTimer: ReturnType<typeof setTimeout> | undefined;

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const lat = development.coordinates.lat;
      const lng = development.coordinates.lng;

      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        if (cancelled || !mapRef.current) return;

        const map = (L as any)
          .map(mapRef.current, { scrollWheelZoom: true })
          .setView([lat, lng], 15);

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

        (L as any).marker([lat, lng], { icon: customIcon }).addTo(map);

        mapInstanceRef.current = map;

        requestAnimationFrame(() => {
          if (!cancelled && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        invalidateTimer = window.setTimeout(() => {
          if (!cancelled && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    const frame = requestAnimationFrame(() => {
      void initMap();
    });

    return () => {
      cancelled = true;
      if (invalidateTimer !== undefined) clearTimeout(invalidateTimer);
      cancelAnimationFrame(frame);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error("Error removing map:", error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [development, activeTab]);

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

  const chargePhone = development.inChargePhone?.trim() ?? "";
  const phoneDigits = phoneDigitsOnly(chargePhone);
  const telHref =
    phoneDigits.length > 0
      ? `tel:${chargePhone.replace(/[^\d+]/g, "") || phoneDigits}`
      : undefined;
  const waHref = phoneDigits.length >= 8 ? `https://wa.me/${phoneDigits}` : undefined;

  const chargeEmail = development.inChargeEmail?.trim() ?? "";
  const mailHref = chargeEmail.length > 0 ? `mailto:${chargeEmail}` : undefined;

  const unitsTabCount =
    linkedProperties.length > 0 ? linkedProperties.length : development.developmentUnits.length;

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
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
      <div data-reveal className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Gallery and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <div className="relative h-[400px] md:h-[500px] bg-slate-200 group">
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

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`} style={{ fontWeight: 600 }}>
                    {development.status}
                  </span>
                </div>

                {/* Compartir enlace */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => id && copyPublicPageUrl(`/desarrollos/${id}`)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-white"
                    aria-label="Copiar enlace del desarrollo"
                  >
                    <Share2 className="h-5 w-5 text-slate-700" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-brand-navy/80 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                  {currentImageIndex + 1} / {development.images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {development.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Development Info Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2 tracking-tight" style={{ fontWeight: 700 }}>
                    {development.name}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-600 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-medium" style={{ fontWeight: 500 }}>
                      {development.fullAddress}, {development.colony}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Desde</p>
                  <p className="text-xl md:text-2xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                    {development.priceRange.split(' - ')[0]}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-center">
                  <Building2 className="w-5 h-5 text-slate-600 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="text-base md:text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{unitsTabCount}</p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>Unidades</p>
                </div>
                <div className="text-center border-x border-slate-200">
                  <Home className="w-5 h-5 text-slate-600 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="text-base md:text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{development.type}</p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>Tipo</p>
                </div>
                <div className="text-center">
                  <Calendar className="w-5 h-5 text-slate-600 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="text-base md:text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{development.deliveryDate}</p>
                  <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>Entrega</p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200">
                <div className="flex overflow-x-auto">
                  {[
                    { id: "descripcion", label: "Descripción" },
                    { id: "amenidades", label: "Amenidades" },
                    { id: "unidades", label: "Unidades" },
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

              {/* Tab Content */}
              <div className="p-6">
                {/* Descripción Tab */}
                {activeTab === "descripcion" && (
                  <div className="space-y-4">
                    <p className="text-base text-slate-700 leading-relaxed" style={{ fontWeight: 400 }}>
                      {development.description}
                    </p>
                    <p className="text-base text-slate-700 leading-relaxed" style={{ fontWeight: 400 }}>
                      Ubicado en una de las zonas más cotizadas de mayor plusvalía de Zapopan, a 3 minutos de
                      Andares. Ideal para profesionistas, estudiantes o inversionistas que buscan rentabilidad,
                      ubicación y calidad de vida en una zona en constante crecimiento.
                    </p>
                    
                    {/* Services */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontWeight: 600 }}>Servicios Disponibles</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {development.services.map((service, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-700" style={{ fontWeight: 400 }}>
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" strokeWidth={2} />
                            {service}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Features */}
                    {development.additionalFeatures.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontWeight: 600 }}>Características Adicionales</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {development.additionalFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-700" style={{ fontWeight: 400 }}>
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" strokeWidth={2} />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Amenidades Tab */}
                {activeTab === "amenidades" && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontWeight: 600 }}>
                      Amenidades para disfrutar cada día
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {development.amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900" style={{ fontWeight: 500 }}>
                              {amenity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unidades Tab: propiedades con development_tokko_id = tokko_id del desarrollo; si no hay, inventario manual (development_units) */}
                {activeTab === "unidades" && (
                  <div>
                    {linkedProperties.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                            Unidades disponibles
                          </h3>
                          <span className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                            {linkedProperties.length}{" "}
                            {linkedProperties.length === 1 ? "propiedad" : "propiedades"}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {linkedProperties.map((p) => (
                            <Link
                              key={p.id}
                              to={`/propiedades/${p.id}`}
                              className="group block rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
                            >
                              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h4
                                    className="text-base font-semibold text-slate-900 group-hover:text-brand-navy"
                                    style={{ fontWeight: 600 }}
                                  >
                                    {p.title}
                                  </h4>
                                  {p.location ? (
                                    <p className="mt-1 text-xs text-slate-500" style={{ fontWeight: 400 }}>
                                      {p.location}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                                    ${p.price.toLocaleString()} MXN
                                  </span>
                                  <ArrowRight
                                    className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-navy"
                                    strokeWidth={1.5}
                                    aria-hidden
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Bed className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                  <span style={{ fontWeight: 500 }}>{p.bedrooms} rec.</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Bath className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                  <span style={{ fontWeight: 500 }}>{p.bathrooms} baños</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Ruler className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                  <span style={{ fontWeight: 500 }}>{p.area} m²</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Home className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                  <span className="line-clamp-1" style={{ fontWeight: 500 }}>
                                    {p.type || "—"}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-3 text-xs font-medium text-primary" style={{ fontWeight: 600 }}>
                                Ver ficha completa
                              </p>
                            </Link>
                          ))}
                        </div>

                        <p
                          className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"
                          style={{ fontWeight: 400 }}
                        >
                          La información contenida es a título informativo y no constituye una oferta vinculante.
                          Consulte con nuestros asesores para obtener información actualizada.
                        </p>
                      </div>
                    ) : development.developmentUnits.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                            Unidades Disponibles
                          </h3>
                          <span className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                            {development.developmentUnits.length} unidades
                          </span>
                        </div>

                        <div className="space-y-3">
                          {development.developmentUnits.map((unit, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300"
                            >
                              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h4 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                                  {unit.type}
                                </h4>
                                <span className="text-xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                                  ${unit.price.toLocaleString()} MXN
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Bed className="h-4 w-4" strokeWidth={1.5} />
                                  <span style={{ fontWeight: 500 }}>{unit.bedrooms} rec.</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Ruler className="h-4 w-4" strokeWidth={1.5} />
                                  <span style={{ fontWeight: 500 }}>{unit.totalArea} m²</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Car className="h-4 w-4" strokeWidth={1.5} />
                                  <span style={{ fontWeight: 500 }}>{unit.parking ? "Sí" : "No"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Home className="h-4 w-4" strokeWidth={1.5} />
                                  <span style={{ fontWeight: 500 }}>{unit.spaces} esp.</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p
                          className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"
                          style={{ fontWeight: 400 }}
                        >
                          La información contenida es a título informativo y no constituye una oferta vinculante.
                          Consulte con nuestros asesores para obtener información actualizada.
                        </p>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <Building2 className="mx-auto mb-3 h-12 w-12 text-slate-300" strokeWidth={1.5} />
                        <p className="text-slate-600" style={{ fontWeight: 500 }}>
                          Aún no hay unidades publicadas para este desarrollo
                        </p>
                        <p className="mt-1 text-sm text-slate-500" style={{ fontWeight: 400 }}>
                          Contacta con nuestros asesores para más detalles
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Ubicación Tab */}
                {activeTab === "ubicacion" && (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontWeight: 600 }}>
                        Ubicación Estratégica
                      </h3>
                      <p className="text-sm text-slate-600 mb-3" style={{ fontWeight: 400 }}>
                        {development.fullAddress}, {development.colony}, Guadalajara, Jalisco
                      </p>
                    </div>
                    <style>{`
                      .custom-marker {
                        background: none;
                        border: none;
                      }
                    `}</style>
                    <div
                      ref={mapRef}
                      className="h-[400px] w-full rounded-lg overflow-hidden border border-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontWeight: 600 }}>
                  Solicita Información
                </h3>

                {submitted && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-sm text-green-900 font-semibold" style={{ fontWeight: 600 }}>
                      ¡Mensaje enviado!
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-sm"
                      placeholder="Nombre completo"
                      style={{ fontWeight: 400 }}
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-sm"
                      placeholder="Email"
                      style={{ fontWeight: 400 }}
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-sm"
                      placeholder="Teléfono"
                      style={{ fontWeight: 400 }}
                    />
                  </div>

                  <div>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all resize-none text-sm"
                      placeholder="Mensaje (opcional)"
                      style={{ fontWeight: 400 }}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#C8102E] text-white px-6 py-3 rounded-lg hover:bg-[#a00d25] hover:shadow-lg transition-all duration-300 font-medium flex items-center justify-center gap-2"
                    style={{ fontWeight: 600 }}
                  >
                    <Send className="w-4 h-4" strokeWidth={2} />
                    Enviar Consulta
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                  {telHref ? (
                    <a
                      href={telHref}
                      className="flex items-center gap-3 text-sm text-slate-700 hover:text-slate-900 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-700" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500" style={{ fontWeight: 400 }}>Llámanos</p>
                        <p className="font-medium text-brand-navy" style={{ fontWeight: 600 }}>
                          {chargePhone}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-slate-500" style={{ fontWeight: 500 }}>
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500" style={{ fontWeight: 400 }}>Llámanos</p>
                        <p className="font-medium text-slate-400" style={{ fontWeight: 600 }}>
                          Sin número registrado
                        </p>
                      </div>
                    </div>
                  )}

                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-700 hover:text-slate-900 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-green-700" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500" style={{ fontWeight: 400 }}>WhatsApp</p>
                        <p className="font-medium text-[#2e7d32]" style={{ fontWeight: 600 }}>Chatear ahora</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-slate-400" style={{ fontWeight: 500 }}>
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500" style={{ fontWeight: 400 }}>WhatsApp</p>
                        <p className="font-medium text-slate-400" style={{ fontWeight: 600 }}>
                          Añade un teléfono válido para chatear
                        </p>
                      </div>
                    </div>
                  )}

                  {mailHref ? (
                    <a
                      href={mailHref}
                      className="flex items-center gap-3 text-sm text-slate-700 transition-colors hover:text-slate-900"
                      style={{ fontWeight: 500 }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                        <Mail className="h-4 w-4 text-sky-800" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500" style={{ fontWeight: 400 }}>
                          Correo
                        </p>
                        <p className="break-all font-medium text-brand-navy" style={{ fontWeight: 600 }}>
                          {chargeEmail}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-slate-500" style={{ fontWeight: 500 }}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Mail className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500" style={{ fontWeight: 400 }}>
                          Correo
                        </p>
                        <p className="font-medium text-slate-400" style={{ fontWeight: 600 }}>
                          Sin correo registrado
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="bg-brand-navy text-white rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ letterSpacing: '0.05em', fontWeight: 600 }}>
                  Información Rápida
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400" style={{ fontWeight: 400 }}>Referencia:</span>
                    <span className="font-medium" style={{ fontWeight: 600 }}>VR666649</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400" style={{ fontWeight: 400 }}>Tipo:</span>
                    <span className="font-medium" style={{ fontWeight: 600 }}>{development.type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400" style={{ fontWeight: 400 }}>Estado:</span>
                    <span className="font-medium" style={{ fontWeight: 600 }}>{development.status}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400" style={{ fontWeight: 400 }}>Unidades:</span>
                    <span className="font-medium" style={{ fontWeight: 600 }}>{unitsTabCount}</span>
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
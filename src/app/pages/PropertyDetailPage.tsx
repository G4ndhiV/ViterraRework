import { useParams, Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { mockProperties } from "../data/properties";
import { Bed, Bath, Square, MapPin, Calendar, Share2, Heart, ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function PropertyDetailPage() {
  const { id } = useParams();
  const property = mockProperties.find((p) => p.id === id);
  const [isFavorite, setIsFavorite] = useState(false);

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

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white" >
      <Header />

      {/* Back Button */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <Link
            to={property.status === "venta" ? "/venta" : "/renta"}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            Volver a Propiedades
          </Link>
        </div>
      </div>

      {/* Property Details */}
      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg overflow-hidden border border-slate-200 mb-12">
            <div className="relative h-[500px]">
              <ImageWithFallback
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 flex gap-2">
                <span
                  className={`px-4 py-2 rounded-lg font-semibold backdrop-blur-sm border ${
                    property.status === "venta"
                      ? "bg-primary/95 text-white border-primary/40"
                      : "bg-brand-navy/90 text-white border-brand-navy/50"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {property.status === "venta" ? "En Venta" : "En Alquiler"}
                </span>
                <span className="px-4 py-2 rounded-lg font-semibold bg-white/90 text-brand-navy backdrop-blur-sm border border-slate-200" style={{ fontWeight: 600 }}>
                  {property.type}
                </span>
              </div>
              <div className="absolute top-6 right-6 flex gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all border border-slate-200"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isFavorite ? "fill-brand-navy text-brand-navy" : "text-slate-600"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
                <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all border border-slate-200">
                  <Share2 className="w-6 h-6 text-slate-600" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-slate-200 p-8 mb-8">
                <h1 className="text-3xl font-semibold text-slate-900 mb-4 tracking-tight" style={{ fontWeight: 700 }}>
                  {property.title}
                </h1>
                
                <div className="flex items-center gap-2 text-slate-600 mb-8">
                  <MapPin className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-lg font-medium" style={{ fontWeight: 500 }}>{property.location}</span>
                </div>

                <div className="flex flex-wrap items-center gap-8 mb-8 pb-8 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Bed className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>{property.bedrooms}</p>
                      <p className="text-sm text-slate-600 font-medium" style={{ fontWeight: 500 }}>Habitaciones</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Bath className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>{property.bathrooms}</p>
                      <p className="text-sm text-slate-600 font-medium" style={{ fontWeight: 500 }}>Baños</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Square className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>{property.area}</p>
                      <p className="text-sm text-slate-600 font-medium" style={{ fontWeight: 500 }}>m²</p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight" style={{ fontWeight: 600 }}>Descripción</h2>
                  <p className="text-slate-600 leading-relaxed mb-4" style={{ fontWeight: 400 }}>
                    Esta hermosa propiedad ofrece un estilo de vida excepcional con acabados de
                    primera calidad y una ubicación privilegiada. Diseñada para el confort y la
                    elegancia, cuenta con amplios espacios y luz natural en todas sus habitaciones.
                  </p>
                  <p className="text-slate-600 leading-relaxed" style={{ fontWeight: 400 }}>
                    Perfecta para familias que buscan tranquilidad sin renunciar a la cercanía de
                    servicios, comercios y vías de acceso principales. Una oportunidad única de
                    inversión en una de las zonas más demandadas de la ciudad.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6 tracking-tight" style={{ fontWeight: 600 }}>
                    Características Principales
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "Cocina equipada",
                      "Aire acondicionado",
                      "Calefacción central",
                      "Armarios empotrados",
                      "Estacionamiento",
                      "Seguridad 24/7",
                      "Área de lavandería",
                      "Balcón/Terraza",
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-slate-700 flex-shrink-0" strokeWidth={1.5} />
                        <span className="text-slate-700 font-medium" style={{ fontWeight: 500 }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Price Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-8 sticky top-24">
                <div className="mb-8">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>
                    Precio
                  </p>
                  <p className="text-4xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                    ${property.price.toLocaleString()}
                  </p>
                  {property.status === "alquiler" && (
                    <p className="text-sm text-slate-500 font-medium mt-1" style={{ fontWeight: 500 }}>por mes</p>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  <Link
                    to="/contacto"
                    className="block text-center w-full bg-[#C8102E] text-white px-6 py-3.5 rounded-lg hover:bg-[#a00d25] transition-all font-medium"
                    style={{ fontWeight: 600 }}
                  >
                    Agendar Visita
                  </Link>
                  <Link
                    to="/contacto"
                    className="block text-center w-full border-2 border-slate-900 text-slate-900 px-6 py-3.5 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    style={{ fontWeight: 600 }}
                  >
                    Contactar Asesor
                  </Link>
                </div>

                <div className="pt-8 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 tracking-tight" style={{ fontWeight: 600 }}>
                    Información Adicional
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium" style={{ fontWeight: 500 }}>ID Propiedad:</span>
                      <span className="font-semibold text-slate-900" style={{ fontWeight: 600 }}>VT-{property.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium" style={{ fontWeight: 500 }}>Tipo:</span>
                      <span className="font-semibold text-slate-900" style={{ fontWeight: 600 }}>{property.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium" style={{ fontWeight: 500 }}>Publicado:</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        <span className="font-semibold text-slate-900" style={{ fontWeight: 600 }}>Hace 2 días</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

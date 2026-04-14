import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArrowRight, MapPin, Calendar, Building2, Users, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { developments } from "../data/developments";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { PreviewSectionChrome } from "../components/admin/siteEditor/PreviewSectionChrome";
import { cn } from "../components/ui/utils";

export function DevelopmentsPage() {
  const pl = usePreviewLayout();
  const { content } = useSiteContent();
  const page = content.developments;
  const featuredDevelopments = developments.filter((x) => x.featured);
  const otherDevelopments = developments.filter((x) => !x.featured);

  const getStatusColor = (status: string) => {
    const colors = {
      "En Construcción": "bg-amber-50 text-amber-700 border border-amber-200",
      "Pre-venta": "bg-blue-50 text-blue-700 border border-blue-200",
      "Disponible": "bg-green-50 text-green-700 border border-green-200",
      "Próximamente": "bg-slate-100 text-slate-700 border border-slate-200"
    };
    return colors[status as keyof typeof colors] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white" >
      <Header />

      {/* Hero Section */}
      <PreviewSectionChrome blockId="dev-hero" label="Cabecera">
      <section className="relative min-h-[68vh] md:min-h-[76vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={page.heroImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/75 to-slate-900/60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="font-semibold text-white mb-6 tracking-tight text-5xl md:text-6xl" style={{ fontWeight: 700 }}>
            {page.heroTitle}
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl" style={{ fontWeight: 400 }}>
            {page.heroSubtitle}
          </p>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Featured Developments */}
      {featuredDevelopments.length > 0 && (
        <PreviewSectionChrome blockId="dev-featured" label="Proyectos destacados (títulos)">
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="mb-12">
              <p className="mb-3 text-sm uppercase tracking-wide text-slate-500" style={{ letterSpacing: "0.1em", fontWeight: 500 }}>
                {page.featuredKicker}
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
                {page.featuredTitle}
              </h2>
            </div>

            <div className="space-y-12">
              {featuredDevelopments.map((dev, index) => (
                <div
                  key={dev.id}
                  className={cn("grid gap-12 items-center", pl.gridCols("grid-cols-1 lg:grid-cols-2"))}
                >
                  <div className={cn(index % 2 === 1 && !pl.preview && "lg:order-2")}>
                    <div className="relative h-[500px] rounded-lg overflow-hidden group">
                      <img
                        src={dev.image}
                        alt={dev.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-6 left-6">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm ${getStatusColor(dev.status)}`} style={{ fontWeight: 600 }}>
                          {dev.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={cn(index % 2 === 1 && !pl.preview && "lg:order-1")}>
                    <div className="flex items-center gap-2 text-slate-600 mb-4">
                      <MapPin className="w-4 h-4" strokeWidth={1.5} />
                      <span className="text-sm font-medium" style={{ fontWeight: 500 }}>{dev.location}</span>
                    </div>

                    <h3 className="text-3xl font-semibold text-slate-900 mb-4 tracking-tight" style={{ fontWeight: 600 }}>
                      {dev.name}
                    </h3>

                    <p className="text-lg text-slate-600 mb-6 leading-relaxed" style={{ fontWeight: 400 }}>
                      {dev.description}
                    </p>

                    <div className={cn("grid gap-4 mb-6 p-6 bg-slate-50 rounded-lg border border-slate-200", pl.gridCols("grid-cols-2"))}>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Unidades</p>
                        <p className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{dev.units}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Entrega</p>
                        <p className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{dev.deliveryDate}</p>
                      </div>
                      <div className={pl.colSpan("col-span-2")}>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Rango de Precios</p>
                        <p className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>{dev.priceRange}</p>
                      </div>
                    </div>

                    <div className="mb-8">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-4" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Amenidades</p>
                      <div className={cn("grid gap-3", pl.gridCols("grid-cols-2"))}>
                        {dev.amenities.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-slate-700 flex-shrink-0" strokeWidth={1.5} />
                            <span className="text-sm text-slate-700" style={{ fontWeight: 500 }}>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={`/desarrollos/${dev.id}`}
                      className="inline-flex items-center gap-2 bg-[#C8102E] text-white px-6 py-3 rounded-lg hover:bg-[#a00d25] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium"
                      style={{ fontWeight: 600 }}
                    >
                      Ver Detalles Completos
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </PreviewSectionChrome>
      )}

      {/* Other Developments Grid */}
      {otherDevelopments.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-sm text-slate-500 uppercase tracking-wide mb-3" style={{ letterSpacing: '0.1em', fontWeight: 500 }}>Más Proyectos</p>
              <h2 className="text-4xl font-semibold text-slate-900 tracking-tight" style={{ fontWeight: 600 }}>
                Otros Desarrollos
              </h2>
            </div>

            <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2"))}>
              {otherDevelopments.map((dev) => (
                <div key={dev.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all group">
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={dev.image}
                      alt={dev.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-6 left-6">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm ${getStatusColor(dev.status)}`} style={{ fontWeight: 600 }}>
                        {dev.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-center gap-2 text-slate-600 mb-3">
                      <MapPin className="w-4 h-4" strokeWidth={1.5} />
                      <span className="text-sm font-medium" style={{ fontWeight: 500 }}>{dev.location}</span>
                    </div>

                    <h3 className="text-2xl font-semibold text-slate-900 mb-3 tracking-tight" style={{ fontWeight: 600 }}>
                      {dev.name}
                    </h3>

                    <p className="text-sm text-slate-600 mb-6 leading-relaxed" style={{ fontWeight: 400 }}>
                      {dev.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Unidades</p>
                        <p className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>{dev.units}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Entrega</p>
                        <p className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>{dev.deliveryDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Desde</p>
                        <p className="text-lg font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                          {dev.priceRange.split(' - ')[0]}
                        </p>
                      </div>
                      <Link
                        to={`/desarrollos/${dev.id}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-900 hover:text-slate-700 transition-colors font-medium"
                        style={{ fontWeight: 600 }}
                      >
                        Ver Detalles
                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-brand-navy">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
            <span className="text-sm text-white font-medium tracking-wide" style={{ fontWeight: 500 }}>Invierte en Tu Futuro</span>
          </div>

          <h2 className="font-heading text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
            ¿Listo para invertir?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed" style={{ fontWeight: 400 }}>
            Agenda una cita con nuestros expertos y descubre las oportunidades de inversión 
            en nuestros desarrollos exclusivos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-navy px-8 py-4 rounded-lg hover:bg-brand-canvas transition-all font-medium"
              style={{ fontWeight: 600 }}
            >
              Agendar Cita
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
            <a
              href="tel:+1234567890"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-lg border border-white/30 hover:bg-white/10 transition-all font-medium"
              style={{ fontWeight: 600 }}
            >
              Llamar Ahora
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
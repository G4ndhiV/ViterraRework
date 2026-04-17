import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArrowRight, MapPin, CheckCircle, Sparkles, ChevronsDown } from "lucide-react";
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
      "En Construcción": "bg-brand-gold/15 text-brand-navy border border-brand-gold/35",
      "Pre-venta": "bg-brand-navy/10 text-brand-navy border border-brand-navy/25",
      "Disponible": "bg-primary/10 text-primary border border-primary/30",
      "Próximamente": "bg-brand-canvas text-brand-navy/80 border border-brand-navy/15"
    };
    return colors[status as keyof typeof colors] || "bg-brand-canvas text-brand-navy/80 border border-brand-navy/15";
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white" >
      <Header />

      {/* Hero Section */}
      <PreviewSectionChrome blockId="dev-hero" label="Cabecera">
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-brand-navy pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+5.25rem)] sm:pb-16 sm:pt-[calc(env(safe-area-inset-top,0px)+6.5rem)] md:pb-24 md:pt-52">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.adsttc.com/media/images/5ef2/f7ce/b357/6589/8c00/019a/large_jpg/847A0737.jpg?1592981436"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/78 via-black/48 to-black/60"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
          <p className="font-heading text-[11px] font-normal uppercase tracking-[0.28em] text-white/75 md:text-xs not-italic">
            Viterra · Desarrollos
          </p>
          <span className="mx-auto mt-3 block h-px w-12 bg-primary" aria-hidden />
          <div className="mt-5 flex justify-center text-primary" aria-hidden>
            <ChevronsDown className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading mt-5 text-3xl font-light tracking-[-0.02em] text-white sm:mt-6 sm:text-5xl md:text-6xl">
            {page.heroTitle}
          </h1>

          <p className="font-heading mx-auto mt-4 max-w-2xl text-base font-light leading-relaxed text-white/90 not-italic sm:text-lg md:text-xl">
            {page.heroSubtitle}
          </p>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Featured Developments */}
      {featuredDevelopments.length > 0 && (
        <PreviewSectionChrome blockId="dev-featured" label="Proyectos destacados (títulos)">
        <section className="bg-white py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <p className="font-heading mb-2 text-xs uppercase tracking-[0.1em] text-brand-navy/65 sm:mb-3 sm:text-sm">
                {page.featuredKicker}
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-navy sm:text-3xl md:text-4xl">
                {page.featuredTitle}
              </h2>
            </div>

            <div className="space-y-10 md:space-y-12">
              {featuredDevelopments.map((dev, index) => (
                <div
                  key={dev.id}
                  className={cn("grid items-center gap-8 md:gap-12", pl.gridCols("grid-cols-1 lg:grid-cols-2"))}
                >
                  <div className={cn(index % 2 === 1 && !pl.preview && "lg:order-2")}>
                    <Link
                      to={`/desarrollos/${dev.id}`}
                      className="relative block h-[500px] overflow-hidden rounded-lg group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      aria-label={`Ver desarrollo: ${dev.name}`}
                    >
                      <img
                        src={dev.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
                        <span className={`font-heading rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${getStatusColor(dev.status)}`}>
                          {dev.status}
                        </span>
                      </div>
                    </Link>
                  </div>

                  <div className={cn(index % 2 === 1 && !pl.preview && "lg:order-1")}>
                    <div className="mb-3 flex items-center gap-2 text-brand-navy/70 sm:mb-4">
                      <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      <span className="font-heading text-sm font-medium">{dev.location}</span>
                    </div>

                    <h3 className="font-heading mb-3 text-2xl font-semibold tracking-tight text-brand-navy sm:mb-4 sm:text-3xl">
                      {dev.name}
                    </h3>

                    <p className="font-heading mb-5 text-base font-normal leading-relaxed text-brand-navy/70 not-italic sm:mb-6 sm:text-lg">
                      {dev.description}
                    </p>

                    <div className={cn("mb-6 grid gap-4 rounded-lg border border-brand-navy/10 bg-brand-canvas p-4 sm:p-6", pl.gridCols("grid-cols-1 sm:grid-cols-2"))}>
                      <div>
                        <p className="font-heading text-xs text-brand-navy/60 uppercase tracking-[0.05em] mb-1">Unidades</p>
                        <p className="font-heading text-lg font-semibold text-brand-navy">{dev.units}</p>
                      </div>
                      <div>
                        <p className="font-heading text-xs text-brand-navy/60 uppercase tracking-[0.05em] mb-1">Entrega</p>
                        <p className="font-heading text-lg font-semibold text-brand-navy">{dev.deliveryDate}</p>
                      </div>
                      <div className={pl.colSpan("col-span-2")}>
                        <p className="font-heading text-xs text-brand-navy/60 uppercase tracking-[0.05em] mb-1">Rango de Precios</p>
                        <p className="font-heading text-lg font-semibold text-brand-navy">{dev.priceRange}</p>
                      </div>
                    </div>

                    <div className="mb-6 sm:mb-8">
                      <p className="font-heading mb-3 text-xs uppercase tracking-[0.05em] text-brand-navy/60 sm:mb-4">Amenidades</p>
                      <div className={cn("grid gap-3", pl.gridCols("grid-cols-1 sm:grid-cols-2"))}>
                        {dev.amenities.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.5} />
                            <span className="font-heading text-sm text-brand-navy/85 font-medium">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={`/desarrollos/${dev.id}`}
                      className="font-heading inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-red-hover hover:shadow-lg sm:w-auto"
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
        <section className="bg-brand-canvas py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <p className="font-heading mb-2 text-xs uppercase tracking-[0.1em] text-brand-navy/60 sm:mb-3 sm:text-sm">Más Proyectos</p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-navy sm:text-3xl md:text-4xl">
                Otros Desarrollos
              </h2>
            </div>

            <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2"))}>
              {otherDevelopments.map((dev) => (
                <div key={dev.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all group">
                  <Link
                    to={`/desarrollos/${dev.id}`}
                    className="relative block h-72 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`Ver desarrollo: ${dev.name}`}
                  >
                    <img
                      src={dev.image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-6 left-6">
                      <span className={`font-heading px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm ${getStatusColor(dev.status)}`}>
                        {dev.status}
                      </span>
                    </div>
                  </Link>

                  <div className="p-5 sm:p-6 md:p-8">
                    <div className="mb-2 flex items-center gap-2 text-brand-navy/70 sm:mb-3">
                      <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      <span className="font-heading text-sm font-medium">{dev.location}</span>
                    </div>

                    <h3 className="font-heading mb-2 text-xl font-semibold tracking-tight text-brand-navy sm:mb-3 sm:text-2xl">
                      {dev.name}
                    </h3>

                    <p className="font-heading mb-5 text-sm font-normal leading-relaxed text-brand-navy/70 not-italic sm:mb-6">
                      {dev.description}
                    </p>

                    <div className="mb-5 grid grid-cols-2 gap-3 border-b border-brand-navy/10 pb-5 sm:mb-6 sm:gap-4 sm:pb-6">
                      <div>
                        <p className="font-heading text-xs text-brand-navy/60 uppercase tracking-[0.05em] mb-1">Unidades</p>
                        <p className="font-heading text-base font-semibold text-brand-navy">{dev.units}</p>
                      </div>
                      <div>
                        <p className="font-heading text-xs text-brand-navy/60 uppercase tracking-[0.05em] mb-1">Entrega</p>
                        <p className="font-heading text-base font-semibold text-brand-navy">{dev.deliveryDate}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-heading mb-1 text-xs uppercase tracking-[0.05em] text-brand-navy/60">Desde</p>
                        <p className="font-heading text-lg font-semibold text-brand-navy">
                          {dev.priceRange.split(' - ')[0]}
                        </p>
                      </div>
                      <Link
                        to={`/desarrollos/${dev.id}`}
                        className="font-heading inline-flex items-center justify-center gap-2 text-sm font-medium text-brand-navy transition-colors hover:text-brand-burgundy sm:justify-end"
                      >
                        Ver Detalles
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
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
      <section className="bg-brand-navy py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm sm:mb-8 sm:px-4">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
            <span className="font-heading text-sm text-white font-medium tracking-wide">Invierte en Tu Futuro</span>
          </div>

          <h2 className="font-heading mb-4 text-2xl font-semibold tracking-tight text-white sm:mb-6 sm:text-4xl md:text-5xl">
            ¿Listo para invertir?
          </h2>
          <p className="font-heading mx-auto mb-8 max-w-2xl text-base font-normal leading-relaxed text-white/80 not-italic sm:mb-10 sm:text-lg">
            Agenda una cita con nuestros expertos y descubre las oportunidades de inversión 
            en nuestros desarrollos exclusivos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contacto"
              className="font-heading inline-flex items-center justify-center gap-2 bg-white text-brand-navy px-8 py-4 rounded-lg hover:bg-brand-canvas transition-all font-medium"
            >
              Agendar Cita
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
            <a
              href="tel:+1234567890"
              className="font-heading inline-flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-lg border border-white/30 hover:bg-white/10 transition-all font-medium"
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
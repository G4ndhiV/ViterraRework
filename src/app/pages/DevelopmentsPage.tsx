import { motion, useReducedMotion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArrowRight, MapPin, CheckCircle } from "lucide-react";
import { Link } from "react-router";
import { developments } from "../data/developments";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { PreviewSectionChrome } from "../components/admin/siteEditor/PreviewSectionChrome";
import { Reveal } from "../components/Reveal";
import { ViterraHeroTopClusterAnimated } from "../components/ViterraHeroTopClusterAnimated";
import { cn } from "../components/ui/utils";
import {
  viterraHeroSectionClass,
  viterraHeroCenteredStackClass,
  viterraHeroCenteredInnerClass,
  viterraHeroMainClass,
  viterraHeroTitleClass,
  viterraHeroSubtitleClass,
} from "../config/heroLayout";

export function DevelopmentsPage() {
  const reduceMotion = useReducedMotion();
  const pl = usePreviewLayout();
  const { content } = useSiteContent();
  const page = content.developments;
  const featuredDevelopments = developments.filter((x) => x.featured);
  const otherDevelopments = developments.filter((x) => !x.featured);

  /** Etiqueta sobre imagen: blanco sólido + texto negro (legible en cualquier foto). */
  const statusBadgeClass =
    "border border-black/15 bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]";

  const heroContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.06,
      },
    },
  } as const;

  const heroItemVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] as const },
    },
  } as const;

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white" >
      <Header />

      {/* Hero Section */}
      <PreviewSectionChrome blockId="dev-hero" label="Cabecera">
      <section className={viterraHeroSectionClass}>
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            src="https://images.adsttc.com/media/images/5ef2/f7ce/b357/6589/8c00/019a/large_jpg/847A0737.jpg?1592981436"
            alt=""
            className="h-full w-full object-cover"
            initial={false}
            animate={
              reduceMotion
                ? { scale: 1.05 }
                : { scale: [1.05, 1.07, 1.05] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 22, repeat: Infinity, ease: "easeInOut" }
            }
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/78 via-black/48 to-black/60" />
        </div>

        <div className={viterraHeroCenteredStackClass}>
          <motion.div
            className={viterraHeroCenteredInnerClass}
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <ViterraHeroTopClusterAnimated
              kicker="Viterra · Desarrollos"
              itemVariants={heroItemVariants}
              reduceMotion={!!reduceMotion}
            />
            <motion.div variants={heroItemVariants} className={viterraHeroMainClass}>
              <h1 className={viterraHeroTitleClass}>{page.heroTitle}</h1>
            </motion.div>
            <motion.p variants={heroItemVariants} className={viterraHeroSubtitleClass}>
              {page.heroSubtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Featured Developments */}
      {featuredDevelopments.length > 0 && (
        <PreviewSectionChrome blockId="dev-featured" label="Proyectos destacados (títulos)">
        <section className="bg-white py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-8 sm:mb-12" y={20}>
              <div>
                <p className="font-heading mb-2 text-xs uppercase tracking-[0.1em] text-brand-navy/65 sm:mb-3 sm:text-sm">
                  {page.featuredKicker}
                </p>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-navy sm:text-3xl md:text-4xl">
                  {page.featuredTitle}
                </h2>
              </div>
            </Reveal>

            <div className="space-y-10 md:space-y-12">
              {featuredDevelopments.map((dev, index) => (
                <Reveal
                  key={dev.id}
                  delay={Math.min(index * 0.08, 0.35)}
                  y={28}
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
                        <span className={`font-heading rounded-lg px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`}>
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

                    <motion.div
                      className="sm:inline-block sm:w-auto w-full"
                      whileHover={reduceMotion ? undefined : { y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    >
                      <Link
                        to={`/desarrollos/${dev.id}`}
                        className="font-heading inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-brand-red-hover hover:shadow-lg sm:w-auto"
                      >
                        Ver Detalles Completos
                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                      </Link>
                    </motion.div>
                  </div>
                </Reveal>
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
            <Reveal className="mb-8 sm:mb-12" y={20}>
              <div>
                <p className="font-heading mb-2 text-xs uppercase tracking-[0.1em] text-brand-navy/60 sm:mb-3 sm:text-sm">Más Proyectos</p>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-navy sm:text-3xl md:text-4xl">
                  Otros Desarrollos
                </h2>
              </div>
            </Reveal>

            <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2"))}>
              {otherDevelopments.map((dev, index) => (
                <Reveal key={dev.id} delay={Math.min(index * 0.07, 0.35)} y={24}>
                  <div className="group overflow-hidden rounded-lg border border-brand-navy/10 bg-white transition-all hover:border-brand-navy/25">
                    <Link
                      to={`/desarrollos/${dev.id}`}
                      className="relative block h-52 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-64 md:h-72"
                      aria-label={`Ver desarrollo: ${dev.name}`}
                    >
                      <img
                        src={dev.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute left-6 top-6">
                        <span className={`font-heading rounded-lg px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`}>
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
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="border-t border-brand-navy/10 bg-gradient-to-b from-[#f5f3ef] via-white to-brand-canvas py-12 sm:py-16 md:py-24">
        <Reveal className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8" y={26}>
          <div>
            <h2 className="font-heading mb-4 text-2xl font-semibold tracking-tight text-brand-navy sm:mb-6 sm:text-4xl md:text-5xl">
              Contáctanos
            </h2>
            <p className="font-heading mx-auto mb-8 max-w-2xl text-base font-normal leading-relaxed text-brand-navy/70 not-italic sm:mb-10 sm:text-lg">
              Agenda una visita o escríbenos: con gusto te orientamos sobre disponibilidad, precios y opciones en
              nuestros desarrollos exclusivos.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <motion.div whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
                <Link
                  to="/contacto"
                  className="font-heading inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-medium text-white transition-all hover:bg-brand-red-hover"
                >
                  Agendar cita
                  <ArrowRight className="h-5 w-5" strokeWidth={2} />
                </Link>
              </motion.div>
              <motion.div whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
                <a
                  href="tel:+1234567890"
                  className="font-heading inline-flex items-center justify-center gap-2 rounded-lg border border-brand-navy/25 bg-white px-8 py-4 font-medium text-brand-navy transition-all hover:border-brand-navy/40 hover:bg-brand-navy/[0.04]"
                >
                  Llamar ahora
                </a>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
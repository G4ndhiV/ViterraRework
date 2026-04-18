import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PropertyCard } from "../components/PropertyCard";
import { SearchBar, SearchFilters } from "../components/SearchBar";
import { mockProperties } from "../data/properties";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { PreviewSectionChrome } from "../components/admin/siteEditor/PreviewSectionChrome";
import { Reveal } from "../components/Reveal";
import { cn } from "../components/ui/utils";

function SectionKicker({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "text-[10px] uppercase tracking-[0.32em] font-normal",
          tone === "light" ? "text-white/70" : "text-brand-navy/55"
        )}
      >
        {children}
      </p>
      <span className="mt-4 mx-auto block h-px w-10 bg-primary" aria-hidden />
    </div>
  );
}

export function HomePage() {
  const pl = usePreviewLayout();
  const reduceMotion = useReducedMotion();
  const { content } = useSiteContent();
  const h = content.home;
  const featuredProperties = mockProperties.slice(0, 6);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const goPrev = () => {
    setCarouselIndex((prev) => (prev - 1 + featuredProperties.length) % featuredProperties.length);
  };

  const goNext = () => {
    setCarouselIndex((prev) => (prev + 1) % featuredProperties.length);
  };

  const handleSearch = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.query) params.append("query", filters.query);
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    const status = filters.status === "venta" ? "venta" : "renta";
    window.location.href = `/${status}?${params.toString()}`;
  };

  const scrollToSearch = () => {
    document.getElementById("busqueda")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    <div className="viterra-page min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero portada: layout propio (no compartido con el resto de páginas). */}
      <PreviewSectionChrome blockId="home-hero" label="Portada principal">
      <section className="viterra-reveal-off scroll-fade-exit-white relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+5.25rem)] sm:pb-16 sm:pt-[calc(env(safe-area-inset-top,0px)+6.5rem)] md:pb-24 md:pt-52">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            src={h.heroImage}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 md:space-y-10"
          >
            <motion.p
              variants={heroItemVariants}
              className="text-[11px] font-normal uppercase tracking-[0.35em] text-white/70 md:text-xs"
            >
              {h.heroKicker}
            </motion.p>

            <motion.h1
              variants={heroItemVariants}
              className="px-2 text-[2.35rem] font-light leading-[1.05] tracking-tight text-white not-italic sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              style={{ fontFamily: "var(--font-hero-display)", fontWeight: 300 }}
            >
              {h.heroTitle}
            </motion.h1>

            <motion.p variants={heroItemVariants} className="mx-auto max-w-xl text-lg font-light leading-relaxed text-white/88 md:text-xl">
              {h.heroSubtitle}
            </motion.p>

            <motion.div
              variants={heroItemVariants}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.28em] text-white/65 md:text-xs"
            >
              <Link to="/desarrollos" className="py-1 font-normal transition-colors hover:text-white">
                {h.heroLinkDevLabel}
              </Link>
              <span className="hidden text-white/30 sm:inline">|</span>
              <Link to="/nosotros" className="py-1 font-normal transition-colors hover:text-white">
                {h.heroLinkAboutLabel}
              </Link>
            </motion.div>

            <motion.div
              variants={heroItemVariants}
              className="flex flex-col items-center justify-center gap-5 pt-2 sm:flex-row sm:gap-8"
            >
              <motion.button
                type="button"
                onClick={scrollToSearch}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="w-full min-w-[240px] border border-white px-10 py-4 text-xs font-normal uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:bg-white hover:text-brand-navy sm:w-auto"
              >
                {h.heroCtaPrimary}
              </motion.button>
              <Link
                to="/venta"
                className="group inline-flex items-center gap-2 border-b border-white/40 pb-0.5 text-sm font-light tracking-wide text-white transition-colors hover:border-white"
              >
                {h.heroCtaSecondary}
                <ArrowRight className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Búsqueda — mismo lenguaje visual que el hero: imagen + velo para legibilidad */}
      <PreviewSectionChrome blockId="home-search" label="Búsqueda">
      <section
        id="busqueda"
        className="scroll-fade-exit-white relative scroll-mt-8 min-h-[72vh] md:min-h-[78vh] flex flex-col justify-center py-20 md:py-28 overflow-hidden border-b border-brand-navy/20"
      >
        {/* Entre hero y búsqueda: cristal oscuro en lugar de línea blanca */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-[3px] bg-black/45 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.07] shadow-[0_6px_24px_-4px_rgba(0,0,0,0.55)]"
        />
        <div className="absolute inset-0 z-0">
          <img
            src={h.searchImage}
            alt=""
            className="w-full h-full object-cover scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/88 via-black/55 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12 md:mb-14" y={28}>
            <div>
              <SectionKicker tone="light">{h.searchKicker}</SectionKicker>
              <h2 className="font-heading font-light text-3xl md:text-4xl lg:text-[2.35rem] text-white tracking-tight text-center mt-8 leading-tight drop-shadow-sm">
                {h.searchTitle}
              </h2>
              <p className="font-heading text-center text-base md:text-lg not-italic text-white/80 mt-4 max-w-xl mx-auto leading-relaxed font-light">
                {h.searchSubtitle}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12} y={20}>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0.92, y: 8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <SearchBar
                onSearch={handleSearch}
                variant="premium"
                className="border border-white/20 bg-white/98 backdrop-blur-sm p-6 md:p-9 shadow-[0_24px_64px_-18px_rgba(0,0,0,0.55)]"
              />
            </motion.div>
          </Reveal>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Selección — fondo blanco (sin imagen de fondo) */}
      <PreviewSectionChrome blockId="home-selection" label="Selección de propiedades">
      <section className="relative scroll-fade-exit-white bg-white py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal
            className={cn(
              "mb-14 flex gap-8 border-b border-brand-navy/10 pb-10 sm:gap-10 md:mb-16 md:pb-12",
              pl.preview ? "flex-col" : "flex-col lg:flex-row lg:items-end lg:justify-between"
            )}
            y={24}
          >
            <div className="lg:max-w-[65%]">
              <p className="mb-4 text-[10px] font-normal uppercase tracking-[0.32em] text-brand-navy/55">{h.selectionKicker}</p>
              <span className="mb-6 block h-px w-10 bg-primary" aria-hidden />
              <h2 className="font-heading text-3xl font-light leading-[1.12] tracking-tight text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                {h.selectionTitle}
              </h2>
              <p className="mt-5 max-w-xl text-[15px] font-light leading-relaxed text-brand-navy/70 md:text-base">
                {h.selectionSubtitle}
              </p>
            </div>
            <Link
              to="/venta"
              className="inline-flex shrink-0 items-center gap-2 self-start border-b border-brand-navy/35 pb-1 text-[11px] uppercase tracking-[0.22em] text-brand-navy transition-colors hover:border-primary hover:text-primary lg:self-auto"
            >
              {h.selectionCatalogLink}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <div className="mx-auto max-w-5xl">
            <motion.div
              key={featuredProperties[carouselIndex].id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <PropertyCard property={featuredProperties[carouselIndex]} variant="editorial" />
            </motion.div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <motion.button
                type="button"
                onClick={goPrev}
                whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-navy/20 text-brand-navy transition-colors hover:border-primary hover:text-primary"
                aria-label="Propiedad anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>

              <div className="flex items-center gap-2">
                {featuredProperties.map((property, index) => (
                  <motion.button
                    key={property.id}
                    type="button"
                    onClick={() => setCarouselIndex(index)}
                    whileHover={reduceMotion ? undefined : { scale: 1.15 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                    className={cn(
                      "h-1.5 rounded-full transition-[width,background-color] duration-300",
                      index === carouselIndex ? "w-8 bg-primary" : "w-3 bg-brand-navy/25 hover:bg-brand-navy/45"
                    )}
                    aria-label={`Ir a propiedad ${index + 1}`}
                  />
                ))}
              </div>

              <motion.button
                type="button"
                onClick={goNext}
                whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-navy/20 text-brand-navy transition-colors hover:border-primary hover:text-primary"
                aria-label="Siguiente propiedad"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          <Reveal className="mt-20 flex flex-col items-center justify-center gap-8 border-t border-brand-navy/10 pt-12 text-sm sm:flex-row" y={18} delay={0.06}>
            <Link
              to="/renta"
              className="inline-flex items-center gap-2 border-b border-brand-navy/25 pb-1 text-[11px] uppercase tracking-[0.16em] text-brand-navy/85 transition-colors hover:border-primary hover:text-primary"
            >
              {h.selectionRentLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="hidden h-4 w-px bg-brand-navy/15 sm:inline" aria-hidden />
            <Link
              to="/venta"
              className="inline-flex items-center gap-2 border-b border-brand-navy/25 pb-1 text-[11px] uppercase tracking-[0.16em] text-brand-navy/85 transition-colors hover:border-primary hover:text-primary"
            >
              {h.selectionSaleLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Experiencia — navy marca + imagen */}
      <PreviewSectionChrome blockId="home-experience" label="Experiencia">
      <section className={cn("grid min-h-[420px] lg:min-h-[540px]", pl.gridCols("grid-cols-1 lg:grid-cols-2"))}>
        <motion.div
          className={cn(
            "relative min-h-[300px] overflow-hidden lg:min-h-0",
            pl.preview ? "order-2" : "order-2 lg:order-1"
          )}
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={h.experienceImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={reduceMotion ? false : { scale: 1.1 }}
            whileInView={reduceMotion ? undefined : { scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
        <div
          className={cn(
            "order-1 flex flex-col justify-center bg-brand-navy px-5 py-14 text-white sm:px-8 md:py-16 lg:px-16 lg:py-24",
            pl.preview ? "" : "lg:order-2"
          )}
        >
          <Reveal y={22} delay={0.04}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/45 font-normal mb-5">{h.experienceKicker}</p>
              <span className="block h-px w-10 bg-primary mb-8" aria-hidden />
              <h3 className="font-heading font-light text-3xl md:text-4xl lg:text-[2.65rem] tracking-tight leading-[1.15] mb-6">
                {h.experienceTitle}
              </h3>
              <p className="font-heading text-lg md:text-xl not-italic text-white/70 leading-relaxed max-w-md mb-4 font-light">
                {h.experienceLead}
              </p>
              <p className="text-white/78 font-light leading-relaxed max-w-md mb-10 text-[15px]">
                {h.experienceBody}
              </p>
              <motion.div whileHover={reduceMotion ? undefined : { x: 3 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
                <Link
                  to="/nosotros"
                  className="inline-flex items-center gap-2 self-start uppercase tracking-[0.22em] text-[11px] border border-white/50 px-9 py-3.5 hover:bg-white hover:text-brand-navy transition-colors duration-300"
                >
                  {h.experienceCta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Cierre — negro marca + acento rojo en hover */}
      <PreviewSectionChrome blockId="home-closing" label="Cierre">
      <section className="py-24 md:py-32 bg-brand-canvas border-t border-brand-navy/10">
        <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6" y={26}>
          <div>
            <SectionKicker>{h.closingKicker}</SectionKicker>
            <h2 className="font-heading font-light text-3xl md:text-4xl lg:text-[2.65rem] text-brand-navy tracking-tight mt-8 mb-5 leading-tight">
              {h.closingTitle}
            </h2>
            <p className="text-brand-navy/70 font-light mb-12 leading-relaxed text-[15px] md:text-base max-w-lg mx-auto">
              {h.closingSubtitle}
            </p>
            <div className={cn("flex gap-4 justify-center", pl.preview ? "flex-col" : "flex-col sm:flex-row")}>
              <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
                <Link
                  to="/contacto"
                  className="inline-flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[11px] bg-brand-navy text-white px-10 py-4 transition-colors hover:brightness-110"
                >
                  {h.closingBtnPrimary}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
                <Link
                  to="/renta"
                  className="inline-flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[11px] border border-brand-navy/25 text-brand-navy px-10 py-4 transition-colors hover:border-primary hover:text-brand-burgundy bg-white/70"
                >
                  {h.closingBtnSecondary}
                </Link>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </section>
      </PreviewSectionChrome>

      <Footer />
    </div>
  );
}

import type { ReactNode } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PropertyCard } from "../components/PropertyCard";
import { SearchBar, SearchFilters } from "../components/SearchBar";
import { mockProperties } from "../data/properties";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { PreviewSectionChrome } from "../components/admin/siteEditor/PreviewSectionChrome";
import { cn } from "../components/ui/utils";

function SectionKicker({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "text-[10px] uppercase tracking-[0.32em] font-normal",
          tone === "light" ? "text-white/70" : "text-neutral-500"
        )}
      >
        {children}
      </p>
      <span className="mt-4 mx-auto block h-px w-10 bg-[#C8102E]" aria-hidden />
    </div>
  );
}

export function HomePage() {
  const pl = usePreviewLayout();
  const { content } = useSiteContent();
  const h = content.home;
  const featuredProperties = mockProperties.slice(0, 6);

  const handleSearch = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.query) params.append("query", filters.query);
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    window.location.href = `/propiedades?${params.toString()}`;
  };

  const scrollToSearch = () => {
    document.getElementById("busqueda")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero (sin cambios de estructura) */}
      <PreviewSectionChrome blockId="home-hero" label="Portada principal">
      <section className="viterra-reveal-off scroll-fade-exit-white relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+5.25rem)] sm:pb-16 sm:pt-[calc(env(safe-area-inset-top,0px)+6.5rem)] md:pb-24 md:pt-52">
        <div className="absolute inset-0 z-0">
          <img src={h.heroImage} alt="" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8 md:space-y-10"
          >
            <p className="text-white/70 text-[11px] md:text-xs uppercase tracking-[0.35em] font-normal">
              {h.heroKicker}
            </p>

            <h1
              className="font-serif text-white text-[2.35rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-tight px-2"
              style={{ fontWeight: 300 }}
            >
              {h.heroTitle}
            </h1>

            <p className="text-lg md:text-xl text-white/88 max-w-xl mx-auto font-light leading-relaxed">
              {h.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] md:text-xs uppercase tracking-[0.28em] text-white/65">
              <Link to="/desarrollos" className="hover:text-white transition-colors py-1">
                {h.heroLinkDevLabel}
              </Link>
              <span className="hidden sm:inline text-white/30">|</span>
              <Link to="/nosotros" className="hover:text-white transition-colors py-1">
                {h.heroLinkAboutLabel}
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 pt-2">
              <button
                type="button"
                onClick={scrollToSearch}
                className="w-full sm:w-auto min-w-[240px] border border-white text-white uppercase tracking-[0.22em] text-xs py-4 px-10 hover:bg-white hover:text-neutral-900 transition-colors duration-300 font-normal"
              >
                {h.heroCtaPrimary}
              </button>
              <Link
                to="/venta"
                className="group inline-flex items-center gap-2 text-white text-sm tracking-wide border-b border-white/40 pb-0.5 hover:border-white transition-colors font-light"
              >
                {h.heroCtaSecondary}
                <ArrowRight className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Búsqueda — mismo lenguaje visual que el hero: imagen + velo para legibilidad */}
      <PreviewSectionChrome blockId="home-search" label="Búsqueda">
      <section
        id="busqueda"
        className="scroll-fade-exit-white relative scroll-mt-8 min-h-[72vh] md:min-h-[78vh] flex flex-col justify-center py-20 md:py-28 overflow-hidden border-b border-black/25"
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
          <div className="mb-12 md:mb-14">
            <SectionKicker tone="light">{h.searchKicker}</SectionKicker>
            <h2 className="font-heading font-light text-3xl md:text-4xl lg:text-[2.35rem] text-white tracking-tight text-center mt-8 leading-tight drop-shadow-sm">
              {h.searchTitle}
            </h2>
            <p className="font-tertiary text-center text-base md:text-lg italic text-white/80 mt-4 max-w-xl mx-auto leading-relaxed">
              {h.searchSubtitle}
            </p>
          </div>
          <SearchBar
            onSearch={handleSearch}
            variant="premium"
            className="border border-white/20 bg-white/98 backdrop-blur-sm p-6 md:p-9 shadow-[0_24px_64px_-18px_rgba(0,0,0,0.55)]"
          />
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Selección — fondo blanco (sin imagen de fondo) */}
      <PreviewSectionChrome blockId="home-selection" label="Selección de propiedades">
      <section className="relative scroll-fade-exit-white bg-white py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "mb-14 flex gap-8 border-b border-neutral-200 pb-10 sm:gap-10 md:mb-16 md:pb-12",
              pl.preview ? "flex-col" : "flex-col lg:flex-row lg:items-end lg:justify-between"
            )}
          >
            <div className="lg:max-w-[65%]">
              <p className="mb-4 text-[10px] font-normal uppercase tracking-[0.32em] text-neutral-500">{h.selectionKicker}</p>
              <span className="mb-6 block h-px w-10 bg-[#C8102E]" aria-hidden />
              <h2 className="font-heading text-3xl font-light leading-[1.12] tracking-tight text-neutral-900 sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                {h.selectionTitle}
              </h2>
              <p className="mt-5 max-w-xl text-[15px] font-light leading-relaxed text-neutral-600 md:text-base">
                {h.selectionSubtitle}
              </p>
            </div>
            <Link
              to="/venta"
              className="inline-flex shrink-0 items-center gap-2 self-start border-b border-neutral-400 pb-1 text-[11px] uppercase tracking-[0.22em] text-neutral-800 transition-colors hover:border-[#C8102E] hover:text-[#C8102E] lg:self-auto"
            >
              {h.selectionCatalogLink}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className={cn("grid gap-x-8 gap-y-12", pl.gridCols("grid-cols-1 md:grid-cols-2 lg:grid-cols-3"))}>
            {featuredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <PropertyCard property={property} variant="editorial" />
              </motion.div>
            ))}
          </div>

          <div className="mt-20 flex flex-col items-center justify-center gap-8 border-t border-neutral-200 pt-12 text-sm sm:flex-row">
            <Link
              to="/renta"
              className="inline-flex items-center gap-2 border-b border-neutral-300 pb-1 text-[11px] uppercase tracking-[0.16em] text-neutral-700 transition-colors hover:border-[#C8102E] hover:text-[#C8102E]"
            >
              {h.selectionRentLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="hidden h-4 w-px bg-neutral-300 sm:inline" aria-hidden />
            <Link
              to="/venta"
              className="inline-flex items-center gap-2 border-b border-neutral-300 pb-1 text-[11px] uppercase tracking-[0.16em] text-neutral-700 transition-colors hover:border-[#C8102E] hover:text-[#C8102E]"
            >
              {h.selectionSaleLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Experiencia — navy marca + imagen */}
      <PreviewSectionChrome blockId="home-experience" label="Experiencia">
      <section className={cn("grid min-h-[420px] lg:min-h-[540px]", pl.gridCols("grid-cols-1 lg:grid-cols-2"))}>
        <div
          className={cn(
            "relative min-h-[300px] lg:min-h-0",
            pl.preview ? "order-2" : "order-2 lg:order-1"
          )}
        >
          <img
            src={h.experienceImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div
          className={cn(
            "order-1 flex flex-col justify-center bg-brand-navy px-5 py-14 text-white sm:px-8 md:py-16 lg:px-16 lg:py-24",
            pl.preview ? "" : "lg:order-2"
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/45 font-normal mb-5">{h.experienceKicker}</p>
          <span className="block h-px w-10 bg-[#C8102E] mb-8" aria-hidden />
          <h3 className="font-heading font-light text-3xl md:text-4xl lg:text-[2.65rem] tracking-tight leading-[1.15] mb-6">
            {h.experienceTitle}
          </h3>
          <p className="font-tertiary text-lg md:text-xl italic text-white/70 leading-relaxed max-w-md mb-4">
            {h.experienceLead}
          </p>
          <p className="text-white/78 font-light leading-relaxed max-w-md mb-10 text-[15px]">
            {h.experienceBody}
          </p>
          <Link
            to="/nosotros"
            className="inline-flex items-center gap-2 self-start uppercase tracking-[0.22em] text-[11px] border border-white/50 px-9 py-3.5 hover:bg-white hover:text-brand-navy transition-colors duration-300"
          >
            {h.experienceCta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Cierre — negro marca + acento rojo en hover */}
      <PreviewSectionChrome blockId="home-closing" label="Cierre">
      <section className="py-24 md:py-32 bg-brand-canvas border-t border-neutral-200/60">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <SectionKicker>{h.closingKicker}</SectionKicker>
          <h2 className="font-heading font-light text-3xl md:text-4xl lg:text-[2.65rem] text-neutral-900 tracking-tight mt-8 mb-5 leading-tight">
            {h.closingTitle}
          </h2>
          <p className="text-neutral-600 font-light mb-12 leading-relaxed text-[15px] md:text-base max-w-lg mx-auto">
            {h.closingSubtitle}
          </p>
          <div className={cn("flex gap-4 justify-center", pl.preview ? "flex-col" : "flex-col sm:flex-row")}>
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[11px] bg-brand-navy text-white px-10 py-4 hover:bg-[#1e2a45] transition-colors"
            >
              {h.closingBtnPrimary}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/propiedades"
              className="inline-flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[11px] border border-neutral-900/25 text-neutral-900 px-10 py-4 hover:border-[#C8102E] hover:text-[#7f1d1d] transition-colors bg-white/60"
            >
              {h.closingBtnSecondary}
            </Link>
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <Footer />
    </div>
  );
}

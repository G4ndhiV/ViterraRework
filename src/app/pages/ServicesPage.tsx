import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Link } from "react-router";
import { Home, Building, TrendingUp, Shield, FileText, Users, ArrowRight, CheckCircle2, ChevronsDown } from "lucide-react";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { DEFAULT_SITE_CONTENT } from "../../data/siteContent";
import { mergeSiteSection } from "../../lib/siteContentMerge";
import { PreviewSectionChrome } from "../components/admin/siteEditor/PreviewSectionChrome";
import { cn } from "../components/ui/utils";

const CARD_ICONS = [Home, Building, TrendingUp, Shield, FileText, Users] as const;

export function ServicesPage() {
  const { content } = useSiteContent();
  const pl = usePreviewLayout();
  const s = mergeSiteSection("services", content.services);
  const cards = Array.isArray(s.cards) ? s.cards : DEFAULT_SITE_CONTENT.services.cards;

  return (
    <div className="viterra-page flex min-h-screen flex-col bg-white">
      <Header />

      <PreviewSectionChrome blockId="services-hero" label="Cabecera">
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-brand-navy pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+5.25rem)] sm:pb-16 sm:pt-[calc(env(safe-area-inset-top,0px)+6.5rem)] md:pb-24 md:pt-52">
        <div className="absolute inset-0 z-0">
          <img
            src="https://wallpapers.com/images/hd/4k-office-background-silapjkl0bkxakj4.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/78 via-black/48 to-black/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 text-center lg:px-8">
          <p className="font-heading text-[11px] font-normal uppercase tracking-[0.28em] text-white/75 md:text-xs not-italic">
            Viterra · Servicios
          </p>
          <span className="mx-auto mt-3 block h-px w-12 bg-primary" aria-hidden />
          <div className="mt-5 flex justify-center text-primary" aria-hidden>
            <ChevronsDown className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading mt-6 text-5xl font-light tracking-tight text-white md:text-6xl">
            {s.heroTitle}
          </h1>
          <p className="font-heading mx-auto mt-4 max-w-2xl text-lg font-light text-white/90 md:text-xl not-italic">
            {s.heroSubtitle}
          </p>
        </div>
      </section>
      </PreviewSectionChrome>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2 lg:grid-cols-3"))}>
            {cards.map((card, index) => {
              const Icon = CARD_ICONS[index] ?? Home;
              return (
                <PreviewSectionChrome key={`${card.title}-${index}`} blockId={`services-card-${index}`} label={`Tarjeta ${index + 1}`}>
                <div
                  className="group rounded-2xl border border-brand-navy/12 p-8 transition-all duration-300 hover:border-brand-navy/30 hover:shadow-lg"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-canvas transition-all group-hover:scale-110 group-hover:bg-primary">
                    <Icon className="h-7 w-7 text-brand-navy transition-colors group-hover:text-white" />
                  </div>
                  <h3 className="font-heading mb-4 text-2xl font-light text-brand-navy not-italic">
                    {card.title}
                  </h3>
                  <p className="font-heading mb-6 leading-relaxed text-brand-navy/72 font-light not-italic">
                    {card.description}
                  </p>
                  <ul className="mb-6 space-y-3">
                    {(card.bullets ?? []).map((b) => (
                      <li key={b} className="font-heading flex items-start gap-2 text-sm text-brand-navy/72">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="font-light">{b}</span>
                      </li>
                    ))}
                  </ul>
                  {card.linkTo && card.linkLabel ? (
                    <Link
                      to={card.linkTo}
                      className="font-heading inline-flex items-center gap-2 text-sm text-brand-navy transition-colors hover:text-primary font-medium"
                    >
                      {card.linkLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
                </PreviewSectionChrome>
              );
            })}
          </div>
        </div>
      </section>

      <PreviewSectionChrome blockId="services-cta" label="Llamado a la acción">
      <section className="bg-brand-canvas py-24">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="font-heading mb-6 text-4xl font-light tracking-tight text-brand-navy md:text-5xl">
            {s.ctaTitle}
          </h2>
          <p className="font-heading mb-10 text-lg md:text-xl text-brand-navy/72 font-light not-italic">
            {s.ctaSubtitle}
          </p>
          <Link
            to="/contacto"
            className="font-heading inline-flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-10 py-4 text-white transition-all hover:bg-brand-burgundy font-medium"
          >
            {s.ctaButton}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      </PreviewSectionChrome>

      <Footer />
    </div>
  );
}

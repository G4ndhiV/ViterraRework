import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Link } from "react-router";
import { Home, Building, TrendingUp, Shield, FileText, Users, ArrowRight, CheckCircle2 } from "lucide-react";
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
      <section className="relative flex min-h-[58vh] flex-col justify-center overflow-hidden bg-brand-navy py-14 sm:min-h-[64vh] md:min-h-[72vh] md:py-20">
        <div className="absolute inset-0 z-0">
          <img src={s.heroImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 text-center lg:px-8">
          <h1 className="font-heading text-5xl font-light tracking-tight text-white md:text-6xl" style={{ letterSpacing: "-0.02em" }}>
            {s.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-white/90" style={{ fontWeight: 300 }}>
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
                  className="group rounded-2xl border border-slate-200 p-8 transition-all duration-300 hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 transition-all group-hover:scale-110 group-hover:bg-primary">
                    <Icon className="h-7 w-7 text-slate-700 transition-colors group-hover:text-white" />
                  </div>
                  <h3 className="mb-4 text-2xl text-slate-900" style={{ fontWeight: 300 }}>
                    {card.title}
                  </h3>
                  <p className="mb-6 leading-relaxed text-slate-600" style={{ fontWeight: 300 }}>
                    {card.description}
                  </p>
                  <ul className="mb-6 space-y-3">
                    {(card.bullets ?? []).map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <span style={{ fontWeight: 300 }}>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {card.linkTo && card.linkLabel ? (
                    <Link
                      to={card.linkTo}
                      className="inline-flex items-center gap-2 text-sm text-brand-navy transition-colors hover:text-primary"
                      style={{ fontWeight: 400 }}
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
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="font-heading mb-6 text-4xl font-light tracking-tight text-brand-navy md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            {s.ctaTitle}
          </h2>
          <p className="mb-10 text-xl text-slate-600" style={{ fontWeight: 300 }}>
            {s.ctaSubtitle}
          </p>
          <Link
            to="/contacto"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-10 py-4 text-white transition-all hover:bg-brand-burgundy"
            style={{ fontWeight: 400 }}
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

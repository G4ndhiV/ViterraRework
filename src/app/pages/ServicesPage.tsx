import { motion, useReducedMotion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Link } from "react-router";
import { Home, Building, TrendingUp, Shield, FileText, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { DEFAULT_SITE_CONTENT } from "../../data/siteContent";
import { mergeSiteSection } from "../../lib/siteContentMerge";
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

const CARD_ICONS = [Home, Building, TrendingUp, Shield, FileText, Users] as const;

export function ServicesPage() {
  const reduceMotion = useReducedMotion();
  const { content } = useSiteContent();
  const pl = usePreviewLayout();
  const s = mergeSiteSection("services", content.services);
  const cards = Array.isArray(s.cards) ? s.cards : DEFAULT_SITE_CONTENT.services.cards;

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
    <div className="viterra-page flex min-h-screen flex-col bg-white">
      <Header />

      <PreviewSectionChrome blockId="services-hero" label="Cabecera">
      <section className={viterraHeroSectionClass}>
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            src="https://wallpapers.com/images/hd/4k-office-background-silapjkl0bkxakj4.jpg"
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
              kicker="Viterra · Servicios"
              itemVariants={heroItemVariants}
              reduceMotion={!!reduceMotion}
            />
            <motion.div variants={heroItemVariants} className={viterraHeroMainClass}>
              <h1 className={viterraHeroTitleClass}>{s.heroTitle}</h1>
            </motion.div>
            <motion.p variants={heroItemVariants} className={viterraHeroSubtitleClass}>
              {s.heroSubtitle}
            </motion.p>
          </motion.div>
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
                  <Reveal delay={Math.min(index * 0.065, 0.4)} y={24}>
                    <motion.div
                      className="group rounded-2xl border border-brand-navy/12 p-8 transition-all duration-300 hover:border-brand-navy/30 hover:shadow-lg"
                      whileHover={reduceMotion ? undefined : { y: -4 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
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
                    </motion.div>
                  </Reveal>
                </PreviewSectionChrome>
              );
            })}
          </div>
        </div>
      </section>

      <PreviewSectionChrome blockId="services-cta" label="Llamado a la acción">
      <section className="bg-brand-canvas py-24">
        <Reveal className="mx-auto max-w-4xl px-6 text-center lg:px-8" y={26}>
          <div>
            <h2 className="font-heading mb-6 text-4xl font-light tracking-tight text-brand-navy md:text-5xl">
              {s.ctaTitle}
            </h2>
            <p className="font-heading mb-10 text-lg md:text-xl text-brand-navy/72 font-light not-italic">
              {s.ctaSubtitle}
            </p>
            <motion.div whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
              <Link
                to="/contacto"
                className="font-heading inline-flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-10 py-4 text-white transition-all hover:bg-brand-burgundy font-medium"
              >
                {s.ctaButton}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </section>
      </PreviewSectionChrome>

      <Footer />
    </div>
  );
}

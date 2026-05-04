import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleNode = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
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

      <section className="bg-white py-24" aria-label="Listado de servicios">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div
            className={cn(
              "flex flex-wrap justify-center gap-x-6 gap-y-10 sm:gap-x-10 md:gap-x-12",
              pl.flexStack("flex-row"),
            )}
            role="tablist"
            aria-orientation="horizontal"
          >
            {cards.map((card, index) => {
              const Icon = CARD_ICONS[index] ?? Home;
              const selected = activeIndex === index;
              return (
                <PreviewSectionChrome key={`${card.title}-${index}`} blockId={`services-card-${index}`} label={`Tarjeta ${index + 1}`}>
                  <Reveal delay={Math.min(index * 0.055, 0.35)} y={20} className="min-h-0">
                    <div className="flex w-[7.5rem] flex-col items-center gap-3 sm:w-[8.5rem]">
                      <motion.button
                        type="button"
                        role="tab"
                        id={`service-tab-${index}`}
                        aria-selected={selected}
                        aria-controls="service-detail-panel"
                        onClick={() => toggleNode(index)}
                        className={cn(
                          "relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-colors sm:h-20 sm:w-20",
                          selected
                            ? "border-primary ring-4 ring-primary/25"
                            : "border-brand-navy/15 hover:border-brand-navy/35 hover:bg-brand-canvas/80",
                        )}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 520, damping: 28 }}
                      >
                        <Icon
                          className={cn(
                            "h-8 w-8 sm:h-9 sm:w-9",
                            selected ? "text-primary" : "text-brand-navy",
                          )}
                          aria-hidden
                        />
                      </motion.button>
                      <span
                        className={cn(
                          "font-heading text-center text-xs font-medium leading-snug text-brand-navy sm:text-sm",
                          selected ? "text-primary" : "",
                        )}
                      >
                        {card.title}
                      </span>
                    </div>
                  </Reveal>
                </PreviewSectionChrome>
              );
            })}
          </div>

          <div className="mx-auto mt-14 max-w-3xl">
            <AnimatePresence mode="wait" initial={false}>
              {activeIndex !== null && cards[activeIndex] ? (
                <motion.div
                  key={activeIndex}
                  id="service-detail-panel"
                  role="tabpanel"
                  aria-labelledby={`service-tab-${activeIndex}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-2xl border border-brand-navy/12 bg-white p-8 shadow-lg sm:p-10"
                >
                  {(() => {
                    const card = cards[activeIndex]!;
                    const Icon = CARD_ICONS[activeIndex] ?? Home;
                    return (
                      <>
                        <div className="mb-6 flex items-start gap-5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-canvas">
                            <Icon className="h-7 w-7 text-brand-navy" aria-hidden />
                          </div>
                          <h3 className="font-heading pt-1 text-2xl font-light text-brand-navy not-italic md:text-3xl">
                            {card.title}
                          </h3>
                        </div>
                        <p className="font-heading mb-6 leading-relaxed text-brand-navy/72 font-light not-italic md:text-lg">
                          {card.description}
                        </p>
                        <ul className="mb-8 space-y-3">
                          {(card.bullets ?? []).map((b) => (
                            <li key={b} className="font-heading flex items-start gap-2 text-sm text-brand-navy/72 md:text-base">
                              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                              <span className="font-light">{b}</span>
                            </li>
                          ))}
                        </ul>
                        {card.linkTo && card.linkLabel ? (
                          <Link
                            to={card.linkTo}
                            className="font-heading inline-flex items-center gap-2 text-sm font-medium text-brand-navy transition-colors hover:text-primary md:text-base"
                          >
                            {card.linkLabel}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.p
                  key="placeholder"
                  id="service-detail-panel"
                  role="region"
                  aria-live="polite"
                  initial={false}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-brand-navy/20 bg-brand-canvas/40 px-6 py-12 text-center font-heading text-sm text-brand-navy/60 sm:text-base"
                >
                  Selecciona un servicio arriba para ver la descripción, beneficios y enlaces.
                </motion.p>
              )}
            </AnimatePresence>
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

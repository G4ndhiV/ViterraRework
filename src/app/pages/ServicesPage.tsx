import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Link } from "react-router";
import {
  Home,
  Building,
  TrendingUp,
  Shield,
  FileText,
  Users,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
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
  const [activeIndex, setActiveIndex] = useState(0);

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

      <section
        className="relative overflow-hidden bg-gradient-to-b from-slate-100/90 via-white to-white py-20 sm:py-28"
        aria-label="Listado de servicios"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,rgba(200,16,46,0.07),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <Reveal y={18} className="mx-auto mb-12 max-w-2xl text-center lg:mx-0 lg:text-left">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-primary sm:text-xs">
              Catálogo
            </p>
            <h2 className="font-heading mt-3 text-balance text-3xl font-light tracking-tight text-brand-navy sm:text-4xl">
              Servicios a tu medida
            </h2>
            <p className="font-heading mt-3 text-pretty text-base text-brand-navy/65 font-light sm:text-lg">
              Elige un servicio en la lista: el panel derecho se actualiza al instante con la información completa.
            </p>
          </Reveal>

          <LayoutGroup id="services-explorer">
            <div
              className={cn(
                "flex gap-10 lg:gap-14 lg:items-stretch",
                pl.flexStack("flex-col lg:flex-row"),
              )}
            >
              <nav
                className={cn(
                  "flex shrink-0 flex-col gap-2",
                  pl.flexStack("w-full max-w-full lg:w-[min(100%,320px)]"),
                )}
                role="tablist"
                aria-label="Servicios disponibles"
                aria-orientation="vertical"
              >
                {cards.map((card, index) => {
                  const Icon = CARD_ICONS[index] ?? Home;
                  const selected = activeIndex === index;
                  return (
                    <PreviewSectionChrome key={`${card.title}-${index}`} blockId={`services-card-${index}`} label={`Tarjeta ${index + 1}`}>
                      <Reveal delay={Math.min(index * 0.045, 0.28)} y={12} className="min-h-0">
                        <motion.button
                          type="button"
                          role="tab"
                          id={`service-tab-${index}`}
                          aria-selected={selected}
                          aria-controls="service-detail-panel"
                          onClick={() => setActiveIndex(index)}
                          className={cn(
                            "group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color,background-color] duration-200 sm:px-5 sm:py-4",
                            selected
                              ? "border-brand-navy/[0.12] bg-white shadow-[0_12px_40px_-12px_rgba(20,28,46,0.18)] ring-1 ring-black/[0.04]"
                              : "border-transparent bg-white/50 hover:border-brand-navy/10 hover:bg-white hover:shadow-md",
                          )}
                          whileTap={reduceMotion ? undefined : { scale: 0.992 }}
                          transition={{ type: "spring", stiffness: 480, damping: 32 }}
                        >
                          {selected ? (
                            <motion.span
                              layoutId="services-rail-accent"
                              className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-primary"
                              transition={{ type: "spring", stiffness: 380, damping: 34 }}
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={cn(
                              "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200",
                              selected
                                ? "border-primary/25 bg-primary/[0.08] text-primary"
                                : "border-brand-navy/10 bg-brand-canvas/80 text-brand-navy group-hover:border-brand-navy/18",
                            )}
                          >
                            <Icon className="h-6 w-6" aria-hidden />
                          </span>
                          <span className="relative min-w-0 flex-1">
                            <span
                              className={cn(
                                "font-heading block text-sm font-medium leading-snug text-brand-navy sm:text-[15px]",
                                selected ? "text-brand-navy" : "text-brand-navy/85",
                              )}
                            >
                              {card.title}
                            </span>
                            <span className="mt-0.5 block font-heading text-xs font-normal text-brand-navy/45">
                              {selected ? "Mostrando detalles" : "Ver información"}
                            </span>
                          </span>
                          <ChevronRight
                            className={cn(
                              "relative h-5 w-5 shrink-0 transition-transform duration-200",
                              selected ? "translate-x-0.5 text-primary" : "text-brand-navy/25 group-hover:translate-x-0.5 group-hover:text-brand-navy/45",
                            )}
                            aria-hidden
                          />
                        </motion.button>
                      </Reveal>
                    </PreviewSectionChrome>
                  );
                })}
              </nav>

              <div className="min-h-0 min-w-0 flex-1 lg:pt-1">
                <AnimatePresence mode="wait" initial={false}>
                  {cards[activeIndex] ? (
                    <motion.div
                      key={activeIndex}
                      id="service-detail-panel"
                      role="tabpanel"
                      aria-labelledby={`service-tab-${activeIndex}`}
                      initial={reduceMotion ? false : { opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, x: -10 }}
                      transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="relative overflow-hidden rounded-[1.75rem] border border-brand-navy/[0.1] bg-white p-8 shadow-[0_24px_60px_-28px_rgba(20,28,46,0.22)] sm:p-10"
                    >
                      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl" aria-hidden />
                      {(() => {
                        const card = cards[activeIndex]!;
                        const Icon = CARD_ICONS[activeIndex] ?? Home;
                        return (
                          <div className="relative">
                            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                              <div className="flex min-w-0 items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-canvas to-brand-canvas/40 ring-1 ring-brand-navy/8">
                                  <Icon className="h-7 w-7 text-brand-navy" aria-hidden />
                                </div>
                                <div className="min-w-0 pt-0.5">
                                  <p className="font-heading text-xs font-medium uppercase tracking-wider text-primary">
                                    Servicio
                                  </p>
                                  <h3 className="font-heading mt-1 text-balance text-2xl font-light leading-tight text-brand-navy not-italic sm:text-3xl">
                                    {card.title}
                                  </h3>
                                </div>
                              </div>
                            </div>
                            <p className="font-heading mb-8 max-w-prose text-pretty text-base leading-relaxed text-brand-navy/72 font-light not-italic sm:text-lg">
                              {card.description}
                            </p>
                            <p className="font-heading mb-3 text-xs font-semibold uppercase tracking-wider text-brand-navy/45">
                              Incluye
                            </p>
                            <ul className="mb-10 grid gap-2.5 sm:gap-3">
                              {(card.bullets ?? []).map((b) => (
                                <li
                                  key={b}
                                  className="font-heading flex items-start gap-3 rounded-xl border border-brand-navy/[0.06] bg-brand-canvas/35 px-4 py-3 text-sm text-brand-navy/80 sm:text-[15px]"
                                >
                                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                                  <span className="font-light leading-snug">{b}</span>
                                </li>
                              ))}
                            </ul>
                            {card.linkTo && card.linkLabel ? (
                              <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}>
                                <Link
                                  to={card.linkTo}
                                  className="font-heading inline-flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-burgundy sm:px-8 sm:text-base"
                                >
                                  {card.linkLabel}
                                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Link>
                              </motion.div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </LayoutGroup>
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

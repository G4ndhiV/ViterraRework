"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import type { ServiceCardContent } from "../../data/siteContent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { PreviewSectionChrome } from "./admin/siteEditor/PreviewSectionChrome";
import { cn } from "./ui/utils";

/** Misma marca mono que el header (sobre fondo corporativo rojo) */
const VITERRA_MARK_MONO = "/images/branding/viterra-mark-mono-alpha.png";

const CARD_ICONS: readonly LucideIcon[] = [Home, Building, TrendingUp, Shield, FileText, Users];

const VB = 400;
const CX = 200;
const CY = 200;
/** Radio base del hexágono (nodos “en reposo”) — mayor = radios y aristas más largos */
const R_NODES = 156;
/** Margen interior del área de vuelo (coords. viewBox) */
const WANDER_MARGIN = 24;
/** Amplitud máxima aproximada del vaivén (suma de ondas lentas) */
const WANDER_AMP = 32;
/** Etiqueta: offset radial desde el centro del nodo hacia afuera */
const LABEL_OUTWARD = 74;

function nodePoint(i: number, n: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return {
    a,
    x: CX + R_NODES * Math.cos(a),
    y: CY + R_NODES * Math.sin(a),
  };
}

/** Movimiento orgánico pseudoaleatorio: varias ondas lentas desfasadas por índice */
function wanderOffset(i: number, tSec: number) {
  const p = i * 1.713 + (i + 1) * 0.91;
  const q = i * 2.399 + 0.37;
  const ox =
    WANDER_AMP *
    (0.38 * Math.sin(tSec * 0.064 + p) +
      0.32 * Math.cos(tSec * 0.05 + q) +
      0.3 * Math.sin(tSec * 0.033 + p * 1.73));
  const oy =
    WANDER_AMP *
    (0.37 * Math.cos(tSec * 0.059 + q * 1.17) +
      0.34 * Math.sin(tSec * 0.072 + p) +
      0.29 * Math.cos(tSec * 0.04 + i * 2.08));
  return { ox, oy };
}

function clampPoint(x: number, y: number) {
  const lo = WANDER_MARGIN;
  const hi = VB - WANDER_MARGIN;
  return {
    x: Math.min(hi, Math.max(lo, x)),
    y: Math.min(hi, Math.max(lo, y)),
  };
}

/** Posición final del nodo + etiqueta siguiendo la dirección radial desde el centro */
function layoutNode(i: number, n: number, tSec: number, reduceMotion: boolean) {
  const base = nodePoint(i, n);
  if (reduceMotion) {
    const dx = base.x - CX;
    const dy = base.y - CY;
    const len = Math.hypot(dx, dy) || 1;
    const lx = base.x + (dx / len) * LABEL_OUTWARD;
    const ly = base.y + (dy / len) * LABEL_OUTWARD;
    return { x: base.x, y: base.y, lx, ly };
  }
  const { ox, oy } = wanderOffset(i, tSec);
  const { x: nx, y: ny } = clampPoint(base.x + ox, base.y + oy);
  const dx = nx - CX;
  const dy = ny - CY;
  const len = Math.hypot(dx, dy) || 1;
  const lx = nx + (dx / len) * LABEL_OUTWARD;
  const ly = ny + (dy / len) * LABEL_OUTWARD;
  const { x: lxC, y: lyC } = clampPoint(lx, ly);
  return { x: nx, y: ny, lx: lxC, ly: lyC };
}

function pct(v: number) {
  return `${(v / VB) * 100}%`;
}

/** Interpolación exponencial hacia el objetivo; `stiffness` ~10–18 da arrastre fluido a cualquier FPS */
function smoothScalar(from: number, to: number, dtSec: number, stiffness: number) {
  const a = 1 - Math.exp(-stiffness * dtSec);
  return from + (to - from) * a;
}

type LayoutPoint = { x: number; y: number; lx: number; ly: number };

/** Alineación del título según la posición actual del nodo (mejor con nodos en movimiento) */
function labelTextAlignFromPos(lx: number, ly: number): string {
  const dx = lx - CX;
  const dy = ly - CY;
  if (Math.abs(dy) >= Math.abs(dx) * 1.05) {
    return "text-center";
  }
  return dx > 0 ? "text-left" : "text-right";
}

type ServicesNodeGraphProps = {
  cards: ServiceCardContent[];
  reduceMotion?: boolean;
};

export function ServicesNodeGraph({ cards, reduceMotion }: ServicesNodeGraphProps) {
  const n = Math.max(cards.length, 1);
  const uid = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<number | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const smoothRef = useRef<LayoutPoint[] | null>(null);
  const lastFrameMsRef = useRef<number | null>(null);
  const [smoothedLayouts, setSmoothedLayouts] = useState<LayoutPoint[]>(() => {
    const nn = Math.max(cards.length, 1);
    return cards.map((_, i) => layoutNode(i, nn, 0, !!reduceMotion));
  });

  /** Reset de posiciones cuando cambia el número de tarjetas o reduceMotion */
  useEffect(() => {
    const rm = !!reduceMotion;
    const list = cardsRef.current;
    if (list.length === 0) return;
    const init = list.map((_, i) => layoutNode(i, n, 0, rm));
    smoothRef.current = init;
    setSmoothedLayouts(init);
    lastFrameMsRef.current = null;
  }, [n, reduceMotion, cards.length]);

  /** Bucle: objetivo analítico + suavizado con Δt real (sin saltos “por frame”) */
  useEffect(() => {
    if (reduceMotion) return;

    const t0 = performance.now();
    let rafId = 0;
    let cancelled = false;
    const STIFF = 17;

    const tick = (now: number) => {
      if (cancelled) return;
      const c = cardsRef.current;
      const tSec = (now - t0) * 0.001;
      const targets = c.map((_, i) => layoutNode(i, n, tSec, false));

      let dt = 1 / 60;
      if (lastFrameMsRef.current != null) {
        dt = (now - lastFrameMsRef.current) / 1000;
        dt = Math.min(Math.max(dt, 1 / 240), 1 / 30);
      }
      lastFrameMsRef.current = now;

      const prev = smoothRef.current;
      const next: LayoutPoint[] = targets.map((tgt, i) => {
        const p = prev?.[i] ?? tgt;
        return {
          x: smoothScalar(p.x, tgt.x, dt, STIFF),
          y: smoothScalar(p.y, tgt.y, dt, STIFF),
          lx: smoothScalar(p.lx, tgt.lx, dt, STIFF),
          ly: smoothScalar(p.ly, tgt.ly, dt, STIFF),
        };
      });
      smoothRef.current = next;
      setSmoothedLayouts(next);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [reduceMotion, n]);

  const spokeLit = (i: number) => hovered === i || openIndex === i;

  const activeCard = openIndex != null ? cards[openIndex] : null;
  const ActiveIcon = openIndex != null ? (CARD_ICONS[openIndex] ?? Home) : Home;

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Jerarquía: contexto → diagrama (flujo natural de lectura) */}
      <div
        className="relative mx-auto w-full max-w-[min(100%,720px)]"
        role="group"
        aria-label="Diagrama de servicios: nodo central Viterra y seis servicios conectados"
      >
        <div className="relative mx-auto aspect-square w-full max-w-[min(92vw,680px)]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
            viewBox={`0 0 ${VB} ${VB}`}
            preserveAspectRatio="xMidYMid meet"
            shapeRendering="geometricPrecision"
            aria-hidden
          >
            <defs>
              <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {Array.from({ length: n }, (_, i) => {
              const j = (i + 1) % n;
              const p0 = smoothedLayouts[i]!;
              const p1 = smoothedLayouts[j]!;
              const h = hovered;
              const o = openIndex;
              const lit = h === i || h === j || o === i || o === j;
              return (
                <line
                  key={`hull-${i}`}
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1.x}
                  y2={p1.y}
                  stroke={lit ? "rgb(200 16 46 / 0.5)" : "rgb(200 16 46 / 0.14)"}
                  strokeWidth={lit ? 3 : 2}
                  strokeLinecap="round"
                  style={{ transition: "stroke 160ms ease, stroke-width 160ms ease" }}
                />
              );
            })}

            {cards.map((_, i) => {
              const { x, y } = smoothedLayouts[i]!;
              const lit = spokeLit(i);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke={lit ? "rgb(200 16 46 / 0.95)" : "rgb(200 16 46 / 0.17)"}
                  strokeWidth={lit ? 3.5 : 1.85}
                  strokeLinecap="round"
                  style={{
                    transition: "stroke 160ms ease, stroke-width 160ms ease",
                    ...(lit && !reduceMotion ? { filter: `url(#${uid}-glow)` } : {}),
                  }}
                />
              );
            })}
          </svg>

          {/* Hub central: cuadrado redondeado (marca + icono) */}
          <div
            className="pointer-events-none absolute z-[1] flex items-center justify-center"
            style={{ left: pct(CX), top: pct(CY), transform: "translate(-50%, -50%)" }}
          >
            <div
              className={cn(
                "flex h-[7.125rem] w-[7.125rem] flex-col items-center justify-center rounded-2xl bg-primary px-3 py-3 text-white",
                "shadow-[0_12px_32px_-8px_rgba(20,28,46,0.45),0_0_0_1px_rgb(200_16_46_/_0.35)]",
                !reduceMotion && "ring-4 ring-primary/20",
                "sm:h-[8.25rem] sm:w-[8.25rem] sm:px-4 sm:py-4",
              )}
            >
              <img
                src={VITERRA_MARK_MONO}
                alt="Viterra"
                width={512}
                height={132}
                decoding="async"
                className="h-[72%] w-auto min-h-[4.25rem] max-h-[5.85rem] max-w-[96%] object-contain object-center sm:min-h-[5rem] sm:max-h-[6.75rem]"
              />
            </div>
          </div>

          {cards.map((card, i) => {
            const { x, y, lx, ly } = smoothedLayouts[i]!;
            const Icon = CARD_ICONS[i] ?? Home;
            const lit = spokeLit(i);
            const align = labelTextAlignFromPos(lx, ly);

            return (
              <PreviewSectionChrome key={`${card.title}-${i}`} blockId={`services-card-${i}`} label={`Tarjeta ${i + 1}`}>
                <div className="pointer-events-none absolute inset-0 z-[5]">
                  <div
                    className={cn("absolute z-[2] max-w-[10.5rem] sm:max-w-[12rem]", align)}
                    style={{
                      left: pct(lx),
                      top: pct(ly),
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span className="font-heading inline-block text-balance text-[10px] font-medium leading-snug text-brand-navy sm:text-xs">
                      {card.title}
                    </span>
                  </div>

                  <div
                    className="absolute z-[3]"
                    style={{
                      left: pct(x),
                      top: pct(y),
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(i)}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(i)}
                      onBlur={() => setHovered(null)}
                      aria-haspopup="dialog"
                      aria-expanded={openIndex === i}
                      aria-label={`Abrir detalles: ${card.title}`}
                      className={cn(
                        "pointer-events-auto flex h-[5.625rem] w-[5.625rem] cursor-pointer items-center justify-center rounded-xl border-2 bg-white",
                        "shadow-[0_4px_14px_-4px_rgba(20,28,46,0.2)] transition-[box-shadow,transform,border-color] duration-200",
                        "sm:h-24 sm:w-24",
                        lit
                          ? "scale-[1.03] border-primary shadow-[0_6px_20px_-4px_rgba(200,16,46,0.35)]"
                          : "border-primary/40 hover:scale-[1.02] hover:border-primary hover:shadow-md",
                      )}
                    >
                      <Icon className="h-[2.0625rem] w-[2.0625rem] text-primary sm:h-10 sm:w-10" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </div>
              </PreviewSectionChrome>
            );
          })}
        </div>
      </div>

      <Dialog open={openIndex != null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent className="max-h-[min(88dvh,640px)] gap-0 overflow-y-auto border-brand-navy/10 p-0 sm:max-w-lg">
          {activeCard && openIndex != null ? (
            <>
              <DialogHeader className="border-b border-brand-navy/[0.08] bg-brand-canvas/50 px-6 pb-4 pt-6 text-left sm:px-8 sm:pb-5 sm:pt-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-brand-navy/10">
                    <ActiveIcon className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-heading text-[11px] font-semibold uppercase tracking-wider text-primary">Servicio</p>
                    <DialogTitle className="font-heading mt-1 text-balance text-xl font-light leading-snug text-brand-navy sm:text-2xl">
                      {activeCard.title}
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="sr-only">{activeCard.description}</DialogDescription>
              </DialogHeader>
              <div className="px-6 py-6 sm:px-8 sm:py-7">
                <p className="font-heading text-pretty text-sm leading-relaxed text-brand-navy/75 font-light sm:text-base">
                  {activeCard.description}
                </p>
                <p className="font-heading mb-2.5 mt-6 text-[11px] font-semibold uppercase tracking-wider text-brand-navy/45">
                  Incluye
                </p>
                <ul className="mb-8 grid gap-2">
                  {(activeCard.bullets ?? []).map((b) => (
                    <li
                      key={b}
                      className="font-heading flex items-start gap-2.5 rounded-xl border border-brand-navy/[0.06] bg-brand-canvas/40 px-3.5 py-2.5 text-sm text-brand-navy/80"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="font-light leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
                {activeCard.linkTo && activeCard.linkLabel ? (
                  <Link
                    to={activeCard.linkTo}
                    onClick={() => setOpenIndex(null)}
                    className="font-heading inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-burgundy sm:w-auto sm:min-w-[12rem]"
                  >
                    {activeCard.linkLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

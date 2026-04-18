import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronUp, Share2 } from "lucide-react";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { SOCIAL_LINKS, type SocialNetworkId } from "../config/socialLinks";
import { cn } from "./ui/utils";

/** Margen respecto al borde superior del footer (px) — más holgura para la franja “Síguenos” */
const FOOTER_GAP = 28;
/** Por encima de este hueco (px) la opacidad del panel es 1; por debajo se desvanece suavemente */
const FOOTER_FADE_RANGE = 240;

const iconById: Record<SocialNetworkId, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

type SocialHeaderDropdownProps = {
  /** Misma clase que los iconos del header (p. ej. `iconBtnClass`) */
  triggerClassName?: string;
  /** Tamaño del icono trigger */
  iconSize?: "md" | "sm";
  /**
   * `end`: ancla el menú al borde derecho del botón (vale cuando el icono está a la derecha).
   * `start`: ancla al borde izquierdo del botón — evita que el panel se salga por la izquierda si el botón está a la izquierda del header.
   */
  menuAlign?: "start" | "end";
};

export function SocialHeaderDropdown({
  triggerClassName,
  iconSize = "md",
  menuAlign = "end",
}: SocialHeaderDropdownProps) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  /** Altura máxima del panel (px) para no solapar el footer al hacer scroll */
  const [panelMaxPx, setPanelMaxPx] = useState<number | null>(null);
  /** 1 = opaco; baja suavemente cuando el hueco hacia el footer se estrecha */
  const [panelFade, setPanelFade] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  /** Solo el botón disparador — si usáramos el contenedor padre, al abrir el menú el rect incluiría el panel y rompería el cálculo hacia el footer */
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updatePanelMaxHeight = useCallback(() => {
    if (!open || !triggerRef.current) return;
    const triggerBottom = triggerRef.current.getBoundingClientRect().bottom;
    const panelTop = triggerBottom + 8;
    const vh = window.innerHeight;
    const footer = document.querySelector("footer");
    const footerTop = footer?.getBoundingClientRect().top ?? vh;
    const limitBottom = Math.min(footerTop - FOOTER_GAP, vh - 8);
    const available = limitBottom - panelTop;
    const softCap = Math.min(vh * 0.48, 304);
    /** Altura = hueco hasta el footer (sin invadirlo), limitada por softCap */
    const raw = Math.min(softCap, Math.max(0, available));
    const px = Math.round(raw);
    setPanelMaxPx(px > 0 ? px : 56);
    const fade = Math.max(0, Math.min(1, available / FOOTER_FADE_RANGE));
    setPanelFade(fade);
  }, [open]);

  const hidden =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/login");

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open || panelFade > 0.08) return;
    const id = window.setTimeout(() => setOpen(false), 480);
    return () => window.clearTimeout(id);
  }, [open, panelFade]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelMaxPx(null);
      setPanelFade(1);
      return;
    }
    updatePanelMaxHeight();
    window.addEventListener("scroll", updatePanelMaxHeight, { passive: true });
    window.addEventListener("resize", updatePanelMaxHeight);
    const footerEl = document.querySelector("footer");
    const ro = new ResizeObserver(() => updatePanelMaxHeight());
    if (footerEl) ro.observe(footerEl);
    return () => {
      window.removeEventListener("scroll", updatePanelMaxHeight);
      window.removeEventListener("resize", updatePanelMaxHeight);
      ro.disconnect();
    };
  }, [open, updatePanelMaxHeight]);

  if (hidden) return null;

  const iconClass = iconSize === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5";

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 shrink-0 items-center"
    >
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="header-social-dropdown"
        title="Redes sociales"
        onClick={() => setOpen((o) => !o)}
      >
        <Share2 className={iconClass} strokeWidth={1.5} aria-hidden />
        <span className="sr-only">Redes sociales</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="header-social-dropdown"
            role="menu"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: panelFade, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            transition={{
              opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
            }}
            style={{
              maxHeight: panelMaxPx != null ? panelMaxPx : undefined,
              pointerEvents: panelFade < 0.12 ? "none" : "auto",
            }}
            className={cn(
              "absolute top-full z-[60] mt-2 flex min-w-[220px] max-w-[min(calc(100vw-1.5rem),260px)] flex-col overflow-hidden",
              menuAlign === "start" ? "left-0 right-auto" : "left-auto right-0",
              "rounded-xl border border-white/20 py-1.5 text-white shadow-lg backdrop-blur-xl",
              "bg-brand-navy/72 ring-1 ring-brand-navy/40 supports-[backdrop-filter]:bg-brand-navy/62"
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/18 px-2.5 pb-2 pt-0.5">
              <p className="font-heading text-[9px] font-medium uppercase tracking-[0.22em] text-white/85">
                Síguenos
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "-m-0.5 shrink-0 rounded-md p-1.5 text-white/75 transition-colors",
                  "hover:text-white",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                )}
                aria-label="Cerrar panel de redes sociales"
              >
                <ChevronUp className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-1.5 pt-1.5" role="none">
              {SOCIAL_LINKS.map(({ id, label, href }) => {
                const Icon = iconById[id];
                return (
                  <li key={id} role="none">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-normal text-white/95 transition-colors hover:bg-white/12"
                      onClick={() => setOpen(false)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white backdrop-blur-sm">
                        <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="truncate">{label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

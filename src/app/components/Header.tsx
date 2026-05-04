import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePreviewCanvas } from "../../contexts/PreviewCanvasContext";
import { SocialNavIcons } from "./SocialNavIcons";
import { cn } from "./ui/utils";
import { VITERRA_NAV_ITEMS, isActiveNavPath } from "../config/siteNav";

/** Recorrido de scroll (px) para interpolar header (home e internas) */
const SCROLL_RANGE = 200;

const NAVY = { r: 20, g: 28, b: 46 } as const;

/** Opacidad máxima del fondo navy: <1 deja traslucir el fondo bajo el header */
const BG_ALPHA_MAX = 0.94;
/** Panel del menú hamburguesa (< lg): cristal arriba del todo; con scroll → mismo cuerpo que la barra. */
const MOBILE_MENU_BG_ALPHA_TOP = 0.48;

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function smoothstep01(t: number, e0: number, e1: number) {
  const u = clamp01((t - e0) / (e1 - e0));
  return u * u * (3 - 2 * u);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Íconos oficiales solo-marca (~1024×265); variantes `-alpha` = negro→transparente (script en repo). */
const MARK_ICON_MONO = "/images/branding/viterra-mark-mono-alpha.png";
const MARK_ICON_RED = "/images/branding/viterra-mark-red-alpha.png";

/** Marca blanca (hero) un poco más pequeña que la roja al hacer scroll */
const MARK_MONO_SCALE_FACTOR = 0.88;

/**
 * Caja fija + scale. La imagen ocupa el 100% del ancho de la caja para que `transform-origin: bottom center`
 * coincida con el centro del layout (si el PNG es más estrecho que la caja, object-fit no desplaza el origen).
 */
function ViterraMarkLeftHero({
  boxW,
  boxH,
  scale,
  className,
  enableTransformTransition = true,
}: {
  boxW: number;
  boxH: number;
  scale: number;
  className?: string;
  /** En móvil el `scale` es fijo: sin transición en `transform` (evita “respirar” al hacer scroll). */
  enableTransformTransition?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-end justify-center overflow-visible", className)}
      style={{ width: boxW, height: boxH }}
      aria-hidden
    >
      <img
        src={MARK_ICON_MONO}
        alt=""
        width={1024}
        height={264}
        decoding="async"
        className="block max-h-full object-contain"
        style={{
          width: "100%",
          height: boxH,
          maxHeight: boxH,
          objectPosition: "bottom center",
          transform: `scale(${scale})`,
          transformOrigin: "bottom center",
          transition: enableTransformTransition ? "transform 0.2s ease" : "none",
          opacity: 0.96,
        }}
      />
    </span>
  );
}

function ViterraMarkLeftScrolled({
  boxW,
  boxH,
  scale,
  className,
  enableTransformTransition = true,
}: {
  boxW: number;
  boxH: number;
  scale: number;
  className?: string;
  enableTransformTransition?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-end justify-center overflow-visible", className)}
      style={{ width: boxW, height: boxH }}
      aria-hidden
    >
      <img
        src={MARK_ICON_RED}
        alt=""
        width={1024}
        height={267}
        decoding="async"
        className="block max-h-full object-contain"
        style={{
          width: "100%",
          height: boxH,
          maxHeight: boxH,
          objectPosition: "bottom center",
          transform: `scale(${scale})`,
          transformOrigin: "bottom center",
          transition: enableTransformTransition ? "transform 0.2s ease" : "none",
          opacity: 0.96,
        }}
      />
    </span>
  );
}

export function Header() {
  const inPreviewCanvas = usePreviewCanvas();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollP, setScrollP] = useState(0);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isRentPage = location.pathname === "/renta";
  const isSalePage = location.pathname === "/venta";
  const isDevelopmentsPage = location.pathname === "/desarrollos";
  const isPropertiesSection = location.pathname.startsWith("/propiedades");
  const isServicesPage = location.pathname === "/servicios";
  const isContactPage = location.pathname === "/contacto";
  const isAboutPage = location.pathname === "/nosotros";
  /** Solo propiedades: lista/mapa sin hero “arriba del todo” como renta/venta — mantener barra compacta. Desarrollos tiene hero como el resto: usar scroll como `p`. */
  const lockHeaderInMode2 = isPropertiesSection;
  const useOverlayHeader =
    isHome || isRentPage || isSalePage || isDevelopmentsPage || isServicesPage || isContactPage || isAboutPage;
  const rafRef = useRef<number | null>(null);

  const readScroll = useCallback(() => {
    setScrollP(clamp01(window.scrollY / SCROLL_RANGE));
  }, []);

  useEffect(() => {
    readScroll();
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        readScroll();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [readScroll]);

  useEffect(() => {
    readScroll();
  }, [location.pathname, readScroll]);

  const p = lockHeaderInMode2 ? 1 : scrollP;

  /** 1 en la parte superior, 0 tras un poco de scroll — refuerzo del velo solo al inicio */
  const firstModeHero = 1 - smoothstep01(p, 0.02, 0.16);
  const heroVeilBoost = firstModeHero * 0.17;
  const gTop = Math.min(0.92, lerp(0.5, 0.22, p) + heroVeilBoost);
  const gMid = Math.min(0.88, lerp(0.38, 0.14, p) + heroVeilBoost * 0.9);
  const gBot = Math.min(0.78, lerp(0.2, 0.09, p) + heroVeilBoost * 0.72);

  const bgAlpha = lerp(0, BG_ALPHA_MAX, p);
  const blurPx = lerp(0, 18, p);
  const headerBgAlpha = bgAlpha;
  const shadowY = lerp(0, 14, p);
  const shadowBlur = lerp(0, 36, p);
  const shadowAlpha = lerp(0, 0.38, p);
  const borderAlpha = lerp(0.12, 0.14, p);

  const logoPadTop = lerp(22, 8, p);
  const logoPadBottom = lerp(10, 6, p);
  const titleSize = lerp(26, 17, p);
  const guionWhite = 1 - smoothstep01(p, 0.15, 0.55);
  const guionRed = smoothstep01(p, 0.2, 0.6);
  const subtitleOpacity = 1 - smoothstep01(p, 0.05, 0.42);
  const subtitleMaxH = lerp(40, 0, smoothstep01(p, 0.08, 0.45));
  const navRowH = lerp(52, 46, p);
  const navGap = lerp(32, 14, p);
  const navFontPx = lerp(13, 10.5, p);
  const navTrackEm = lerp(0.12, 0.16, p);
  const navLift = lerp(0, -3, p);

  const navCenterOpacity = 1 - smoothstep01(p, 0.38, 0.74);
  const navSplitOpacity = smoothstep01(p, 0.44, 0.82);
  const showCenterNav = navCenterOpacity > 0.04;
  const showSplitNav = navSplitOpacity > 0.04;

  /** Transición marca izquierda: blanco grande → rojo compacto (cruza con el scroll) */
  const compactLeftMark = smoothstep01(p, 0.2, 0.48);
  /** 0 = arriba del todo (marca grande); 1 = header compacto (marca pequeña) */
  const markShrink = smoothstep01(p, 0.05, 0.48);
  /** Escala 1 → ~0.52: mismo ancho de caja, el dibujo se reduce desde abajo al centro */
  const markScale = lerp(1, 0.52, markShrink);
  const markBoxW = 200;
  const markBoxH = 50;
  /**
   * Móvil/tablet (< lg): caja fija + escala fija para mono y rojo.
   * No usar `markScale` del scroll (eso anima el logo de escritorio): al mezclarlo con el crossfade
   * blanco→rojo el tamaño “respira” y el PNG rojo se ve desacomodado.
   */
  const markBoxWMobile = 104;
  const markBoxHMobile = 26;
  const MOBILE_HEADER_MARK_SCALE = 0.92 * MARK_MONO_SCALE_FACTOR;

  const navLinkClass =
    "font-normal uppercase text-white/85 hover:text-white transition-colors shrink-0";
  /** Modo 1 (nav centrada, inicio de scroll): subrayado blanco. Modo 2 (nav partida): rojo corporativo. */
  const navLinkActiveBase = "text-white font-semibold underline decoration-2 underline-offset-[7px]";
  const navLinkActiveClassCenter = `${navLinkActiveBase} decoration-white`;
  const navLinkActiveClassSplit = `${navLinkActiveBase} decoration-primary`;
  return (
    <header
      className={`left-0 right-0 z-50 w-full overflow-visible text-white pt-[env(safe-area-inset-top,0px)] ${
        useOverlayHeader ? "fixed top-0" : "sticky top-0"
      }`}
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundColor: `rgba(${NAVY.r},${NAVY.g},${NAVY.b},${headerBgAlpha})`,
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,${gTop.toFixed(3)}) 0%, rgba(0,0,0,${gMid.toFixed(3)}) 42%, rgba(0,0,0,${gBot.toFixed(3)}) 100%)`,
        backdropFilter: `saturate(140%) blur(${blurPx}px)`,
        WebkitBackdropFilter: `saturate(140%) blur(${blurPx}px)`,
        boxShadow: p > 0.02 ? `0 ${shadowY}px ${shadowBlur}px -10px rgba(0,0,0,${shadowAlpha})` : "none",
        borderBottom: `1px solid rgba(255,255,255,${borderAlpha})`,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn("relative overflow-x-visible transition-none", inPreviewCanvas ? "hidden" : "hidden lg:flex lg:justify-center")}
          style={{ paddingTop: `${logoPadTop}px`, paddingBottom: `${logoPadBottom}px` }}
        >
          <Link
            to="/"
            aria-label="Viterra Grupo Inmobiliario — Inicio"
            className="group relative flex w-full max-w-none justify-center overflow-visible"
          >
            <span className="absolute left-8 top-[calc(50%+12px)] z-10 -translate-y-1/2 overflow-visible sm:left-10">
              <span className="relative overflow-visible" style={{ width: markBoxW, height: markBoxH }}>
                <span
                  className="absolute inset-0 flex items-end justify-center overflow-visible transition-opacity duration-300 ease-out"
                  style={{ opacity: 1 - compactLeftMark, pointerEvents: compactLeftMark > 0.92 ? "none" : "auto" }}
                >
                  <ViterraMarkLeftHero
                    boxW={markBoxW}
                    boxH={markBoxH}
                    scale={markScale * MARK_MONO_SCALE_FACTOR}
                  />
                </span>
                <span
                  className="absolute inset-0 flex items-end justify-center overflow-visible transition-opacity duration-300 ease-out"
                  style={{ opacity: compactLeftMark, pointerEvents: compactLeftMark < 0.08 ? "none" : "auto" }}
                >
                  <ViterraMarkLeftScrolled boxW={markBoxW} boxH={markBoxH} scale={markScale} />
                </span>
              </span>
            </span>
            <span className="inline-flex min-w-[11rem] max-w-[16rem] flex-col items-stretch text-center">
              <span
                className="text-center font-light leading-tight text-white"
                style={{ fontSize: `${titleSize}px`, letterSpacing: `${lerp(0.18, 0.2, p)}em` }}
              >
                VITERRA
              </span>
              <span className="relative my-2 h-px w-full shrink-0 overflow-hidden rounded-full" aria-hidden>
                <span
                  className="absolute inset-0 origin-left bg-white"
                  style={{ opacity: guionWhite, transform: `scaleX(${lerp(1, 0.35, smoothstep01(p, 0.2, 0.55))})` }}
                />
                <span
                  className="absolute inset-0 origin-left bg-[#C8102E]"
                  style={{ opacity: guionRed, transform: `scaleX(${lerp(0.2, 1, smoothstep01(p, 0.15, 0.5))})` }}
                />
              </span>
              <div className="overflow-hidden text-center" style={{ maxHeight: `${subtitleMaxH}px`, opacity: subtitleOpacity }}>
                <p className="pt-0.5 text-[10px] font-normal uppercase tracking-[0.22em] text-white/70">Grupo Inmobiliario</p>
              </div>
            </span>
          </Link>
        </div>

        <div
          className={cn("relative overflow-visible border-t border-white/10", inPreviewCanvas ? "hidden" : "hidden lg:block")}
          style={{ minHeight: `${navRowH}px` }}
        >
          {/* Un solo bloque de redes: no depende del crossfade nav centrado ↔ partido */}
          <div className="pointer-events-none absolute inset-0 z-[55] flex items-stretch">
            <div className="pointer-events-auto flex min-w-0 shrink-0 items-center justify-start self-stretch pl-1 pr-2">
              <SocialNavIcons iconSize="md" />
            </div>
          </div>
          <nav
            className="absolute inset-0 flex items-stretch px-1 pl-[13.5rem] sm:pl-56"
            style={{
              opacity: navCenterOpacity,
              pointerEvents: showCenterNav ? "auto" : "none",
              transform: `translateY(${navLift}px)`,
            }}
            aria-hidden={!showCenterNav}
          >
            <div className="flex min-w-0 flex-1 items-center justify-center" style={{ gap: `${navGap}px` }}>
              {VITERRA_NAV_ITEMS.map(([to, label]) => {
                const active = isActiveNavPath(location.pathname, to);
                return (
                  <Link
                    key={`c-${to}`}
                    to={to}
                    className={cn(navLinkClass, active && navLinkActiveClassCenter)}
                    style={{ fontSize: `${navFontPx}px`, letterSpacing: `${navTrackEm}em` }}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="flex w-20 shrink-0 items-center justify-end gap-0.5 self-stretch" />
          </nav>

          <nav
            className="absolute inset-0 flex items-stretch justify-between px-1 pl-[13.5rem] sm:pl-56"
            style={{
              opacity: navSplitOpacity,
              pointerEvents: showSplitNav ? "auto" : "none",
              transform: `translateY(${navLift}px)`,
            }}
            aria-hidden={!showSplitNav}
          >
            <div className="flex min-w-0 items-center gap-4 self-stretch xl:gap-5">
              {VITERRA_NAV_ITEMS.slice(0, 3).map(([to, label]) => {
                const active = isActiveNavPath(location.pathname, to);
                return (
                  <Link
                    key={`l-${to}`}
                    to={to}
                    className={cn(navLinkClass, "text-white/90", active && navLinkActiveClassSplit)}
                    style={{ fontSize: `${navFontPx}px`, letterSpacing: `${navTrackEm}em` }}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="w-28 shrink-0" aria-hidden />
            <div className="flex min-w-0 items-center justify-end gap-4 self-stretch xl:gap-5">
              {VITERRA_NAV_ITEMS.slice(3).map(([to, label]) => {
                const active = isActiveNavPath(location.pathname, to);
                return (
                  <Link
                    key={`r-${to}`}
                    to={to}
                    className={cn(navLinkClass, "text-white/90", active && navLinkActiveClassSplit)}
                    style={{ fontSize: `${navFontPx}px`, letterSpacing: `${navTrackEm}em` }}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <div
          className={cn(
            "relative grid min-h-[52px] grid-cols-3 items-center gap-2 border-t-0 px-2 py-1.5 sm:px-3",
            inPreviewCanvas ? "" : "lg:hidden"
          )}
        >
          <Link
            to="/"
            className="relative z-[56] inline-flex min-w-0 max-w-full flex-col items-start justify-center gap-0.5 justify-self-start"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Viterra Grupo Inmobiliario — Inicio"
          >
            <span className="font-heading truncate text-[13px] font-medium tracking-[0.16em] text-white sm:tracking-[0.18em]">
              VITERRA
            </span>
            <span className="h-px w-7 shrink-0 bg-[#C8102E] sm:w-8" aria-hidden />
          </Link>
          <div className="relative z-[52] flex min-w-0 items-center justify-center justify-self-center">
            <Link
              to="/"
              className="flex shrink-0 items-center justify-center overflow-visible rounded-sm"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Viterra Grupo Inmobiliario — Inicio"
            >
              <span
                className="relative shrink-0 overflow-hidden rounded-sm"
                style={{ width: markBoxWMobile, height: markBoxHMobile }}
              >
                <span
                  className="absolute inset-0 flex items-end justify-center overflow-hidden transition-opacity duration-200 ease-out"
                  style={{ opacity: 1 - compactLeftMark, pointerEvents: compactLeftMark > 0.92 ? "none" : "auto" }}
                >
                  <ViterraMarkLeftHero
                    boxW={markBoxWMobile}
                    boxH={markBoxHMobile}
                    scale={MOBILE_HEADER_MARK_SCALE}
                    enableTransformTransition={false}
                  />
                </span>
                <span
                  className="absolute inset-0 flex items-end justify-center overflow-hidden transition-opacity duration-200 ease-out"
                  style={{ opacity: compactLeftMark, pointerEvents: compactLeftMark < 0.08 ? "none" : "auto" }}
                >
                  <ViterraMarkLeftScrolled
                    boxW={markBoxWMobile}
                    boxH={markBoxHMobile}
                    scale={MOBILE_HEADER_MARK_SCALE}
                    enableTransformTransition={false}
                  />
                </span>
              </span>
            </Link>
          </div>
          <div className="relative z-[56] flex min-w-0 max-w-full items-center justify-end gap-0.5 justify-self-end sm:gap-1">
            <div className="min-w-0 max-w-[min(100%,11.5rem)] overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-w-none">
              <SocialNavIcons iconSize="xs" />
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="shrink-0 p-2 text-white"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          className={cn(
            "max-h-[min(70vh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5rem))] overflow-y-auto overscroll-contain border-t border-white/10",
            inPreviewCanvas ? "block" : "lg:hidden"
          )}
          style={{
            backgroundColor: `rgba(${NAVY.r},${NAVY.g},${NAVY.b},${lerp(MOBILE_MENU_BG_ALPHA_TOP, BG_ALPHA_MAX, p)})`,
            backdropFilter: `saturate(140%) blur(${lerp(20, 16, p)}px)`,
            WebkitBackdropFilter: `saturate(140%) blur(${lerp(20, 16, p)}px)`,
            transition: "background-color 0.35s ease, backdrop-filter 0.35s ease, -webkit-backdrop-filter 0.35s ease",
          }}
        >
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-5 sm:px-6 sm:py-6">
            {VITERRA_NAV_ITEMS.map(([to, label]) => {
              const active = isActiveNavPath(location.pathname, to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block border-l-[3px] py-3 pl-4 text-sm uppercase tracking-[0.14em] transition-colors",
                    active
                      ? "border-primary font-semibold text-white"
                      : "border-transparent text-white/90 hover:text-white"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

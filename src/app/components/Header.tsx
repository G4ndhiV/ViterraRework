import { Link, useLocation } from "react-router";
import { Menu, X, Search, User } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePreviewCanvas } from "../../contexts/PreviewCanvasContext";
import { cn } from "./ui/utils";

/** Recorrido de scroll (px) para interpolar header (home e internas) */
const SCROLL_RANGE = 200;

const navItems = [
  ["/", "INICIO"],
  ["/renta", "RENTAR"],
  ["/venta", "COMPRAR"],
  ["/desarrollos", "DESARROLLOS"],
  ["/servicios", "SERVICIOS"],
  ["/nosotros", "ACERCA DE"],
] as const;

const NAVY = { r: 20, g: 28, b: 46 } as const;

/** Opacidad máxima del fondo navy: <1 deja traslucir el fondo bajo el header */
const BG_ALPHA_MAX = 0.94;

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

export function Header() {
  const inPreviewCanvas = usePreviewCanvas();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollP, setScrollP] = useState(0);
  const location = useLocation();
  const isHome = location.pathname === "/";
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

  const p = scrollP;

  useEffect(() => {
    if (scrollP > 0.92) setIsMenuOpen(false);
  }, [scrollP]);

  /** 1 en la parte superior, 0 tras un poco de scroll — refuerzo del velo solo al inicio */
  const firstModeHero = 1 - smoothstep01(p, 0.02, 0.16);
  const heroVeilBoost = firstModeHero * 0.17;
  const gTop = Math.min(0.92, lerp(0.5, 0.22, p) + heroVeilBoost);
  const gMid = Math.min(0.88, lerp(0.38, 0.14, p) + heroVeilBoost * 0.9);
  const gBot = Math.min(0.78, lerp(0.2, 0.09, p) + heroVeilBoost * 0.72);

  const bgAlpha = lerp(0, BG_ALPHA_MAX, p);
  const blurPx = lerp(0, 18, p);
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

  const navLinkClass =
    "font-normal uppercase text-white/85 hover:text-white transition-colors shrink-0";
  const iconBtnClass = "p-2 text-white/80 hover:text-white rounded-sm";

  return (
    <header
      className={`left-0 right-0 z-50 w-full text-white pt-[env(safe-area-inset-top,0px)] ${
        isHome ? "fixed top-0" : "sticky top-0"
      }`}
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundColor: `rgba(${NAVY.r},${NAVY.g},${NAVY.b},${bgAlpha})`,
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,${gTop.toFixed(3)}) 0%, rgba(0,0,0,${gMid.toFixed(3)}) 42%, rgba(0,0,0,${gBot.toFixed(3)}) 100%)`,
        backdropFilter: `saturate(140%) blur(${blurPx}px)`,
        WebkitBackdropFilter: `saturate(140%) blur(${blurPx}px)`,
        boxShadow: p > 0.02 ? `0 ${shadowY}px ${shadowBlur}px -10px rgba(0,0,0,${shadowAlpha})` : "none",
        borderBottom: `1px solid rgba(255,255,255,${borderAlpha})`,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn("justify-center transition-none", inPreviewCanvas ? "hidden" : "hidden lg:flex")}
          style={{ paddingTop: `${logoPadTop}px`, paddingBottom: `${logoPadBottom}px` }}
        >
          <Link to="/" className="group inline-flex min-w-[11rem] max-w-[16rem] flex-col items-stretch text-center">
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
          </Link>
        </div>

        <div
          className={cn("relative border-t border-white/10", inPreviewCanvas ? "hidden" : "hidden lg:block")}
          style={{ minHeight: `${navRowH}px` }}
        >
          <nav
            className="absolute inset-0 flex items-center px-1"
            style={{
              opacity: navCenterOpacity,
              pointerEvents: showCenterNav ? "auto" : "none",
              transform: `translateY(${navLift}px)`,
            }}
            aria-hidden={!showCenterNav}
          >
            <div className="w-20 shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center justify-center" style={{ gap: `${navGap}px` }}>
              {navItems.map(([to, label]) => (
                <Link key={`c-${to}`} to={to} className={navLinkClass} style={{ fontSize: `${navFontPx}px`, letterSpacing: `${navTrackEm}em` }}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex w-20 shrink-0 items-center justify-end gap-0.5">
              <button type="button" className={iconBtnClass} aria-label="Buscar">
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <button type="button" className={iconBtnClass} aria-label="Cuenta">
                <User className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </nav>

          <nav
            className="absolute inset-0 flex items-center justify-between px-1"
            style={{
              opacity: navSplitOpacity,
              pointerEvents: showSplitNav ? "auto" : "none",
              transform: `translateY(${navLift}px)`,
            }}
            aria-hidden={!showSplitNav}
          >
            <div className="flex min-w-0 items-center gap-4 xl:gap-5">
              <button type="button" className="-ml-1 shrink-0 p-2 text-white/85 hover:text-white" aria-label="Buscar">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
              {navItems.slice(0, 3).map(([to, label]) => (
                <Link key={`l-${to}`} to={to} className={`${navLinkClass} text-white/90`} style={{ fontSize: `${navFontPx}px`, letterSpacing: `${navTrackEm}em` }}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="w-28 shrink-0" aria-hidden />
            <div className="flex min-w-0 items-center justify-end gap-4 xl:gap-5">
              {navItems.slice(3).map(([to, label]) => (
                <Link key={`r-${to}`} to={to} className={`${navLinkClass} text-white/90`} style={{ fontSize: `${navFontPx}px`, letterSpacing: `${navTrackEm}em` }}>
                  {label}
                </Link>
              ))}
              <button type="button" className="shrink-0 p-2 text-white/85 hover:text-white" aria-label="Cuenta">
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </div>
          </nav>
        </div>

        <div
          className={cn("flex items-center justify-between gap-3 border-t-0", inPreviewCanvas ? "flex" : "flex lg:hidden")}
          style={{
            minHeight: `${lerp(52, 48, p)}px`,
            paddingTop: `${lerp(6, 4, p)}px`,
            paddingBottom: `${lerp(6, 4, p)}px`,
          }}
        >
          <Link to="/" className="inline-flex min-w-0 flex-col items-start gap-1" onClick={() => setIsMenuOpen(false)}>
            <span className="font-heading truncate font-medium tracking-[0.18em] text-white" style={{ fontSize: `${lerp(15, 13, p)}px` }}>
              VITERRA
            </span>
            <span className="h-px w-8 bg-[#C8102E]" style={{ opacity: lerp(0.85, 1, p) }} aria-hidden />
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <button type="button" className="p-2 text-white/85 hover:text-white" aria-label="Buscar">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-white" aria-expanded={isMenuOpen}>
              {isMenuOpen ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          className={cn(
            "max-h-[min(70vh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5rem))] overflow-y-auto overscroll-contain border-t border-white/10 backdrop-blur-md",
            inPreviewCanvas ? "block" : "lg:hidden"
          )}
          style={{
            backgroundColor: `rgba(${NAVY.r},${NAVY.g},${NAVY.b},${lerp(0.86, 0.92, p)})`,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-5 sm:px-6 sm:py-6">
            {navItems.map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setIsMenuOpen(false)} className="block py-3 text-sm uppercase tracking-[0.14em] text-white/90">
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

import { useCallback, useEffect } from "react";
import { useLocation } from "react-router";

function scrollWindowToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Sube la ventana al inicio cuando cambia la URL, y también al hacer clic en enlaces internos
 * (incluido mismo path, p. ej. "Inicio" estando ya en inicio).
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    scrollWindowToTop();
  }, [pathname, search, hash]);

  const onInternalLinkClick = useCallback((e: MouseEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const el = e.target as HTMLElement | null;
    if (!el) return;

    const anchor = el.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const raw = anchor.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;

    let url: URL;
    try {
      url = new URL(anchor.href, window.location.origin);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;

    // Tras el enrutado del cliente, subir (setTimeout cubre mismo path y navegación async)
    window.setTimeout(() => {
      scrollWindowToTop();
    }, 0);
  }, []);

  useEffect(() => {
    document.addEventListener("click", onInternalLinkClick, true);
    return () => document.removeEventListener("click", onInternalLinkClick, true);
  }, [onInternalLinkClick]);

  return null;
}

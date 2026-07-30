/** Google Analytics 4 (gtag.js). Solo se inyecta en producción. */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_MEASUREMENT_ID = "G-X3Y9JCYFZM";

function measurementId(): string {
  const fromEnv = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
  return fromEnv || DEFAULT_MEASUREMENT_ID;
}

function shouldTrack(): boolean {
  return Boolean(import.meta.env.PROD);
}

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

let initialized = false;

/** Inyecta gtag.js y configura el Measurement ID (una sola vez, solo en prod). */
export function initGoogleAnalytics(): void {
  if (initialized || !shouldTrack() || typeof document === "undefined") return;

  const id = measurementId();
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  // SPA: page_view manual en cambios de ruta
  window.gtag("config", id, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  initialized = true;
}

/** Envía page_view para la ruta actual (omite /admin). */
export function trackPageView(path: string): void {
  if (!shouldTrack()) return;
  if (isAdminPath(path)) return;

  initGoogleAnalytics();
  if (!window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : path,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  });
}

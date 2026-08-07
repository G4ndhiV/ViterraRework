/**
 * Google Analytics 4 (gtag.js) + Google Tag Manager.
 * Solo se inyectan en producción.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_MEASUREMENT_ID = "G-X3Y9JCYFZM";
const DEFAULT_GTM_ID = "GTM-NPFMGP4H";

function measurementId(): string {
  const fromEnv = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
  return fromEnv || DEFAULT_MEASUREMENT_ID;
}

function gtmId(): string {
  const fromEnv = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim();
  return fromEnv || DEFAULT_GTM_ID;
}

function shouldTrack(): boolean {
  return Boolean(import.meta.env.PROD);
}

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

let gtmInitialized = false;
let gaInitialized = false;

/**
 * Instalación oficial de GTM: script en head + noscript al inicio de body.
 * @see https://developers.google.com/tag-platform/tag-manager/web
 */
export function initGoogleTagManager(): void {
  if (gtmInitialized || !shouldTrack() || typeof document === "undefined") return;

  const id = gtmId();
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
  if (!firstScript) document.head.appendChild(script);

  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  iframe.title = "Google Tag Manager";
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);

  gtmInitialized = true;
}

/** Inyecta gtag.js y configura el Measurement ID (una sola vez, solo en prod). */
export function initGoogleAnalytics(): void {
  if (gaInitialized || !shouldTrack() || typeof document === "undefined") return;

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

  gaInitialized = true;
}

/** Envía page_view para la ruta actual (omite /admin). Notifica gtag y dataLayer (GTM). */
export function trackPageView(path: string): void {
  if (!shouldTrack()) return;
  if (isAdminPath(path)) return;

  initGoogleTagManager();
  initGoogleAnalytics();

  const pageLocation = typeof window !== "undefined" ? window.location.href : path;
  const pageTitle = typeof document !== "undefined" ? document.title : undefined;

  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: pageLocation,
      page_title: pageTitle,
    });
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "virtualPageview",
    page_path: path,
    page_location: pageLocation,
    page_title: pageTitle,
  });
}

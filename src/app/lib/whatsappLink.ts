import { formatPhoneForDisplay } from "./phoneLink";

function isWhatsappHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "wa.me" || h.endsWith(".wa.me") || h.includes("whatsapp.com");
}

function digitsFromInput(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** URL https guardada es de WhatsApp (no Maps ni otros dominios). */
export function isWhatsappHttpUrl(url: string): boolean {
  try {
    return isWhatsappHostname(new URL(url.trim()).hostname);
  } catch {
    return false;
  }
}

/** Normaliza enlace WhatsApp para guardar en BD (URL completa preferida). */
export function normalizeWhatsappLinkForStorage(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    if (!isWhatsappHttpUrl(t)) return null;
    return t;
  }
  const digits = digitsFromInput(t);
  if (digits.length >= 10) return `https://wa.me/${digits}`;
  return null;
}

/** Href para botón en ficha pública: usa liga guardada, dígitos legacy o fallback del sitio. */
export function resolveWhatsappHref(
  stored: string | undefined,
  fallbackHref: string,
  message?: string,
): string {
  const t = stored?.trim();
  if (t && /^https?:\/\//i.test(t) && isWhatsappHttpUrl(t)) {
    try {
      const u = new URL(t);
      if (message && !u.searchParams.has("text")) {
        u.searchParams.set("text", message);
        return u.toString();
      }
      return t;
    } catch {
      return t;
    }
  }
  if (t) {
    const digits = digitsFromInput(t);
    if (digits.length >= 10) {
      const base = `https://wa.me/${digits}`;
      return message ? `${base}?text=${encodeURIComponent(message)}` : base;
    }
  }
  if (fallbackHref && message && fallbackHref.includes("wa.me")) {
    try {
      const u = new URL(fallbackHref);
      if (!u.searchParams.has("text")) {
        u.searchParams.set("text", message);
        return u.toString();
      }
    } catch {
      /* mantener fallback */
    }
  }
  return fallbackHref || "#";
}

/** Número o etiqueta corta para mostrar junto al botón WhatsApp. */
export function whatsappDisplayLabel(stored: string | undefined | null): string {
  const t = stored?.trim() ?? "";
  if (!t) return "";
  if (/^https?:\/\//i.test(t) && isWhatsappHttpUrl(t)) {
    try {
      const u = new URL(t);
      const fromPath = u.pathname.replace(/\D/g, "");
      if (fromPath.length >= 10) return formatPhoneForDisplay(fromPath);
    } catch {
      /* ignore */
    }
    return "Enlace WhatsApp";
  }
  return formatPhoneForDisplay(t) || t;
}

export function isValidWhatsappLinkInput(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return isWhatsappHttpUrl(t);
  return digitsFromInput(t).length >= 10;
}

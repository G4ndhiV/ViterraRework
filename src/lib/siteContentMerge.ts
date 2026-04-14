import { DEFAULT_SITE_CONTENT, type SiteContent } from "../data/siteContent";
import { deepMerge } from "./deepMerge";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Garantiza que una sección tenga todos los campos de DEFAULT (listas, textos, etc.). */
export function mergeSiteSection<K extends keyof SiteContent>(key: K, section: unknown): SiteContent[K] {
  const patch: Record<string, unknown> = isPlainObject(section) ? section : {};
  const merged = deepMerge(
    DEFAULT_SITE_CONTENT[key] as unknown as Record<string, unknown>,
    patch
  ) as SiteContent[K];

  if (key === "services") {
    const svc = merged as SiteContent["services"];
    const fallback = DEFAULT_SITE_CONTENT.services.cards;
    if (!Array.isArray(svc.cards)) {
      return { ...svc, cards: fallback } as SiteContent[K];
    }
  }

  return merged;
}

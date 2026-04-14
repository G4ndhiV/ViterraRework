import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SITE_CONTENT, SITE_CONTENT_KEY, type SiteContent } from "../data/siteContent";
import { deepMerge } from "../lib/deepMerge";
import { mergeSiteSection } from "../lib/siteContentMerge";

type SiteContentContextValue = {
  content: SiteContent;
  /** Reemplaza una sección completa (tras editar en admin) */
  setSection: <K extends keyof SiteContent>(key: K, section: SiteContent[K]) => void;
  /** Fusiona parcialmente una sección */
  patchSection: <K extends keyof SiteContent>(key: K, partial: Partial<SiteContent[K]>) => void;
  resetToDefaults: () => void;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

function loadMerged(): SiteContent {
  try {
    const raw = localStorage.getItem(SITE_CONTENT_KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    const first = deepMerge(DEFAULT_SITE_CONTENT as Record<string, unknown>, parsed as Record<string, unknown>) as SiteContent;
    const keys = Object.keys(DEFAULT_SITE_CONTENT) as (keyof SiteContent)[];
    const repaired = { ...first };
    for (const key of keys) {
      repaired[key] = mergeSiteSection(key, first[key]);
    }
    return repaired;
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(loadMerged);

  useEffect(() => {
    setContent(loadMerged());
  }, []);

  const persist = useCallback((next: SiteContent) => {
    localStorage.setItem(SITE_CONTENT_KEY, JSON.stringify(next));
    setContent(next);
  }, []);

  const setSection = useCallback(
    <K extends keyof SiteContent>(key: K, section: SiteContent[K]) => {
      const next = { ...content, [key]: mergeSiteSection(key, section) };
      persist(next);
    },
    [content, persist]
  );

  const patchSection = useCallback(
    <K extends keyof SiteContent>(key: K, partial: Partial<SiteContent[K]>) => {
      const next = {
        ...content,
        [key]: mergeSiteSection(key, {
          ...(content[key] != null ? (content[key] as object) : {}),
          ...partial,
        }),
      };
      persist(next);
    },
    [content, persist]
  );

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(SITE_CONTENT_KEY);
    setContent(DEFAULT_SITE_CONTENT);
  }, []);

  const value = useMemo(
    () => ({ content, setSection, patchSection, resetToDefaults }),
    [content, setSection, patchSection, resetToDefaults]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/**
 * Sustituye solo la lectura de `content` (p. ej. borrador en vista previa del admin).
 * Las acciones (setSection, etc.) siguen siendo las del padre.
 */
export function SiteContentReadOverride({
  content: overrideContent,
  children,
}: {
  content: SiteContent;
  children: ReactNode;
}) {
  const parent = useSiteContent();
  const value = useMemo(
    () => ({ ...parent, content: overrideContent }),
    [parent, overrideContent]
  );
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error("useSiteContent debe usarse dentro de SiteContentProvider");
  return ctx;
}

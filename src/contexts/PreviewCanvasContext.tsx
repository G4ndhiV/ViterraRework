import { createContext, useContext, type ReactNode } from "react";

const PreviewCanvasContext = createContext(false);

/** Activo dentro de la vista previa del admin (el ancho real es estrecho; no usar breakpoints de viewport). */
export function PreviewCanvasProvider({ children }: { children: ReactNode }) {
  return <PreviewCanvasContext.Provider value={true}>{children}</PreviewCanvasContext.Provider>;
}

export function usePreviewCanvas() {
  return useContext(PreviewCanvasContext);
}

/**
 * Los breakpoints `md:`/`lg:` de Tailwind miran el viewport del navegador, no el panel de la vista previa.
 * Con ventana ancha, las grillas multi-columna se activan dentro de un iframe/columna estrecha y se solapan.
 * Usar estas clases solo dentro de páginas renderizadas en `SitePreviewCanvas`.
 */
export function usePreviewLayout() {
  const preview = usePreviewCanvas();
  return {
    preview,
    /** Grillas: en preview siempre una columna. `responsiveCols` p. ej. `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` */
    gridCols: (responsiveCols: string) => (preview ? "grid-cols-1" : responsiveCols),
    /** `lg:col-span-*` en preview debe ser una sola columna */
    colSpan: (responsive: string) => (preview ? "col-span-1" : responsive),
    /** Flex: en preview apilar (evita filas comprimidas) */
    flexStack: (responsive: string) => (preview ? "flex-col" : responsive),
  };
}

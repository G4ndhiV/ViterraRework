import type { CSSProperties } from "react";

/** Colores por defecto para etapas incorporadas (hex #RRGGBB) */
export const DEFAULT_BUILTIN_STAGE_HEX: Record<string, string> = {
  nuevo: "#64748b",
  contactado: "#d97706",
  calificado: "#0284c7",
  negociacion: "#7c3aed",
  cerrado: "#16a34a",
  perdido: "#94a3b8",
};

export const DEFAULT_CUSTOM_STAGE_HEX = "#6366f1";

export const STAGE_COLORS_STORAGE_KEY = "viterra_kanban_stage_colors";

export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function normalizeHex(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  return m ? `#${m[1].toLowerCase()}` : DEFAULT_CUSTOM_STAGE_HEX;
}

/** Chips / selects: fondo y borde suaves a partir del acento */
export function stageHexToChipStyle(hex: string): CSSProperties {
  const rgb = parseHex(hex);
  if (!rgb) return {};
  const { r, g, b } = rgb;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.13)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.42)`,
    borderWidth: 1,
    borderStyle: "solid",
    color: "#0f172a",
  };
}

/** Cabecera del botón en vista lista agrupada */
export function stageHexToListHeaderStyle(hex: string): CSSProperties {
  const h = normalizeHex(hex);
  const rgb = parseHex(h);
  const tintL = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.16)` : "rgba(99, 102, 241, 0.16)";
  const tintR = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)` : "rgba(99, 102, 241, 0.06)";
  return {
    borderLeftColor: h,
    background: `linear-gradient(to right, ${tintL}, #ffffff 48%, ${tintR})`,
  };
}

/** Cabecera expandida de columna Kanban */
export function stageHexToKanbanHeaderStyle(hex: string): CSSProperties {
  const h = normalizeHex(hex);
  const rgb = parseHex(h);
  if (!rgb) {
    return {
      background: "linear-gradient(to bottom, rgb(241 245 249), rgb(255 255 255))",
      borderBottomColor: "rgba(148, 163, 184, 0.35)",
    };
  }
  const { r, g, b } = rgb;
  return {
    background: `linear-gradient(to bottom, rgba(${r},${g},${b},0.26), rgba(255,255,255,0.97))`,
    borderBottomColor: `rgba(${r},${g},${b},0.35)`,
  };
}

export const LIST_STAGE_HEADER_BUTTON_CLASSES =
  "flex w-full items-center gap-3 border-0 px-3 py-3.5 text-left shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)] transition-[filter,box-shadow] sm:gap-4 sm:px-5 sm:py-4 hover:brightness-[1.02] hover:shadow-[inset_0_-1px_0_rgba(15,23,42,0.08),0_4px_20px_-8px_rgba(20,28,46,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 border-l-[4px] border-solid";

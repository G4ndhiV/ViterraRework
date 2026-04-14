import type { SiteContent } from "../../../../data/siteContent";

export type SiteKey = keyof SiteContent;

/** Bloques alineados con `sectionId` en formularios y `PreviewSectionChrome` en páginas */
export const EDITOR_PAGE_BLOCKS: Record<SiteKey, { id: string; label: string }[]> = {
  home: [
    { id: "home-hero", label: "Portada principal" },
    { id: "home-search", label: "Búsqueda" },
    { id: "home-selection", label: "Selección de propiedades" },
    { id: "home-experience", label: "Experiencia" },
    { id: "home-closing", label: "Cierre" },
  ],
  contact: [
    { id: "contact-hero", label: "Cabecera" },
    { id: "contact-info", label: "Datos de contacto" },
    { id: "contact-whatsapp", label: "WhatsApp" },
    { id: "contact-form", label: "Formulario" },
    { id: "contact-map", label: "Mapa" },
  ],
  services: [
    { id: "services-hero", label: "Cabecera" },
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `services-card-${i}`,
      label: `Tarjeta ${i + 1}`,
    })),
    { id: "services-cta", label: "Llamado a la acción" },
  ],
  about: [
    { id: "about-hero", label: "Cabecera" },
    { id: "about-story", label: "Historia" },
    { id: "about-mission", label: "Misión y visión" },
    { id: "about-values", label: "Valores" },
    { id: "about-stats", label: "Cifras" },
    { id: "about-timeline", label: "Línea de tiempo" },
    { id: "about-team", label: "Equipo" },
  ],
  developments: [
    { id: "dev-hero", label: "Cabecera" },
    { id: "dev-featured", label: "Proyectos destacados (títulos)" },
  ],
};

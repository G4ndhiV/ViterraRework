/**
 * Diccionarios del chrome de UI (botones, etiquetas, encabezados fijos).
 *
 * NO incluye el contenido editable desde el admin —eso vive en
 * `site_content_sections` por idioma— ni el texto del catálogo, que viene del
 * sync de Tokko.
 *
 * `es` es la fuente de verdad: `en` está tipado como `Record<TranslationKey,
 * string>`, así que si se agrega una clave en español y se olvida en inglés,
 * `tsc` falla en vez de mostrar la clave cruda en producción.
 */
export const es = {
  /* Navegación principal */
  "nav.home": "INICIO",
  "nav.rent": "RENTAR",
  "nav.buy": "COMPRAR",
  "nav.developments": "DESARROLLOS",
  "nav.services": "SERVICIOS",
  "nav.about": "NOSOTROS",
  "nav.contact": "CONTACTO",

  /* Selector de idioma */
  "locale.switchLabel": "Cambiar idioma",
  "locale.es": "Español",
  "locale.en": "English",

  /* Bloque de contacto de las fichas */
  "contact.call": "Llamar",
  "contact.whatsapp": "WhatsApp",
  "contact.phone": "Teléfono",
  "contact.responsible": "Responsable",
  "contact.scheduleVisit": "Agendar visita",
  "contact.contactAdvisor": "Contactar asesor",

  /* Mensajes precargados de WhatsApp */
  "wa.propertyInterest": "Hola, me interesa la propiedad {title}.",
  "wa.developmentInterest": "Hola, me interesa el desarrollo {name}.",
  "wa.reference": "Referencia: {code}.",
  "wa.moreInfo": "¿Podrían darme más información?",
  "wa.scheduleVisit": "Me gustaría agendar una visita.",
  "wa.listingLink": "Ficha: {url}",

  /* Estados genéricos */
  "common.loading": "Cargando…",
  "common.notFound": "No encontrado",
  "common.seeMore": "Ver más",
  "common.seeLess": "Ver menos",
} as const;

export type TranslationKey = keyof typeof es;

export const en: Record<TranslationKey, string> = {
  "nav.home": "HOME",
  "nav.rent": "RENT",
  "nav.buy": "BUY",
  "nav.developments": "DEVELOPMENTS",
  "nav.services": "SERVICES",
  "nav.about": "ABOUT US",
  "nav.contact": "CONTACT",

  "locale.switchLabel": "Change language",
  "locale.es": "Español",
  "locale.en": "English",

  "contact.call": "Call",
  "contact.whatsapp": "WhatsApp",
  "contact.phone": "Phone",
  "contact.responsible": "Contact",
  "contact.scheduleVisit": "Schedule a visit",
  "contact.contactAdvisor": "Contact an advisor",

  "wa.propertyInterest": "Hi, I'm interested in the property {title}.",
  "wa.developmentInterest": "Hi, I'm interested in the development {name}.",
  "wa.reference": "Reference: {code}.",
  "wa.moreInfo": "Could you send me more information?",
  "wa.scheduleVisit": "I'd like to schedule a visit.",
  "wa.listingLink": "Listing: {url}",

  "common.loading": "Loading…",
  "common.notFound": "Not found",
  "common.seeMore": "See more",
  "common.seeLess": "See less",
};

export const DICTIONARIES = { es, en } as const;

/** Sustituye `{placeholder}` por los valores dados. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

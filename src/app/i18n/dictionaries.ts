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
  "wa.listingLabel": "Ficha",

  /* Secciones de características del catálogo */
  "catalog.amenities": "Amenidades",
  "catalog.services": "Servicios",
  "catalog.additionalFeatures": "Características adicionales",

  /* Tarjetas de propiedad */
  "card.bedrooms": "Recámaras",
  "card.bathrooms": "Baños",
  "card.bedroomsShort": "hab.",
  "card.bathroomsShort": "baños",
  "card.seeDetails": "Ver detalles",
  "card.perMonth": "/ mes",
  "card.priceLabel": "Precio",
  "card.saleSuffix": "venta",
  "card.dualOperation": "Se puede comprar o rentar",

  /* Portada */
  "home.instagramCaptionFallback": "Descubre más detalles en nuestra publicación de Instagram.",
  "home.instagramAlt": "Publicación de Instagram",
  "home.mapLoading": "Cargando mapa...",
  "home.mapLoadingDetail": "Cargando mapa y ubicaciones del catálogo...",
  "home.mapCount": "{count} propiedades",
  "home.mapCountOne": "1 propiedad",
  "home.featuredError":
    "No pudimos cargar las propiedades destacadas. Comprueba tu conexión e inténtalo de nuevo.",
  "home.featuredEmpty": "No hay propiedades destacadas en este momento.",

  /* Buscador y listados */
  "search.operationLabel": "Operación",
  "search.operationSale": "Venta",
  "search.operationRent": "Renta",
  "search.operationGroupLabel": "Venta o renta",
  "search.statusLabel": "Estado",
  "search.typeFieldLabel": "Tipo",
  "search.typeAll": "Todos",
  "search.typeLoading": "Cargando tipos…",
  "search.locationFieldLabel": "Ubicación o palabra clave",
  "search.hideAdvanced": "Ocultar filtros avanzados",
  "search.showAdvanced": "Filtros avanzados",
  "search.minPrice": "Precio mínimo (MXN)",
  "search.maxPrice": "Precio máximo (MXN)",
  "search.submit": "Buscar",
  "search.exploreMap": "Explorar en mapa",
  "search.locationPlaceholder": "Ej: Zapopan, San Javier…",
  "search.typePlaceholder": "Todos o escribe un tipo…",
  "search.resultsCount": "{count} propiedades disponibles",
  "search.resultsCountOne": "1 propiedad disponible",
  "sort.newest": "Más recientes",
  "sort.priceAsc": "Precio: menor a mayor",
  "sort.priceDesc": "Precio: mayor a menor",
  "sort.areaAsc": "Área: menor a mayor",
  "sort.areaDesc": "Área: mayor a menor",
  "sort.bedroomsAsc": "Recámaras: menor a mayor",
  "sort.bedroomsDesc": "Recámaras: mayor a menor",
  "sort.bathroomsAsc": "Baños: menor a mayor",
  "sort.bathroomsDesc": "Baños: mayor a menor",

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
  "wa.listingLabel": "Listing",

  "catalog.amenities": "Amenities",
  "catalog.services": "Services",
  "catalog.additionalFeatures": "Additional features",

  "card.bedrooms": "Bedrooms",
  "card.bathrooms": "Bathrooms",
  "card.bedroomsShort": "bd",
  "card.bathroomsShort": "ba",
  "card.seeDetails": "View details",
  "card.perMonth": "/ month",
  "card.priceLabel": "Price",
  "card.saleSuffix": "sale",
  "card.dualOperation": "Available to buy or rent",

  "home.instagramCaptionFallback": "See more on our Instagram post.",
  "home.instagramAlt": "Instagram post",
  "home.mapLoading": "Loading map…",
  "home.mapLoadingDetail": "Loading map and catalog locations…",
  "home.mapCount": "{count} properties",
  "home.mapCountOne": "1 property",
  "home.featuredError":
    "We couldn't load the featured properties. Check your connection and try again.",
  "home.featuredEmpty": "There are no featured properties right now.",

  "search.operationLabel": "Operation",
  "search.operationSale": "Sale",
  "search.operationRent": "Rent",
  "search.operationGroupLabel": "Sale or rent",
  "search.statusLabel": "Status",
  "search.typeFieldLabel": "Type",
  "search.typeAll": "All",
  "search.typeLoading": "Loading types…",
  "search.locationFieldLabel": "Location or keyword",
  "search.hideAdvanced": "Hide advanced filters",
  "search.showAdvanced": "Advanced filters",
  "search.minPrice": "Minimum price (MXN)",
  "search.maxPrice": "Maximum price (MXN)",
  "search.submit": "Search",
  "search.exploreMap": "Explore on map",
  "search.locationPlaceholder": "e.g. Zapopan, San Javier…",
  "search.typePlaceholder": "All, or type a category…",
  "search.resultsCount": "{count} properties available",
  "search.resultsCountOne": "1 property available",
  "sort.newest": "Most recent",
  "sort.priceAsc": "Price: low to high",
  "sort.priceDesc": "Price: high to low",
  "sort.areaAsc": "Area: small to large",
  "sort.areaDesc": "Area: large to small",
  "sort.bedroomsAsc": "Bedrooms: low to high",
  "sort.bedroomsDesc": "Bedrooms: high to low",
  "sort.bathroomsAsc": "Bathrooms: low to high",
  "sort.bathroomsDesc": "Bathrooms: high to low",

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

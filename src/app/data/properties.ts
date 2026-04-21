import type { Property } from "../components/PropertyCard";

/** @deprecated El catálogo vive en Supabase (`properties`). */
export const PROPERTIES_STORAGE_KEY = "viterra_properties_catalog";

/** Lista vacía: sin datos mock. */
export const SEED_PROPERTIES: Property[] = [];

export function loadCatalogProperties(): Property[] {
  return [];
}

/** Conservado por compatibilidad; el inventario se persiste en Supabase. */
export function saveCatalogProperties(_next: Property[]): void {
  if (typeof window === "undefined") return;
}

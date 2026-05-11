import type { Property } from "../components/PropertyCard";
import type { Development } from "../data/developments";

export type CatalogEntityType = "property" | "development";
export type CatalogActivityAction = "created" | "updated" | "deleted" | "price_changed";

/** Actividades que el feed de inventario debe registrar o mostrar (alta, baja, precio). */
export function isInventoryTimelineAction(action: CatalogActivityAction): boolean {
  return action === "created" || action === "deleted" || action === "price_changed";
}

export type CatalogActivityDiff = Record<string, unknown>;

function pickPropertyComparable(p: Property): Record<string, unknown> {
  const withoutPrice = { ...p, price: undefined };
  return JSON.parse(JSON.stringify(withoutPrice));
}

/** Detecta si hubo cambio fuera del precio (ficha de propiedad). */
export function propertyHasNonPriceChanges(prev: Property, next: Property): boolean {
  const a = pickPropertyComparable(prev);
  const b = pickPropertyComparable(next);
  return JSON.stringify(a) !== JSON.stringify(b);
}

function pickDevelopmentComparable(d: Development): Record<string, unknown> {
  const { priceRange, ...rest } = d;
  return JSON.parse(JSON.stringify(rest));
}

/** Detecta si hubo cambio fuera de `priceRange` (desarrollo). */
export function developmentHasNonPriceRangeChanges(prev: Development, next: Development): boolean {
  const a = pickDevelopmentComparable(prev);
  const b = pickDevelopmentComparable(next);
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function buildPropertySnapshot(p: Property): Record<string, unknown> {
  return {
    kind: "property" as const,
    id: p.id,
    title: p.publicationTitle?.trim() || p.title,
    image: p.image,
    location: p.location,
    colony: p.colony ?? "",
    price: p.price,
    type: p.type,
    status: p.status,
    referenceCode: p.referenceCode ?? "",
    featured: p.featured ?? false,
  };
}

export function buildDevelopmentSnapshot(d: Development): Record<string, unknown> {
  return {
    kind: "development" as const,
    id: d.id,
    name: d.name,
    image: d.image,
    location: d.location,
    colony: d.colony,
    priceRange: d.priceRange,
    type: d.type,
    status: d.status,
    referenceCode: d.referenceCode ?? "",
    featured: d.featured ?? false,
  };
}

export function buildPropertySaveEvent(
  prev: Property | undefined,
  next: Property,
  existed: boolean
): { action: CatalogActivityAction; diff: CatalogActivityDiff | null } {
  if (!existed) {
    return { action: "created", diff: null };
  }
  if (!prev) {
    return { action: "updated", diff: null };
  }
  if (prev.price !== next.price) {
    return {
      action: "price_changed",
      diff: { price: { from: prev.price, to: next.price } },
    };
  }
  const other = propertyHasNonPriceChanges(prev, next);
  return { action: "updated", diff: other ? {} : null };
}

export function buildDevelopmentSaveEvent(
  prev: Development | undefined,
  next: Development,
  existed: boolean
): { action: CatalogActivityAction; diff: CatalogActivityDiff | null } {
  if (!existed) {
    return { action: "created", diff: null };
  }
  if (!prev) {
    return { action: "updated", diff: null };
  }
  const prevRange = String(prev.priceRange ?? "").trim();
  const nextRange = String(next.priceRange ?? "").trim();
  if (prevRange !== nextRange) {
    return {
      action: "price_changed",
      diff: { priceRange: { from: prevRange, to: nextRange } },
    };
  }
  const other = developmentHasNonPriceRangeChanges(prev, next);
  return { action: "updated", diff: other ? {} : null };
}


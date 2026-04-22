import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "../components/PropertyCard";

const nowIso = () => new Date().toISOString();

function appStatusFromDb(s: string): "venta" | "alquiler" {
  const t = s.trim().toLowerCase();
  if (t.includes("alquiler") || t.includes("rent") || t === "renta") return "alquiler";
  return "venta";
}

function dbStatusFromApp(s: Property["status"]): string {
  return s === "alquiler" ? "alquiler" : "venta";
}

/** Entero ≥ 0 a partir de valores que vienen de Postgres/JSON (a veces string). */
function nonNegInt(v: number | string | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

/** Normaliza columnas `text[]` de Postgres. */
function textArrayCol(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function optionalPositiveNum(v: number | string | null | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return undefined;
  return n;
}

/** URLs de galería: primero la principal, luego el resto sin duplicados. */
function buildGalleryUrls(primary: string, images: string[]): string[] {
  const cleaned = images.map((u) => String(u).trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (u: string) => {
    if (seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  if (primary) push(primary);
  for (const u of cleaned) push(u);
  return out.length ? out : primary ? [primary] : [];
}

export type PropertyRow = {
  id: string;
  tokko_id: string;
  title: string;
  price: number | null;
  location: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  image: string | null;
  type: string | null;
  status: string;
  lat: number | null;
  lng: number | null;
  images: string[];
  deleted_at: string | null;
  payload: Record<string, unknown>;
  synced_at: string;
  updated_at: string;
  featured: boolean;
  /** `public.properties.colony` (puede faltar en filas antiguas). */
  colony?: string | null;
  amenities?: string[] | null;
  services?: string[] | null;
  additional_features?: string[] | null;
  publication_title?: string | null;
  full_address?: string | null;
  description?: string | null;
  rich_description?: string | null;
  reference_code?: string | null;
  public_url?: string | null;
  surface_land?: number | string | null;
  expenses?: number | string | null;
  age?: number | null;
  parking_spaces?: number | null;
  development_tokko_id?: string | null;
};

/**
 * Convierte una fila de `public.properties` al tipo `Property` de la app.
 * Recámaras y baños salen de las columnas **`bedrooms`** y **`bathrooms`** (no de `payload`).
 */
export function rowToProperty(row: PropertyRow): Property {
  const imgs = Array.isArray(row.images) ? row.images : [];
  const primary = row.image?.trim() || imgs[0] || "";
  const pubTitle = row.publication_title?.trim();
  const listingAt = row.synced_at || row.updated_at;
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price ?? 0),
    location: row.location ?? "",
    bedrooms: nonNegInt(row.bedrooms),
    bathrooms: nonNegInt(row.bathrooms),
    area: Number(row.area ?? 0),
    image: primary,
    type: row.type ?? "",
    status: appStatusFromDb(row.status),
    coordinates:
      row.lat != null && row.lng != null
        ? { lat: row.lat, lng: row.lng }
        : undefined,
    colony:
      row.colony != null && String(row.colony).trim() !== ""
        ? String(row.colony).trim()
        : undefined,
    amenities: textArrayCol(row.amenities),
    services: textArrayCol(row.services),
    additionalFeatures: textArrayCol(row.additional_features),
    publicationTitle: pubTitle || undefined,
    fullAddress: row.full_address?.trim() || undefined,
    description: row.description?.trim() || undefined,
    richDescription: row.rich_description?.trim() || undefined,
    referenceCode: row.reference_code?.trim() || undefined,
    publicUrl: row.public_url?.trim() || undefined,
    surfaceLand: optionalPositiveNum(row.surface_land),
    expenses: optionalPositiveNum(row.expenses),
    age: row.age != null && Number.isFinite(row.age) ? Math.max(0, Math.round(row.age)) : undefined,
    parkingSpaces: row.parking_spaces != null ? nonNegInt(row.parking_spaces) : undefined,
    galleryImages: buildGalleryUrls(primary, imgs),
    featured: Boolean(row.featured),
    listingUpdatedAt: listingAt || undefined,
    developmentTokkoId:
      row.development_tokko_id != null && String(row.development_tokko_id).trim() !== ""
        ? String(row.development_tokko_id).trim()
        : undefined,
  };
}

export async function fetchCatalogProperties(client: SupabaseClient) {
  /** No filtramos por `deleted_at IS NULL`: en datos sincronizados desde Tokko a veces nunca queda NULL y el listado quedaría vacío. El borrado en admin sigue usando `softDeleteProperty`. */
  /** `select('*')` incluye `bedrooms` y `bathrooms`; `rowToProperty` las mapea al modelo. */
  return client.from("properties").select("*").order("updated_at", { ascending: false });
}

export async function insertProperty(client: SupabaseClient, p: Property, explicitId: string) {
  const ts = nowIso();
  const id = explicitId || p.id;
  const tokkoId = `manual_${id}`;
  const imgs =
    p.galleryImages && p.galleryImages.length > 0 ? [...p.galleryImages] : p.image ? [p.image] : [];
  const row = {
    id,
    tokko_id: tokkoId,
    title: p.title,
    price: p.price,
    location: p.location || null,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    image: p.image || null,
    type: p.type || null,
    status: dbStatusFromApp(p.status),
    lat: p.coordinates?.lat ?? null,
    lng: p.coordinates?.lng ?? null,
    development_tokko_id: p.developmentTokkoId?.trim() || null,
    payload: { source: "viterra_admin" } as Record<string, unknown>,
    synced_at: ts,
    updated_at: ts,
    images: imgs,
    colony: p.colony?.trim() || null,
    full_address: p.fullAddress?.trim() || null,
    description: p.description?.trim() || null,
    rich_description: p.richDescription?.trim() || null,
    amenities: [...(p.amenities ?? [])],
    services: [...(p.services ?? [])],
    additional_features: [...(p.additionalFeatures ?? [])],
    reference_code: p.referenceCode?.trim() || null,
    public_url: p.publicUrl?.trim() || null,
    deleted_at: null,
    publication_title: p.publicationTitle?.trim() || null,
    featured: p.featured ?? false,
    surface_land: p.surfaceLand ?? null,
    expenses: p.expenses ?? null,
    age: p.age ?? null,
    parking_spaces: p.parkingSpaces != null ? p.parkingSpaces : null,
    property_type_tokko_id: null,
  };
  return client.from("properties").insert(row);
}

export async function updateProperty(client: SupabaseClient, p: Property) {
  const ts = nowIso();
  const imgs =
    p.galleryImages !== undefined
      ? [...p.galleryImages]
      : p.image
        ? [p.image]
        : [];

  const patch: Record<string, unknown> = {
    title: p.title,
    price: p.price,
    location: p.location || null,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    image: p.image || null,
    type: p.type || null,
    status: dbStatusFromApp(p.status),
    lat: p.coordinates?.lat ?? null,
    lng: p.coordinates?.lng ?? null,
    colony: p.colony?.trim() || null,
    amenities: p.amenities ?? [],
    services: p.services ?? [],
    additional_features: p.additionalFeatures ?? [],
    images: imgs,
    updated_at: ts,
    synced_at: ts,
    payload: { source: "viterra_admin", lastEdit: ts } as Record<string, unknown>,
  };

  if (p.publicationTitle !== undefined) patch.publication_title = p.publicationTitle.trim() || null;
  if (p.fullAddress !== undefined) patch.full_address = p.fullAddress.trim() || null;
  if (p.description !== undefined) patch.description = p.description.trim() || null;
  if (p.richDescription !== undefined) patch.rich_description = p.richDescription.trim() || null;
  if (p.referenceCode !== undefined) patch.reference_code = p.referenceCode.trim() || null;
  if (p.publicUrl !== undefined) patch.public_url = p.publicUrl.trim() || null;
  if (p.surfaceLand !== undefined) patch.surface_land = p.surfaceLand ?? null;
  if (p.expenses !== undefined) patch.expenses = p.expenses ?? null;
  if (p.age !== undefined) patch.age = p.age ?? null;
  if (p.parkingSpaces !== undefined) patch.parking_spaces = p.parkingSpaces ?? null;
  if (p.featured !== undefined) patch.featured = p.featured;
  if (p.developmentTokkoId !== undefined) patch.development_tokko_id = p.developmentTokkoId.trim() || null;

  return client.from("properties").update(patch).eq("id", p.id);
}

export async function softDeleteProperty(client: SupabaseClient, id: string) {
  const ts = nowIso();
  return client.from("properties").update({ deleted_at: ts, updated_at: ts, synced_at: ts }).eq("id", id);
}

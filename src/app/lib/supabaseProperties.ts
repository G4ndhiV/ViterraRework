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
  /** FK lógica al desarrollo: coincide con `developments.tokko_id`. */
  development_tokko_id?: string | null;
};

export function rowToProperty(row: PropertyRow): Property {
  const imgs = Array.isArray(row.images) ? row.images : [];
  const primary = row.image?.trim() || imgs[0] || "";
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price ?? 0),
    location: row.location ?? "",
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    area: Number(row.area ?? 0),
    image: primary,
    type: row.type ?? "",
    status: appStatusFromDb(row.status),
    coordinates:
      row.lat != null && row.lng != null
        ? { lat: row.lat, lng: row.lng }
        : undefined,
  };
}

export async function fetchCatalogProperties(client: SupabaseClient) {
  /** No filtramos por `deleted_at IS NULL`: en datos sincronizados desde Tokko a veces nunca queda NULL y el listado quedaría vacío. El borrado en admin sigue usando `softDeleteProperty`. */
  return client.from("properties").select("*").order("updated_at", { ascending: false });
}

/** Propiedades (unidades) vinculadas a un desarrollo vía `properties.development_tokko_id` = `developments.tokko_id`. */
export async function fetchPropertiesByDevelopmentTokkoId(
  client: SupabaseClient,
  developmentTokkoId: string
) {
  const tid = developmentTokkoId.trim();
  if (!tid) return { data: [] as Property[], error: null };
  const res = await client
    .from("properties")
    .select("*")
    .eq("development_tokko_id", tid)
    .order("price", { ascending: true });
  if (res.error) return { data: [] as Property[], error: res.error };
  const rows = (res.data ?? []) as PropertyRow[];
  return { data: rows.map(rowToProperty), error: null };
}

export async function insertProperty(client: SupabaseClient, p: Property, explicitId: string) {
  const ts = nowIso();
  const id = explicitId || p.id;
  const tokkoId = `manual_${id}`;
  const imgs = p.image ? [p.image] : [];
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
    development_tokko_id: null,
    payload: { source: "viterra_admin" } as Record<string, unknown>,
    synced_at: ts,
    updated_at: ts,
    images: imgs,
    colony: null,
    full_address: null,
    description: null,
    rich_description: null,
    amenities: [] as string[],
    services: [] as string[],
    additional_features: [] as string[],
    reference_code: null,
    public_url: null,
    deleted_at: null,
    publication_title: null,
    featured: false,
    surface_land: null,
    expenses: null,
    age: null,
    parking_spaces: null,
    property_type_tokko_id: null,
  };
  return client.from("properties").insert(row);
}

export async function updateProperty(client: SupabaseClient, p: Property) {
  const ts = nowIso();
  const imgs = p.image ? [p.image] : [];
  return client
    .from("properties")
    .update({
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
      images: imgs,
      updated_at: ts,
      synced_at: ts,
      payload: { source: "viterra_admin", lastEdit: ts } as Record<string, unknown>,
    })
    .eq("id", p.id);
}

export async function softDeleteProperty(client: SupabaseClient, id: string) {
  const ts = nowIso();
  return client.from("properties").update({ deleted_at: ts, updated_at: ts, synced_at: ts }).eq("id", id);
}

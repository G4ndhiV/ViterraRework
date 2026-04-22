import type { SupabaseClient } from "@supabase/supabase-js";
import type { Development, DevelopmentUnit } from "../data/developments";

const nowIso = () => new Date().toISOString();

type DevelopmentRow = Record<string, unknown> & {
  id: string;
  tokko_id: string;
  name: string;
  location: string | null;
  colony: string | null;
  full_address: string | null;
  type: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  status: string | null;
  units: number | null;
  delivery_date: string | null;
  price_range: string | null;
  amenities: string[];
  services: string[];
  additional_features: string[];
  lat: number | null;
  lng: number | null;
  featured: boolean;
  payload: Record<string, unknown>;
  synced_at: string;
  updated_at: string;
  deleted_at: string | null;
  display_on_web: boolean;
};

type DevelopmentUnitRow = {
  id: string;
  development_id: string;
  tokko_id: string | null;
  unit_type: string | null;
  address: string | null;
  spaces: number | null;
  bedrooms: number | null;
  covered_area: number | null;
  total_area: number | null;
  parking: boolean;
  price: number | null;
  for_rent: boolean;
  payload: Record<string, unknown>;
  synced_at: string;
  updated_at: string;
};

function unitRowToApp(u: DevelopmentUnitRow): DevelopmentUnit {
  return {
    type: u.unit_type ?? "",
    address: u.address ?? "",
    spaces: u.spaces ?? 0,
    bedrooms: u.bedrooms ?? 0,
    coveredArea: Number(u.covered_area ?? 0),
    totalArea: Number(u.total_area ?? 0),
    parking: u.parking,
    price: Number(u.price ?? 0),
    forRent: u.for_rent,
  };
}

function groupUnitsByDevelopment(rows: DevelopmentUnitRow[] | null): Map<string, DevelopmentUnit[]> {
  const m = new Map<string, DevelopmentUnit[]>();
  if (!rows) return m;
  for (const r of rows) {
    const list = m.get(r.development_id) ?? [];
    list.push(unitRowToApp(r));
    m.set(r.development_id, list);
  }
  return m;
}

export function rowToDevelopment(row: DevelopmentRow, units: DevelopmentUnit[]): Development {
  const imgs = Array.isArray(row.images) ? row.images : [];
  const primary = row.image?.trim() || imgs[0] || "";
  const status = (row.status ?? "Disponible") as Development["status"];
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? "",
    colony: row.colony ?? "",
    fullAddress: row.full_address ?? "",
    type: row.type ?? "",
    description: row.description ?? "",
    image: primary,
    images: imgs.length > 0 ? imgs : primary ? [primary] : [],
    status,
    units: row.units ?? units.length,
    deliveryDate: row.delivery_date ?? "",
    priceRange: row.price_range ?? "",
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    services: Array.isArray(row.services) ? row.services : [],
    additionalFeatures: Array.isArray(row.additional_features) ? row.additional_features : [],
    developmentUnits: units,
    coordinates: {
      lat: row.lat ?? 20.67,
      lng: row.lng ?? -103.35,
    },
    featured: row.featured,
    displayOnWeb: row.display_on_web ?? true,
  };
}

export async function fetchDevelopmentsWithUnits(
  client: SupabaseClient,
  opts: { publicOnly?: boolean } = {}
) {
  let q = client.from("developments").select("*");
  if (opts.publicOnly) {
    q = q.eq("display_on_web", true);
  }
  const devRes = await q.order("name");
  if (devRes.error) return { data: [] as Development[], error: devRes.error };
  const rows = (devRes.data ?? []) as DevelopmentRow[];
  if (rows.length === 0) return { data: [] as Development[], error: null };

  const ids = rows.map((r) => r.id);
  const unitRes = await client.from("development_units").select("*").in("development_id", ids);
  if (unitRes.error) return { data: [] as Development[], error: unitRes.error };
  const byDev = groupUnitsByDevelopment((unitRes.data ?? []) as DevelopmentUnitRow[]);
  const data = rows.map((r) => rowToDevelopment(r, byDev.get(r.id) ?? []));
  return { data, error: null };
}

/**
 * Busca un desarrollo por su `tokko_id` (coincide con `properties.development_tokko_id`).
 * Incluye unidades para mantener el mismo modelo `Development` que el resto del catálogo.
 */
export async function fetchDevelopmentByTokkoId(
  client: SupabaseClient,
  tokkoId: string,
  opts: { publicOnly?: boolean } = {}
) {
  const id = String(tokkoId).trim();
  if (!id) return { data: null as Development | null, error: null };

  let q = client.from("developments").select("*").eq("tokko_id", id);
  if (opts.publicOnly) q = q.eq("display_on_web", true);
  const devRes = await q.maybeSingle();
  if (devRes.error) return { data: null, error: devRes.error };
  const row = devRes.data as DevelopmentRow | null;
  if (!row) return { data: null, error: null };

  const unitRes = await client.from("development_units").select("*").eq("development_id", row.id);
  if (unitRes.error) return { data: null, error: unitRes.error };
  const units = groupUnitsByDevelopment((unitRes.data ?? []) as DevelopmentUnitRow[]).get(row.id) ?? [];
  return { data: rowToDevelopment(row, units), error: null };
}

export async function fetchDevelopmentById(
  client: SupabaseClient,
  id: string,
  opts: { publicOnly?: boolean } = {}
) {
  let q = client.from("developments").select("*").eq("id", id);
  if (opts.publicOnly) q = q.eq("display_on_web", true);
  const devRes = await q.maybeSingle();
  if (devRes.error) return { data: null, error: devRes.error };
  const row = devRes.data as DevelopmentRow | null;
  if (!row) return { data: null, error: null };
  const unitRes = await client.from("development_units").select("*").eq("development_id", id);
  if (unitRes.error) return { data: null, error: unitRes.error };
  const units = groupUnitsByDevelopment((unitRes.data ?? []) as DevelopmentUnitRow[]).get(id) ?? [];
  return { data: rowToDevelopment(row, units), error: null };
}

export async function upsertDevelopment(client: SupabaseClient, d: Development) {
  const ts = nowIso();
  const imgs = d.images?.length ? d.images : d.image ? [d.image] : [];
  const tokkoId = d.tokkoId?.trim() || `manual_${d.id}`;
  const row = {
    id: d.id,
    tokko_id: tokkoId,
    name: d.name,
    location: d.location || null,
    colony: d.colony || null,
    full_address: d.fullAddress || null,
    type: d.type || null,
    description: d.description || null,
    image: d.image || imgs[0] || null,
    images: imgs,
    status: d.status || null,
    units: d.units,
    delivery_date: d.deliveryDate || null,
    price_range: d.priceRange || null,
    amenities: d.amenities ?? [],
    services: d.services ?? [],
    additional_features: d.additionalFeatures ?? [],
    lat: d.coordinates?.lat ?? null,
    lng: d.coordinates?.lng ?? null,
    featured: d.featured ?? false,
    payload: { ...(d.payload ?? {}), source: "viterra_admin" } as Record<string, unknown>,
    synced_at: ts,
    updated_at: ts,
    web_url: null,
    reference_code: null,
    publication_title: null,
    deleted_at: null,
    display_on_web: d.displayOnWeb !== false,
    construction_status: null,
    financing_details: null,
    in_charge_name: null,
    in_charge_email: null,
    in_charge_phone: null,
    development_type_tokko_id: null,
  };

  const { data: existing } = await client.from("developments").select("id").eq("id", d.id).maybeSingle();
  const ins = existing
    ? await client.from("developments").update(row).eq("id", d.id)
    : await client.from("developments").insert(row);
  if (ins.error) return ins;

  await client.from("development_units").delete().eq("development_id", d.id);

  for (let i = 0; i < d.developmentUnits.length; i++) {
    const u = d.developmentUnits[i];
    const unitId = crypto.randomUUID();
    const unitRow = {
      id: unitId,
      development_id: d.id,
      tokko_id: `manual_${d.id}_u${i}`,
      unit_type: u.type || null,
      address: u.address || null,
      spaces: u.spaces,
      bedrooms: u.bedrooms,
      covered_area: u.coveredArea,
      total_area: u.totalArea,
      parking: u.parking,
      price: u.price,
      for_rent: u.forRent,
      payload: {} as Record<string, unknown>,
      synced_at: ts,
      updated_at: ts,
    };
    const uins = await client.from("development_units").insert(unitRow);
    if (uins.error) return uins;
  }

  return { error: null };
}

export async function softDeleteDevelopment(client: SupabaseClient, id: string) {
  const ts = nowIso();
  return client.from("developments").update({ deleted_at: ts, updated_at: ts, synced_at: ts }).eq("id", id);
}

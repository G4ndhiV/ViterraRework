import { geocodePlaceQuery, type GeocodeResult } from "./geocodeNominatim";
import { distanceMeters } from "./geoSearch";

export type NearbyPoint = { lat: number; lng: number };

export type NearbyCenter = NearbyPoint & { label: string; source: "nominatim" | "catalog" | "pool" | "fallback" };

const GDL: NearbyCenter = {
  lat: 20.676208,
  lng: -103.34721,
  label: "Guadalajara",
  source: "fallback",
};

type Locatable = {
  title?: string;
  location?: string;
  colony?: string;
  coordinates?: { lat: number; lng: number } | null;
};

function centroidOf(items: NearbyPoint[]): NearbyPoint | null {
  if (items.length === 0) return null;
  let lat = 0;
  let lng = 0;
  for (const p of items) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / items.length, lng: lng / items.length };
}

function textMatchesProperty(p: Locatable, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    (p.location ?? "").toLowerCase().includes(needle) ||
    (p.colony ?? "").toLowerCase().includes(needle) ||
    (p.title ?? "").toLowerCase().includes(needle)
  );
}

/** Centro para búsqueda cercana: inventario que matchea → Nominatim → centroide del pool → GDL. */
export async function resolveNearbyCenter(
  query: string,
  pool: Locatable[],
  signal?: AbortSignal
): Promise<NearbyCenter> {
  const q = query.trim();
  const withCoords = pool.filter((p) => p.coordinates);

  if (q.length >= 2) {
    const matched = withCoords.filter((p) => textMatchesProperty(p, q));
    const catalogCenter = centroidOf(matched.map((p) => p.coordinates!));
    if (catalogCenter) {
      return { ...catalogCenter, label: q, source: "catalog" };
    }

    try {
      const geo: GeocodeResult | null = await geocodePlaceQuery(q, signal);
      if (geo) {
        return { lat: geo.lat, lng: geo.lng, label: geo.displayName.split(",")[0] ?? q, source: "nominatim" };
      }
    } catch {
      /* pool fallback */
    }
  }

  const poolCenter = centroidOf(withCoords.map((p) => p.coordinates!));
  if (poolCenter) {
    return { ...poolCenter, label: "tu zona de inventario", source: "pool" };
  }

  return GDL;
}

export type NearbySearchResult<T extends Locatable> = {
  items: T[];
  hint: string | null;
  error: string | null;
  usedNearestFallback: boolean;
};

const NEAREST_FALLBACK_COUNT = 12;

/** Filtra por radio; si queda vacío, devuelve las N más cercanas del pool filtrado. */
export function filterByNearbyRadius<T extends Locatable>(
  pool: T[],
  center: NearbyPoint,
  km: number,
  nearestCount = NEAREST_FALLBACK_COUNT
): NearbySearchResult<T> {
  const radiusM = km * 1000;
  const withDist = pool
    .filter((p) => p.coordinates)
    .map((p) => ({
      item: p,
      dist: distanceMeters(center, p.coordinates!),
    }))
    .sort((a, b) => a.dist - b.dist);

  const inRadius = withDist.filter((x) => x.dist <= radiusM).map((x) => x.item);

  if (inRadius.length > 0) {
    return { items: inRadius, hint: null, error: null, usedNearestFallback: false };
  }

  if (withDist.length === 0) {
    return {
      items: [],
      hint: null,
      error: "No hay propiedades con ubicación para ampliar la búsqueda.",
      usedNearestFallback: false,
    };
  }

  const nearest = withDist.slice(0, nearestCount).map((x) => x.item);
  return {
    items: nearest,
    hint: `Sin coincidencias en ${km} km; mostrando las más cercanas`,
    error: null,
    usedNearestFallback: true,
  };
}

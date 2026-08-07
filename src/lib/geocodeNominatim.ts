/** Geocodificación via Nominatim (OpenStreetMap), acotada a México. */

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Busca un punto para una consulta de texto (colonia, ciudad, etc.).
 * Preferimos resultados en Jalisco/México.
 */
export async function geocodePlaceQuery(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  const params = new URLSearchParams({
    q: `${q}, Jalisco, México`,
    format: "json",
    limit: "1",
    countrycodes: "mx",
    addressdetails: "0",
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    displayName: first.display_name ?? q,
  };
}

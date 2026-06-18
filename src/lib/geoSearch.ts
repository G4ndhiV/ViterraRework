import type { LatLng, LatLngBounds, Layer } from "leaflet";
import L from "leaflet";

/** Reduce vértices de un trazo libre para polígonos ligeros (mapa fluido). */
export function decimateLatLngs(points: LatLng[], maxPoints: number): LatLng[] {
  if (points.length <= maxPoints) return points.slice();
  const n = points.length;
  const out: LatLng[] = [points[0]];
  const step = (n - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.min(n - 1, Math.round(i * step));
    out.push(points[idx]);
  }
  out.push(points[n - 1]);
  return out;
}

export type SearchZone =
  | { kind: "polygon"; ring: LatLng[] }
  | { kind: "rectangle"; bounds: LatLngBounds }
  | { kind: "circle"; center: LatLng; radiusM: number };

/** Ray casting: punto dentro de anillo (no cerrado explícitamente; Leaflet cierra el polígono) */
export function pointInPolygonRing(point: LatLng, ring: LatLng[]): boolean {
  if (ring.length < 3) return false;
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng;
    const yi = ring[i].lat;
    const xj = ring[j].lng;
    const yj = ring[j].lat;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInZone(point: LatLng, zone: SearchZone): boolean {
  if (zone.kind === "rectangle") {
    return zone.bounds.contains(point);
  }
  if (zone.kind === "circle") {
    return zone.center.distanceTo(point) <= zone.radiusM;
  }
  return pointInPolygonRing(point, zone.ring);
}

function firstPolygonRing(layer: L.Polygon): LatLng[] {
  const raw = layer.getLatLngs() as LatLng[] | LatLng[][];
  if (!raw || raw.length === 0) return [];
  if (Array.isArray(raw[0])) {
    return (raw as LatLng[][])[0] ?? [];
  }
  return raw as LatLng[];
}

/** Interpreta capas dibujadas con Geoman / Leaflet */
export function zoneFromLeafletLayer(layer: Layer): SearchZone | null {
  if (layer instanceof L.Rectangle) {
    return { kind: "rectangle", bounds: layer.getBounds() };
  }
  if (layer instanceof L.Circle) {
    return {
      kind: "circle",
      center: layer.getLatLng(),
      radiusM: layer.getRadius(),
    };
  }
  if (layer instanceof L.Polygon) {
    const ring = firstPolygonRing(layer);
    if (ring.length >= 3) {
      return { kind: "polygon", ring };
    }
  }
  return null;
}

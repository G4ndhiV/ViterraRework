import { describe, it, expect } from "vitest";
import L from "leaflet";
import {
  decimateLatLngs,
  pointInPolygonRing,
  pointInZone,
  ringCentroid,
  zoneCenter,
  expandZoneToCircleKm,
  distanceMeters,
  type SearchZone,
} from "../../../lib/geoSearch";

describe("geoSearch math & spatial utilities", () => {
  it("should decimate latlng points when exceeding maxPoints", () => {
    const points = [
      L.latLng(20, -100),
      L.latLng(21, -100),
      L.latLng(22, -100),
      L.latLng(23, -100),
      L.latLng(24, -100),
    ];
    const decimated = decimateLatLngs(points, 3);
    expect(decimated.length).toBe(3);
    expect(decimated[0]).toEqual(points[0]);
    expect(decimated[2]).toEqual(points[4]);
  });

  it("should test point in polygon ring using ray casting", () => {
    const squareRing = [
      L.latLng(20, -100),
      L.latLng(22, -100),
      L.latLng(22, -98),
      L.latLng(20, -98),
    ];

    expect(pointInPolygonRing(L.latLng(21, -99), squareRing)).toBe(true);
    expect(pointInPolygonRing(L.latLng(25, -99), squareRing)).toBe(false);
  });

  it("should test point in zone for circles, rectangles and polygons", () => {
    const circleZone: SearchZone = {
      kind: "circle",
      center: L.latLng(20.676, -103.347),
      radiusM: 5000,
    };
    expect(pointInZone(L.latLng(20.68, -103.35), circleZone)).toBe(true);

    const rectZone: SearchZone = {
      kind: "rectangle",
      bounds: L.latLngBounds(L.latLng(20, -100), L.latLng(22, -98)),
    };
    expect(pointInZone(L.latLng(21, -99), rectZone)).toBe(true);
    expect(pointInZone(L.latLng(23, -99), rectZone)).toBe(false);
  });

  it("should compute ring centroid and zone centers", () => {
    const squareRing = [
      L.latLng(20, -100),
      L.latLng(22, -100),
      L.latLng(22, -98),
      L.latLng(20, -98),
    ];
    const center = ringCentroid(squareRing);
    expect(center?.lat).toBe(21);
    expect(center?.lng).toBe(-99);

    const circleZone: SearchZone = {
      kind: "circle",
      center: L.latLng(20.676, -103.347),
      radiusM: 5000,
    };
    expect(zoneCenter(circleZone)).toEqual(L.latLng(20.676, -103.347));
  });

  it("should expand search zone to circle of N km", () => {
    const circleZone: SearchZone = {
      kind: "circle",
      center: L.latLng(20.676, -103.347),
      radiusM: 1000,
    };
    const expanded = expandZoneToCircleKm(circleZone, 10);
    expect(expanded?.kind).toBe("circle");
    if (expanded?.kind === "circle") {
      expect(expanded.radiusM).toBe(10000);
    }
  });

  it("should calculate distance in meters using distanceMeters", () => {
    const p1 = { lat: 20.676, lng: -103.347 };
    const p2 = { lat: 20.686, lng: -103.347 };
    const dist = distanceMeters(p1, p2);
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1200);
  });
});

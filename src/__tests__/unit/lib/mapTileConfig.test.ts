import { describe, it, expect, vi } from "vitest";
import {
  MAP_STREET_TILE_URL,
  MAP_STREET_TILE_ATTRIBUTION,
  getViterraStreetTileLayer,
} from "../../../app/lib/mapTileConfig";

describe("mapTileConfig", () => {
  it("should export CARTO tile URL and attribution strings", () => {
    expect(MAP_STREET_TILE_URL).toContain("cartocdn.com");
    expect(MAP_STREET_TILE_ATTRIBUTION).toContain("OpenStreetMap");
  });

  it("should create Leaflet tile layer using getViterraStreetTileLayer", () => {
    const mockTileLayer = vi.fn().mockReturnValue({ type: "tileLayer" });
    const mockL = { tileLayer: mockTileLayer };

    const layer = getViterraStreetTileLayer(mockL);
    expect(mockTileLayer).toHaveBeenCalledWith(
      MAP_STREET_TILE_URL,
      expect.objectContaining({
        attribution: MAP_STREET_TILE_ATTRIBUTION,
        subdomains: "abcd",
        maxZoom: 20,
      })
    );
    expect(layer).toEqual({ type: "tileLayer" });
  });
});

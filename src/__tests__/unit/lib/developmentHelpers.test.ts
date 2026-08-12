import { describe, it, expect } from "vitest";
import {
  developmentReferenceFromTokkoId,
  resolveDevelopmentReferenceCode,
  previewDevelopmentReferenceCode,
} from "../../../app/lib/developmentReferenceCode";
import {
  parseDeliveryYear,
  formatDeliveryYear,
  allowedDeliveryYears,
  deliveryYearHint,
  isDeliveryYearValidForStatus,
  displayDeliveryYearSelect,
} from "../../../app/lib/developmentDeliveryYear";
import {
  developmentUnitPrices,
  developmentPriceBounds,
  filterDevelopmentsCatalog,
} from "../../../app/lib/developmentCatalogFilter";
import { isPublicDevelopmentTokkoId } from "../../../app/lib/developmentTokkoId";
import type { Development } from "../../../app/data/developments";

describe("Development helpers", () => {
  describe("developmentReferenceCode", () => {
    it("should compute reference code from Tokko ID", () => {
      expect(developmentReferenceFromTokkoId("9988")).toBe("VAD9988");
      expect(developmentReferenceFromTokkoId("   ")).toBe("VAD");
    });

    it("should resolve final reference code correctly", () => {
      expect(resolveDevelopmentReferenceCode("CUSTOM-DEV", "123", "d1")).toBe("CUSTOM-DEV");
      expect(resolveDevelopmentReferenceCode("", "123", "d1")).toBe("VAD123");
    });

    it("should preview reference code correctly", () => {
      expect(previewDevelopmentReferenceCode("PREV-1", "555", "d1")).toBe("PREV-1");
      expect(previewDevelopmentReferenceCode("", "555", "d1")).toBe("VAD555");
    });
  });

  describe("developmentDeliveryYear", () => {
    it("should parse delivery year from ISO date strings", () => {
      expect(parseDeliveryYear("2027-12-31")).toBe(2027);
      expect(parseDeliveryYear("invalid")).toBeNull();
      expect(parseDeliveryYear(null)).toBeNull();
    });

    it("should format delivery year appropriately", () => {
      expect(formatDeliveryYear(2028)).toBe("2028");
      expect(formatDeliveryYear(null)).toBe("Por definir");
    });

    it("should compute allowed delivery years list", () => {
      const years = allowedDeliveryYears("En Construcción", 2026);
      expect(years).toContain(2026);
      expect(years).toContain(2030);
    });

    it("should provide delivery year hint per status", () => {
      expect(deliveryYearHint("En Construcción", 2026)).toContain("construcción");
      expect(deliveryYearHint("Disponible", 2026)).toContain("2026");
    });

    it("should validate delivery year according to construction status", () => {
      expect(isDeliveryYearValidForStatus("2028-06-01", "En Construcción", 2026)).toBe(true);
      expect(isDeliveryYearValidForStatus("2025-06-01", "Próximamente", 2026)).toBe(false);
    });

    it("should display delivery year select value correctly", () => {
      expect(displayDeliveryYearSelect("2027-06-01")).toBe("2027");
      expect(displayDeliveryYearSelect("")).toBe("");
    });
  });

  describe("developmentCatalogFilter", () => {
    const mockDevs: Partial<Development>[] = [
      {
        id: "d1",
        name: "Torre Residencial Altus",
        location: "San Pedro",
        colony: "Del Valle",
        fullAddress: "Av. Vasconcelos",
        type: "Residencial",
        description: "Lujo y confort",
        developmentUnits: [
          { type: "Departamento", address: "Dpto A", spaces: 2, bedrooms: 2, coveredArea: 80, totalArea: 100, parking: true, price: 3500000, forRent: false },
          { type: "Penthouse", address: "PH 1", spaces: 3, bedrooms: 3, coveredArea: 150, totalArea: 200, parking: true, price: 7500000, forRent: false },
        ],
        status: "Pre-venta",
      },
      {
        id: "d2",
        name: "Valle Verde Casas",
        location: "Zapopan",
        colony: "Jardines",
        fullAddress: "Av. Patria",
        type: "Casas",
        description: "Hermosas casas",
        developmentUnits: [
          { type: "Casa", address: "Casa 1", spaces: 4, bedrooms: 4, coveredArea: 180, totalArea: 220, parking: true, price: 5000000, forRent: false },
        ],
        status: "Disponible",
      },
    ];

    it("should extract unit prices from development", () => {
      const prices = developmentUnitPrices(mockDevs[0] as Development);
      expect(prices).toEqual([3500000, 7500000]);
    });

    it("should compute price bounds from development", () => {
      const bounds = developmentPriceBounds(mockDevs[0] as Development);
      expect(bounds.min).toBe(3500000);
      expect(bounds.max).toBe(7500000);
    });

    it("should filter developments by query and price bounds", () => {
      const result = filterDevelopmentsCatalog(mockDevs as Development[], {
        query: "Altus",
        minPrice: "3000000",
        maxPrice: "8000000",
      } as any);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("d1");
    });
  });

  describe("developmentTokkoId", () => {
    it("should identify valid public Tokko IDs", () => {
      expect(isPublicDevelopmentTokkoId("12345")).toBe(true);
      expect(isPublicDevelopmentTokkoId("")).toBe(false);
      expect(isPublicDevelopmentTokkoId(null)).toBe(false);
    });
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCatalogPriceSlices } from "../../../app/hooks/useCatalogPriceSlices";
import * as supabaseClientModule from "../../../app/lib/supabaseClient";

describe("useCatalogPriceSlices hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return empty arrays when Supabase client is not available or returns empty data", async () => {
    vi.spyOn(supabaseClientModule, "getSupabaseClient").mockReturnValue(null);

    const { result } = renderHook(() => useCatalogPriceSlices());

    expect(result.current).toEqual({ venta: [], alquiler: [] });
  });

  it("should categorize property prices into venta and alquiler slices", async () => {
    const mockData = [
      { price: 5000000, status: "venta" },
      { price: 12000000, status: "Venta Directa" },
      { price: 25000, status: "alquiler" },
      { price: 30000, status: "Renta Mensual" },
    ];

    const mockSelect = vi.fn().mockResolvedValue({ data: mockData, error: null });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const mockClient = { from: mockFrom } as any;

    vi.spyOn(supabaseClientModule, "getSupabaseClient").mockReturnValue(mockClient);

    const { result } = renderHook(() => useCatalogPriceSlices());

    await waitFor(() => {
      expect(result.current.venta).toEqual([5000000, 12000000]);
      expect(result.current.alquiler).toEqual([25000, 30000]);
    });
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDevelopmentsCatalog } from "../../../app/hooks/useDevelopmentsCatalog";
import * as supabaseClientModule from "../../../app/lib/supabaseClient";
import * as supabaseDevelopmentsModule from "../../../app/lib/supabaseDevelopments";

describe("useDevelopmentsCatalog hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle missing Supabase client gracefully", async () => {
    vi.spyOn(supabaseClientModule, "getSupabaseClient").mockReturnValue(null);

    const { result } = renderHook(() => useDevelopmentsCatalog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toContain("Faltan variables");
      expect(result.current.developments).toEqual([]);
    });
  });

  it("should fetch and load developments successfully", async () => {
    const mockDevs = [
      { id: "d1", name: "Torre Vasconcelos", status: "En Pre-Venta" },
    ];

    const mockClient = {} as any;
    vi.spyOn(supabaseClientModule, "getSupabaseClient").mockReturnValue(mockClient);
    vi.spyOn(supabaseClientModule, "syncSupabaseAuthSession").mockResolvedValue({ hasSession: true, userId: "u1" });
    vi.spyOn(supabaseDevelopmentsModule, "fetchDevelopmentsWithUnits").mockResolvedValue({
      data: mockDevs as any,
      error: null,
    });

    const { result } = renderHook(() => useDevelopmentsCatalog(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.developments).toEqual(mockDevs);
      expect(result.current.error).toBeNull();
    });
  });
});

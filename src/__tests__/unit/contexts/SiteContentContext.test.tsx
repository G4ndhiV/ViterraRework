import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { SiteContentProvider, useSiteContent } from "../../../contexts/SiteContentContext";
import * as supabaseClientModule from "../../../app/lib/supabaseClient";

describe("SiteContentContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabaseClientModule, "getSupabaseClient").mockReturnValue(null);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SiteContentProvider>{children}</SiteContentProvider>
  );

  it("should throw error if useSiteContent is used outside provider", () => {
    expect(() => renderHook(() => useSiteContent())).toThrow(
      "useSiteContent debe usarse dentro de SiteContentProvider"
    );
  });

  it("should provide default site content and allow patchSection updates", () => {
    const { result } = renderHook(() => useSiteContent(), { wrapper });

    expect(result.current.content).toBeDefined();
    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.patchSection("home", { heroTitle: "Test Title" });
    });

    expect(result.current.content.home.heroTitle).toBe("Test Title");
  });
});

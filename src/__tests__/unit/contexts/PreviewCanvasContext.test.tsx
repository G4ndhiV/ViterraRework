import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import {
  PreviewCanvasProvider,
  usePreviewCanvas,
  usePreviewLayout,
} from "../../../contexts/PreviewCanvasContext";

describe("PreviewCanvasContext & usePreviewLayout", () => {
  it("should return false for usePreviewCanvas outside provider", () => {
    const { result } = renderHook(() => usePreviewCanvas());
    expect(result.current).toBe(false);
  });

  it("should return true for usePreviewCanvas inside PreviewCanvasProvider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PreviewCanvasProvider>{children}</PreviewCanvasProvider>
    );

    const { result } = renderHook(() => usePreviewCanvas(), { wrapper });
    expect(result.current).toBe(true);
  });

  it("should format layout classes correctly depending on preview mode", () => {
    const { result: defaultLayout } = renderHook(() => usePreviewLayout());
    expect(defaultLayout.current.gridCols("grid-cols-1 md:grid-cols-3")).toBe(
      "grid-cols-1 md:grid-cols-3"
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PreviewCanvasProvider>{children}</PreviewCanvasProvider>
    );
    const { result: previewLayout } = renderHook(() => usePreviewLayout(), { wrapper });
    expect(previewLayout.current.gridCols("grid-cols-1 md:grid-cols-3")).toBe("grid-cols-1");
    expect(previewLayout.current.colSpan("lg:col-span-2")).toBe("col-span-1");
    expect(previewLayout.current.flexStack("flex-row")).toBe("flex-col");
  });
});

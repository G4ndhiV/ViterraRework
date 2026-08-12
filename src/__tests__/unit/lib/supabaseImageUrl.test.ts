import { describe, it, expect } from "vitest";
import { optimizedImageUrl } from "../../../app/lib/supabaseImageUrl";

describe("supabaseImageUrl", () => {
  it("should return empty or null input unchanged", () => {
    expect(optimizedImageUrl(null)).toBe("");
    expect(optimizedImageUrl("")).toBe("");
  });

  it("should return non-Supabase storage URLs (e.g. Tokko or Unsplash) unchanged", () => {
    const unsplash = "https://images.unsplash.com/photo-123";
    expect(optimizedImageUrl(unsplash)).toBe(unsplash);
  });

  it("should rewrite Supabase Storage public object URL to render endpoint with width, height and quality", () => {
    const original = "https://xyz.supabase.co/storage/v1/object/public/properties/img1.jpg";
    const optimized = optimizedImageUrl(original, { width: 800, height: 600, quality: 80 });

    expect(optimized).toContain("/storage/v1/render/image/public/properties/img1.jpg");
    expect(optimized).toContain("width=800");
    expect(optimized).toContain("height=600");
    expect(optimized).toContain("resize=cover");
    expect(optimized).toContain("quality=80");
  });
});

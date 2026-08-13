import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInstagramFeed } from "../../../app/hooks/useInstagramFeed";
import { FALLBACK_INSTAGRAM_POSTS } from "../../../data/instagramFallback";

describe("useInstagramFeed hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fallback posts when network calls fail", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useInstagramFeed(3));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );


    expect(result.current.posts.length).toBeGreaterThan(0);
    expect(result.current.posts[0].shortcode).toBe(FALLBACK_INSTAGRAM_POSTS[0].shortcode);
    expect(result.current.error).toBe(false);
  });

  it("fetches posts successfully when API endpoint responds", async () => {
    const mockPosts = [
      {
        shortcode: "TEST1234",
        type: "p" as const,
        videoUrl: null,
        thumbnail: "https://example.com/test.jpg",
        caption: "Test caption",
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ posts: mockPosts }),
      json: async () => ({ posts: mockPosts }),
    } as unknown as Response);


    const { result } = renderHook(() => useInstagramFeed(1));

    await waitFor(() => {
      expect(result.current.posts[0].shortcode).toBe("TEST1234");
    });

    expect(result.current.loading).toBe(false);
  });
});

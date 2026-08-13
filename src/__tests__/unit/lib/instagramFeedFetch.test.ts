import { describe, expect, it } from "vitest";
import { mapWebProfileEdges, scrapePostsFromHtml, unescapeIgUrl } from "../../../lib/instagramFeedFetch";

describe("instagramFeedFetch library", () => {
  describe("unescapeIgUrl", () => {
    it("decodes unicode escape sequences like \\u00253D and \\u0026", () => {
      const raw = "https://scontent.cdninstagram.com/v/test.jpg?key=Mzk2Mg\\u00253D\\u00253D&foo=\\u0026bar";
      const unescaped = unescapeIgUrl(raw);
      expect(unescaped).toBe("https://scontent.cdninstagram.com/v/test.jpg?key=Mzk2Mg%3D%3D&foo=&bar");
    });

    it("returns empty string for empty input", () => {
      expect(unescapeIgUrl("")).toBe("");
    });
  });

  describe("mapWebProfileEdges", () => {
    it("maps Instagram web profile GraphQL edges correctly", () => {
      const edges = [
        {
          node: {
            shortcode: "ABC12345",
            __typename: "GraphImage",
            thumbnail_src: "https://example.com/thumb.jpg",
            edge_media_to_caption: {
              edges: [{ node: { text: "Publicación de prueba" } }],
            },
          },
        },
      ];

      const mapped = mapWebProfileEdges(edges, 1);
      expect(mapped).toHaveLength(1);
      expect(mapped[0]).toEqual({
        shortcode: "ABC12345",
        type: "p",
        videoUrl: null,
        thumbnail: "https://example.com/thumb.jpg",
        caption: "Publicación de prueba",
      });
    });
  });

  describe("scrapePostsFromHtml", () => {
    it("scrapes shortcode_media from escaped embed HTML", () => {
      const sampleHtml = `
        var data = {
          "shortcode_media\\":{\\"__typename\\":\\"GraphImage\\",\\"id\\":\\"123456\\",\\"shortcode\\":\\"XYZ987\\"
        };
      `;
      const posts = scrapePostsFromHtml(sampleHtml, 1);
      expect(posts).toHaveLength(1);
      expect(posts[0].shortcode).toBe("XYZ987");
      expect(posts[0].type).toBe("p");
    });
  });
});

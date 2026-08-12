import { describe, it, expect } from "vitest";
import { deepMerge } from "../../../lib/deepMerge";
import { mergeSiteSection } from "../../../lib/siteContentMerge";
import { DEFAULT_SITE_CONTENT } from "../../../data/siteContent";

describe("deepMerge & siteContentMerge utilities", () => {
  describe("deepMerge", () => {
    it("should merge simple properties without mutating base", () => {
      const base = { a: 1, b: "hello" };
      const patch = { b: "world" };
      const result = deepMerge(base, patch);

      expect(result).toEqual({ a: 1, b: "world" });
      expect(base.b).toBe("hello"); // Immutability test
    });

    it("should recursively merge nested objects", () => {
      const base = { config: { theme: "dark", showHeader: true } };
      const patch = { config: { theme: "light" } };
      const result = deepMerge(base, patch as any);

      expect(result).toEqual({ config: { theme: "light", showHeader: true } });
    });

    it("should handle null and undefined patches gracefully", () => {
      const base = { a: 1 };
      expect(deepMerge(base, null)).toEqual({ a: 1 });
      expect(deepMerge(base, undefined)).toEqual({ a: 1 });
    });
  });

  describe("mergeSiteSection", () => {
    it("should return default home section when passed empty patch", () => {
      const home = mergeSiteSection("home", {});
      expect(home.heroTitle).toBe(DEFAULT_SITE_CONTENT.home.heroTitle);
      expect(home.heroKicker).toBe(DEFAULT_SITE_CONTENT.home.heroKicker);
    });

    it("should merge partial home updates while preserving defaults", () => {
      const home = mergeSiteSection("home", { heroTitle: "Nuevo Título Viterra" });
      expect(home.heroTitle).toBe("Nuevo Título Viterra");
      expect(home.heroSubtitle).toBe(DEFAULT_SITE_CONTENT.home.heroSubtitle);
    });

    it("should properly normalize services section cards", () => {
      const services = mergeSiteSection("services", {
        cards: [
          { title: "Asesoría Personalizada" },
        ],
      });
      expect(services.cards[0].title).toBe("Asesoría Personalizada");
      expect(services.cards[0].description).toBeDefined();
    });

    it("should merge contact section and fallback faq/social links", () => {
      const contact = mergeSiteSection("contact", {
        title: "Contacto Viterra",
      } as any);
      expect((contact as any).title).toBe("Contacto Viterra");
      expect(contact.faq.length).toBeGreaterThan(0);
      expect(contact.infoItems.length).toBeGreaterThan(0);
    });

    it("should merge about section values, stats, team and milestones", () => {
      const about = mergeSiteSection("about", {
        storyTitle: "Nuestra Historia",
      });
      expect(about.storyTitle).toBe("Nuestra Historia");
      expect(about.stats.length).toBeGreaterThan(0);
      expect(about.team.length).toBeGreaterThan(0);
    });
  });
});

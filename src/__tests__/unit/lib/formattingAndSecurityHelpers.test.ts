import { describe, it, expect } from "vitest";
import { escapeHtml } from "../../../app/lib/escapeHtml";
import { foldSearchText } from "../../../app/lib/searchText";
import {
  isAllowedEmbedHost,
  isAllowedEmbedUrl,
  normalizeAllowedEmbedUrl,
} from "../../../app/lib/safeEmbed";
import {
  embedIframeVideoSrc,
  embeddableVideoSrc,
  resolvePropertyVideoPlayback,
} from "../../../app/lib/embeddableVideo";
import {
  isValidPhoneForCall,
  formatPhoneForDisplay,
  resolveTelHref,
} from "../../../app/lib/phoneLink";
import {
  isWhatsappHttpUrl,
  normalizeWhatsappLinkForStorage,
  resolveWhatsappHref,
  isValidWhatsappLinkInput,
} from "../../../app/lib/whatsappLink";
import {
  parseHex,
  stageHexToChipStyle,
  stageHexToKanbanHeaderStyle,
} from "../../../app/lib/stageColors";
import { withTimeout } from "../../../app/lib/withTimeout";
import { iconFromFeatureKey } from "../../../app/lib/featureIconPicker";

describe("Formatting and Security Helpers", () => {
  describe("escapeHtml & foldSearchText", () => {
    it("should escape special HTML characters", () => {
      expect(escapeHtml("<script>alert('1')</script>")).toBe(
        "&lt;script&gt;alert(&#39;1&#39;)&lt;/script&gt;"
      );
    });

    it("should fold search text removing accents and lowering case", () => {
      expect(foldSearchText("Cancún")).toBe("cancun");
      expect(foldSearchText("San Pedro Garza García")).toBe("san pedro garza garcia");
    });
  });

  describe("safeEmbed", () => {
    it("should validate allowed embed hosts (YouTube, Vimeo, Matterport, Google Maps)", () => {
      expect(isAllowedEmbedHost("www.youtube.com")).toBe(true);
      expect(isAllowedEmbedHost("my.matterport.com")).toBe(true);
      expect(isAllowedEmbedHost("malicious-site.com")).toBe(false);
    });

    it("should validate and normalize embed URLs", () => {
      expect(isAllowedEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(true);
      expect(isAllowedEmbedUrl("javascript:alert(1)")).toBe(false);
      expect(normalizeAllowedEmbedUrl("https://www.youtube.com/embed/123")).toBe("https://www.youtube.com/embed/123");
    });
  });

  describe("embeddableVideo", () => {
    it("should parse video embed sources", () => {
      expect(embedIframeVideoSrc("https://www.youtube.com/embed/xyz")).toBe("https://www.youtube.com/embed/xyz");
      expect(embeddableVideoSrc("https://youtu.be/xyz")).toBe("https://youtu.be/xyz");
    });

    it("should resolve property video playback type", () => {
      const iframePlayback = resolvePropertyVideoPlayback("https://www.youtube.com/embed/xyz");
      expect(iframePlayback?.kind).toBe("iframe");

      const directPlayback = resolvePropertyVideoPlayback("https://www.youtube.com/watch?v=123");
      expect(directPlayback?.kind).toBe("video");
    });
  });

  describe("phoneLink & whatsappLink", () => {
    it("should validate phone numbers and format for tel: hrefs", () => {
      expect(isValidPhoneForCall("+52 (81) 1234-5678")).toBe(true);
      expect(isValidPhoneForCall("abc")).toBe(false);
      expect(resolveTelHref("+52 8112345678")).toBe("tel:+528112345678");
      expect(formatPhoneForDisplay("8112345678")).toBe("81 1234 5678");
    });

    it("should normalize and resolve WhatsApp links", () => {
      expect(isWhatsappHttpUrl("https://wa.me/528112345678")).toBe(true);
      expect(isValidWhatsappLinkInput("8112345678")).toBe(true);
      expect(normalizeWhatsappLinkForStorage("8112345678")).toBe("https://wa.me/8112345678");
      expect(resolveWhatsappHref("https://wa.me/528112345678", "https://wa.me/fallback")).toContain("wa.me");
    });
  });

  describe("stageColors", () => {
    it("should parse hex colors to RGB", () => {
      expect(parseHex("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(parseHex("invalid")).toBeNull();
    });

    it("should create chip and kanban header CSS styles", () => {
      const chipStyle = stageHexToChipStyle("#6366f1");
      expect(chipStyle.color).toBeDefined();
      expect(chipStyle.backgroundColor).toBeDefined();

      const kanbanStyle = stageHexToKanbanHeaderStyle("#6366f1");
      expect(kanbanStyle.borderBottomColor).toBeDefined();
      expect(kanbanStyle.background).toContain("linear-gradient");
    });
  });

  describe("withTimeout", () => {
    it("should resolve when promise finishes before timeout", async () => {
      const promise = Promise.resolve("success");
      const res = await withTimeout(promise, 1000, "test");
      expect(res).toBe("success");
    });

    it("should reject when promise times out", async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 500));
      await expect(withTimeout(slowPromise, 50, "slow task")).rejects.toThrow("slow task");
    });
  });

  describe("featureIconPicker", () => {
    it("should resolve Lucide icon from feature key", () => {
      expect(iconFromFeatureKey("pool")).toBeDefined();
      expect(iconFromFeatureKey("non_existent_key")).toBeNull();
    });
  });
});

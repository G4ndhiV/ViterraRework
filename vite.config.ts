import { defineConfig, type Plugin } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchFreshInstagramPosts, type IgPost } from "./api/_lib/instagramFeedFetch";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id: string) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

/** Dev-only: sirve /api/instagram-feed desde Node.js (sin CORS) */
function instagramFeedDev(): Plugin {
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  const RATE_MAX = 30;
  const RATE_WINDOW_MS = 60_000;
  let memoryCache: { username: string; posts: IgPost[] } | null = null;

  return {
    name: "instagram-feed-dev",
    configureServer(server) {
      server.middlewares.use(
        "/api/instagram-feed",
        async (req: IncomingMessage, res: ServerResponse) => {
          const origin = req.headers.origin ?? "";
          const allowed =
            origin === "http://localhost:5173" ||
            origin === "http://127.0.0.1:5173" ||
            !origin;
          res.setHeader("Access-Control-Allow-Origin", allowed ? (origin || "http://localhost:5173") : "http://localhost:5173");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }

          const clientKey = String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "dev");
          const now = Date.now();
          const bucket = rateBuckets.get(clientKey);
          if (!bucket || now > bucket.resetAt) {
            rateBuckets.set(clientKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
          } else {
            bucket.count += 1;
            if (bucket.count > RATE_MAX) {
              res.statusCode = 429;
              res.end(JSON.stringify({ error: "Too many requests", posts: [] }));
              return;
            }
          }

          const url = new URL(req.url ?? "", "http://localhost");
          const username = url.searchParams.get("username") ?? "viterrainmobiliaria";
          if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid username", posts: [] }));
            return;
          }
          const parsedCount = parseInt(url.searchParams.get("count") ?? "3", 10);
          const count =
            Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 9) : 3;

          try {
            const fresh = await fetchFreshInstagramPosts(username, count);
            if (fresh.length > 0) {
              memoryCache = { username, posts: fresh };
              res.end(JSON.stringify({ posts: fresh.slice(0, count), stale: false }));
              return;
            }

            if (memoryCache && memoryCache.username === username && memoryCache.posts.length > 0) {
              res.setHeader("X-Feed-Stale", "1");
              res.end(JSON.stringify({ posts: memoryCache.posts.slice(0, count), stale: true }));
              return;
            }

            res.statusCode = 502;
            res.end(JSON.stringify({ error: "Instagram feed unavailable", posts: [] }));
          } catch {
            if (memoryCache && memoryCache.username === username && memoryCache.posts.length > 0) {
              res.setHeader("X-Feed-Stale", "1");
              res.end(JSON.stringify({ posts: memoryCache.posts.slice(0, count), stale: true }));
              return;
            }
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Instagram feed unavailable", posts: [] }));
          }
        }
      );
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
    instagramFeedDev(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
  build: {
    // vendor-pdf (@react-pdf, ~1.4 MB) es grande por naturaleza pero está aislado y
    // se descarga solo al generar un PDF, así que no cuenta como regresión del bundle inicial.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Separa vendors pesados estáticos en chunks cacheables independientes.
        // (@react-pdf y @tiptap se separan solos vía lazy() → chunks async on-demand.)
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // PDF y Excel: compartidos entre chunks lazy → forzarlos a vendor evita que
          // Rollup los "suba" al chunk de AdminWorkspace. Solo se descargan al usarse.
          if (
            id.includes("@react-pdf") ||
            id.includes("fontkit") ||
            id.includes("/yoga-layout") ||
            id.includes("/pdfkit") ||
            id.includes("/restructure") ||
            id.includes("unicode-") ||
            id.includes("/linebreak") ||
            id.includes("/hyphen")
          ) {
            return "vendor-pdf";
          }
          if (id.includes("/xlsx") || id.includes("sheetjs")) return "vendor-xlsx";
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-editor";
          if (id.includes("recharts") || id.includes("/d3-") || id.includes("victory-vendor")) {
            return "vendor-charts";
          }
          if (id.includes("/leaflet")) return "vendor-maps";
          if (id.includes("react-dnd") || id.includes("dnd-core")) return "vendor-dnd";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("/motion/") || id.includes("framer-motion")) return "vendor-motion";
        },
      },
    },
  },
});

/**
 * Vercel Serverless Function — proxy Instagram + scrape + caché Supabase.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  fetchFreshInstagramPosts,
  type IgPost,
} from "./_lib/instagramFeedFetch";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://www.viterrainmobiliaria.com",
  "https://viterrainmobiliaria.com",
  "https://viterra.mx",
  "https://www.viterra.mx",
]);

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;

/** Caché en memoria del proceso (instancias warm de Vercel). */
let memoryCache: { username: string; posts: IgPost[]; at: number } | null = null;

function corsOrigin(req: IncomingMessage): string {
  const origin = req.headers.origin ?? "";
  if (typeof origin === "string" && ALLOWED_ORIGINS.has(origin)) return origin;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && typeof origin === "string" && origin.endsWith(vercelUrl)) return origin;
  return "https://www.viterrainmobiliaria.com";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_MAX;
}

function readQuery(req: IncomingMessage): URLSearchParams {
  const raw = req.url ?? "";
  const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  return new URLSearchParams(q);
}

function supabaseUrl(): string | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  return url?.trim() || null;
}

/** Escritura: requiere service role. */
function supabaseAdmin(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Lectura: service role o anon (RLS permite SELECT público). */
function supabaseReader(): SupabaseClient | null {
  const admin = supabaseAdmin();
  if (admin) return admin;
  const url = supabaseUrl();
  const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function readCache(username: string): Promise<IgPost[] | null> {
  if (memoryCache && memoryCache.username === username && memoryCache.posts.length > 0) {
    return memoryCache.posts;
  }
  const sb = supabaseReader();
  if (!sb) return null;
  const { data, error } = await sb
    .from("instagram_feed_cache")
    .select("posts")
    .eq("username", username)
    .maybeSingle();
  if (error || !data?.posts || !Array.isArray(data.posts) || data.posts.length === 0) return null;
  return data.posts as IgPost[];
}

async function writeCache(username: string, posts: IgPost[]): Promise<void> {
  memoryCache = { username, posts, at: Date.now() };
  const sb = supabaseAdmin();
  if (!sb) return;
  await sb.from("instagram_feed_cache").upsert({
    username,
    posts,
    fetched_at: new Date().toISOString(),
  });
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  }
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const origin = corsOrigin(req);
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

    if (req.method === "OPTIONS") {
      res.statusCode = 200;
      res.end();
      return;
    }

    const clientKey = String(
      req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown"
    );
    if (!checkRateLimit(clientKey)) {
      sendJson(res, 429, { error: "Too many requests", posts: [] });
      return;
    }

    const params = readQuery(req);
    const username = params.get("username") ?? "viterrainmobiliaria";
    const parsedCount = parseInt(params.get("count") ?? "3", 10);
    const count =
      Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 9) : 3;

    if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
      sendJson(res, 400, { error: "Invalid username", posts: [] });
      return;
    }

    const fresh = await fetchFreshInstagramPosts(username, count);
    if (fresh.length > 0) {
      await writeCache(username, fresh);
      sendJson(res, 200, { posts: fresh.slice(0, count), stale: false });
      return;
    }

    const cached = await readCache(username);
    if (cached && cached.length > 0) {
      sendJson(res, 200, { posts: cached.slice(0, count), stale: true }, { "X-Feed-Stale": "1" });
      return;
    }

    sendJson(res, 502, { error: "Instagram feed unavailable", posts: [] });
  } catch (err) {
    console.error("[instagram-feed]", err);
    try {
      const params = readQuery(req);
      const username = params.get("username") ?? "viterrainmobiliaria";
      const parsedCount = parseInt(params.get("count") ?? "3", 10);
      const count =
        Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 9) : 3;
      const cached = await readCache(username);
      if (cached && cached.length > 0) {
        sendJson(res, 200, { posts: cached.slice(0, count), stale: true }, { "X-Feed-Stale": "1" });
        return;
      }
    } catch {
      /* fall through */
    }
    sendJson(res, 500, { error: "Instagram feed unavailable", posts: [] });
  }
}

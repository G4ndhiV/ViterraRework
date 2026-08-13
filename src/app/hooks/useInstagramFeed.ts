import { useCallback, useEffect, useState } from "react";
import { FALLBACK_INSTAGRAM_POSTS, type InstagramPost } from "../../data/instagramFallback";
import { getSupabaseClient } from "../lib/supabaseClient";

export type { InstagramPost };

const IG_USERNAME = "viterrainmobiliaria";
const MAX_ATTEMPTS = 2;
const LS_KEY = `viterra_ig_feed_${IG_USERNAME}`;
const LS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type CachedFeed = { posts: InstagramPost[]; savedAt: number };

function readLocalCache(): InstagramPost[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFeed;
    if (!Array.isArray(parsed?.posts) || parsed.posts.length === 0) return null;
    if (Date.now() - (parsed.savedAt || 0) > LS_MAX_AGE_MS) return null;
    return parsed.posts.filter((p) => Boolean(p?.shortcode));
  } catch {
    return null;
  }
}

function writeLocalCache(posts: InstagramPost[]) {
  try {
    const payload: CachedFeed = { posts, savedAt: Date.now() };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

async function fetchFromSupabase(count: number): Promise<InstagramPost[] | null> {
  try {
    const client = getSupabaseClient();
    if (!client) return null;

    const queryPromise = (async () => {
      const { data, error } = await client
        .from("instagram_feed_cache")
        .select("posts")
        .eq("username", IG_USERNAME)
        .maybeSingle();

      if (!error && Array.isArray(data?.posts) && data.posts.length > 0) {
        return (data.posts as InstagramPost[])
          .slice(0, count)
          .filter((p) => Boolean(p?.shortcode));
      }
      return null;
    })();

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 500)
    );

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch {
    /* ignore supabase errors */
  }
  return null;
}

async function fetchFeed(count: number, signal?: AbortSignal): Promise<InstagramPost[]> {
  const res = await fetch(
    `/api/instagram-feed?username=${encodeURIComponent(IG_USERNAME)}&count=${count}&_=${Date.now()}`,
    { cache: "no-store", signal }
  );
  const data = (await res.json()) as { posts?: InstagramPost[]; error?: string };
  if (Array.isArray(data?.posts) && data.posts.length > 0) {
    return data.posts.slice(0, count).filter((p) => Boolean(p?.shortcode));
  }
  throw new Error(data?.error || `instagram-feed ${res.status}`);
}

/** Último recurso en el navegador: HTML del /embed/ vía proxy CORS. */
async function fetchFeedFromBrowser(count: number, signal?: AbortSignal): Promise<InstagramPost[]> {
  const targets = [
    `https://www.instagram.com/${IG_USERNAME}/embed/`,
    `https://www.instagram.com/${IG_USERNAME}/`,
  ];
  const proxies = targets.flatMap((target) => [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    `https://corsproxy.io/?${encodeURIComponent(target)}`,
  ]);

  for (const url of proxies) {
    if (signal?.aborted) break;
    try {
      const res = await fetch(url, { signal, cache: "no-store" });
      if (!res.ok) continue;
      const html = await res.text();
      const posts = scrapeShortcodesFromHtml(html, count);
      if (posts.length > 0) return posts;
    } catch {
      /* next proxy */
    }
  }
  return [];
}

function scrapeShortcodesFromHtml(html: string, count: number): InstagramPost[] {
  const posts: InstagramPost[] = [];
  const seen = new Set<string>();

  const rootRe =
    /shortcode_media\\":\{\\"__typename\\":\\"(GraphVideo|GraphSidecar|GraphImage)\\",\\"id\\":\\"\d+\\",\\"shortcode\\":\\"([A-Za-z0-9_-]+)\\"/g;

  for (const m of html.matchAll(rootRe)) {
    const typename = m[1];
    const shortcode = m[2];
    if (seen.has(shortcode)) continue;
    seen.add(shortcode);
    const chunk = html.slice(m.index ?? 0, (m.index ?? 0) + 1800);
    const thumbMatch = chunk.match(/\\"display_url\\":\\"((?:[^"\\]|\\.)+?)\\"/);
    posts.push({
      shortcode,
      type: typename === "GraphVideo" ? "reel" : "p",
      videoUrl: null,
      thumbnail: thumbMatch
        ? thumbMatch[1]
            .replace(/\\+u0025/gi, "%")
            .replace(/\\+u0026/gi, "&")
            .replace(/\\+u002f/gi, "/")
            .replace(/\\\//g, "/")
        : null,
      caption: "",
    });
    if (posts.length >= count) return posts;
  }

  return posts;
}

export function useInstagramFeed(count = 3) {
  const [posts, setPosts] = useState<InstagramPost[]>(() => {
    if (typeof window === "undefined") return FALLBACK_INSTAGRAM_POSTS.slice(0, count);
    const cached = readLocalCache();
    if (cached && cached.length > 0) {
      return cached.slice(0, count);
    }
    return FALLBACK_INSTAGRAM_POSTS.slice(0, count);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(false);
      let lastErr: unknown;

      try {
        // 1. Intento API local / dev server
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          if (signal?.aborted) return;
          try {
            const next = await fetchFeed(count, signal);
            if (signal?.aborted) return;
            if (next && next.length > 0) {
              setPosts(next);
              writeLocalCache(next);
              setError(false);
              return;
            }
          } catch (err) {
            lastErr = err;
            if (signal?.aborted) return;
            await new Promise((r) => setTimeout(r, 20 * (attempt + 1)));
          }
        }

        if (signal?.aborted) return;

        // 2. Intento Supabase Cache Table
        try {
          const sbPosts = await fetchFromSupabase(count);
          if (sbPosts && sbPosts.length > 0) {
            if (signal?.aborted) return;
            setPosts(sbPosts);
            writeLocalCache(sbPosts);
            setError(false);
            return;
          }
        } catch (err) {
          lastErr = err;
        }

        if (signal?.aborted) return;

        // 3. Intento Browser Proxy
        try {
          const browserPosts = await fetchFeedFromBrowser(count, signal);
          if (browserPosts.length > 0) {
            if (signal?.aborted) return;
            setPosts(browserPosts);
            writeLocalCache(browserPosts);
            setError(false);
            return;
          }
        } catch (err) {
          lastErr = err;
        }

        if (signal?.aborted) return;

        // 4. Local storage o Fallback definitivo
        const cached = readLocalCache();
        if (cached && cached.length > 0) {
          setPosts(cached.slice(0, count));
        } else {
          setPosts(FALLBACK_INSTAGRAM_POSTS.slice(0, count));
        }
        setError(false);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [count]
  );

  useEffect(() => {
    let ac = new AbortController();
    void load(ac.signal);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      ac.abort();
      ac = new AbortController();
      void load(ac.signal);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ac.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  return { posts, loading, error, profileUrl: `https://www.instagram.com/${IG_USERNAME}/` };
}

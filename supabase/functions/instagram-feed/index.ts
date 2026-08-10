/**
 * Proxy para obtener los últimos posts de Instagram sin restricciones CORS.
 *
 * GET /functions/v1/instagram-feed
 *   ?username=viterrainmobiliaria   (opcional)
 *   &count=3                        (opcional)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

type IgPost = {
  shortcode: string;
  type: "reel" | "p";
  videoUrl: string | null;
  thumbnail: string | null;
  caption: string;
};

const IG_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function unescapeIgUrl(raw: string): string {
  let s = raw;
  for (let i = 0; i < 5; i++) {
    const next = s
      .replace(/\\\\/g, "\\")
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
        String.fromCharCode(parseInt(hex, 16))
      )
      .replace(/\\\//g, "/")
      .replace(/\\"/g, '"');
    if (next === s) break;
    s = next;
  }
  return s;
}

function scrapePostsFromHtml(html: string, count: number): IgPost[] {
  const posts: IgPost[] = [];
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
    const videoMatch = chunk.match(/\\"video_url\\":\\"((?:[^"\\]|\\.)+?)\\"/);
    const isVideo = typename === "GraphVideo" || /\\"is_video\\":true/.test(chunk.slice(0, 400));
    posts.push({
      shortcode,
      type: isVideo ? "reel" : "p",
      videoUrl: videoMatch ? unescapeIgUrl(videoMatch[1]) : null,
      thumbnail: thumbMatch ? unescapeIgUrl(thumbMatch[1]) : null,
      caption: "",
    });
    if (posts.length >= count) return posts;
  }
  return posts.slice(0, count);
}

function mapWebProfileEdges(
  edges: { node: Record<string, unknown> }[],
  count: number
): IgPost[] {
  return edges
    .slice(0, count)
    .map(({ node: n }) => {
      const isVideo = n.__typename === "GraphVideo";
      const captionEdges =
        (n.edge_media_to_caption as { edges: { node: { text: string } }[] } | undefined)?.edges ?? [];
      const caption = captionEdges[0]?.node?.text ?? "";
      return {
        shortcode: String(n.shortcode ?? ""),
        type: (isVideo ? "reel" : "p") as "reel" | "p",
        videoUrl: isVideo ? ((n.video_url as string) ?? null) : null,
        thumbnail: (n.thumbnail_src ?? n.display_url ?? null) as string | null,
        caption: caption.slice(0, 140),
      };
    })
    .filter((p) => Boolean(p.shortcode));
}

async function fetchFresh(username: string, count: number): Promise<IgPost[]> {
  try {
    const embedRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/embed/`, {
      headers: {
        "User-Agent": IG_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-MX,es;q=0.9",
        Referer: `https://www.instagram.com/${username}/`,
      },
    });
    if (embedRes.ok) {
      const posts = scrapePostsFromHtml(await embedRes.text(), count);
      if (posts.length > 0) return posts;
    }
  } catch {
    /* continue */
  }

  for (const host of ["www.instagram.com", "i.instagram.com"] as const) {
    try {
      const igRes = await fetch(
        `https://${host}/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
        {
          headers: {
            "User-Agent": IG_UA,
            "x-ig-app-id": "936619743392459",
            Accept: "application/json",
            "Accept-Language": "es-MX,es;q=0.9",
            Referer: "https://www.instagram.com/",
          },
        }
      );
      if (!igRes.ok) continue;
      const data = await igRes.json();
      const edges: { node: Record<string, unknown> }[] =
        data?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
      const posts = mapWebProfileEdges(edges, count);
      if (posts.length > 0) return posts;
    } catch {
      /* next */
    }
  }

  return [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const username = url.searchParams.get("username") ?? "viterrainmobiliaria";
  const parsedCount = parseInt(url.searchParams.get("count") ?? "3", 10);
  const count = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 9) : 3;

  if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
    return json({ error: "Invalid username", posts: [] }, 400);
  }

  try {
    const posts = await fetchFresh(username, count);
    if (posts.length > 0) return json({ posts });
    return json({ error: "Instagram feed unavailable", posts: [] }, 502);
  } catch (err) {
    return json({ error: String(err), posts: [] }, 500);
  }
});

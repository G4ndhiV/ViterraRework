/**
 * Fetch/scrape helpers for Instagram public profile posts (server-side).
 */

export type IgPost = {
  shortcode: string;
  type: "reel" | "p";
  videoUrl: string | null;
  thumbnail: string | null;
  caption: string;
};

const IG_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export function mapWebProfileEdges(
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

export function unescapeIgUrl(raw: string): string {
  if (!raw) return "";
  let res = raw;
  res = res.replace(/\\+u0025/gi, "%");
  res = res.replace(/\\+u0026/gi, "&");
  res = res.replace(/\\+u002f/gi, "/");
  res = res.replace(/\\+u003d/gi, "=");
  res = res.replace(/\\+\//g, "/");
  res = res.replace(/\\"/g, '"');
  res = res.replace(/\\\//g, "/");
  return res;
}


/**
 * Extrae posts del HTML (perfil o /embed/).
 * Prioriza bloques `shortcode_media` (publicaciones raíz, no slides de carrusel).
 * Soporta JSON escapado del embed (`\\"shortcode\\":\\"...\\"`).
 */
export function scrapePostsFromHtml(html: string, count: number): IgPost[] {
  const posts: IgPost[] = [];
  const seen = new Set<string>();

  // Exacto al JSON escapado del /embed/: shortcode_media\":{\"__typename\":\"Graph…\",\"id\":\"…\",\"shortcode\":\"…”
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

  // Fallback plano (API JSON sin escapar)
  const plainRootRe =
    /"shortcode_media"\s*:\s*\{\s*"__typename"\s*:\s*"(GraphVideo|GraphSidecar|GraphImage)"\s*,\s*"id"\s*:\s*"\d+"\s*,\s*"shortcode"\s*:\s*"([A-Za-z0-9_-]+)"/g;
  for (const m of html.matchAll(plainRootRe)) {
    const shortcode = m[2];
    if (seen.has(shortcode)) continue;
    seen.add(shortcode);
    posts.push({
      shortcode,
      type: m[1] === "GraphVideo" ? "reel" : "p",
      videoUrl: null,
      thumbnail: null,
      caption: "",
    });
    if (posts.length >= count) return posts;
  }

  return posts.slice(0, count);
}

export async function httpsGetText(
  url: string,
  headers: Record<string, string>
): Promise<{ statusCode: number; body: string }> {
  const https = await import("node:https");
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      // Follow one redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGetText(res.headers.location, headers).then(resolve, reject);
        res.resume();
        return;
      }
      let body = "";
      res.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      res.on("end", () => resolve({ statusCode: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
  });
}

const igHeaders = {
  "User-Agent": IG_UA,
  "x-ig-app-id": "936619743392459",
  Accept: "application/json,text/html,*/*",
  "Accept-Language": "es-MX,es;q=0.9",
  Referer: "https://www.instagram.com/",
};

/** Intenta API oficial no documentada, luego /embed/ (fiable), luego perfil. */
export async function fetchFreshInstagramPosts(
  username: string,
  count: number
): Promise<IgPost[]> {
  // 1) Embed HTML — suele traer shortcode_media con los posts recientes
  try {
    const { statusCode, body } = await httpsGetText(
      `https://www.instagram.com/${encodeURIComponent(username)}/embed/`,
      {
        "User-Agent": IG_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-MX,es;q=0.9",
        Referer: `https://www.instagram.com/${username}/`,
      }
    );
    if (statusCode >= 200 && statusCode < 300) {
      const posts = scrapePostsFromHtml(body, count);
      if (posts.length > 0) return posts;
    }
  } catch {
    /* continue */
  }

  try {
    const { statusCode, body } = await httpsGetText(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      igHeaders
    );
    if (statusCode >= 200 && statusCode < 300) {
      const data = JSON.parse(body) as {
        data?: { user?: { edge_owner_to_timeline_media?: { edges?: { node: Record<string, unknown> }[] } } };
      };
      const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
      const posts = mapWebProfileEdges(edges, count);
      if (posts.length > 0) return posts;
    }
  } catch {
    /* continue */
  }

  try {
    const { statusCode, body } = await httpsGetText(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      igHeaders
    );
    if (statusCode >= 200 && statusCode < 300) {
      const data = JSON.parse(body) as {
        data?: { user?: { edge_owner_to_timeline_media?: { edges?: { node: Record<string, unknown> }[] } } };
      };
      const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
      const posts = mapWebProfileEdges(edges, count);
      if (posts.length > 0) return posts;
    }
  } catch {
    /* continue */
  }

  try {
    const { statusCode, body } = await httpsGetText(
      `https://www.instagram.com/${encodeURIComponent(username)}/`,
      {
        "User-Agent": IG_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-MX,es;q=0.9",
      }
    );
    if (statusCode >= 200 && statusCode < 300) {
      const posts = scrapePostsFromHtml(body, count);
      if (posts.length > 0) return posts;
    }
  } catch {
    /* empty */
  }

  return [];
}

/**
 * Fetch/scrape helpers for Instagram public profile posts (server-side).
 * Vive en api/_lib para que Vercel empaquete la función sin imports ESM rotos.
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

/** Deshace escapes anidados del JSON del embed (`\\u0026`, `\\u00253D`, etc.). */
export function unescapeIgUrl(raw: string): string {
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

/**
 * Extrae posts del HTML (perfil o /embed/).
 * Prioriza bloques `shortcode_media` (publicaciones raíz).
 */
export function scrapePostsFromHtml(html: string, count: number): IgPost[] {
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
  // Preferir fetch global (Node 18+ / Vercel) — más fiable que node:https en serverless.
  const res = await fetch(url, { headers, redirect: "follow" });
  const body = await res.text();
  return { statusCode: res.status, body };
}

const igHeaders = {
  "User-Agent": IG_UA,
  "x-ig-app-id": "936619743392459",
  Accept: "application/json,text/html,*/*",
  "Accept-Language": "es-MX,es;q=0.9",
  Referer: "https://www.instagram.com/",
};

/** Embed HTML primero (fiable), luego APIs web_profile_info, luego perfil. */
export async function fetchFreshInstagramPosts(
  username: string,
  count: number
): Promise<IgPost[]> {
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
        data?: {
          user?: { edge_owner_to_timeline_media?: { edges?: { node: Record<string, unknown> }[] } };
        };
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
        data?: {
          user?: { edge_owner_to_timeline_media?: { edges?: { node: Record<string, unknown> }[] } };
        };
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

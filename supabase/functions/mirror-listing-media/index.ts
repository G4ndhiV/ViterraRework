/**
 * Copia fotos externas (Tokko, CDN, etc.) a Supabase Storage y actualiza `image` / `images`.
 *
 * Requiere migración `listings_storage_bucket` (bucket `listings`).
 *
 * Secrets (igual que tokko-sync):
 * - SYNC_HTTP_SECRET — header x-sync-secret o Bearer
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Opcional:
 * - MIRROR_MEDIA_ROW_LIMIT — filas a procesar por invocación (default 12, máx 35)
 * - MIRROR_MEDIA_FETCH_SCAN — filas escaneadas por query (default 45)
 * - MIRROR_MEDIA_MAX_BYTES — por archivo (default 15728640 = 15 MiB)
 * - MIRROR_IMAGE_REFERER — Referer en GET (si no va definido y la URL es *.tokkobroker.com, se usa https://www.tokkobroker.com/)
 * - MIRROR_IMAGE_FETCH_RETRIES — reintentos ante reset/TLS/502 (default 4, máx 8)
 *
 * POST JSON:
 *   { "table": "properties" | "developments", "limit": 12, "dryRun": true, "offset": 0 }
 * - offset: paginación por orden `id` (PostgREST range). Usa `next_offset` de la respuesta en la siguiente llamada.
 *
 * Invoke:
 *   curl -sS -X POST "$SUPABASE_URL/functions/v1/mirror-listing-media" \
 *     -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
 *     -H "x-sync-secret: $SYNC_HTTP_SECRET" -H "Content-Type: application/json" \
 *     -d '{"table":"properties","dryRun":true,"limit":5,"offset":0}'
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BUCKET = "listings";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v && v.length > 0 ? v : undefined;
}

function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing required secret: ${name}`);
  return v;
}

function assertSecret(req: Request): void {
  const expected = requireEnv("SYNC_HTTP_SECRET");
  const fromHeader = (req.headers.get("x-sync-secret") ?? "").trim();
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (fromHeader === expected || bearer === expected) return;
  throw new Error("Unauthorized");
}

function isMirroredUrl(u: string): boolean {
  return u.includes("/storage/v1/object/public/listings/");
}

function isExternalHttpUrl(u: string): boolean {
  return /^https?:\/\//i.test(u.trim()) && !isMirroredUrl(u);
}

/** Orden portada + galería, sin duplicados consecutivos. */
function orderedMediaUrls(image: unknown, images: unknown): string[] {
  const out: string[] = [];
  const push = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (out.length > 0 && out[out.length - 1] === t) return;
    out.push(t);
  };
  if (typeof image === "string") push(image);
  if (Array.isArray(images)) {
    for (const x of images) {
      if (typeof x === "string") push(x);
    }
  }
  return out;
}

function rowNeedsMirror(image: unknown, images: unknown): boolean {
  return orderedMediaUrls(image, images).some(isExternalHttpUrl);
}

function extFromMimeAndUrl(contentType: string | null, url: string): string {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  const path = new URL(url, "https://dummy.local").pathname.toLowerCase();
  const m = path.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/);
  if (m) return m[1] === "jpeg" ? "jpg" : m[1];
  return "jpg";
}

async function sha256HexOfString(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function refererForImageUrl(url: string): string | undefined {
  const explicit = getEnv("MIRROR_IMAGE_REFERER");
  if (explicit) return explicit;
  try {
    const u = new URL(url);
    if (/\.tokkobroker\.com$/i.test(u.hostname) || u.hostname === "static.tokkobroker.com") {
      return "https://www.tokkobroker.com/";
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function isRetriableImageFetchError(msg: string): boolean {
  const m = msg.toLowerCase();
  if (m.includes("connection reset")) return true;
  if (m.includes("sendrequest")) return true;
  if (m.includes("connection refused")) return true;
  if (m.includes("unexpected eof")) return true;
  if (m.includes("broken pipe")) return true;
  if (m.includes("tls handshake")) return true;
  if (m.includes("timed out")) return true;
  if (m.includes("econnreset")) return true;
  if (m.includes("http 502")) return true;
  if (m.includes("http 503")) return true;
  if (m.includes("http 504")) return true;
  return false;
}

async function fetchImageBytesOnce(
  url: string,
  maxBytes: number,
): Promise<{ bytes: Uint8Array; contentType: string | null }> {
  const referer = refererForImageUrl(url);
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent":
        getEnv("MIRROR_IMAGE_USER_AGENT") ??
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      ...(referer ? { Referer: referer } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GET image HTTP ${res.status} for ${url.slice(0, 120)}`);
  }
  const len = res.headers.get("content-length");
  if (len && Number(len) > maxBytes) throw new Error(`image too large (${len} bytes)`);
  const ab = await res.arrayBuffer();
  if (ab.byteLength > maxBytes) throw new Error(`image too large (${ab.byteLength} bytes)`);
  return { bytes: new Uint8Array(ab), contentType: res.headers.get("content-type") };
}

async function fetchImageBytes(
  url: string,
  maxBytes: number,
): Promise<{ bytes: Uint8Array; contentType: string | null }> {
  const retries = Math.min(Math.max(Number(getEnv("MIRROR_IMAGE_FETCH_RETRIES") ?? "") || 4, 1), 8);
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchImageBytesOnce(url, maxBytes);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt === retries || !isRetriableImageFetchError(lastErr.message)) throw lastErr;
      await new Promise((r) => setTimeout(r, 200 * 2 ** (attempt - 1)));
    }
  }
  throw lastErr ?? new Error("fetchImageBytes: unknown error");
}

function publicObjectUrl(supabaseUrl: string, objectPath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

type TableName = "properties" | "developments";

type Row = { id: string; tokko_id: string; image: string | null; images: string[] | null };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
    assertSecret(req);

    const body = (await req.json().catch(() => ({}))) as {
      table?: string;
      limit?: number;
      dryRun?: boolean;
      offset?: number;
    };

    const table = (body.table === "developments" ? "developments" : "properties") as TableName;
    const dryRun = Boolean(body.dryRun);
    const rowLimit = Math.min(
      Math.max(Number(getEnv("MIRROR_MEDIA_ROW_LIMIT") ?? body.limit ?? 12) || 12, 1),
      35,
    );
    const scanBatch = Math.min(
      Math.max(Number(getEnv("MIRROR_MEDIA_FETCH_SCAN") ?? "") || 45, 10),
      120,
    );
    const maxBytes = Math.min(
      Math.max(Number(getEnv("MIRROR_MEDIA_MAX_BYTES") ?? "") || 15_728_640, 256_000),
      52_428_800,
    );

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const prefix = table === "properties" ? "properties" : "developments";

    let offset = Math.max(0, Math.floor(Number(body.offset ?? 0) || 0));
    let processed = 0;
    let scanned = 0;
    const errors: string[] = [];
    const mirrored_tokko_ids: string[] = [];

    while (processed < rowLimit && scanned < 8000) {
      const to = offset + scanBatch - 1;
      const { data, error } = await supabase
        .from(table)
        .select("id, tokko_id, image, images")
        .order("id", { ascending: true })
        .range(offset, to);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Row[];
      if (rows.length === 0) break;

      let consumedInBatch = 0;
      let hitRowLimit = false;
      for (const row of rows) {
        consumedInBatch++;
        scanned++;
        if (!rowNeedsMirror(row.image, row.images)) continue;

        if (dryRun) {
          processed++;
          mirrored_tokko_ids.push(row.tokko_id);
          if (processed >= rowLimit) {
            hitRowLimit = true;
            break;
          }
          continue;
        }

        try {
          const urls = orderedMediaUrls(row.image, row.images);
          const newUrls: string[] = [];
          for (const u of urls) {
            if (!isExternalHttpUrl(u)) {
              newUrls.push(u);
              continue;
            }
            const { bytes, contentType } = await fetchImageBytes(u, maxBytes);
            const ext = extFromMimeAndUrl(contentType, u);
            const hash = (await sha256HexOfString(u)).slice(0, 24);
            const objectPath = `${prefix}/${row.tokko_id}/${hash}.${ext}`;
            const ct = contentType?.split(";")[0]?.trim() || `image/${ext === "jpg" ? "jpeg" : ext}`;
            const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
              upsert: true,
              contentType: ct,
            });
            if (upErr) throw new Error(upErr.message);
            newUrls.push(publicObjectUrl(supabaseUrl, objectPath));
          }

          const newImage = newUrls[0] ?? null;
          const newImages = newUrls;

          const { error: upRow } = await supabase
            .from(table)
            .update({
              image: newImage,
              images: newImages,
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          if (upRow) throw new Error(upRow.message);

          processed++;
          mirrored_tokko_ids.push(row.tokko_id);
          if (processed >= rowLimit) {
            hitRowLimit = true;
            break;
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`tokko_id=${row.tokko_id}: ${msg}`);
        }
      }

      // Solo avanzar por filas recorridas; si se cortó por `limit` a mitad del lote, no saltar el resto.
      offset += consumedInBatch;
      if (rows.length < scanBatch) break;
      if (hitRowLimit || processed >= rowLimit) break;
    }

    return jsonResponse({
      ok: true,
      dryRun,
      table,
      processed,
      scanned,
      next_offset: offset,
      mirrored_tokko_ids,
      errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "Unauthorized" ? 401 : 500;
    return jsonResponse({ ok: false, error: msg }, status);
  }
});

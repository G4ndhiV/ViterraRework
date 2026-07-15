const OBJECT_MARKER = "/storage/v1/object/public/";

/**
 * Reescribe una URL pública de Supabase Storage para servirla redimensionada/comprimida
 * vía el endpoint de transformación de imágenes (`/storage/v1/render/image/public/...`).
 * URLs que no son de Supabase Storage (p. ej. el CDN de Tokko) se devuelven sin cambios,
 * porque ese endpoint no existe para ellas.
 */
export function optimizedImageUrl(
  url: string | undefined | null,
  opts: { width?: number; height?: number; quality?: number } = {},
): string {
  const u = (url ?? "").trim();
  if (!u) return u;

  const idx = u.indexOf(OBJECT_MARKER);
  if (idx === -1) return u;

  const base = u.slice(0, idx);
  const rest = u.slice(idx + OBJECT_MARKER.length);
  const [bucketAndPath, existingQuery] = rest.split("?");
  if (!bucketAndPath) return u;

  const params = new URLSearchParams(existingQuery ?? "");
  if (opts.width) params.set("width", String(Math.round(opts.width)));
  if (opts.height) params.set("height", String(Math.round(opts.height)));
  if (opts.width && opts.height) params.set("resize", "cover");
  params.set("quality", String(opts.quality ?? 75));

  return `${base}/storage/v1/render/image/public/${bucketAndPath}?${params.toString()}`;
}

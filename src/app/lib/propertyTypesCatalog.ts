/** Comparación de tipo de inmueble para filtros del sitio público. */
export function propertyMatchesTypeFilter(propertyType: string, filterType: string): boolean {
  const f = filterType.trim();
  if (!f) return true;
  return propertyType.trim().toLowerCase() === f.toLowerCase();
}

/** Lista única ordenada (es-MX), sin distinguir mayúsculas. */
export function mergePropertyTypeNames(...sources: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of sources) {
    for (const raw of list) {
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, "es"));
}

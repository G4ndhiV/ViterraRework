import type { Property } from "../components/PropertyCard";
import type { Development } from "../data/developments";

function normTokko(id: string | undefined | null): string {
  return id?.trim().toLowerCase() ?? "";
}

/** Mapa propiedad (id interno) → desarrollo (id interno) vía Tokko. */
export function buildPropertyToDevelopmentIdMap(
  properties: Property[],
  developments: Development[],
): Map<string, string> {
  const developmentIdByTokko = new Map<string, string>();
  for (const d of developments) {
    const tokko = normTokko(d.tokkoId);
    if (tokko) developmentIdByTokko.set(tokko, d.id);
  }
  const map = new Map<string, string>();
  for (const p of properties) {
    const tokko = normTokko(p.developmentTokkoId);
    if (!tokko) continue;
    const devId = developmentIdByTokko.get(tokko);
    if (devId) map.set(p.id, devId);
  }
  return map;
}

/** Propiedades del catálogo vinculadas a un desarrollo (`development_tokko_id` ↔ `tokko_id`). */
export function propertiesForDevelopmentFilter(
  properties: Property[],
  development: Development | undefined,
): Property[] {
  if (!development) return properties;
  const devTokko = normTokko(development.tokkoId);
  if (!devTokko) return [];
  return properties.filter((p) => normTokko(p.developmentTokkoId) === devTokko);
}

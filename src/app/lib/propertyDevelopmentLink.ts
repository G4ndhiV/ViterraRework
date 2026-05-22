import type { Property } from "../components/PropertyCard";
import type { Development } from "../data/developments";

function normTokko(id: string | undefined | null): string {
  return id?.trim().toLowerCase() ?? "";
}

/** Clave usada en `properties.development_tokko_id` (Tokko o `manual_{id}`). */
export function developmentLinkTokkoId(development: Pick<Development, "id" | "tokkoId">): string {
  return development.tokkoId?.trim() || `manual_${development.id}`;
}

/** Busca desarrollo por `development_tokko_id` guardado en la propiedad. */
export function resolveDevelopmentByTokkoId(
  developments: Development[],
  developmentTokkoId: string | undefined | null,
): Development | null {
  const key = normTokko(developmentTokkoId);
  if (!key) return null;
  return (
    developments.find(
      (d) => normTokko(d.tokkoId) === key || normTokko(developmentLinkTokkoId(d)) === key,
    ) ?? null
  );
}

/** Mapa propiedad (id interno) → desarrollo (id interno) vía Tokko. */
export function buildPropertyToDevelopmentIdMap(
  properties: Property[],
  developments: Development[],
): Map<string, string> {
  const developmentIdByTokko = new Map<string, string>();
  for (const d of developments) {
    developmentIdByTokko.set(normTokko(developmentLinkTokkoId(d)), d.id);
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
  const devTokko = normTokko(developmentLinkTokkoId(development));
  return properties.filter((p) => normTokko(p.developmentTokkoId) === devTokko);
}

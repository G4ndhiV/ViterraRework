/** Fusión superficial recursiva: objetos anidados se combinan; arrays del patch sustituyen al base. */
export function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T> | null | undefined): T {
  if (!patch || typeof patch !== "object") return { ...base };
  const out = { ...base } as T;
  for (const k of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[k];
    const bv = base[k];
    if (pv === undefined || pv === null) continue;
    if (Array.isArray(pv)) {
      (out as Record<string, unknown>)[k as string] = pv;
    } else if (pv !== null && typeof pv === "object" && !Array.isArray(pv) && bv !== null && typeof bv === "object" && !Array.isArray(bv)) {
      (out as Record<string, unknown>)[k as string] = deepMerge(bv as Record<string, unknown>, pv as Record<string, unknown>);
    } else {
      (out as Record<string, unknown>)[k as string] = pv;
    }
  }
  return out;
}

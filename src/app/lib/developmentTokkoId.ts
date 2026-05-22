/** Tokko numérico de sync; oculta IDs internos `manual_*` en el admin. */
export function isPublicDevelopmentTokkoId(tokkoId: string | undefined | null): boolean {
  const t = tokkoId?.trim() ?? "";
  if (!t || t.startsWith("manual_")) return false;
  return /^\d+$/.test(t);
}

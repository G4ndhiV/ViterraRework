/** Referencia visible en ficha pública y CRM (desarrollos). */

export function developmentReferenceFromTokkoId(tokkoId: string): string {
  const t = tokkoId.trim();
  if (/^\d+$/.test(t)) return `VAD${t}`;
  if (t.startsWith("manual_")) {
    const uuid = t.slice("manual_".length).replace(/-/g, "");
    const short = uuid.slice(0, 8).toUpperCase();
    return short ? `VDV-${short}` : "VDV";
  }
  return `VAD${t}`;
}

export function resolveDevelopmentReferenceCode(
  referenceCode: string | undefined | null,
  tokkoId: string,
  developmentId: string,
): string {
  const manual = referenceCode?.trim();
  if (manual) return manual;
  const linkId = tokkoId.trim() || `manual_${developmentId}`;
  return developmentReferenceFromTokkoId(linkId);
}

/** Vista previa en el formulario antes del primer guardado. */
export function previewDevelopmentReferenceCode(
  referenceCode: string | undefined | null,
  tokkoId: string | undefined | null,
  developmentId: string,
): string {
  return resolveDevelopmentReferenceCode(
    referenceCode,
    tokkoId?.trim() || `manual_${developmentId}`,
    developmentId,
  );
}

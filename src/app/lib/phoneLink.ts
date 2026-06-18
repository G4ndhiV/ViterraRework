/** Teléfono con al menos 10 dígitos (lada México u otro). */
export function isValidPhoneForCall(raw: string | undefined | null): boolean {
  const t = raw?.trim() ?? "";
  if (!t) return true;
  return t.replace(/\D/g, "").length >= 10;
}

/** Texto legible para mostrar en la ficha (conserva formato del admin si ya trae espacios). */
export function formatPhoneForDisplay(phone: string | undefined | null): string {
  const raw = phone?.trim() ?? "";
  if (!raw) return "";
  if (/^[\d+\s().-]+$/.test(raw) && /[\s()-]/.test(raw)) {
    return raw;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 12 && digits.startsWith("52")) {
    const local = digits.slice(2);
    return `+52 ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
  }
  if (digits.length >= 10) return `+${digits}`;
  return raw;
}

/** `tel:` para la ficha pública; null si no hay número usable. */
export function resolveTelHref(phone: string | undefined | null): string | null {
  const raw = phone?.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.startsWith("52") ? `tel:+${digits}` : `tel:+52${digits}`;
  }
  if (digits.length >= 3) return `tel:+${digits}`;
  return null;
}

import type { Lead } from "../data/leads";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Solo dígitos, para comparar teléfonos con distinto formato. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Busca leads cuyo email o teléfono coincidan con el contacto nuevo.
 * El teléfono debe tener al menos 7 dígitos para considerarse válido.
 */
export function findDuplicateLeads(
  leads: Lead[],
  email: string,
  phone: string
): Lead[] {
  const ne = normalizeEmail(email);
  const np = normalizePhone(phone);
  if (!ne && np.length < 7) return [];

  return leads.filter((l) => {
    const emailMatch = ne.length > 0 && normalizeEmail(l.email) === ne;
    const phoneMatch =
      np.length >= 7 &&
      normalizePhone(l.phone).length >= 7 &&
      normalizePhone(l.phone) === np;
    return emailMatch || phoneMatch;
  });
}

/** Identificador único para nuevos leads (compatible con UUID en Supabase). */
export function newLeadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

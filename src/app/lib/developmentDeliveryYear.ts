import type { Development } from "../data/developments";

export const DELIVERY_YEAR_UNDEFINED = "Por definir";

const YEAR_MIN = 1990;

export function parseDeliveryYear(deliveryDate: string | undefined | null): number | null {
  const t = String(deliveryDate ?? "").trim();
  if (!t || t === DELIVERY_YEAR_UNDEFINED) return null;
  const four = t.match(/^(\d{4})\b/);
  if (four) return Number(four[1]);
  const n = Number(t);
  if (Number.isFinite(n) && n >= YEAR_MIN && n <= 2100) return Math.trunc(n);
  return null;
}

export function formatDeliveryYear(year: number | null | undefined): string {
  if (year == null || !Number.isFinite(year)) return DELIVERY_YEAR_UNDEFINED;
  return String(Math.trunc(year));
}

export function allowedDeliveryYears(
  status: Development["status"],
  currentYear = new Date().getFullYear(),
): (number | null)[] {
  if (status === "Disponible") {
    const years: number[] = [];
    for (let y = currentYear; y >= YEAR_MIN; y--) years.push(y);
    return years;
  }
  if (status === "Próximamente") {
    const years: number[] = [];
    for (let y = currentYear; y <= currentYear + 15; y++) years.push(y);
    return years;
  }
  const years: (number | null)[] = [null];
  for (let y = YEAR_MIN; y <= currentYear + 15; y++) years.push(y);
  return years;
}

export function deliveryYearHint(status: Development["status"], currentYear = new Date().getFullYear()): string {
  if (status === "Disponible") {
    return `Listo para entrega: elige ${currentYear} o un año anterior.`;
  }
  if (status === "Próximamente") {
    return `Entrega futura: ${currentYear} o años posteriores.`;
  }
  return "En construcción o pre-venta: cualquier año razonable o «Por definir».";
}

export function isDeliveryYearValidForStatus(
  deliveryDate: string,
  status: Development["status"],
  currentYear = new Date().getFullYear(),
): boolean {
  const year = parseDeliveryYear(deliveryDate);
  const allowed = allowedDeliveryYears(status, currentYear);
  if (year === null) {
    return status === "En Construcción" || status === "Pre-venta";
  }
  return allowed.includes(year);
}

/** Primer año permitido para el estatus (el más relevante en el desplegable). */
export function defaultDeliveryYearForStatus(
  status: Development["status"],
  currentYear = new Date().getFullYear(),
): number | null {
  const allowed = allowedDeliveryYears(status, currentYear).filter((y): y is number => y != null);
  return allowed[0] ?? null;
}

export function defaultDeliveryDateForStatus(
  status: Development["status"],
  currentYear = new Date().getFullYear(),
): string {
  const y = defaultDeliveryYearForStatus(status, currentYear);
  if (y != null && (status === "Disponible" || status === "Próximamente")) {
    return formatDeliveryYear(y);
  }
  if (status === "En Construcción" || status === "Pre-venta") {
    return DELIVERY_YEAR_UNDEFINED;
  }
  return DELIVERY_YEAR_UNDEFINED;
}

export function coerceDeliveryYearOnStatusChange(
  deliveryDate: string,
  newStatus: Development["status"],
  currentYear = new Date().getFullYear(),
): string {
  const trimmed = deliveryDate.trim() || DELIVERY_YEAR_UNDEFINED;
  if (isDeliveryYearValidForStatus(trimmed, newStatus, currentYear)) return trimmed;
  return defaultDeliveryDateForStatus(newStatus, currentYear);
}

export function validateDeliveryDateForSave(
  deliveryDate: string,
  status: Development["status"],
): string | null {
  const trimmed = deliveryDate.trim() || DELIVERY_YEAR_UNDEFINED;
  if (!isDeliveryYearValidForStatus(trimmed, status)) {
    return `El año de entrega no es válido para el estatus «${status}».`;
  }
  return null;
}

export function displayDeliveryYearSelect(deliveryDate: string): string {
  const y = parseDeliveryYear(deliveryDate);
  if (y != null) return String(y);
  return "";
}

export interface DevelopmentUnit {
  type: string;
  address: string;
  spaces: number;
  bedrooms: number;
  coveredArea: number;
  totalArea: number;
  parking: boolean;
  price: number;
  forRent: boolean;
}

export interface Development {
  id: string;
  name: string;
  location: string;
  colony: string;
  fullAddress: string;
  type: string;
  description: string;
  image: string;
  images: string[];
  status: "En Construcción" | "Pre-venta" | "Disponible" | "Próximamente";
  units: number;
  deliveryDate: string;
  priceRange: string;
  amenities: string[];
  services: string[];
  additionalFeatures: string[];
  developmentUnits: DevelopmentUnit[];
  coordinates: {
    lat: number;
    lng: number;
  };
  featured?: boolean;
  /** Columna `display_on_web` en Supabase (por defecto true en creación admin). */
  displayOnWeb?: boolean;
  /** Teléfono de contacto del desarrollo (`in_charge_phone` en Supabase). */
  inChargePhone?: string;
  /** Email de contacto (`in_charge_email` en Supabase). */
  inChargeEmail?: string;
  /** Código de referencia (`reference_code`). */
  referenceCode?: string;
  tokkoId?: string;
  payload?: Record<string, unknown>;
}

/** Valor mostrado en el sitio público cuando no hay fecha de entrega en catálogo. */
export function displayDeliveryDate(value: string | undefined | null): string {
  const t = String(value ?? "").trim();
  return t.length > 0 ? t : "Por definir...";
}

/** @deprecated Sin datos mock; el catálogo viene de Supabase. */
export const seedDevelopments: Development[] = [];

/** Alias para páginas que importaban `developments`; usar datos remotos. */
export const developments: Development[] = seedDevelopments;

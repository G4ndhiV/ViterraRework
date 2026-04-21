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
  tokkoId?: string;
  payload?: Record<string, unknown>;
}

/** @deprecated Sin datos mock; el catálogo viene de Supabase. */
export const seedDevelopments: Development[] = [];

/** Alias para páginas que importaban `developments`; usar datos remotos. */
export const developments: Development[] = seedDevelopments;

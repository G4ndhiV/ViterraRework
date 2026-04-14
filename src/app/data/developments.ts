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
}

export const developments: Development[] = [
  {
    id: "1",
    name: "EVER Zona Real",
    location: "Colonia Jardines Del Valle",
    colony: "Jardines Del Valle",
    fullAddress: "Av. del Servidor Público al 1428",
    type: "Edificio",
    description: "Descubre un desarrollo que redefine el estilo de vida moderno: un condominio exclusivo que combina ubicación estratégica, diseño inteligente y amenidades que elevan tu día a día.",
    image: "https://images.unsplash.com/photo-1758448617761-09367c1748d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kb21pbml1bSUyMHRvd2VyJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3NDM5ODA0OHww&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1758448617761-09367c1748d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kb21pbml1bSUyMHRvd2VyJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3NDM5ODA0OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1642976975710-1d8890dbf5ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbHV4dXJ5JTIwcGVudGhvdXNlJTIwaW50ZXJpb3IlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc3NDM5Nzk5NHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwd2hpdGUlMjBjb3VudGVyc3xlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwbHV4dXJ5JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzc0Mzk3OTk0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiYXRocm9vbSUyMGx1eHVyeXxlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    status: "Pre-venta",
    units: 3,
    deliveryDate: "Diciembre 2025",
    priceRange: "$3,341,418 - $3,888,014",
    amenities: [
      "Elevador de vehículos",
      "Gimnasio equipado",
      "Salón de usos múltiples con cocina",
      "Salón de juegos",
      "Terraza techada y terraza abierta",
      "Elevador de pasajeros",
      "Inversión con visión",
    ],
    services: [
      "Agua de grifo",
      "Pavimento",
      "Alcantarilla",
      "Agua Potable",
      "Electricidad",
    ],
    additionalFeatures: [
      "Gimnasio",
      "Sala de juegos",
    ],
    developmentUnits: [
      {
        type: "Tipo 3",
        address: "Av. del Servidor Público al 1428",
        spaces: 1,
        bedrooms: 2,
        coveredArea: 76,
        totalArea: 76,
        parking: true,
        price: 3341418,
        forRent: false,
      },
      {
        type: "Tipo 1",
        address: "Av. del Servidor Público al 1428",
        spaces: 1,
        bedrooms: 1,
        coveredArea: 65,
        totalArea: 65,
        parking: true,
        price: 3888014,
        forRent: false,
      },
      {
        type: "Tipo 2",
        address: "Av. del Servidor Público al 1428",
        spaces: 1,
        bedrooms: 1,
        coveredArea: 60,
        totalArea: 60,
        parking: true,
        price: 3832667,
        forRent: false,
      },
    ],
    coordinates: {
      lat: 20.676208,
      lng: -103.347210,
    },
    featured: true
  },
  {
    id: "2",
    name: "Residencial Las Colinas",
    location: "Zona Residencial Norte",
    colony: "Las Colinas",
    fullAddress: "Av. Las Colinas 2500",
    type: "Conjunto Residencial",
    description: "Exclusivo complejo de casas con arquitectura contemporánea. Diseño bioclimático y espacios verdes integrados para tu bienestar.",
    image: "https://images.unsplash.com/photo-1764562155616-facdda23671a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXNpZGVudGlhbCUyMGRldmVsb3BtZW50JTIwYXJjaGl0ZWN0dXJlJTIwYWVyaWFsfGVufDF8fHx8MTc3NDM5ODA0OHww&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1764562155616-facdda23671a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXNpZGVudGlhbCUyMGRldmVsb3BtZW50JTIwYXJjaGl0ZWN0dXJlJTIwYWVyaWFsfGVufDF8fHx8MTc3NDM5ODA0OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NDM5Nzk5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwd2hpdGUlMjBjb3VudGVyc3xlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwZ3JheXxlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    status: "En Construcción",
    units: 45,
    deliveryDate: "Junio 2025",
    priceRange: "$380,000 - $620,000",
    amenities: [
      "Parque Central",
      "Casa Club con salón de eventos",
      "Alberca semi-olímpica",
      "Áreas Verdes y jardines",
      "Ciclovía perimetral",
      "Pet Park para mascotas",
      "Cancha de tenis",
      "Área de BBQ",
    ],
    services: [
      "Agua de grifo",
      "Pavimento",
      "Gas natural",
      "Agua Potable",
      "Electricidad",
      "Fibra óptica",
    ],
    additionalFeatures: [
      "Casa Club",
      "Alberca",
      "Cancha deportiva",
    ],
    developmentUnits: [],
    coordinates: {
      lat: 20.680000,
      lng: -103.350000,
    },
    featured: true
  },
  {
    id: "3",
    name: "Urban Living Apartments",
    location: "Distrito Comercial",
    colony: "Centro",
    fullAddress: "Av. Juárez 1800",
    type: "Edificio de Apartamentos",
    description: "Apartamentos modernos en el corazón de la ciudad. Ubicación estratégica cerca de centros comerciales, oficinas y entretenimiento.",
    image: "https://images.unsplash.com/photo-1762397794646-f19044bd0828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBjb21wbGV4JTIwYnVpbGRpbmclMjBleHRlcmlvcnxlbnwxfHx8fDE3NzQzOTgwNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1762397794646-f19044bd0828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBjb21wbGV4JTIwYnVpbGRpbmclMjBleHRlcmlvcnxlbnwxfHx8fDE3NzQzOTgwNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwd2hpdGUlMjBjb3VudGVyc3xlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwZ3JheXxlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    status: "Disponible",
    units: 85,
    deliveryDate: "Entrega Inmediata",
    priceRange: "$180,000 - $420,000",
    amenities: [
      "Gimnasio totalmente equipado",
      "Terraza Común con vista panorámica",
      "Estacionamiento subterráneo",
      "Lobby Premium con seguridad 24/7",
      "Business Center",
      "Área de coworking",
    ],
    services: [
      "Agua de grifo",
      "Gas natural",
      "Agua Potable",
      "Electricidad",
      "Internet de alta velocidad",
    ],
    additionalFeatures: [
      "Gimnasio",
      "Business Center",
    ],
    developmentUnits: [],
    coordinates: {
      lat: 20.672000,
      lng: -103.346000,
    },
    featured: false
  },
  {
    id: "4",
    name: "Vista Lago Residencial",
    location: "Zona Lago, Oeste",
    colony: "Chapala",
    fullAddress: "Paseo del Lago 500",
    type: "Residencial de Lujo",
    description: "Desarrollo exclusivo frente al lago con vistas espectaculares. Diseño arquitectónico contemporáneo y acabados de primera calidad.",
    image: "https://images.unsplash.com/photo-1759256243437-9c8f7238c42b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBtYW5zaW9uJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0Mzk3OTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1759256243437-9c8f7238c42b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBtYW5zaW9uJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0Mzk3OTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwd2hpdGUlMjBjb3VudGVyc3xlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwZ3JheXxlbnwxfHx8fDE3NzQzOTc5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    status: "Próximamente",
    units: 28,
    deliveryDate: "2026",
    priceRange: "$500,000 - $1,200,000",
    amenities: [
      "Muelle Privado",
      "Beach Club exclusivo",
      "Restaurant gourmet",
      "Spa y wellness center",
      "Marina privada",
      "Club náutico",
    ],
    services: [
      "Agua de grifo",
      "Pavimento",
      "Gas natural",
      "Agua Potable",
      "Electricidad",
    ],
    additionalFeatures: [
      "Beach Club",
      "Marina",
      "Spa",
    ],
    developmentUnits: [],
    coordinates: {
      lat: 20.300000,
      lng: -103.200000,
    },
    featured: false
  }
];

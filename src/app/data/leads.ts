export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: "compra" | "venta" | "alquiler" | "asesoria";
  propertyType: string;
  budget: number;
  location: string;
  status: "nuevo" | "contactado" | "calificado" | "negociacion" | "cerrado" | "perdido";
  priority: "alta" | "media" | "baja";
  source: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  lastContact: string;
}

export const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "(555) 123-4567",
    interest: "compra",
    propertyType: "Casa",
    budget: 250000,
    location: "Centro",
    status: "calificado",
    priority: "alta",
    source: "Website",
    assignedTo: "María González",
    notes: "Cliente muy interesado en propiedades en el centro. Busca 3 habitaciones mínimo.",
    createdAt: "2024-03-15",
    lastContact: "2024-03-18"
  },
  {
    id: "2",
    name: "Ana Martínez",
    email: "ana.martinez@email.com",
    phone: "(555) 234-5678",
    interest: "venta",
    propertyType: "Apartamento",
    budget: 180000,
    location: "Norte",
    status: "contactado",
    priority: "media",
    source: "Facebook",
    assignedTo: "Carlos Rodríguez",
    notes: "Quiere vender su apartamento actual. Necesita evaluación.",
    createdAt: "2024-03-16",
    lastContact: "2024-03-17"
  },
  {
    id: "3",
    name: "Roberto Silva",
    email: "roberto.silva@email.com",
    phone: "(555) 345-6789",
    interest: "alquiler",
    propertyType: "Penthouse",
    budget: 3500,
    location: "Sur",
    status: "nuevo",
    priority: "alta",
    source: "Referido",
    assignedTo: "Ana Martínez",
    notes: "Busca alquiler temporal por 6 meses. Ejecutivo extranjero.",
    createdAt: "2024-03-19",
    lastContact: "2024-03-19"
  },
  {
    id: "4",
    name: "Laura Gómez",
    email: "laura.gomez@email.com",
    phone: "(555) 456-7890",
    interest: "compra",
    propertyType: "Villa",
    budget: 450000,
    location: "Este",
    status: "negociacion",
    priority: "alta",
    source: "Instagram",
    assignedTo: "María González",
    notes: "En proceso de negociación para villa en zona residencial exclusiva.",
    createdAt: "2024-03-10",
    lastContact: "2024-03-19"
  },
  {
    id: "5",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@email.com",
    phone: "(555) 567-8901",
    interest: "compra",
    propertyType: "Apartamento",
    budget: 150000,
    location: "Centro",
    status: "contactado",
    priority: "baja",
    source: "Website",
    assignedTo: "Carlos Rodríguez",
    notes: "Primera compra. Necesita asesoría sobre financiamiento.",
    createdAt: "2024-03-14",
    lastContact: "2024-03-16"
  },
  {
    id: "6",
    name: "Patricia Torres",
    email: "patricia.torres@email.com",
    phone: "(555) 678-9012",
    interest: "alquiler",
    propertyType: "Casa",
    budget: 2000,
    location: "Oeste",
    status: "nuevo",
    priority: "media",
    source: "Google",
    assignedTo: "Ana Martínez",
    notes: "Familia con 2 hijos. Busca casa con jardín.",
    createdAt: "2024-03-18",
    lastContact: "2024-03-18"
  },
  {
    id: "7",
    name: "Miguel Rojas",
    email: "miguel.rojas@email.com",
    phone: "(555) 789-0123",
    interest: "compra",
    propertyType: "Oficina",
    budget: 300000,
    location: "Centro",
    status: "cerrado",
    priority: "alta",
    source: "Referido",
    assignedTo: "Carlos Rodríguez",
    notes: "Operación cerrada exitosamente. Cliente muy satisfecho.",
    createdAt: "2024-03-01",
    lastContact: "2024-03-15"
  },
  {
    id: "8",
    name: "Sandra López",
    email: "sandra.lopez@email.com",
    phone: "(555) 890-1234",
    interest: "venta",
    propertyType: "Casa",
    budget: 200000,
    location: "Norte",
    status: "perdido",
    priority: "baja",
    source: "Website",
    assignedTo: "María González",
    notes: "Cliente decidió no vender por el momento. Seguimiento en 6 meses.",
    createdAt: "2024-02-20",
    lastContact: "2024-03-05"
  }
];

/** Etapas fijas del embudo; también pueden existir etapas personalizadas (`custom_*`). */
export type LeadBuiltinStatus =
  | "nuevo"
  | "contactado"
  | "calificado"
  | "negociacion"
  | "cerrado"
  | "perdido";

/** Entrada del historial de notas del cliente (texto libre + fecha asociada). */
export interface LeadClientNote {
  id: string;
  /** Fecha de la nota (YYYY-MM-DD). */
  date: string;
  body: string;
}

/** Nivel de prioridad por estrellas (1 = mínima, 6 = máxima). */
export type LeadPriorityStars = 1 | 2 | 3 | 4 | 5 | 6;

export function newLeadClientNoteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `lnote_${crypto.randomUUID()}`;
  }
  return `lnote_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function clampLeadPriorityStars(n: number): LeadPriorityStars {
  const x = Math.round(Number(n));
  if (Number.isNaN(x) || x < 1) return 1;
  if (x > 6) return 6;
  return x as LeadPriorityStars;
}

function migrateLegacyPriority(raw: unknown): LeadPriorityStars {
  if (typeof raw === "number" && !Number.isNaN(raw)) return clampLeadPriorityStars(raw);
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    return clampLeadPriorityStars(parseInt(raw, 10));
  }
  if (raw === "alta") return 5;
  if (raw === "media") return 3;
  if (raw === "baja") return 2;
  return 3;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: "compra" | "venta" | "alquiler" | "asesoria";
  propertyType: string;
  budget: number;
  location: string;
  /** Clave de etapa: incorporada o id de etapa personalizada (`custom_*`). */
  status: string;
  /** Prioridad visual 1–6 estrellas (mayor número = mayor prioridad). */
  priorityStars: LeadPriorityStars;
  source: string;
  /** Nombre para mostrar (asesor asignado) */
  assignedTo: string;
  /** ID de usuario CRM; el asesor solo ve leads con su id */
  assignedToUserId: string;
  /** Historial de notas (cada una con fecha y texto libre). */
  clientNotes: LeadClientNote[];
  createdAt: string;
  lastContact: string;
  updatedAt?: string;
}

export const BUILTIN_STATUS_ORDER: LeadBuiltinStatus[] = [
  "nuevo",
  "contactado",
  "calificado",
  "negociacion",
  "cerrado",
  "perdido",
];

export const LEAD_STATUS_LABEL: Record<LeadBuiltinStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Calificado",
  negociacion: "Negociación",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

export type CustomKanbanStage = { id: string; label: string };

export function newCustomStageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `custom_${crypto.randomUUID()}`;
  }
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function labelForLeadStatus(status: string, customStages: CustomKanbanStage[] = []): string {
  if (Object.prototype.hasOwnProperty.call(LEAD_STATUS_LABEL, status)) {
    return LEAD_STATUS_LABEL[status as LeadBuiltinStatus];
  }
  const custom = customStages.find((s) => s.id === status);
  return custom?.label ?? status;
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
    priorityStars: 5,
    source: "Website",
    assignedTo: "María González",
    assignedToUserId: "4",
    clientNotes: [
      {
        id: "lnote_1a",
        date: "2024-03-15",
        body: "Cliente muy interesado en propiedades en el centro. Busca 3 habitaciones mínimo.",
      },
    ],
    createdAt: "2024-03-15",
    lastContact: "2024-03-18",
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
    priorityStars: 3,
    source: "Facebook",
    assignedTo: "Carlos Rodríguez",
    assignedToUserId: "5",
    clientNotes: [
      {
        id: "lnote_2a",
        date: "2024-03-16",
        body: "Quiere vender su apartamento actual. Necesita evaluación.",
      },
    ],
    createdAt: "2024-03-16",
    lastContact: "2024-03-17",
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
    priorityStars: 5,
    source: "Referido",
    assignedTo: "Laura Méndez",
    assignedToUserId: "3",
    clientNotes: [
      {
        id: "lnote_3a",
        date: "2024-03-19",
        body: "Busca alquiler temporal por 6 meses. Ejecutivo extranjero.",
      },
    ],
    createdAt: "2024-03-19",
    lastContact: "2024-03-19",
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
    priorityStars: 6,
    source: "Instagram",
    assignedTo: "María González",
    assignedToUserId: "4",
    clientNotes: [
      {
        id: "lnote_4a",
        date: "2024-03-12",
        body: "Primera visita a zona residencial; muy interesada en seguridad 24h.",
      },
      {
        id: "lnote_4b",
        date: "2024-03-19",
        body: "En proceso de negociación para villa en zona residencial exclusiva.",
      },
    ],
    createdAt: "2024-03-10",
    lastContact: "2024-03-19",
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
    priorityStars: 2,
    source: "Website",
    assignedTo: "Laura Méndez",
    assignedToUserId: "3",
    clientNotes: [
      {
        id: "lnote_5a",
        date: "2024-03-14",
        body: "Primera compra. Necesita asesoría sobre financiamiento.",
      },
    ],
    createdAt: "2024-03-14",
    lastContact: "2024-03-16",
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
    priorityStars: 3,
    source: "Google",
    assignedTo: "Laura Méndez",
    assignedToUserId: "3",
    clientNotes: [
      {
        id: "lnote_6a",
        date: "2024-03-18",
        body: "Familia con 2 hijos. Busca casa con jardín.",
      },
    ],
    createdAt: "2024-03-18",
    lastContact: "2024-03-18",
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
    priorityStars: 5,
    source: "Referido",
    assignedTo: "Carlos Rodríguez",
    assignedToUserId: "5",
    clientNotes: [
      {
        id: "lnote_7a",
        date: "2024-03-15",
        body: "Operación cerrada exitosamente. Cliente muy satisfecho.",
      },
    ],
    createdAt: "2024-03-01",
    lastContact: "2024-03-15",
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
    priorityStars: 2,
    source: "Website",
    assignedTo: "María González",
    assignedToUserId: "4",
    clientNotes: [
      {
        id: "lnote_8a",
        date: "2024-03-05",
        body: "Cliente decidió no vender por el momento. Seguimiento en 6 meses.",
      },
    ],
    createdAt: "2024-02-20",
    lastContact: "2024-03-05",
  },
];

const BY_ASSIGNED_NAME: Record<string, string> = {
  "María González": "4",
  "Carlos Rodríguez": "5",
  "Ana Martínez": "3",
  "Laura Méndez": "3",
};

function migrateClientNotes(raw: Partial<Lead> & Record<string, unknown>): LeadClientNote[] {
  if (Array.isArray(raw.clientNotes)) {
    const out: LeadClientNote[] = [];
    for (const item of raw.clientNotes) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const dateRaw = typeof o.date === "string" ? o.date : "";
      const date =
        /^\d{4}-\d{2}-\d{2}/.test(dateRaw) ? dateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
      out.push({
        id: typeof o.id === "string" && o.id ? o.id : newLeadClientNoteId(),
        date,
        body: String(o.body ?? ""),
      });
    }
    return out;
  }
  const legacy = String(raw.notes ?? "").trim();
  if (legacy) {
    const created = String(raw.createdAt ?? new Date().toISOString().slice(0, 10));
    return [
      {
        id: newLeadClientNoteId(),
        date: /^\d{4}-\d{2}-\d{2}/.test(created) ? created.slice(0, 10) : new Date().toISOString().slice(0, 10),
        body: legacy,
      },
    ];
  }
  return [];
}

/** Ordena por fecha descendente (más reciente primero). */
export function sortLeadClientNotesNewestFirst(notes: LeadClientNote[]): LeadClientNote[] {
  return [...notes].sort((a, b) => {
    const ta = Date.parse(a.date) || 0;
    const tb = Date.parse(b.date) || 0;
    return tb - ta;
  });
}

/** Normaliza datos guardados en localStorage antes de la nueva versión. */
export function normalizeStoredLead(raw: Partial<Lead> & Record<string, unknown>): Lead {
  const fallback = mockLeads[0];
  let assignedToUserId =
    typeof raw.assignedToUserId === "string" ? raw.assignedToUserId : undefined;
  if (!assignedToUserId && typeof raw.assignedTo === "string") {
    assignedToUserId = BY_ASSIGNED_NAME[raw.assignedTo] ?? "1";
  }
  if (!assignedToUserId) assignedToUserId = "1";

  return {
    id: String(raw.id ?? fallback.id),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    interest: (raw.interest as Lead["interest"]) ?? "compra",
    propertyType: String(raw.propertyType ?? ""),
    budget: typeof raw.budget === "number" ? raw.budget : Number(raw.budget) || 0,
    location: String(raw.location ?? ""),
    status:
      typeof raw.status === "string" && raw.status.length > 0 ? raw.status : "nuevo",
    priorityStars: migrateLegacyPriority(
      raw.priorityStars !== undefined ? raw.priorityStars : raw.priority
    ),
    source: String(raw.source ?? ""),
    assignedTo: String(raw.assignedTo ?? "Sin asignar"),
    assignedToUserId,
    clientNotes: migrateClientNotes(raw),
    createdAt: String(raw.createdAt ?? ""),
    lastContact: String(raw.lastContact ?? ""),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

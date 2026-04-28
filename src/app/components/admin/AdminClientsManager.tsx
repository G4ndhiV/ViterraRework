import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Building2,
  Home,
  Link2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  UserCircle2,
  Filter,
  Calendar,
} from "lucide-react";
import type { User } from "../../contexts/AuthContext";
import type { Lead } from "../../data/leads";
import { leadIsAssignedToUser } from "../../lib/leadsAccess";
import type { Property } from "../PropertyCard";
import type { Development } from "../../data/developments";
import {
  appendClientActivity,
  findClientByEmailNormalized,
  isLeadContactLinkedToClient,
  newClientActivityId,
  newClientId,
  normalizeEmailKey,
  normalizePhoneKey,
  type CrmClient,
} from "../../data/clients";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";
import { foldSearchText } from "../../lib/searchText";
import type { UserGroup } from "../../lib/userGroups";
import { WhatsAppGlyph } from "../WhatsAppGlyph";

const userReadonlyFieldClass =
  "w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-sm text-brand-navy";

function defaultWhatsappMessage(clientName: string): string {
  const n = clientName.trim() || "cliente";
  return `Hola ${n}, te contacto de Viterra para dar seguimiento a tu solicitud inmobiliaria.`;
}

type Props = {
  currentUser: User;
  users: User[];
  clients: CrmClient[];
  onSetClients: (updater: (prev: CrmClient[]) => CrmClient[]) => void;
  properties: Property[];
  developments: Development[];
  leads: Lead[];
  userGroups?: UserGroup[];
  focusClient?: { id: string; nonce: number } | null;
  onFocusClientConsumed?: () => void;
  seedFromLead?: { lead: Lead; nonce: number } | null;
  onSeedFromLeadConsumed?: () => void;
  onViewTeamMember?: (userId: string, fallbackName?: string) => void;
};

function canManageAllClients(user: User): boolean {
  return user.role === "admin";
}

/** Crear/editar/guardar ficha CRM: solo admin. Líder y asesor solo consulta (WhatsApp permitido). */
function canModifyClientRecord(user: User): boolean {
  return user.role === "admin";
}

/** Compara ids de usuario (p. ej. UUID de Supabase); insensible a mayúsculas y espacios. */
function uidEq(a: string | undefined, b: string | undefined): boolean {
  const x = (a ?? "").trim();
  const y = (b ?? "").trim();
  if (!x && !y) return true;
  if (!x || !y) return false;
  return x.toLowerCase() === y.toLowerCase();
}

/** Alcance de listado/detalle: admin todo; líder por leads del grupo; asesor por titular CRM o por lead vinculado asignado a él. */
function clientVisibleToUser(
  user: User,
  client: CrmClient,
  leadsById: Map<string, Lead>,
  groupScopedLeadAssigneeIds: Set<string> | null
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "lider_grupo") {
    if (!groupScopedLeadAssigneeIds || groupScopedLeadAssigneeIds.size === 0) return false;
    return client.linkedLeadIds.some((leadId) => {
      const assigneeId = leadsById.get(leadId)?.assignedToUserId?.trim();
      return (
        !!assigneeId && groupScopedLeadAssigneeIds.has(assigneeId.toLowerCase())
      );
    });
  }
  if (uidEq(client.primaryOwnerUserId, user.id)) return true;
  return client.linkedLeadIds.some((leadId) =>
    uidEq(leadsById.get(leadId)?.assignedToUserId, user.id)
  );
}

/** Misma regla que la visibilidad para roles no admin: si el cliente está en tu alcance, puedes editar la ficha. */
function clientEditableByUser(
  user: User,
  client: CrmClient,
  leadsById: Map<string, Lead>,
  groupScopedLeadAssigneeIds: Set<string> | null
): boolean {
  if (canManageAllClients(user)) return true;
  return clientVisibleToUser(user, client, leadsById, groupScopedLeadAssigneeIds);
}

/** Solo administrador puede editar fichas de cliente. */
function userMayEditClientRecords(user: User): boolean {
  return user.role === "admin";
}

function clientRowEditable(
  user: User,
  client: CrmClient,
  leadsById: Map<string, Lead>,
  groupScopedLeadAssigneeIds: Set<string> | null
): boolean {
  return (
    canModifyClientRecord(user) &&
    userMayEditClientRecords(user) &&
    clientEditableByUser(user, client, leadsById, groupScopedLeadAssigneeIds)
  );
}

export function AdminClientsManager({
  currentUser,
  users,
  clients,
  onSetClients,
  properties,
  developments,
  leads,
  userGroups = [],
  focusClient,
  onFocusClientConsumed,
  seedFromLead,
  onSeedFromLeadConsumed,
  onViewTeamMember,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [developmentFilter, setDevelopmentFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [leadLinkPresence, setLeadLinkPresence] = useState<"all" | "any" | "none">("all");
  const [propertyLinkPresence, setPropertyLinkPresence] = useState<"all" | "any" | "none">("all");
  const [developmentLinkPresence, setDevelopmentLinkPresence] = useState<"all" | "any" | "none">("all");
  const [phoneListFilter, setPhoneListFilter] = useState<"all" | "with" | "without">("all");
  const [createdInRange, setCreatedInRange] = useState<"all" | "7d" | "30d" | "90d" | "1y">("all");

  const [selected, setSelected] = useState<CrmClient | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertyAssignmentFilter, setPropertyAssignmentFilter] = useState<"all" | "selected" | "unselected">("all");
  const [developmentSearchQuery, setDevelopmentSearchQuery] = useState("");
  const [developmentAssignmentFilter, setDevelopmentAssignmentFilter] =
    useState<"all" | "selected" | "unselected">("all");
  const [whatsappMessageDraft, setWhatsappMessageDraft] = useState("");
  /** Solo vista hasta pulsar «Editar» (admin / líder con derecho sobre la ficha). Altas nuevas abren ya en edición. */
  const [isEditingClient, setIsEditingClient] = useState(false);

  const leadsById = useMemo(() => {
    const map = new Map<string, Lead>();
    for (const lead of leads) map.set(lead.id, lead);
    return map;
  }, [leads]);

  const groupScopedLeadAssigneeIds = useMemo(() => {
    if (currentUser.role !== "lider_grupo") return null;
    const ids = new Set<string>([currentUser.id.trim().toLowerCase()]);
    for (const group of userGroups) {
      if (!uidEq(group.leaderId, currentUser.id)) continue;
      for (const memberId of group.memberIds) {
        const m = memberId.trim().toLowerCase();
        if (m) ids.add(m);
      }
    }
    return ids;
  }, [currentUser.id, currentUser.role, userGroups]);

  const advisorFilterUserOptions = useMemo(() => {
    if (currentUser.role === "admin") {
      return users.filter((u) => u.isActive).sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    if (currentUser.role === "lider_grupo" && groupScopedLeadAssigneeIds) {
      return users
        .filter(
          (u) => u.isActive && groupScopedLeadAssigneeIds.has(u.id.trim().toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return [];
  }, [currentUser.role, users, groupScopedLeadAssigneeIds]);

  const clientVisibleToCurrentUser = useCallback(
    (client: CrmClient) =>
      clientVisibleToUser(currentUser, client, leadsById, groupScopedLeadAssigneeIds),
    [currentUser, groupScopedLeadAssigneeIds, leadsById]
  );

  const extraListFiltersActive =
    leadLinkPresence !== "all" ||
    propertyLinkPresence !== "all" ||
    developmentLinkPresence !== "all" ||
    phoneListFilter !== "all" ||
    createdInRange !== "all";

  const scopeClients = useMemo(
    () => clients.filter((client) => clientVisibleToCurrentUser(client)),
    [clients, clientVisibleToCurrentUser]
  );

  const filteredList = useMemo(() => {
    let list = scopeClients;
    const q = foldSearchText(searchQuery);
    if (q) {
      list = list.filter((c) => {
        const blob = foldSearchText([c.name, c.email, c.phone].join(" "));
        return blob.includes(q);
      });
    }
    if (propertyFilter !== "all") {
      list = list.filter((c) => c.propertyIds.includes(propertyFilter));
    }
    if (developmentFilter !== "all") {
      list = list.filter((c) => c.developmentIds.includes(developmentFilter));
    }
    if (
      ownerFilter !== "all" &&
      (canManageAllClients(currentUser) || currentUser.role === "lider_grupo")
    ) {
      list = list.filter((c) => c.primaryOwnerUserId === ownerFilter);
    }
    if (leadLinkPresence === "any") {
      list = list.filter((c) => c.linkedLeadIds.length > 0);
    } else if (leadLinkPresence === "none") {
      list = list.filter((c) => c.linkedLeadIds.length === 0);
    }
    if (propertyLinkPresence === "any") {
      list = list.filter((c) => c.propertyIds.length > 0);
    } else if (propertyLinkPresence === "none") {
      list = list.filter((c) => c.propertyIds.length === 0);
    }
    if (developmentLinkPresence === "any") {
      list = list.filter((c) => c.developmentIds.length > 0);
    } else if (developmentLinkPresence === "none") {
      list = list.filter((c) => c.developmentIds.length === 0);
    }
    if (phoneListFilter === "with") {
      list = list.filter((c) => Boolean(c.phone?.trim()));
    } else if (phoneListFilter === "without") {
      list = list.filter((c) => !c.phone?.trim());
    }
    if (createdInRange !== "all") {
      const now = Date.now();
      const days: Record<Exclude<typeof createdInRange, "all">, number> = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      };
      const maxAgeMs = days[createdInRange] * 24 * 60 * 60 * 1000;
      list = list.filter((c) => {
        const t = new Date(c.createdAt).getTime();
        if (Number.isNaN(t)) return false;
        return now - t <= maxAgeMs;
      });
    }
    return list;
  }, [
    scopeClients,
    searchQuery,
    propertyFilter,
    developmentFilter,
    ownerFilter,
    leadLinkPresence,
    propertyLinkPresence,
    developmentLinkPresence,
    phoneListFilter,
    createdInRange,
    currentUser.role,
  ]);

  const suggestedLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (clients.some((c) => c.linkedLeadIds.includes(lead.id))) return false;
      if (isLeadContactLinkedToClient(clients, lead.email, lead.phone)) return false;
      if (!lead.email.trim() && !lead.phone.trim()) return false;
      if (
        currentUser.role === "lider_grupo" &&
        (!lead.assignedToUserId || !groupScopedLeadAssigneeIds?.has(lead.assignedToUserId))
      ) {
        return false;
      }
      if (currentUser.role === "asesor" && !leadIsAssignedToUser(lead, currentUser)) return false;
      return true;
    });
  }, [leads, clients, currentUser.role, currentUser.id, groupScopedLeadAssigneeIds]);

  const openNew = useCallback(() => {
    if (!canModifyClientRecord(currentUser)) return;
    const now = new Date().toISOString();
    const draft: CrmClient = {
      id: newClientId(),
      name: "",
      email: "",
      phone: "",
      propertyIds: [],
      developmentIds: [],
      linkedLeadIds: [],
      primaryOwnerUserId: canManageAllClients(currentUser) ? currentUser.id : currentUser.id,
      createdAt: now,
      updatedAt: now,
      activity: [
        {
          id: newClientActivityId(),
          type: "created",
          description: "Cliente registrado en el CRM",
          createdAt: now,
          actorName: currentUser.name,
        },
      ],
    };
    setIsNew(true);
    setIsEditingClient(true);
    setSelected(draft);
  }, [currentUser]);

  const openCreateFromLead = useCallback(
    (lead: Lead) => {
      const leadPropertyIds = lead.relatedPropertyId ? [lead.relatedPropertyId] : [];
      const leadDevelopmentIds = lead.relatedDevelopmentId ? [lead.relatedDevelopmentId] : [];
      const existing = findClientByEmailNormalized(clients, lead.email);
      if (existing) {
        if (!clientVisibleToCurrentUser(existing)) {
          window.alert(
            "Ya existe un cliente con este correo fuera de tu alcance. Contacta a un administrador."
          );
          return;
        }
        if (!canModifyClientRecord(currentUser)) {
          setIsNew(false);
          setSelected({ ...existing });
          return;
        }
        setIsNew(false);
        let next = { ...existing };
        const nextLinkedLeadIds = next.linkedLeadIds.includes(lead.id)
          ? next.linkedLeadIds
          : [...next.linkedLeadIds, lead.id];
        const nextPropertyIds = [...new Set([...next.propertyIds, ...leadPropertyIds])];
        const nextDevelopmentIds = [...new Set([...next.developmentIds, ...leadDevelopmentIds])];
        const changed =
          nextLinkedLeadIds.length !== next.linkedLeadIds.length ||
          nextPropertyIds.length !== next.propertyIds.length ||
          nextDevelopmentIds.length !== next.developmentIds.length;
        if (changed) {
          next = appendClientActivity(
            {
              ...next,
              linkedLeadIds: nextLinkedLeadIds,
              propertyIds: nextPropertyIds,
              developmentIds: nextDevelopmentIds,
            },
            {
              type: "link_lead",
              description: `Vinculado al lead «${lead.name}» (#${lead.id})`,
              actorName: currentUser.name,
            }
          );
          onSetClients((prev) => prev.map((c) => (c.id === next.id ? next : c)));
        }
        setSelected(next);
        setIsEditingClient(false);
        return;
      }
      if (!canModifyClientRecord(currentUser)) {
        window.alert(
          "Tu rol solo permite consultar fichas de cliente. Para registrar uno nuevo, contacta a un administrador o líder de grupo."
        );
        return;
      }
      const now = new Date().toISOString();
      const ownerId =
        canManageAllClients(currentUser) ? lead.assignedToUserId || currentUser.id : currentUser.id;
      const draft: CrmClient = appendClientActivity(
        {
          id: newClientId(),
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          propertyIds: leadPropertyIds,
          developmentIds: leadDevelopmentIds,
          linkedLeadIds: [lead.id],
          primaryOwnerUserId: ownerId,
          createdAt: now,
          updatedAt: now,
          activity: [],
        },
        {
          type: "created",
          description: `Cliente creado desde el lead «${lead.name}»`,
          actorName: currentUser.name,
        }
      );
      draft.activity = [
        ...draft.activity,
        {
          id: newClientActivityId(),
          type: "link_lead",
          description: `Vinculado al lead #${lead.id} · ${lead.name}`,
          createdAt: now,
          actorName: currentUser.name,
        },
      ];
      setIsNew(true);
      setIsEditingClient(true);
      setSelected(draft);
    },
    [clients, currentUser, onSetClients, clientVisibleToCurrentUser]
  );

  useEffect(() => {
    if (!focusClient) return;
    const c = clients.find((x) => x.id === focusClient.id);
    if (c && clientVisibleToCurrentUser(c)) {
      setIsNew(false);
      setIsEditingClient(false);
      setSelected({ ...c });
    }
    onFocusClientConsumed?.();
  }, [focusClient?.nonce, focusClient?.id, clients, onFocusClientConsumed, clientVisibleToCurrentUser]);

  useEffect(() => {
    if (!seedFromLead) return;
    if (!canModifyClientRecord(currentUser)) {
      onSeedFromLeadConsumed?.();
      return;
    }
    openCreateFromLead(seedFromLead.lead);
    onSeedFromLeadConsumed?.();
  }, [seedFromLead?.nonce, seedFromLead?.lead, currentUser.role, onSeedFromLeadConsumed, openCreateFromLead]);

  const closeDetail = () => {
    setSelected(null);
    setIsNew(false);
    setIsEditingClient(false);
  };

  const cancelEditing = useCallback(() => {
    if (!selected || isNew) return;
    const fresh = clients.find((x) => x.id === selected.id);
    if (fresh) setSelected({ ...fresh });
    setIsEditingClient(false);
  }, [selected, isNew, clients]);

  useEffect(() => {
    if (!selected) return;
    setOwnerSearchQuery("");
    setPropertySearchQuery("");
    setPropertyAssignmentFilter("all");
    setDevelopmentSearchQuery("");
    setDevelopmentAssignmentFilter("all");
  }, [selected?.id]);

  useLayoutEffect(() => {
    if (!selected) return;
    setWhatsappMessageDraft(defaultWhatsappMessage(selected.name));
  }, [selected?.id]);

  const saveClient = () => {
    if (!selected) return;
    if (!canModifyClientRecord(currentUser)) return;
    const name = selected.name.trim();
    const email = selected.email.trim();
    const phone = selected.phone.trim();
    if (!name) {
      window.alert("El nombre del cliente es obligatorio.");
      return;
    }

    if (isNew) {
      if (!email && !phone) {
        window.alert("Para crear el cliente, captura al menos correo o teléfono.");
        return;
      }
      if (email) {
        const dup = findClientByEmailNormalized(clients, email);
        if (dup) {
          window.alert("Ya existe un cliente con este correo. Abre su ficha para vincular leads.");
          return;
        }
      }
      onSetClients((prev) => [...prev, selected]);
    } else {
      onSetClients((prev) =>
        prev.map((c) => {
          if (c.id !== selected.id) return c;
          const prevStr = JSON.stringify({
            name: c.name,
            email: c.email,
            phone: c.phone,
            propertyIds: c.propertyIds,
            developmentIds: c.developmentIds,
            linkedLeadIds: c.linkedLeadIds,
            primaryOwnerUserId: c.primaryOwnerUserId,
          });
          const nextStr = JSON.stringify({
            name: selected.name,
            email: selected.email,
            phone: selected.phone,
            propertyIds: selected.propertyIds,
            developmentIds: selected.developmentIds,
            linkedLeadIds: selected.linkedLeadIds,
            primaryOwnerUserId: selected.primaryOwnerUserId,
          });
          let next = { ...selected, updatedAt: new Date().toISOString() };
          if (prevStr !== nextStr) {
            next = appendClientActivity(next, {
              type: "updated",
              description: "Se actualizaron los datos del cliente",
              actorName: currentUser.name,
            });
          }
          return next;
        })
      );
    }
    closeDetail();
  };

  const ownerName = (client: CrmClient) => {
    const userId = client.primaryOwnerUserId?.trim() ?? "";
    if (userId) {
      const fromUsers = users.find((u) => u.id === userId)?.name;
      if (fromUsers) return fromUsers;
    }

    const linkedLeadWithAssignee = client.linkedLeadIds
      .map((id) => leads.find((l) => l.id === id))
      .find((l): l is Lead => !!l && !!l.assignedTo?.trim());
    if (linkedLeadWithAssignee) return linkedLeadWithAssignee.assignedTo;

    if (!userId) return "Sin asignar";
    return "Asesor no encontrado";
  };

  const canEditSelected = Boolean(
    selected && clientRowEditable(currentUser, selected, leadsById, groupScopedLeadAssigneeIds)
  );
  const showEditableFields = Boolean(canEditSelected && (isNew || isEditingClient));
  const canSetOwner = canManageAllClients(currentUser);
  const selectedWhatsappDigits = selected?.phone?.replace(/\D/g, "") ?? "";
  const selectedWhatsappHref =
    selectedWhatsappDigits.length > 0
      ? `https://wa.me/${selectedWhatsappDigits}?text=${encodeURIComponent(whatsappMessageDraft)}`
      : "";
  const ownerOptionsForDetail = useMemo(() => {
    const q = foldSearchText(ownerSearchQuery);
    return users
      .filter((u) => u.isActive)
      .filter((u) => {
        if (!q) return true;
        const blob = foldSearchText(`${u.name} ${u.email} ${u.role}`);
        return blob.includes(q);
      });
  }, [users, ownerSearchQuery]);
  const propertyOptionsForDetail = useMemo(() => {
    if (!selected) return [];
    const q = foldSearchText(propertySearchQuery);
    return properties.filter((p) => {
      const isSelected = selected.propertyIds.includes(p.id);
      if (propertyAssignmentFilter === "selected" && !isSelected) return false;
      if (propertyAssignmentFilter === "unselected" && isSelected) return false;
      if (!q) return true;
      const blob = foldSearchText(`${p.title} ${p.location} ${p.type} ${p.status}`);
      return blob.includes(q);
    });
  }, [properties, propertySearchQuery, propertyAssignmentFilter, selected]);
  const developmentOptionsForDetail = useMemo(() => {
    if (!selected) return [];
    const q = foldSearchText(developmentSearchQuery);
    return developments.filter((d) => {
      const isSelected = selected.developmentIds.includes(d.id);
      if (developmentAssignmentFilter === "selected" && !isSelected) return false;
      if (developmentAssignmentFilter === "unselected" && isSelected) return false;
      if (!q) return true;
      const blob = foldSearchText(`${d.name} ${d.location} ${d.type} ${d.status}`);
      return blob.includes(q);
    });
  }, [developments, developmentSearchQuery, developmentAssignmentFilter, selected]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.14)] ring-1 ring-slate-900/[0.04]">
        <div
          className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative px-5 pb-6 pt-6 md:px-8 md:pb-7 md:pt-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-900">CRM · Clientes</h2>
              <p className="mt-1 text-sm text-slate-600">
                Fichas de clientes, relación con propiedades y desarrollos, e historial de actividad.
              </p>
              {!canModifyClientRecord(currentUser) && (
                <p className="mt-2 text-sm text-slate-500">
                  Como asesor puedes revisar datos y contactar por WhatsApp; crear o cambiar fichas corresponde a un
                  administrador o líder de grupo.
                </p>
              )}
            </div>
            {canModifyClientRecord(currentUser) && (
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover"
              >
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </button>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6">
            <div className="relative min-h-[2.75rem] w-full">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, correo o teléfono…"
                className="h-full min-h-[2.75rem] w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-12 pr-4 text-sm text-brand-navy shadow-sm transition-all placeholder:text-slate-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                style={{ fontWeight: 500 }}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="h-full min-h-[2.75rem] w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-brand-navy shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                style={{ fontWeight: 500 }}
              >
                <option value="all">Todas las propiedades</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <select
                value={developmentFilter}
                onChange={(e) => setDevelopmentFilter(e.target.value)}
                className="h-full min-h-[2.75rem] w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-brand-navy shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                style={{ fontWeight: 500 }}
              >
                <option value="all">Todos los desarrollos</option>
                {developments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {(canManageAllClients(currentUser) || currentUser.role === "lider_grupo") && (
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="h-full min-h-[2.75rem] w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-brand-navy shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  style={{ fontWeight: 500 }}
                  aria-label="Filtrar por asesor titular"
                >
                  <option value="all">
                    {currentUser.role === "lider_grupo"
                      ? "Todos los asesores (mi alcance)"
                      : "Todos los asesores"}
                  </option>
                  {advisorFilterUserOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <Filter className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Más filtros
                </p>
                {extraListFiltersActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setLeadLinkPresence("all");
                      setPropertyLinkPresence("all");
                      setDevelopmentLinkPresence("all");
                      setPhoneListFilter("all");
                      setCreatedInRange("all");
                    }}
                    className="text-xs font-medium text-primary decoration-primary/30 hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">
                    Leads vinculados
                  </label>
                  <select
                    value={leadLinkPresence}
                    onChange={(e) => setLeadLinkPresence(e.target.value as "all" | "any" | "none")}
                    className="h-8 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 pr-7 text-xs text-brand-navy shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/15"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="all">Cualquiera</option>
                    <option value="any">Con al menos un lead</option>
                    <option value="none">Sin leads</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">
                    Propiedades
                  </label>
                  <select
                    value={propertyLinkPresence}
                    onChange={(e) => setPropertyLinkPresence(e.target.value as "all" | "any" | "none")}
                    className="h-8 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 pr-7 text-xs text-brand-navy shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/15"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="all">Cualquiera</option>
                    <option value="any">Con al menos una</option>
                    <option value="none">Sin vincular</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">
                    Desarrollos
                  </label>
                  <select
                    value={developmentLinkPresence}
                    onChange={(e) => setDevelopmentLinkPresence(e.target.value as "all" | "any" | "none")}
                    className="h-8 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 pr-7 text-xs text-brand-navy shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/15"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="all">Cualquiera</option>
                    <option value="any">Con al menos uno</option>
                    <option value="none">Sin vincular</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">
                    Teléfono
                  </label>
                  <select
                    value={phoneListFilter}
                    onChange={(e) => setPhoneListFilter(e.target.value as "all" | "with" | "without")}
                    className="h-8 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 pr-7 text-xs text-brand-navy shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/15"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="all">Cualquiera</option>
                    <option value="with">Con teléfono</option>
                    <option value="without">Sin teléfono</option>
                  </select>
                </div>
                <div className="space-y-0.5 sm:col-span-2 lg:col-span-1">
                  <label className="inline-flex items-center gap-1 text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">
                    <Calendar className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                    Alta reciente
                  </label>
                  <select
                    value={createdInRange}
                    onChange={(e) => setCreatedInRange(e.target.value as typeof createdInRange)}
                    className="h-8 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 pr-7 text-xs text-brand-navy shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/15"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="all">Cualquier fecha</option>
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="90d">Últimos 90 días</option>
                    <option value="1y">Último año</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {canModifyClientRecord(currentUser) && suggestedLeads.length > 0 && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-4">
          <p className="text-sm font-semibold text-amber-900">Sugerencias desde leads</p>
          <p className="mt-1 text-xs text-amber-800/90">
            Contactos aún sin ficha de cliente. Puedes registrar uno con un clic.
          </p>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {suggestedLeads.slice(0, 12).map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-brand-navy">{lead.name}</span>
                <span className="text-xs text-slate-600">{lead.email}</span>
                <button
                  type="button"
                  onClick={() => openCreateFromLead(lead)}
                  className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-brand-red-hover"
                >
                  Crear cliente
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Contacto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Asesor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Vínculos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No hay clientes que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filteredList.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNew(false);
                        setIsEditingClient(false);
                        setSelected({ ...c });
                      }}
                      className="text-left"
                    >
                      <p className="text-sm font-semibold text-slate-900">{c.name || "Sin nombre"}</p>
                      <p className="text-xs text-slate-500">{c.linkedLeadIds.length} lead(s) vinculados</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <p>{c.email}</p>
                    <p className="text-xs text-slate-500">{c.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {c.primaryOwnerUserId && onViewTeamMember ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!c.primaryOwnerUserId) return;
                          onViewTeamMember(c.primaryOwnerUserId, ownerName(c));
                        }}
                        className="text-left text-brand-navy underline decoration-brand-navy/30 underline-offset-2 transition hover:text-primary hover:decoration-primary"
                        style={{ fontWeight: 600 }}
                      >
                        {ownerName(c)}
                      </button>
                    ) : (
                      ownerName(c)
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {c.propertyIds.length} prop. · {c.developmentIds.length} desv.
                  </td>
                  <td className="px-4 py-3 text-right">
                    {clientRowEditable(currentUser, c, leadsById, groupScopedLeadAssigneeIds) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNew(false);
                          setIsEditingClient(true);
                          setSelected({ ...c });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/[0.06]"
                        style={{ fontWeight: 600 }}
                      >
                        <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                        Editar
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
        key={selected?.id ?? "client-detail"}
      >
        <DialogContent
          hideCloseButton
          className={cn(
            "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 sm:!max-w-none"
          )}
        >
          {selected && (
            <>
              <div className="h-0.5 shrink-0 bg-gradient-to-r from-brand-gold/90 via-primary to-brand-burgundy/90" />
              <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/90 px-4 py-4 sm:px-5">
                <DialogHeader className="gap-0 p-0 text-left">
                  <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>
                    <span className="text-primary/90">CRM</span>
                    <span className="text-slate-400"> · </span>
                    Detalle de cliente
                  </p>
                  <div className="mt-3 flex flex-col gap-4 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
                    <div className="min-w-0 flex-1">
                      {showEditableFields ? (
                        <input
                          value={selected.name}
                          onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                          className="font-heading w-full truncate border-0 bg-transparent text-3xl leading-tight tracking-tight text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-4xl"
                          style={{ fontWeight: 700 }}
                          placeholder="Nombre del cliente"
                        />
                      ) : (
                        <DialogTitle
                          className="font-heading truncate text-3xl leading-tight tracking-tight text-brand-navy sm:text-4xl"
                          style={{ fontWeight: 700 }}
                        >
                          {selected.name}
                        </DialogTitle>
                      )}
                      <p className="mt-1.5 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                        <UserCircle2 className="mr-1 inline h-4 w-4 text-slate-400" />
                        Asesor: {ownerName(selected)}
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 min-[1100px]:w-auto min-[1100px]:flex-row min-[1100px]:justify-end">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 border-stone-300 bg-white text-slate-700 hover:bg-stone-100 hover:text-slate-700"
                          style={{ fontWeight: 600 }}
                        >
                          Regresar
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 border-stone-300 bg-white text-slate-700 hover:bg-stone-100 hover:text-slate-700"
                          style={{ fontWeight: 600 }}
                        >
                          Cerrar
                        </Button>
                      </DialogClose>
                      {canEditSelected && !isNew && !isEditingClient && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 border-primary/35 bg-white px-4 font-semibold text-primary hover:bg-primary/[0.06]"
                          style={{ fontWeight: 600 }}
                          onClick={() => setIsEditingClient(true)}
                        >
                          <Pencil className="mr-2 h-4 w-4" strokeWidth={2} aria-hidden />
                          Editar
                        </Button>
                      )}
                      {showEditableFields && (
                        <>
                          {!isNew && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 border-stone-300 bg-white text-slate-700 hover:bg-stone-100 hover:text-slate-700"
                              style={{ fontWeight: 600 }}
                              onClick={cancelEditing}
                            >
                              Cancelar edición
                            </Button>
                          )}
                          <Button
                            type="button"
                            className="h-10 bg-primary px-4 font-semibold text-primary-foreground hover:bg-brand-red-hover"
                            onClick={saveClient}
                          >
                            {isNew ? "Registrar cliente" : "Guardar cambios"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <DialogDescription className="sr-only">
                    Cliente {selected.name}, correo {selected.email}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-stone-100/95 to-stone-100/80">
                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
                  <div className="mx-auto w-full max-w-[min(100%,88rem)]">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
                        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                          <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                            Contacto
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Mismos bloques que en la ficha de usuario del equipo.
                          </p>
                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-white to-primary/[0.04] p-5 shadow-sm">
                              <div className="flex items-start gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                                  <Mail className="h-5 w-5" strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Correo
                                  </p>
                                  {showEditableFields ? (
                                    <input
                                      value={selected.email}
                                      onChange={(e) => setSelected({ ...selected, email: e.target.value })}
                                      className="mt-1 w-full border-0 border-b border-stone-200 bg-transparent text-[15px] text-brand-navy focus:border-primary focus:outline-none"
                                      style={{ fontWeight: 600 }}
                                    />
                                  ) : (
                                    <a
                                      href={`mailto:${encodeURIComponent(selected.email)}`}
                                      className="mt-1 block break-all text-[15px] text-primary"
                                      style={{ fontWeight: 600 }}
                                    >
                                      {selected.email}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-white to-brand-navy/[0.06] p-5 shadow-sm">
                              <div className="flex items-start gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy ring-1 ring-brand-navy/15">
                                  <Phone className="h-5 w-5" strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Teléfono
                                  </p>
                                  {showEditableFields ? (
                                    <input
                                      value={selected.phone}
                                      onChange={(e) => setSelected({ ...selected, phone: e.target.value })}
                                      className="mt-1 w-full border-0 border-b border-stone-200 bg-transparent text-[15px] text-brand-navy focus:border-primary focus:outline-none"
                                      style={{ fontWeight: 600 }}
                                    />
                                  ) : selected.phone ? (
                                    <a
                                      href={`tel:${selected.phone.replace(/\s/g, "")}`}
                                      className="mt-1 block text-[15px] text-brand-navy"
                                      style={{ fontWeight: 600 }}
                                    >
                                      {selected.phone}
                                    </a>
                                  ) : (
                                    <p className="mt-1 text-[15px] text-slate-400">Sin capturar</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {canSetOwner && showEditableFields && (
                            <div className="mt-6 border-t border-stone-200/80 pt-6">
                              <Label className="text-xs text-slate-500">Asesor (asesor / líder)</Label>
                              <div className="relative mt-2 w-full max-w-md">
                                <Search
                                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                  strokeWidth={1.75}
                                />
                                <input
                                  value={ownerSearchQuery}
                                  onChange={(e) => setOwnerSearchQuery(e.target.value)}
                                  placeholder="Buscar asesor por nombre, correo o rol…"
                                  className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-brand-navy focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                />
                              </div>
                              <select
                                value={selected.primaryOwnerUserId}
                                onChange={(e) =>
                                  setSelected({ ...selected, primaryOwnerUserId: e.target.value })
                                }
                                className="mt-2 h-10 w-full max-w-md rounded-lg border border-stone-200 bg-white px-3 text-sm text-brand-navy"
                              >
                                {ownerOptionsForDetail.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name} ({u.role})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </section>

                        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                          <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                            Contactar cliente por WhatsApp
                          </h3>
                          <div className="mt-3 rounded-lg border border-stone-200/80 bg-stone-50/40 p-4">
                            <Label
                              htmlFor="client-whatsapp-message"
                              className="text-sm text-slate-700"
                              style={{ fontWeight: 600 }}
                            >
                              Mensaje (se enviará al abrir WhatsApp)
                            </Label>
                            <textarea
                              id="client-whatsapp-message"
                              value={whatsappMessageDraft}
                              onChange={(e) => setWhatsappMessageDraft(e.target.value)}
                              rows={4}
                              className="mt-2 w-full resize-y rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                              placeholder={defaultWhatsappMessage(selected.name)}
                            />
                            {!selected.phone?.trim() && (
                              <p className="mt-2 text-xs text-amber-800">
                                Captura un teléfono en la sección de contacto para poder abrir WhatsApp.
                              </p>
                            )}
                          </div>
                          <div className="mt-4">
                            <a
                              href={selectedWhatsappHref || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm text-white transition",
                                selectedWhatsappHref
                                  ? "bg-emerald-500 hover:bg-emerald-600"
                                  : "cursor-not-allowed bg-slate-300"
                              )}
                              style={{ fontWeight: 700 }}
                              aria-disabled={!selectedWhatsappHref}
                              onClick={(e) => {
                                if (!selectedWhatsappHref) e.preventDefault();
                              }}
                            >
                              <WhatsAppGlyph className="h-5 w-5 shrink-0 text-white" />
                              Abrir WhatsApp
                            </a>
                          </div>
                        </section>

                      </div>

                      <aside className="lg:col-span-5 lg:sticky lg:top-2 lg:self-start">
                        <section className="mb-6 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                          <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                            Propiedades y desarrollos
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Vincula inventario relacionado con este cliente.
                          </p>
                          <div className="mt-4 space-y-3 text-sm text-slate-700">
                              <p className="text-xs font-semibold text-slate-500">Propiedades</p>
                              <div className="grid gap-2 sm:grid-cols-1">
                                {selected.propertyIds.length === 0 ? (
                                  <p className="text-slate-500">Ninguna vinculada.</p>
                                ) : (
                                  selected.propertyIds.map((id) => {
                                    const p = properties.find((x) => x.id === id);
                                    if (!p) {
                                      return (
                                        <article key={id} className="rounded-lg border border-stone-200/80 bg-stone-50/50 p-3">
                                          <p className="text-sm font-medium text-brand-navy">{id}</p>
                                        </article>
                                      );
                                    }
                                    return (
                                      <article
                                        key={id}
                                        className="overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-sm"
                                      >
                                        <div className="aspect-[16/9] w-full bg-stone-100">
                                          {p.image ? (
                                            <img
                                              src={p.image}
                                              alt={p.title}
                                              className="h-full w-full object-cover"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                                              Sin imagen
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-3">
                                          <p className="text-sm font-semibold text-brand-navy">{p.title}</p>
                                          <p className="mt-0.5 text-xs text-slate-500">{p.location || "Ubicación no definida"}</p>
                                          <p className="mt-1 text-xs text-slate-600">
                                            {p.status === "alquiler" ? "Alquiler" : "Venta"} · {p.type || "Tipo no definido"}
                                          </p>
                                          <p className="mt-1.5 text-sm font-semibold text-primary">
                                            ${Number(p.price || 0).toLocaleString("es-MX")}
                                          </p>
                                        </div>
                                      </article>
                                    );
                                  })
                                )}
                              </div>
                              <p className="text-xs font-semibold text-slate-500">Desarrollos</p>
                              <ul className="space-y-1">
                                {selected.developmentIds.length === 0 ? (
                                  <li className="text-slate-500">Ninguno vinculado.</li>
                                ) : (
                                  selected.developmentIds.map((id) => {
                                    const d = developments.find((x) => x.id === id);
                                    return <li key={id}>{d?.name ?? id}</li>;
                                  })
                                )}
                              </ul>
                            </div>
                        </section>

                      </aside>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

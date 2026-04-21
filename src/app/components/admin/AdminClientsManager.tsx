import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Building2,
  Calendar,
  History,
  Home,
  Link2,
  Mail,
  Phone,
  Plus,
  Search,
  UserCircle2,
} from "lucide-react";
import type { User } from "../../contexts/AuthContext";
import type { Lead } from "../../data/leads";
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
  type ClientActivityEntry,
  type ClientActivityType,
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

const userReadonlyFieldClass =
  "w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-sm text-brand-navy";

function formatActivityDate(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clientActivityMeta(type: ClientActivityType) {
  const map: Record<
    ClientActivityType,
    { title: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; iconClass: string; badgeClass: string }
  > = {
    created: {
      title: "Alta",
      Icon: Plus,
      iconClass: "text-emerald-600",
      badgeClass: "bg-emerald-100 text-emerald-700",
    },
    updated: {
      title: "Actualización",
      Icon: History,
      iconClass: "text-amber-700",
      badgeClass: "bg-amber-100 text-amber-700",
    },
    note: {
      title: "Nota",
      Icon: History,
      iconClass: "text-slate-600",
      badgeClass: "bg-slate-100 text-slate-700",
    },
    link_property: {
      title: "Propiedad",
      Icon: Home,
      iconClass: "text-primary",
      badgeClass: "bg-primary/10 text-primary",
    },
    link_development: {
      title: "Desarrollo",
      Icon: Building2,
      iconClass: "text-primary",
      badgeClass: "bg-primary/10 text-primary",
    },
    link_lead: {
      title: "Lead",
      Icon: Link2,
      iconClass: "text-brand-navy",
      badgeClass: "bg-stone-100 text-brand-navy",
    },
  };
  return map[type];
}

const activityBadgeLabel: Record<ClientActivityType, string> = {
  created: "Alta",
  updated: "Cambio",
  note: "Nota",
  link_property: "Inmueble",
  link_development: "Desarrollo",
  link_lead: "Lead",
};

type Props = {
  currentUser: User;
  users: User[];
  clients: CrmClient[];
  onSetClients: (updater: (prev: CrmClient[]) => CrmClient[]) => void;
  properties: Property[];
  developments: Development[];
  leads: Lead[];
  focusClient?: { id: string; nonce: number } | null;
  onFocusClientConsumed?: () => void;
  seedFromLead?: { lead: Lead; nonce: number } | null;
  onSeedFromLeadConsumed?: () => void;
};

function canManageAllClients(user: User): boolean {
  return user.role === "admin" || user.role === "lider_grupo";
}

function clientIsEditableBy(user: User, client: CrmClient): boolean {
  if (canManageAllClients(user)) return true;
  return client.primaryOwnerUserId === user.id;
}

export function AdminClientsManager({
  currentUser,
  users,
  clients,
  onSetClients,
  properties,
  developments,
  leads,
  focusClient,
  onFocusClientConsumed,
  seedFromLead,
  onSeedFromLeadConsumed,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [developmentFilter, setDevelopmentFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  const [selected, setSelected] = useState<CrmClient | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertyAssignmentFilter, setPropertyAssignmentFilter] = useState<"all" | "selected" | "unselected">("all");
  const [developmentSearchQuery, setDevelopmentSearchQuery] = useState("");
  const [developmentAssignmentFilter, setDevelopmentAssignmentFilter] =
    useState<"all" | "selected" | "unselected">("all");

  const scopeClients = useMemo(() => {
    if (canManageAllClients(currentUser)) return clients;
    return clients.filter((c) => c.primaryOwnerUserId === currentUser.id);
  }, [clients, currentUser]);

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
    if (ownerFilter !== "all" && canManageAllClients(currentUser)) {
      list = list.filter((c) => c.primaryOwnerUserId === ownerFilter);
    }
    return list;
  }, [scopeClients, searchQuery, propertyFilter, developmentFilter, ownerFilter, currentUser.role]);

  const suggestedLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (clients.some((c) => c.linkedLeadIds.includes(lead.id))) return false;
      if (isLeadContactLinkedToClient(clients, lead.email, lead.phone)) return false;
      if (!lead.email.trim() && !lead.phone.trim()) return false;
      if (currentUser.role === "asesor" && lead.assignedToUserId !== currentUser.id) return false;
      return true;
    });
  }, [leads, clients, currentUser.role, currentUser.id]);

  const openNew = useCallback(() => {
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
    setSelected(draft);
    setNoteDraft("");
  }, [currentUser]);

  const openCreateFromLead = useCallback(
    (lead: Lead) => {
      const existing = findClientByEmailNormalized(clients, lead.email);
      if (existing) {
        if (!canManageAllClients(currentUser) && existing.primaryOwnerUserId !== currentUser.id) {
          window.alert(
            "Ya existe un cliente con este correo asignado a otro asesor. Contacta a un administrador."
          );
          return;
        }
        setIsNew(false);
        let next = { ...existing };
        if (!next.linkedLeadIds.includes(lead.id)) {
          next = appendClientActivity(
            {
              ...next,
              linkedLeadIds: [...next.linkedLeadIds, lead.id],
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
        setNoteDraft("");
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
          propertyIds: [],
          developmentIds: [],
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
      setSelected(draft);
      setNoteDraft("");
    },
    [clients, currentUser, onSetClients]
  );

  useEffect(() => {
    if (!focusClient) return;
    const c = clients.find((x) => x.id === focusClient.id);
    if (c && (canManageAllClients(currentUser) || c.primaryOwnerUserId === currentUser.id)) {
      setIsNew(false);
      setSelected({ ...c });
      setNoteDraft("");
    }
    onFocusClientConsumed?.();
  }, [focusClient?.nonce, focusClient?.id, clients, currentUser, onFocusClientConsumed]);

  useEffect(() => {
    if (!seedFromLead) return;
    openCreateFromLead(seedFromLead.lead);
    onSeedFromLeadConsumed?.();
  }, [seedFromLead?.nonce, seedFromLead?.lead, onSeedFromLeadConsumed, openCreateFromLead]);

  const closeDetail = () => {
    setSelected(null);
    setIsNew(false);
    setNoteDraft("");
  };

  useEffect(() => {
    if (!selected) return;
    setOwnerSearchQuery("");
    setPropertySearchQuery("");
    setPropertyAssignmentFilter("all");
    setDevelopmentSearchQuery("");
    setDevelopmentAssignmentFilter("all");
  }, [selected?.id]);

  const saveClient = () => {
    if (!selected) return;
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

  const addNote = () => {
    if (!selected || !noteDraft.trim()) return;
    const text = noteDraft.trim();
    setSelected((prev) =>
      prev
        ? appendClientActivity(prev, {
            type: "note",
            description: text,
            actorName: currentUser.name,
          })
        : prev
    );
    setNoteDraft("");
  };

  const sortedActivity = useMemo(() => {
    if (!selected) return [];
    return [...selected.activity].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [selected]);

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

  const canEdit = selected ? clientIsEditableBy(currentUser, selected) : false;
  const canSetOwner = canManageAllClients(currentUser);
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
            </div>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover"
            >
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </button>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              {canManageAllClients(currentUser) && (
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="h-full min-h-[2.75rem] w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-brand-navy shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 sm:col-span-2 lg:col-span-1"
                  style={{ fontWeight: 500 }}
                >
                  <option value="all">Todos los asesores</option>
                  {users
                    .filter((u) => u.isActive)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {suggestedLeads.length > 0 && (
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
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
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
                        setSelected({ ...c });
                        setNoteDraft("");
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
                  <td className="px-4 py-3 text-sm text-slate-700">{ownerName(c)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {c.propertyIds.length} prop. · {c.developmentIds.length} desv.
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
                      {canEdit ? (
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
                          className="h-10 border-stone-300 bg-white text-slate-700 hover:bg-stone-50"
                          style={{ fontWeight: 600 }}
                        >
                          Cerrar
                        </Button>
                      </DialogClose>
                      {canEdit && (
                        <Button
                          type="button"
                          className="h-10 bg-primary px-4 font-semibold text-primary-foreground hover:bg-brand-red-hover"
                          onClick={saveClient}
                        >
                          Guardar cambios
                        </Button>
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
                                  {canEdit ? (
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
                                  {canEdit ? (
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

                          {canSetOwner && canEdit && (
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
                            Propiedades y desarrollos
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Vincula inventario relacionado con este cliente.
                          </p>
                          {canEdit ? (
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">
                                  Propiedades
                                </p>
                                <div className="mb-2 space-y-2">
                                  <div className="relative">
                                    <Search
                                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                      strokeWidth={1.75}
                                    />
                                    <input
                                      value={propertySearchQuery}
                                      onChange={(e) => setPropertySearchQuery(e.target.value)}
                                      placeholder="Buscar propiedad…"
                                      className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-brand-navy focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                  </div>
                                  <select
                                    value={propertyAssignmentFilter}
                                    onChange={(e) =>
                                      setPropertyAssignmentFilter(
                                        e.target.value as "all" | "selected" | "unselected"
                                      )
                                    }
                                    className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-brand-navy"
                                  >
                                    <option value="all">Todas</option>
                                    <option value="selected">Solo vinculadas</option>
                                    <option value="unselected">No vinculadas</option>
                                  </select>
                                </div>
                                <ScrollArea className="h-40 rounded-lg border border-stone-200 p-2">
                                  {propertyOptionsForDetail.map((p) => (
                                    <label
                                      key={p.id}
                                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-stone-50"
                                    >
                                      <Checkbox
                                        checked={selected.propertyIds.includes(p.id)}
                                        onCheckedChange={(v) => {
                                          const on = v === true;
                                          setSelected({
                                            ...selected,
                                            propertyIds: on
                                              ? [...selected.propertyIds, p.id]
                                              : selected.propertyIds.filter((x) => x !== p.id),
                                          });
                                        }}
                                      />
                                      <span className="text-sm text-brand-navy">{p.title}</span>
                                    </label>
                                  ))}
                                  {propertyOptionsForDetail.length === 0 && (
                                    <p className="px-2 py-3 text-sm text-slate-500">Sin resultados.</p>
                                  )}
                                </ScrollArea>
                              </div>
                              <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">
                                  Desarrollos
                                </p>
                                <div className="mb-2 space-y-2">
                                  <div className="relative">
                                    <Search
                                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                      strokeWidth={1.75}
                                    />
                                    <input
                                      value={developmentSearchQuery}
                                      onChange={(e) => setDevelopmentSearchQuery(e.target.value)}
                                      placeholder="Buscar desarrollo…"
                                      className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-brand-navy focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                  </div>
                                  <select
                                    value={developmentAssignmentFilter}
                                    onChange={(e) =>
                                      setDevelopmentAssignmentFilter(
                                        e.target.value as "all" | "selected" | "unselected"
                                      )
                                    }
                                    className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-brand-navy"
                                  >
                                    <option value="all">Todos</option>
                                    <option value="selected">Solo vinculados</option>
                                    <option value="unselected">No vinculados</option>
                                  </select>
                                </div>
                                <ScrollArea className="h-40 rounded-lg border border-stone-200 p-2">
                                  {developmentOptionsForDetail.map((d) => (
                                    <label
                                      key={d.id}
                                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-stone-50"
                                    >
                                      <Checkbox
                                        checked={selected.developmentIds.includes(d.id)}
                                        onCheckedChange={(v) => {
                                          const on = v === true;
                                          setSelected({
                                            ...selected,
                                            developmentIds: on
                                              ? [...selected.developmentIds, d.id]
                                              : selected.developmentIds.filter((x) => x !== d.id),
                                          });
                                        }}
                                      />
                                      <span className="text-sm text-brand-navy">{d.name}</span>
                                    </label>
                                  ))}
                                  {developmentOptionsForDetail.length === 0 && (
                                    <p className="px-2 py-3 text-sm text-slate-500">Sin resultados.</p>
                                  )}
                                </ScrollArea>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3 text-sm text-slate-700">
                              <p className="text-xs font-semibold text-slate-500">Propiedades</p>
                              <ul className="space-y-1">
                                {selected.propertyIds.length === 0 ? (
                                  <li className="text-slate-500">Ninguna vinculada.</li>
                                ) : (
                                  selected.propertyIds.map((id) => {
                                    const p = properties.find((x) => x.id === id);
                                    return <li key={id}>{p?.title ?? id}</li>;
                                  })
                                )}
                              </ul>
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
                          )}
                        </section>

                        {selected.linkedLeadIds.length > 0 && (
                          <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                            <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                              Leads vinculados
                            </h3>
                            <ul className="mt-3 space-y-2">
                              {selected.linkedLeadIds.map((lid) => {
                                const lead = leads.find((l) => l.id === lid);
                                return (
                                  <li
                                    key={lid}
                                    className="rounded-lg border border-stone-200/80 bg-stone-50/50 px-3 py-2 text-sm"
                                  >
                                    {lead ? (
                                      <>
                                        <span className="font-medium text-brand-navy">{lead.name}</span>
                                        <span className="text-slate-500"> · {lead.email}</span>
                                      </>
                                    ) : (
                                      <span>Lead #{lid}</span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </section>
                        )}
                      </div>

                      <aside className="lg:col-span-5 lg:sticky lg:top-2 lg:self-start">
                        {canEdit && (
                          <section className="mb-6 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
                            <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                              Añadir nota
                            </h3>
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              rows={3}
                              className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-brand-navy"
                              placeholder="Escribe una nota interna…"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2"
                              onClick={addNote}
                              disabled={!noteDraft.trim()}
                            >
                              Registrar nota
                            </Button>
                          </section>
                        )}

                        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                          <h3 className="flex items-center gap-2 text-sm text-slate-700" style={{ fontWeight: 600 }}>
                            <History className="h-4 w-4 text-primary" strokeWidth={1.9} />
                            Actividad
                          </h3>
                          <div className="mt-4 space-y-3">
                            {sortedActivity.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center text-sm text-slate-500">
                                Sin actividad registrada.
                              </p>
                            ) : (
                              <div className="relative pl-8">
                                <div className="absolute bottom-3 left-[15px] top-3 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                                <div className="space-y-4">
                                  {sortedActivity.map((entry) => {
                                    const meta = clientActivityMeta(entry.type);
                                    const Icon = meta.Icon;
                                    return (
                                      <article
                                        key={entry.id}
                                        className="relative rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 shadow-sm"
                                      >
                                        <span className="absolute -left-8 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm">
                                          <Icon className={cn("h-3.5 w-3.5", meta.iconClass)} strokeWidth={2} />
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm text-brand-navy" style={{ fontWeight: 700 }}>
                                            {meta.title}
                                          </p>
                                          <span
                                            className={cn("rounded-full px-2 py-0.5 text-[11px]", meta.badgeClass)}
                                          >
                                            {activityBadgeLabel[entry.type]}
                                          </span>
                                        </div>
                                        <p className="mt-1.5 text-sm text-slate-700">{entry.description}</p>
                                        <p className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                          <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatActivityDate(entry.createdAt)}
                                          </span>
                                          <span className="text-slate-400">·</span>
                                          <span>{entry.actorName}</span>
                                        </p>
                                      </article>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
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

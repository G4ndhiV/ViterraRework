import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import type { User } from "../../contexts/AuthContext";
import {
  labelForLeadStatus,
  newLeadClientNoteId,
  type CustomKanbanStage,
  type Lead,
  type LeadPriorityStars,
} from "../../data/leads";
import { LeadPriorityStarsInput } from "./LeadPriorityStarsInput";
import { CRM_ASSIGNEES, resolveAssigneeName } from "../../data/crmAssignees";
import { useAuth } from "../../contexts/AuthContext";
import { findDuplicateLeads, newLeadId } from "../../lib/leadDuplicates";
import { DEFAULT_PIPELINE_GROUP_ID } from "../../lib/pipelineByGroup";
import { foldSearchText } from "../../lib/searchText";
import type { Property } from "../PropertyCard";
import type { Development } from "../../data/developments";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allLeads: Lead[];
  onAddLead: (lead: Lead) => void;
  user: User;
  customKanbanStages?: CustomKanbanStage[];
  /** Grupo de trabajo cuyo pipeline Kanban aplica a este lead */
  pipelineGroupId?: string;
  /** Primera columna activa del pipeline; obligatoria para crear leads. */
  defaultStageId?: string | null;
  /** Si se define, limita la asignación a estos IDs de usuario. */
  allowedAssigneeUserIds?: string[];
  properties: Property[];
  developments: Development[];
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  relatedPropertyId: "",
  relatedDevelopmentId: "",
  priorityStars: 3 as LeadPriorityStars,
  source: "CRM",
  notes: "",
};

export function AddLeadDialog({
  open,
  onOpenChange,
  allLeads,
  onAddLead,
  user,
  customKanbanStages = [],
  pipelineGroupId = DEFAULT_PIPELINE_GROUP_ID,
  defaultStageId = null,
  allowedAssigneeUserIds,
  properties,
  developments,
}: Props) {
  const { users: teamUsers } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [assigneeId, setAssigneeId] = useState(user.id);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [developmentSearch, setDevelopmentSearch] = useState("");

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setAssigneeId(user.id);
      setAssigneeSearch("");
      setPropertySearch("");
      setDevelopmentSearch("");
    }
  }, [open, user.id]);

  const assigneeOptions = useMemo(() => {
    const fromTeam = teamUsers.filter((u) => u.isActive).map((u) => ({ id: u.id, name: u.name }));
    const list = fromTeam.length > 0 ? fromTeam : CRM_ASSIGNEES;
    const scopedList =
      allowedAssigneeUserIds && allowedAssigneeUserIds.length > 0
        ? list.filter((a) => allowedAssigneeUserIds.includes(a.id))
        : list;
    if (user.role === "asesor") {
      return scopedList.filter((a) => a.id === user.id);
    }
    return scopedList;
  }, [teamUsers, user.role, user.id, allowedAssigneeUserIds]);

  useEffect(() => {
    if (user.role === "asesor") {
      setAssigneeId(user.id);
    }
  }, [user.role, user.id]);

  useEffect(() => {
    if (assigneeOptions.length === 0) return;
    if (assigneeOptions.some((opt) => opt.id === assigneeId)) return;
    setAssigneeId(assigneeOptions[0].id);
  }, [assigneeOptions, assigneeId]);

  const duplicates = useMemo(
    () => findDuplicateLeads(allLeads, form.email, form.phone),
    [allLeads, form.email, form.phone]
  );
  const filteredAssigneeOptions = useMemo(() => {
    const q = foldSearchText(assigneeSearch);
    if (!q) return assigneeOptions;
    return assigneeOptions.filter((a) => foldSearchText(a.name).includes(q));
  }, [assigneeOptions, assigneeSearch]);
  const filteredPropertyOptions = useMemo(() => {
    const q = foldSearchText(propertySearch);
    if (!q) return properties;
    return properties.filter((p) =>
      foldSearchText(`${p.title} ${p.location} ${p.type}`).includes(q)
    );
  }, [properties, propertySearch]);
  const filteredDevelopmentOptions = useMemo(() => {
    const q = foldSearchText(developmentSearch);
    if (!q) return developments;
    return developments.filter((d) =>
      foldSearchText(`${d.name} ${d.location} ${d.type}`).includes(q)
    );
  }, [developments, developmentSearch]);

  const propertyToDevelopmentId = useMemo(() => {
    const map = new Map<string, string>();
    for (const property of properties) {
      const tokkoId = property.developmentTokkoId?.trim();
      if (!tokkoId) continue;
      const linkedDevelopment = developments.find((development) => development.tokkoId?.trim() === tokkoId);
      if (linkedDevelopment) map.set(property.id, linkedDevelopment.id);
    }
    return map;
  }, [properties, developments]);

  const hasDuplicate = duplicates.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultStageId) return;
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!name || !email || !phone) return;

    const today = new Date().toISOString().slice(0, 10);
    const relatedProperty =
      form.relatedPropertyId.trim().length > 0
        ? properties.find((p) => p.id === form.relatedPropertyId)
        : undefined;
    const relatedDevelopment =
      form.relatedDevelopmentId.trim().length > 0
        ? developments.find((d) => d.id === form.relatedDevelopmentId)
        : undefined;

    const noteText = form.notes.trim();
    const newLead: Lead = {
      id: newLeadId(),
      name,
      email,
      phone,
      interest: relatedProperty?.status === "alquiler" ? "alquiler" : "compra",
      propertyType: relatedProperty?.type || relatedDevelopment?.type || "—",
      budget: relatedProperty?.price ?? 0,
      location: relatedProperty?.location || relatedDevelopment?.location || "—",
      relatedPropertyId: relatedProperty?.id,
      relatedDevelopmentId: relatedDevelopment?.id,
      status: defaultStageId,
      priorityStars: form.priorityStars,
      source: form.source.trim() || "CRM",
      assignedTo: resolveAssigneeName(assigneeId, assigneeOptions),
      assignedToUserId: assigneeId,
      pipelineGroupId,
      clientNotes: noteText
        ? [{ id: newLeadClientNoteId(), date: today, body: noteText }]
        : [],
      createdAt: today,
      lastContact: today,
      updatedAt: new Date().toISOString(),
    };

    onAddLead(newLead);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden border-slate-200/80 p-0 shadow-[0_24px_64px_-12px_rgba(20,28,46,0.28)] sm:max-w-5xl">
        <div className="h-1.5 bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy" aria-hidden />
        <div className="border-b border-slate-100/90 bg-white px-5 pb-2.5 pt-3">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-heading text-xl tracking-tight text-brand-navy" style={{ fontWeight: 600 }}>
              Nuevo lead
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
              Registra un cliente potencial. Si el correo o teléfono ya existen, te avisaremos para que confirmes la asignación.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 px-5 py-2.5">
          {!defaultStageId && (
            <div
              className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
              role="alert"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
              <div className="min-w-0 space-y-1">
                <p className="font-semibold" style={{ fontWeight: 600 }}>
                  No hay columnas configuradas
                </p>
                <p className="text-amber-900/90" style={{ fontWeight: 500 }}>
                  Crea al menos una columna en <strong>Mi empresa → Pipeline de ventas</strong> para poder registrar leads.
                </p>
              </div>
            </div>
          )}
          {hasDuplicate && (
            <div
              className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
              role="alert"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
              <div className="min-w-0 space-y-2">
                <p className="font-semibold" style={{ fontWeight: 600 }}>
                  Posible contacto duplicado
                </p>
                <p className="text-amber-900/90" style={{ fontWeight: 500 }}>
                  Ya hay {duplicates.length === 1 ? "un lead" : `${duplicates.length} leads`} con este correo o teléfono.
                  Revisa y asigna el responsable antes de guardar.
                </p>
                <ul className="list-inside list-disc space-y-1 text-xs text-amber-900/85" style={{ fontWeight: 500 }}>
                  {duplicates.map((d) => (
                    <li key={d.id}>
                      {d.name} — {labelForLeadStatus(d.status, customKanbanStages)} — asignado a {d.assignedTo}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid gap-2.5 lg:grid-cols-2">
            <section className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/40 p-3.5">
              <div className="space-y-0.5">
                <h3 className="text-sm text-brand-navy" style={{ fontWeight: 700 }}>
                  1. Datos de contacto
                </h3>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Información principal del cliente potencial.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="lead-name" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Nombre completo
                  </Label>
                  <input
                    id="lead-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ fontWeight: 500 }}
                    placeholder="Ej. María García"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-email" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Correo
                  </Label>
                  <input
                    id="lead-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ fontWeight: 500 }}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-phone" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Teléfono
                  </Label>
                  <input
                    id="lead-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ fontWeight: 500 }}
                    placeholder="+52 …"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5">
              <div className="space-y-0.5">
                <h3 className="text-sm text-brand-navy" style={{ fontWeight: 700 }}>
                  2. Seguimiento comercial
                </h3>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Define prioridad, origen y responsable del lead.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Prioridad (1–6 estrellas)
                  </Label>
                  <LeadPriorityStarsInput
                    value={form.priorityStars}
                    onChange={(v) => setForm((f) => ({ ...f, priorityStars: v }))}
                    size="md"
                  />
                  <p className="text-[11px] leading-relaxed text-slate-500" style={{ fontWeight: 500 }}>
                    Más estrellas indican mayor prioridad para el seguimiento.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-source" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Origen
                  </Label>
                  <input
                    id="lead-source"
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ fontWeight: 500 }}
                    placeholder="CRM, referido…"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="lead-assignee"
                    className={`text-xs uppercase tracking-wide ${hasDuplicate ? "text-amber-800" : "text-slate-600"}`}
                    style={{ fontWeight: 600 }}
                  >
                    Asignar a {hasDuplicate ? "(confirma por el posible duplicado)" : ""}
                  </Label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <input
                      type="search"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Buscar asesor…"
                      className="mb-2 h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                  <select
                    id="lead-assignee"
                    value={assigneeId}
                    disabled={user.role === "asesor"}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
                    style={{ fontWeight: 500 }}
                  >
                    {filteredAssigneeOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {filteredAssigneeOptions.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">No se encontraron asesores para esa búsqueda.</p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="lead-notes" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Notas
                  </Label>
                  <textarea
                    id="lead-notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full resize-y rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ fontWeight: 500 }}
                    placeholder="Detalle del interés del cliente…"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 lg:col-span-2">
              <div className="space-y-0.5">
                <h3 className="text-sm text-brand-navy" style={{ fontWeight: 700 }}>
                  3. Vinculación con inventario
                </h3>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Relaciona el lead con una propiedad o desarrollo existente.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-property" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Asignar propiedad
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                    <input
                      type="search"
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      placeholder="Buscar propiedad…"
                    className="mb-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                  <select
                    id="lead-property"
                    value={form.relatedPropertyId}
                    onChange={(e) => {
                      const propertyId = e.target.value;
                      const linkedDevelopmentId = propertyToDevelopmentId.get(propertyId);
                      setForm((f) => ({
                        ...f,
                        relatedPropertyId: propertyId,
                        relatedDevelopmentId:
                          propertyId.length === 0
                            ? ""
                            : linkedDevelopmentId ?? "",
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="">Sin propiedad</option>
                    {filteredPropertyOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-development" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                    Asignar desarrollo
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                    <input
                      type="search"
                      value={developmentSearch}
                      onChange={(e) => setDevelopmentSearch(e.target.value)}
                      placeholder="Buscar desarrollo…"
                    className="mb-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                  <select
                    id="lead-development"
                    value={form.relatedDevelopmentId}
                    onChange={(e) => setForm((f) => ({ ...f, relatedDevelopmentId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="">Sin desarrollo</option>
                    {filteredDevelopmentOptions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="mt-1 gap-2 border-t border-slate-100 pt-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!defaultStageId}
              className="bg-primary hover:bg-brand-red-hover text-primary-foreground"
            >
              Guardar lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

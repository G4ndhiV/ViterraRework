import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { CRM_ASSIGNEES, getAssigneeNameById } from "../../data/crmAssignees";
import { findDuplicateLeads, nextLeadId } from "../../lib/leadDuplicates";
import { DEFAULT_PIPELINE_GROUP_ID } from "../../lib/pipelineByGroup";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allLeads: Lead[];
  onAddLead: (lead: Lead) => void;
  user: User;
  customKanbanStages?: CustomKanbanStage[];
  /** Grupo de trabajo cuyo pipeline Kanban aplica a este lead */
  pipelineGroupId?: string;
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  interest: "compra" as Lead["interest"],
  propertyType: "",
  budget: "",
  location: "",
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
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [assigneeId, setAssigneeId] = useState(user.id);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setAssigneeId(user.id);
    }
  }, [open, user.id]);

  const assigneeOptions = useMemo(() => {
    if (user.role === "asesor") {
      return CRM_ASSIGNEES.filter((a) => a.id === user.id);
    }
    return CRM_ASSIGNEES;
  }, [user.role, user.id]);

  useEffect(() => {
    if (user.role === "asesor") {
      setAssigneeId(user.id);
    }
  }, [user.role, user.id]);

  const duplicates = useMemo(
    () => findDuplicateLeads(allLeads, form.email, form.phone),
    [allLeads, form.email, form.phone]
  );

  const hasDuplicate = duplicates.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!name || !email || !phone) return;

    const budgetNum = Number(form.budget.replace(/[^\d.]/g, "")) || 0;
    const today = new Date().toISOString().slice(0, 10);

    const noteText = form.notes.trim();
    const newLead: Lead = {
      id: nextLeadId(allLeads),
      name,
      email,
      phone,
      interest: form.interest,
      propertyType: form.propertyType.trim() || "—",
      budget: budgetNum,
      location: form.location.trim() || "—",
      status: "nuevo",
      priorityStars: form.priorityStars,
      source: form.source.trim() || "CRM",
      assignedTo: getAssigneeNameById(assigneeId),
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
      <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto border-slate-200/80 p-0 shadow-[0_24px_64px_-12px_rgba(20,28,46,0.28)] sm:max-w-lg">
        <div className="h-1.5 bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy" aria-hidden />
        <div className="border-b border-slate-100/90 bg-white px-6 pb-4 pt-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-heading text-xl tracking-tight text-brand-navy" style={{ fontWeight: 600 }}>
              Nuevo lead
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
              Registra un cliente potencial. Si el correo o teléfono ya existen, te avisaremos para que confirmes la asignación.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="lead-name" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                Nombre completo
              </Label>
              <input
                id="lead-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ fontWeight: 500 }}
                placeholder="+52 …"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-interest" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                Interés
              </Label>
              <select
                id="lead-interest"
                value={form.interest}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interest: e.target.value as Lead["interest"] }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ fontWeight: 500 }}
              >
                <option value="compra">Compra</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="asesoria">Asesoría</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-type" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                Tipo de propiedad
              </Label>
              <input
                id="lead-type"
                value={form.propertyType}
                onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}
                className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ fontWeight: 500 }}
                placeholder="Casa, depto…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-budget" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                Presupuesto (USD)
              </Label>
              <input
                id="lead-budget"
                inputMode="numeric"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ fontWeight: 500 }}
                placeholder="250000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-loc" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                Zona / ubicación
              </Label>
              <input
                id="lead-loc"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ fontWeight: 500 }}
                placeholder="Centro, norte…"
              />
            </div>
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
            <div className="sm:col-span-2 space-y-1.5">
              <Label
                htmlFor="lead-assignee"
                className={`text-xs uppercase tracking-wide ${hasDuplicate ? "text-amber-800" : "text-slate-600"}`}
                style={{ fontWeight: 600 }}
              >
                Asignar a {hasDuplicate ? "(confirma por el posible duplicado)" : ""}
              </Label>
              <select
                id="lead-assignee"
                value={assigneeId}
                disabled={user.role === "asesor"}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
                style={{ fontWeight: 500 }}
              >
                {assigneeOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="lead-notes" className="text-xs uppercase tracking-wide text-slate-600" style={{ fontWeight: 600 }}>
                Notas
              </Label>
              <textarea
                id="lead-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full resize-y rounded-xl border border-slate-200/90 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ fontWeight: 500 }}
                placeholder="Detalle del interés del cliente…"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 pt-4 mt-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-brand-red-hover text-primary-foreground">
              Guardar lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { Calendar, Mail, Phone, Plus, Tag, Trash2 } from "lucide-react";
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
import type { Lead, LeadPriorityStars } from "../../data/leads";
import { labelForLeadStatus, newLeadClientNoteId, sortLeadClientNotesNewestFirst } from "../../data/leads";
import { CRM_ASSIGNEES, getAssigneeNameById } from "../../data/crmAssignees";
import { LeadPriorityBadge } from "./LeadPriorityBadge";
import { LeadPriorityStarsInput } from "./LeadPriorityStarsInput";
import { cn } from "../ui/utils";

function formatLeadDate(value: string | undefined) {
  if (!value) return "—";
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  return new Date(t).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const leadFieldClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-brand-navy transition-colors placeholder:text-slate-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300/80";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  defaultMode?: "view" | "edit";
  /** Valores y etiquetas para el selector de etapa (incorporadas + personalizadas). */
  statusOptions: { value: string; label: string }[];
  /** Al cambiar fase desde la vista resumen (sin modo edición). */
  onStatusChange?: (leadId: string, newStatus: string) => void;
  onSave: (lead: Lead) => void;
  onDelete: (id: string) => void;
};

export function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  defaultMode = "view",
  statusOptions,
  onStatusChange,
  onSave,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(defaultMode === "edit");
  const [draft, setDraft] = useState<Lead | null>(null);

  useEffect(() => {
    if (open && lead) {
      setDraft({ ...lead });
      setEditing(defaultMode === "edit");
    }
  }, [open, lead, defaultMode]);

  if (!lead) {
    return null;
  }

  const d = draft ?? lead;

  const handleSave = () => {
    if (!draft) return;
    const prunedNotes = draft.clientNotes
      .map((n) => ({ ...n, body: n.body.trim() }))
      .filter((n) => n.body.length > 0);
    onSave({
      ...draft,
      clientNotes: prunedNotes,
      assignedTo: getAssigneeNameById(draft.assignedToUserId),
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm("¿Eliminar este lead de forma permanente?")) {
      onDelete(lead.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={lead.id}>
      <DialogContent
        className={cn(
          "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 sm:!max-w-none"
        )}
      >
        <div className="h-0.5 shrink-0 bg-gradient-to-r from-brand-gold/90 via-primary to-brand-burgundy/90" aria-hidden />
        <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/90 px-4 py-2.5 pr-12 sm:px-5 sm:pr-14">
          <DialogHeader className="gap-0 p-0 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>
                  <span className="text-primary/90">CRM</span>
                  <span className="text-slate-400"> · </span>
                  {editing ? "Edición de lead" : "Detalle de lead"}
                </p>
                <DialogTitle
                  className="font-heading mt-0.5 truncate text-lg leading-tight text-brand-navy sm:text-xl"
                  style={{ fontWeight: 600 }}
                >
                  {d.name}
                </DialogTitle>
              </div>
              <span className="inline-flex max-w-[min(12rem,46%)] shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-wide text-primary">
                {labelForLeadStatus(
                  d.status,
                  statusOptions.map((o) => ({ id: o.value, label: o.label }))
                )}
              </span>
            </div>
            <DialogDescription className="sr-only">
              Lead {d.name}, estado{" "}
              {labelForLeadStatus(d.status, statusOptions.map((o) => ({ id: o.value, label: o.label })))}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-stone-100/95 to-stone-100/80">
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-[min(100%,88rem)]">
          {editing && draft ? (
            <div className="grid grid-cols-1 gap-6 text-sm lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10">
              <div className="flex flex-col gap-5 lg:col-span-7 xl:col-span-8">
                <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                    Fase del embudo
                  </h3>
                  <div className="mt-3">
                    <Label className="sr-only">Estado del lead</Label>
                    <select
                      value={
                        statusOptions.some((o) => o.value === draft.status)
                          ? draft.status
                          : statusOptions[0]?.value ?? draft.status
                      }
                      onChange={(e) => setDraft((d) => (d ? { ...d, status: e.target.value } : d))}
                      className={cn(leadFieldClass, "bg-stone-50/50")}
                      style={{ fontWeight: 600 }}
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                    Contacto
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        Nombre completo
                      </Label>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                        className={leadFieldClass}
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                          Correo
                        </Label>
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(e) => setDraft((d) => (d ? { ...d, email: e.target.value } : d))}
                          className={leadFieldClass}
                          style={{ fontWeight: 500 }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                          Teléfono
                        </Label>
                        <input
                          value={draft.phone}
                          onChange={(e) => setDraft((d) => (d ? { ...d, phone: e.target.value } : d))}
                          className={leadFieldClass}
                          style={{ fontWeight: 500 }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                    Interés y propiedad
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        Interés
                      </Label>
                      <select
                        value={draft.interest}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, interest: e.target.value as Lead["interest"] } : d
                          )
                        }
                        className={leadFieldClass}
                        style={{ fontWeight: 500 }}
                      >
                        <option value="compra">Compra</option>
                        <option value="venta">Venta</option>
                        <option value="alquiler">Alquiler</option>
                        <option value="asesoria">Asesoría</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        Tipo de propiedad
                      </Label>
                      <input
                        value={draft.propertyType}
                        onChange={(e) => setDraft((d) => (d ? { ...d, propertyType: e.target.value } : d))}
                        className={leadFieldClass}
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        Presupuesto (USD)
                      </Label>
                      <input
                        type="number"
                        min={0}
                        value={draft.budget}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, budget: Number(e.target.value) || 0 } : d))
                        }
                        className={cn(leadFieldClass, "max-w-xs")}
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        Ubicación deseada
                      </Label>
                      <input
                        value={draft.location}
                        onChange={(e) => setDraft((d) => (d ? { ...d, location: e.target.value } : d))}
                        className={leadFieldClass}
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                      Notas del cliente
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-stone-300 bg-white text-xs hover:bg-stone-50"
                      onClick={() =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                clientNotes: [
                                  ...prev.clientNotes,
                                  {
                                    id: newLeadClientNoteId(),
                                    date: new Date().toISOString().slice(0, 10),
                                    body: "",
                                  },
                                ],
                              }
                            : prev
                        )
                      }
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      Añadir nota
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Cada nota tiene su propia fecha; puedes registrar reuniones, llamadas o acuerdos.
                  </p>
                  <div className="mt-4 space-y-4">
                    {draft.clientNotes.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center text-sm text-slate-500">
                        Aún no hay notas. Pulsa «Añadir nota» para crear la primera.
                      </p>
                    ) : (
                      draft.clientNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 ring-1 ring-stone-100"
                        >
                          <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                                Fecha
                              </Label>
                              <input
                                type="date"
                                value={note.date.slice(0, 10)}
                                onChange={(e) =>
                                  setDraft((d) =>
                                    d
                                      ? {
                                          ...d,
                                          clientNotes: d.clientNotes.map((n) =>
                                            n.id === note.id ? { ...n, date: e.target.value } : n
                                          ),
                                        }
                                      : d
                                  )
                                }
                                className={cn(leadFieldClass, "w-auto min-w-[10rem]")}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() =>
                                setDraft((d) =>
                                  d
                                    ? {
                                        ...d,
                                        clientNotes: d.clientNotes.filter((n) => n.id !== note.id),
                                      }
                                    : d
                                )
                              }
                              aria-label="Eliminar nota"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                              Contenido
                            </Label>
                            <textarea
                              rows={4}
                              value={note.body}
                              onChange={(e) =>
                                setDraft((d) =>
                                  d
                                    ? {
                                        ...d,
                                        clientNotes: d.clientNotes.map((n) =>
                                          n.id === note.id ? { ...n, body: e.target.value } : n
                                        ),
                                      }
                                    : d
                                )
                              }
                              className={cn(
                                leadFieldClass,
                                "min-h-[88px] resize-y bg-white focus:bg-white"
                              )}
                              style={{ fontWeight: 500 }}
                              placeholder="Ej. Llamada de seguimiento, acuerdos, preferencias…"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-5 lg:sticky lg:top-1 lg:col-span-5 xl:col-span-4">
                <section
                  className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/40 via-white to-stone-50/90 p-5 shadow-sm sm:p-6"
                  title="De 1 a 6 estrellas; más estrellas = mayor urgencia de seguimiento."
                >
                  <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                    Prioridad
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <LeadPriorityStarsInput
                      value={draft.priorityStars}
                      onChange={(v: LeadPriorityStars) =>
                        setDraft((prev) => (prev ? { ...prev, priorityStars: v } : prev))
                      }
                      size="md"
                    />
                    <span className="rounded-md bg-white/90 px-2 py-0.5 text-xs tabular-nums text-slate-600 shadow-sm ring-1 ring-stone-200/80" style={{ fontWeight: 600 }}>
                      {draft.priorityStars}/6
                    </span>
                  </div>
                </section>

                <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                    Asignación
                  </h3>
                  <div className="mt-4 space-y-1.5">
                    <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                      Asignado a
                    </Label>
                    <select
                      value={draft.assignedToUserId}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, assignedToUserId: e.target.value } : d))
                      }
                      className={leadFieldClass}
                      style={{ fontWeight: 500 }}
                    >
                      {CRM_ASSIGNEES.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
              </aside>
            </div>
          ) : (
            <div className="flex flex-col gap-6 text-sm lg:gap-8">
              <section className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-[0_6px_28px_-10px_rgba(20,28,46,0.14)] sm:flex sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-6">
                <div
                  className="pointer-events-none absolute inset-y-4 left-0 w-[3px] rounded-full bg-gradient-to-b from-primary via-primary/85 to-brand-navy"
                  aria-hidden
                />
                <div className="pl-5 sm:min-w-0 sm:flex-1 sm:pl-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Pipeline
                  </p>
                  <label className="mt-1 block text-sm text-slate-600" style={{ fontWeight: 500 }}>
                    Etapa en el embudo
                  </label>
                </div>
                <div className="mt-3 pl-5 sm:mt-0 sm:max-w-md sm:flex-1 sm:pl-0 lg:max-w-lg">
                  <select
                    value={
                      statusOptions.some((o) => o.value === d.status)
                        ? d.status
                        : statusOptions[0]?.value ?? d.status
                    }
                    onChange={(e) => onStatusChange?.(lead.id, e.target.value)}
                    disabled={!onStatusChange}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-3 text-sm text-brand-navy transition-colors focus:border-primary/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontWeight: 600 }}
                    aria-label="Cambiar fase del lead"
                  >
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8 xl:gap-10">
                <main className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
                  <div className="flex items-center gap-2 border-b border-stone-200/90 pb-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Contacto y oferta
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-white to-primary/[0.04] p-5 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                          <Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Correo
                          </p>
                          <a
                            href={`mailto:${encodeURIComponent(d.email)}`}
                            className="mt-1 block break-all text-[15px] text-primary transition-colors hover:underline"
                            style={{ fontWeight: 600 }}
                          >
                            {d.email}
                          </a>
                        </div>
                      </div>
                    </section>
                    <section className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-white to-brand-navy/[0.06] p-5 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy ring-1 ring-brand-navy/15">
                          <Phone className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Teléfono
                          </p>
                          <a
                            href={`tel:${d.phone.replace(/\s/g, "")}`}
                            className="mt-1 block text-[15px] text-brand-navy transition-colors group-hover:text-primary"
                            style={{ fontWeight: 600 }}
                          >
                            {d.phone}
                          </a>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-stone-100 pb-3">
                      <h3 className="text-base text-brand-navy" style={{ fontWeight: 700 }}>
                        Interés y propiedad
                      </h3>
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Resumen
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                      {[
                        { label: "Interés", value: d.interest, capitalize: true },
                        { label: "Tipo", value: d.propertyType },
                        {
                          label: "Presupuesto",
                          value: (
                            <>
                              ${d.budget.toLocaleString()}{" "}
                              <span className="text-xs font-normal text-slate-500">USD</span>
                            </>
                          ),
                        },
                        { label: "Ubicación", value: d.location },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl bg-gradient-to-b from-stone-50/90 to-stone-50/40 px-3 py-3 ring-1 ring-stone-200/70 sm:px-4 sm:py-3.5"
                        >
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            {item.label}
                          </dt>
                          <dd
                            className={cn(
                              "mt-1.5 text-sm text-brand-navy",
                              item.capitalize && "capitalize"
                            )}
                            style={{ fontWeight: 600 }}
                          >
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <div className="flex items-center gap-2 border-b border-stone-200/90 pb-2 pt-1">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-navy/70" aria-hidden />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Notas del cliente
                    </span>
                  </div>

                  <section className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-gradient-to-b from-stone-100/80 to-stone-50/90 p-5 shadow-inner sm:p-6">
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/[0.06]"
                      aria-hidden
                    />
                    {sortLeadClientNotesNewestFirst(d.clientNotes).length === 0 ? (
                      <p className="relative text-sm text-slate-500">
                        Sin notas registradas. Usa «Editar» para añadir la primera.
                      </p>
                    ) : (
                      <ul className="relative space-y-4">
                        {sortLeadClientNotesNewestFirst(d.clientNotes).map((note) => (
                          <li
                            key={note.id}
                            className="rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 shadow-sm ring-1 ring-stone-100/80"
                          >
                            <time
                              className="text-[11px] font-semibold uppercase tracking-wide text-primary"
                              dateTime={note.date}
                            >
                              {formatLeadDate(note.date)}
                            </time>
                            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800" style={{ fontWeight: 400 }}>
                              {note.body.trim() || "—"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </main>

                <aside className="flex flex-col gap-0 lg:sticky lg:top-1 lg:col-span-5 xl:col-span-4">
                  <div className="mb-3 lg:mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Seguimiento
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Prioridad, origen, fechas y responsable
                    </p>
                  </div>
                  <div className="rounded-2xl border border-stone-200/85 bg-white shadow-md ring-1 ring-black/[0.03]">
                    <div
                      className="rounded-t-2xl border-b border-stone-100 bg-gradient-to-r from-amber-50/60 to-white p-5 sm:p-6"
                      title="Prioridad del 1 al 6 (estrellas de izquierda a derecha)"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900/85">
                        Prioridad
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <LeadPriorityBadge stars={d.priorityStars} size="md" />
                        <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs tabular-nums text-slate-700 shadow-sm ring-1 ring-stone-200/80" style={{ fontWeight: 700 }}>
                          {d.priorityStars}/6
                        </span>
                      </div>
                    </div>

                    <div className="border-b border-stone-100 bg-gradient-to-br from-primary/[0.06] to-white px-5 py-5 sm:px-6">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                        <Tag className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                        Origen
                      </p>
                      <p className="mt-2 text-lg font-bold text-brand-navy">{d.source || "—"}</p>
                    </div>

                    <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <Calendar className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
                        Fechas clave
                      </p>
                      <div className="mt-4 space-y-2.5">
                        {[
                          { label: "Registro", date: formatLeadDate(d.createdAt), dot: "bg-primary" },
                          { label: "Último contacto", date: formatLeadDate(d.lastContact), dot: "bg-brand-navy/55" },
                          { label: "Actualizado", date: formatLeadDate(d.updatedAt ?? d.lastContact), dot: "bg-stone-400" },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-start gap-3 rounded-xl bg-stone-50/90 px-3 py-2.5 ring-1 ring-stone-100"
                          >
                            <span
                              className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", row.dot)}
                              aria-hidden
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                {row.label}
                              </p>
                              <p className="mt-0.5 text-sm font-bold text-brand-navy">{row.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-b-2xl bg-gradient-to-r from-stone-50/90 to-white px-5 py-5 pb-6 sm:gap-5 sm:px-6">
                      <span
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-brand-navy text-lg font-bold text-white shadow-md ring-2 ring-white"
                        aria-hidden
                      >
                        {d.assignedTo
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Asignado a
                        </p>
                        <p className="truncate text-lg font-bold text-brand-navy">{d.assignedTo}</p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-stone-200/90 bg-stone-50/90 px-4 py-3 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="border-stone-300 bg-white hover:bg-stone-50"
                  onClick={() => {
                    setDraft({ ...lead });
                    setEditing(false);
                  }}
                >
                  Cancelar edición
                </Button>
                <Button
                  type="button"
                  className="bg-primary hover:bg-brand-red-hover text-primary-foreground"
                  onClick={handleSave}
                >
                  Guardar cambios
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="border-stone-300 bg-white hover:bg-stone-50"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  className="bg-primary hover:bg-brand-red-hover text-primary-foreground"
                  onClick={() => setEditing(true)}
                >
                  Editar
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

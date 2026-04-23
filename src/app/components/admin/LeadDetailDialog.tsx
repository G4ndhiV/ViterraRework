import { useEffect, useMemo, useState } from "react";
import { Calendar, History, Mail, MessageCircle, Phone, Plus, Search, Tag, Trash2, UserCircle2 } from "lucide-react";
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
import type { Lead, LeadPriorityStars } from "../../data/leads";
import type { Property } from "../PropertyCard";
import type { Development } from "../../data/developments";
import { isClickableTeamMemberProfile, resolveLeadTeamUser } from "../../lib/crmTeamUser";
import { labelForLeadStatus, newLeadActivityId, newLeadClientNoteId, sortLeadClientNotesNewestFirst } from "../../data/leads";
import { CRM_ASSIGNEES, resolveAssigneeName } from "../../data/crmAssignees";
import { LeadPriorityBadge } from "./LeadPriorityBadge";
import { LeadPriorityStarsInput } from "./LeadPriorityStarsInput";
import { cn } from "../ui/utils";
import { foldSearchText } from "../../lib/searchText";

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
  /** Usuarios del equipo (para abrir ficha desde el asignado). */
  teamUsers?: User[];
  currentUserId?: string;
  /** Navega a Mi empresa → Usuarios y abre el detalle (solo lectura si no es admin). */
  onViewTeamMember?: (userId: string) => void;
  /** Permiso para ficha de cliente CRM */
  canManageClients?: boolean;
  /** Abre el módulo Clientes y crea o vincula ficha desde este lead */
  onRegisterClientFromLead?: (lead: Lead) => void;
  properties?: Property[];
  developments?: Development[];
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
  teamUsers = [],
  currentUserId = "",
  onViewTeamMember,
  canManageClients = false,
  onRegisterClientFromLead,
  properties = [],
  developments = [],
}: Props) {
  const assigneeSelectOptions = useMemo(() => {
    const fromTeam = teamUsers.filter((u) => u.isActive).map((u) => ({ id: u.id, name: u.name }));
    return fromTeam.length > 0 ? fromTeam : CRM_ASSIGNEES;
  }, [teamUsers]);
  const [editing, setEditing] = useState(defaultMode === "edit");
  const [draft, setDraft] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "activity" | "contact">("info");
  const [activityComment, setActivityComment] = useState("");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [developmentSearchQuery, setDevelopmentSearchQuery] = useState("");

  useEffect(() => {
    if (open && lead) {
      setDraft({ ...lead });
      setEditing(defaultMode === "edit");
      setActiveTab("info");
      setActivityComment("");
      setPropertySearchQuery("");
      setDevelopmentSearchQuery("");
    }
  }, [open, lead, defaultMode]);

  /** Debe ejecutarse antes de cualquier return: mismas reglas de hooks en todos los renders. */
  const displayLead = lead != null ? draft ?? lead : null;
  const assigneeTeamUser = useMemo(() => {
    if (!displayLead) return undefined;
    const source = editing && draft ? draft : displayLead;
    return resolveLeadTeamUser(teamUsers, source);
  }, [editing, draft, displayLead, teamUsers]);
  const assigneeProfileOpen =
    !!onViewTeamMember && isClickableTeamMemberProfile(assigneeTeamUser, currentUserId);
  const filteredProperties = useMemo(() => {
    const q = foldSearchText(propertySearchQuery);
    if (!q) return properties;
    return properties.filter((p) => foldSearchText(`${p.title} ${p.location} ${p.type}`).includes(q));
  }, [properties, propertySearchQuery]);
  const filteredDevelopments = useMemo(() => {
    const q = foldSearchText(developmentSearchQuery);
    if (!q) return developments;
    return developments.filter((dev) => foldSearchText(`${dev.name} ${dev.location} ${dev.type}`).includes(q));
  }, [developments, developmentSearchQuery]);

  if (!lead) {
    return null;
  }

  const d = draft ?? lead;
  const canOpenClientProfile = canManageClients && !!onRegisterClientFromLead;
  const whatsappDigits = d.phone.replace(/\D/g, "");
  const whatsappMessage = `Hola ${d.name}, te contacto de Viterra para dar seguimiento a tu solicitud inmobiliaria.`;
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`;
  const sortedActivity = [...(d.activity ?? [])].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  const selectedProperty = properties.find((p) => p.id === d.relatedPropertyId);
  const selectedDevelopment = developments.find((dev) => dev.id === d.relatedDevelopmentId);

  const handleSave = () => {
    if (!draft) return;
    const prunedNotes = draft.clientNotes
      .map((n) => ({ ...n, body: n.body.trim() }))
      .filter((n) => n.body.length > 0);
    onSave({
      ...draft,
      clientNotes: prunedNotes,
      assignedTo: resolveAssigneeName(draft.assignedToUserId, assigneeSelectOptions),
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
    onOpenChange(false);
  };

  const handleAddActivityComment = () => {
    const text = activityComment.trim();
    if (!text) return;
    const now = new Date().toISOString();
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: now,
        activity: [
          {
            id: newLeadActivityId(),
            type: "comment",
            createdAt: now,
            description: text,
            status: prev.status,
          },
          ...(prev.activity ?? []),
        ],
      };
    });
    setActivityComment("");
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
        hideCloseButton
        className={cn(
          "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 sm:!max-w-none"
        )}
      >
        <div className="h-0.5 shrink-0 bg-gradient-to-r from-brand-gold/90 via-primary to-brand-burgundy/90" aria-hidden />
        <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/90 px-4 py-4 sm:px-5">
          <DialogHeader className="gap-0 p-0 text-left">
            <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>
              <span className="text-primary/90">CRM</span>
              <span className="text-slate-400"> · </span>
              {editing ? "Edición de lead" : "Detalle de lead"}
            </p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(18rem,32rem)_minmax(0,1fr)] items-center gap-4">
              <div className="min-w-0">
                {canOpenClientProfile ? (
                  <button
                    type="button"
                    onClick={() => onRegisterClientFromLead(d)}
                    className="group inline-flex max-w-full items-center gap-2 truncate rounded-lg px-1 py-0.5 text-left text-primary transition-colors hover:text-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    style={{ fontWeight: 700, textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
                    title="Abrir perfil del cliente en modulo Clientes"
                  >
                    <span className="font-heading truncate text-3xl leading-tight tracking-tight sm:text-4xl">{d.name}</span>
                  </button>
                ) : (
                  <DialogTitle
                    className="font-heading truncate text-3xl leading-tight tracking-tight text-brand-navy sm:text-4xl"
                    style={{ fontWeight: 700, textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
                  >
                    {d.name}
                  </DialogTitle>
                )}
                {canOpenClientProfile && (
                  <p className="mt-1 pl-1 text-xs text-slate-500" style={{ fontWeight: 500 }}>
                    Click en el nombre para abrir su perfil en Clientes.
                  </p>
                )}
              </div>
              <div className="justify-self-center">
                <div className="inline-flex w-full min-w-[18rem] max-w-[32rem] items-center justify-center gap-1.5 rounded-xl border border-stone-200/90 bg-white/90 p-1 shadow-sm ring-1 ring-white/70">
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`flex-1 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "info"
                      ? "bg-gradient-to-r from-brand-navy to-[#1f2d47] text-white shadow-md shadow-brand-navy/20"
                      : "text-slate-600 hover:bg-stone-50 hover:text-brand-navy"
                  }`}
                >
                  Información
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "activity"
                      ? "bg-gradient-to-r from-brand-navy to-[#1f2d47] text-white shadow-md shadow-brand-navy/20"
                      : "text-slate-600 hover:bg-stone-50 hover:text-brand-navy"
                  }`}
                >
                  <History className="h-3.5 w-3.5" strokeWidth={1.9} />
                  Actividad
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "contact"
                      ? "bg-gradient-to-r from-brand-navy to-[#1f2d47] text-white shadow-md shadow-brand-navy/20"
                      : "text-slate-600 hover:bg-stone-50 hover:text-brand-navy"
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.9} />
                  Contacto
                </button>
                </div>
              </div>
              <div className="w-full max-w-[16rem] justify-self-end">
                <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  Estado
                </label>
                <select
                  value={
                    statusOptions.some((o) => o.value === d.status)
                      ? d.status
                      : statusOptions[0]?.value ?? d.status
                  }
                  onChange={(e) => {
                    if (editing && draft) {
                      setDraft((prev) => (prev ? { ...prev, status: e.target.value } : prev));
                    } else {
                      onStatusChange?.(lead.id, e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-brand-navy transition-colors focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  style={{ fontWeight: 600 }}
                  aria-label="Cambiar estado del lead"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
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
          {activeTab === "contact" ? (
            <section className="mx-auto w-full max-w-3xl rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                Contactar cliente por WhatsApp
              </h3>
              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500" style={{ fontWeight: 600 }}>
                  Cliente
                </p>
                <p className="mt-1 text-lg text-brand-navy" style={{ fontWeight: 700 }}>
                  {canOpenClientProfile ? (
                    <button
                      type="button"
                      onClick={() => onRegisterClientFromLead(d)}
                      className="inline-flex items-center gap-1.5 rounded-md px-1 text-left text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      style={{ fontWeight: 700 }}
                      title="Abrir perfil del cliente en modulo Clientes"
                    >
                      {d.name}
                    </button>
                  ) : (
                    d.name
                  )}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Teléfono: <span className="font-semibold text-slate-800">{d.phone}</span>
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Mensaje sugerido:
                </p>
                <p className="mt-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {whatsappMessage}
                </p>
              </div>
              <div className="mt-4">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
                    whatsappDigits.length >= 8
                      ? "bg-[#25D366] hover:bg-[#1fb458]"
                      : "pointer-events-none bg-slate-300"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir WhatsApp
                </a>
                {whatsappDigits.length < 8 && (
                  <p className="mt-2 text-xs text-amber-700">
                    El teléfono del lead no parece válido para WhatsApp. Edítalo en la pestaña de información.
                  </p>
                )}
              </div>
            </section>
          ) : activeTab === "activity" ? (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                Historial de movimientos del lead
              </h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-stone-200/90 bg-stone-50/60 p-3">
                  <label className="mb-1.5 block text-xs text-slate-600" style={{ fontWeight: 600 }}>
                    Añadir comentario
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <textarea
                      rows={2}
                      value={activityComment}
                      onChange={(e) => setActivityComment(e.target.value)}
                      className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400"
                      placeholder="Escribe un comentario sobre este lead..."
                    />
                    <Button
                      type="button"
                      className="bg-primary text-primary-foreground hover:bg-brand-red-hover sm:self-end"
                      onClick={handleAddActivityComment}
                    >
                      Agregar comentario
                    </Button>
                  </div>
                </div>
                {sortedActivity.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center text-sm text-slate-500">
                    Sin actividad registrada.
                  </p>
                ) : (
                  <div className="relative pl-8">
                    <div className="absolute bottom-3 left-[15px] top-3 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                    <div className="space-y-4">
                      {sortedActivity.map((entry) => {
                        const statusLabel = labelForLeadStatus(
                          entry.status ?? d.status,
                          statusOptions.map((o) => ({ id: o.value, label: o.label }))
                        );
                        const timelineMeta: Record<
                          "created" | "status_change" | "updated" | "comment",
                          { title: string; icon: typeof History; iconClassName: string; badgeClassName: string }
                        > = {
                          created: {
                            title: "Lead creado",
                            icon: Plus,
                            iconClassName: "text-emerald-600",
                            badgeClassName: "bg-emerald-100 text-emerald-700",
                          },
                          status_change: {
                            title: "Cambio de estado",
                            icon: Tag,
                            iconClassName: "text-primary",
                            badgeClassName: "bg-primary/10 text-primary",
                          },
                          updated: {
                            title: "Información actualizada",
                            icon: History,
                            iconClassName: "text-amber-700",
                            badgeClassName: "bg-amber-100 text-amber-700",
                          },
                          comment: {
                            title: "Comentario",
                            icon: MessageCircle,
                            iconClassName: "text-brand-navy",
                            badgeClassName: "bg-brand-navy/10 text-brand-navy",
                          },
                        };
                        const meta = timelineMeta[entry.type];
                        const Icon = meta.icon;

                        return (
                          <article key={entry.id} className="relative rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 shadow-sm">
                            <span className="absolute -left-8 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm">
                              <Icon className={cn("h-3.5 w-3.5", meta.iconClassName)} strokeWidth={2} />
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm text-brand-navy" style={{ fontWeight: 700 }}>
                                {meta.title}
                              </p>
                              <span className={cn("rounded-full px-2 py-0.5 text-[11px]", meta.badgeClassName)}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-slate-700">{entry.description}</p>
                            <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatLeadDate(entry.createdAt)}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : editing && draft ? (
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
                    Propiedad o desarrollo relacionado
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        Propiedad
                      </Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="search"
                          value={propertySearchQuery}
                          onChange={(e) => setPropertySearchQuery(e.target.value)}
                          placeholder="Buscar propiedad…"
                          className="mb-2 h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-brand-navy focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300/80"
                        />
                      </div>
                      <select
                        value={draft.relatedPropertyId ?? ""}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, relatedPropertyId: e.target.value || undefined } : d))
                        }
                        className={leadFieldClass}
                        style={{ fontWeight: 500 }}
                      >
                        <option value="">Sin propiedad</option>
                        {filteredProperties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                        Desarrollo
                      </Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="search"
                          value={developmentSearchQuery}
                          onChange={(e) => setDevelopmentSearchQuery(e.target.value)}
                          placeholder="Buscar desarrollo…"
                          className="mb-2 h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-brand-navy focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300/80"
                        />
                      </div>
                      <select
                        value={draft.relatedDevelopmentId ?? ""}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, relatedDevelopmentId: e.target.value || undefined } : d))
                        }
                        className={leadFieldClass}
                        style={{ fontWeight: 500 }}
                      >
                        <option value="">Sin desarrollo</option>
                        {filteredDevelopments.map((dev) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.name}
                          </option>
                        ))}
                      </select>
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
                      className="h-8 border-stone-300 bg-white text-xs text-slate-700 hover:bg-stone-50 hover:text-slate-800"
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
                      {assigneeSelectOptions.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    {assigneeProfileOpen && assigneeTeamUser ? (
                      <button
                        type="button"
                        className="mt-2 text-left text-xs font-semibold text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary/90"
                        style={{ fontWeight: 600 }}
                        onClick={() => onViewTeamMember?.(assigneeTeamUser.id)}
                      >
                        Ver ficha de {assigneeTeamUser.name}
                      </button>
                    ) : null}
                  </div>
                </section>
              </aside>
            </div>
          ) : (
            <div className="flex flex-col gap-6 text-sm lg:gap-8">
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

                  <div className="grid grid-cols-1 gap-6">
                    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                      <div className="border-b border-stone-100 pb-3">
                        <h3 className="text-base text-brand-navy" style={{ fontWeight: 700 }}>
                          Propiedad o desarrollo relacionado
                        </h3>
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedProperty ? (
                          <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm lg:flex-row lg:items-stretch">
                            <div className="w-full min-w-0 lg:w-[70%] lg:max-w-[70%] lg:flex-[0_0_70%]">
                              <div className="aspect-[16/9] w-full min-w-0 bg-stone-100 lg:flex lg:min-h-[220px] lg:h-full lg:aspect-auto">
                                {selectedProperty.image ? (
                                  <img
                                    src={selectedProperty.image}
                                    alt={selectedProperty.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full min-h-[160px] w-full items-center justify-center text-xs text-slate-500 lg:min-h-[220px]">
                                    Sin imagen
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex w-full min-w-0 flex-col justify-start gap-0 border-t border-stone-200/80 p-4 sm:p-5 lg:w-[30%] lg:max-w-[30%] lg:flex-[0_0_30%] lg:border-l lg:border-t-0">
                              <div className="min-w-0 break-words">
                                <p className="text-sm font-semibold text-brand-navy">{selectedProperty.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {selectedProperty.location || "Ubicación no definida"}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  {selectedProperty.status === "alquiler" ? "Alquiler" : "Venta"} ·{" "}
                                  {selectedProperty.type || "Tipo no definido"}
                                </p>
                                <p className="mt-1.5 text-sm font-semibold text-primary">
                                  ${Number(selectedProperty.price || 0).toLocaleString("es-MX")}
                                </p>
                              </div>
                              <div className="mt-4 border-t border-stone-200/80 pt-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Desarrollo
                                </p>
                                <p className="mt-1.5 text-sm text-brand-navy" style={{ fontWeight: 600 }}>
                                  {selectedDevelopment?.name ?? "Sin desarrollo vinculado"}
                                </p>
                              </div>
                            </div>
                          </article>
                        ) : (
                          <>
                            <p className="rounded-xl bg-gradient-to-b from-stone-50/90 to-stone-50/40 px-3 py-3 text-sm text-slate-500 ring-1 ring-stone-200/70 sm:px-4 sm:py-3.5">
                              Sin propiedad vinculada
                            </p>
                            <div className="rounded-xl bg-gradient-to-b from-stone-50/90 to-stone-50/40 px-3 py-3 ring-1 ring-stone-200/70 sm:px-4 sm:py-3.5">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Desarrollo
                              </p>
                              <p className="mt-1.5 text-sm text-brand-navy" style={{ fontWeight: 600 }}>
                                {selectedDevelopment?.name ?? "Sin desarrollo vinculado"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                  </div>
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
                        {assigneeProfileOpen && assigneeTeamUser ? (
                          <button
                            type="button"
                            className="truncate text-left text-lg font-bold text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary/90"
                            style={{ fontWeight: 700 }}
                            onClick={() => onViewTeamMember?.(assigneeTeamUser.id)}
                          >
                            {d.assignedTo}
                          </button>
                        ) : (
                          <p className="truncate text-lg font-bold text-brand-navy">{d.assignedTo}</p>
                        )}
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
            {canOpenClientProfile && (
              <Button
                type="button"
                variant="outline"
                className="border-stone-300 bg-white text-brand-navy hover:bg-stone-50 hover:!text-brand-navy"
                onClick={() => onRegisterClientFromLead(d)}
              >
                <UserCircle2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Abrir perfil en Clientes
              </Button>
            )}
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {activeTab === "activity" || activeTab === "contact" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="border-stone-300 bg-white text-slate-700 hover:bg-stone-50 hover:text-slate-800"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  className="bg-primary hover:bg-brand-red-hover text-primary-foreground"
                  onClick={handleSave}
                >
                  Guardar cambios
                </Button>
              </>
            ) : editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="border-stone-300 bg-white text-slate-700 hover:bg-stone-50 hover:text-slate-800"
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
                  className="border-stone-300 bg-white text-slate-700 hover:bg-stone-50 hover:text-slate-800"
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

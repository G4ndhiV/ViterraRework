import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  History,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { labelForLeadStatus, newLeadActivityId, newLeadClientNoteId } from "../../data/leads";
import { CRM_ASSIGNEES, resolveAssigneeName } from "../../data/crmAssignees";
import { LeadPriorityBadge } from "./LeadPriorityBadge";
import { LeadPriorityStarsInput } from "./LeadPriorityStarsInput";
import { cn } from "../ui/utils";
import { foldSearchText } from "../../lib/searchText";

/* ───────────────────────── Sistema de diseño «Dossier» ─────────────────────────
   Editorial / lujo inmobiliario: papel marfil, tinta navy, oro y burdeos como
   acentos, reglas a 1px y Cormorant Garamond para los titulares.                */
const serif: CSSProperties = { fontFamily: "var(--font-hero-display)" };

const leadFieldClass =
  "w-full rounded-[3px] border border-[#ded6c3] bg-[#fcfbf7] px-3.5 py-2.5 text-sm text-[#141c2e] transition-colors placeholder:text-[#a8a08c] focus:border-[#9a7b4f] focus:outline-none focus:ring-1 focus:ring-[#9a7b4f]/40";

const cardClass = "rounded-[4px] border border-[#e6dfce] bg-white shadow-[0_1px_0_rgba(20,28,46,0.02),0_18px_40px_-32px_rgba(20,28,46,0.5)]";

function reveal(delayMs: number): CSSProperties {
  return { animationDelay: `${delayMs}ms`, animationFillMode: "both" };
}

/** Divisor editorial: rombo dorado + etiqueta versalita + regla fina. */
function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-[7px] w-[7px] rotate-45 bg-[#9a7b4f]" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6750]">
        {children}
      </span>
      <span className="h-px flex-1 bg-[#e2dbc9]" aria-hidden />
    </div>
  );
}

function CardEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a7b4f]">{children}</p>
  );
}

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
  const assigneePicture = assigneeTeamUser?.profile?.picture?.trim() || "";

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

  const tabDef: { id: "info" | "activity" | "contact"; label: string; icon?: typeof History }[] = [
    { id: "info", label: "Información" },
    { id: "activity", label: "Actividad", icon: History },
    { id: "contact", label: "Contacto", icon: MessageCircle },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={lead.id}>
      <DialogContent
        hideCloseButton
        className={cn(
          "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none duration-200",
          "bg-[#f4f1ea]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 sm:!max-w-none"
        )}
      >
        {/* ───────── Cabecera: banda navy editorial ───────── */}
        <div className="relative shrink-0 overflow-hidden border-b border-black/30 bg-[#141c2e] px-4 py-5 sm:px-8 sm:py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(130% 150% at 10% -30%, rgba(154,123,79,0.22), transparent 55%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(127,29,29,0.30), transparent 70%)" }}
          />
          <DialogHeader className="relative gap-0 p-0 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c8ad84]">
                <span className="h-[5px] w-[5px] rotate-45 bg-[#c8ad84]" aria-hidden />
                CRM · {editing ? "Edición de lead" : "Detalle de lead"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#e0a3a3]/25 bg-transparent px-3.5 py-2 text-xs font-semibold text-[#e3a7a7] transition-colors hover:bg-[#7f1d1d]/35 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.85} />
                  Eliminar
                </button>
                {activeTab === "activity" || activeTab === "contact" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-white/20 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.12] hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.85} />
                      Regresar
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-transparent bg-[#9a7b4f] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#86683f]"
                    >
                      Guardar cambios
                    </button>
                  </>
                ) : editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft({ ...lead });
                        setEditing(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-white/20 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.12] hover:text-white"
                    >
                      Cancelar edición
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-transparent bg-[#9a7b4f] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#86683f]"
                    >
                      Guardar cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-white/20 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.12] hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.85} />
                      Regresar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-transparent bg-[#9a7b4f] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#86683f]"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.85} />
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              {/* Nombre */}
              <div className="min-w-0">
                {canOpenClientProfile ? (
                  <button
                    type="button"
                    onClick={() => onRegisterClientFromLead(d)}
                    className="group inline-flex max-w-full items-center gap-2 truncate text-left text-[#f4f1ea] transition-colors hover:text-white focus-visible:outline-none"
                    title="Abrir la ficha del cliente"
                  >
                    <span
                      style={serif}
                      className="truncate text-4xl font-medium leading-[1.05] tracking-tight decoration-[#9a7b4f]/70 underline-offset-[6px] group-hover:underline sm:text-[2.85rem]"
                    >
                      {d.name}
                    </span>
                  </button>
                ) : (
                  <DialogTitle
                    style={serif}
                    className="truncate text-4xl font-medium leading-[1.05] tracking-tight text-[#f4f1ea] sm:text-[2.85rem]"
                  >
                    {d.name}
                  </DialogTitle>
                )}
              </div>

              {/* Pestañas */}
              <div className="justify-self-start lg:justify-self-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1 backdrop-blur-sm">
                  {tabDef.map((t) => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all",
                          active
                            ? "bg-[#f4f1ea] text-[#141c2e] shadow-sm"
                            : "text-white/65 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={1.9} /> : null}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estado */}
              <div className="w-full max-w-[15rem] justify-self-start lg:justify-self-end">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8ad84]">
                  Estado
                </label>
                <div className="relative">
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
                    className="w-full appearance-none rounded-[3px] border border-white/15 bg-white/[0.08] px-3.5 py-2 pr-9 text-sm font-semibold text-white transition-colors focus:border-[#9a7b4f] focus:outline-none focus:ring-1 focus:ring-[#9a7b4f]/50"
                    aria-label="Cambiar estado del lead"
                  >
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value} className="text-[#141c2e]">
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c8ad84]" strokeWidth={2} />
                </div>
              </div>
            </div>
            <DialogDescription className="sr-only">
              Lead {d.name}, estado{" "}
              {labelForLeadStatus(d.status, statusOptions.map((o) => ({ id: o.value, label: o.label })))}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ───────── Cuerpo ───────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
            <div className="mx-auto w-full max-w-[min(100%,84rem)]">
              {activeTab === "contact" ? (
                /* ───── Pestaña Contacto ───── */
                <section className={cn("mx-auto w-full max-w-3xl p-6 sm:p-8", cardClass, "animate-in fade-in slide-in-from-bottom-2 duration-500")}>
                  <CardEyebrow>Contacto directo</CardEyebrow>
                  <h3 style={serif} className="mt-1 text-3xl font-medium text-[#141c2e]">
                    Escribir por WhatsApp
                  </h3>
                  <div className="mt-6 rounded-[4px] border border-[#e6dfce] bg-[#faf7f0] p-5">
                    <CardEyebrow>Cliente</CardEyebrow>
                    <p className="mt-1.5 text-xl text-[#141c2e]" style={{ fontWeight: 700 }}>
                      {canOpenClientProfile ? (
                        <button
                          type="button"
                          onClick={() => onRegisterClientFromLead(d)}
                          className="inline-flex items-center gap-1.5 rounded-md text-left text-[#7f1d1d] underline decoration-[#9a7b4f]/45 underline-offset-4 transition-colors hover:text-[#a00d25]"
                          style={{ fontWeight: 700 }}
                          title="Abrir la ficha del cliente"
                        >
                          {d.name}
                        </button>
                      ) : (
                        d.name
                      )}
                    </p>
                    <p className="mt-3 text-sm text-[#5a5446]">
                      Teléfono: <span className="font-semibold tabular-nums text-[#141c2e]">{d.phone}</span>
                    </p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a7b4f]">
                      Mensaje sugerido
                    </p>
                    <p className="mt-1.5 rounded-[3px] border border-[#e6dfce] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#3f3a30]">
                      {whatsappMessage}
                    </p>
                  </div>
                  <div className="mt-6">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-sm font-semibold text-white transition-colors",
                        whatsappDigits.length >= 8
                          ? "bg-[#25D366] hover:bg-[#1fb458]"
                          : "pointer-events-none bg-slate-300"
                      )}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Abrir WhatsApp
                    </a>
                    {whatsappDigits.length < 8 && (
                      <p className="mt-2 text-xs text-[#7f1d1d]">
                        El teléfono del lead no parece válido para WhatsApp. Edítalo en la pestaña de información.
                      </p>
                    )}
                  </div>
                </section>
              ) : activeTab === "activity" ? (
                /* ───── Pestaña Actividad ───── */
                <section className={cn("mx-auto w-full max-w-5xl p-6 sm:p-8", cardClass, "animate-in fade-in slide-in-from-bottom-2 duration-500")}>
                  <CardEyebrow>Bitácora</CardEyebrow>
                  <h3 style={serif} className="mt-1 text-3xl font-medium text-[#141c2e]">
                    Historial del lead
                  </h3>
                  <div className="mt-6 space-y-5">
                    <div className="rounded-[4px] border border-[#e6dfce] bg-[#faf7f0] p-4">
                      <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7b4f]">
                        Añadir comentario
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <textarea
                          rows={2}
                          value={activityComment}
                          onChange={(e) => setActivityComment(e.target.value)}
                          className={cn(leadFieldClass, "flex-1 bg-white")}
                          placeholder="Escribe un comentario sobre este lead..."
                        />
                        <Button
                          type="button"
                          className="bg-[#141c2e] text-[#f4f1ea] hover:bg-[#23314f] sm:self-end"
                          onClick={handleAddActivityComment}
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                    {sortedActivity.length === 0 ? (
                      <p className="rounded-[4px] border border-dashed border-[#ded6c3] bg-[#faf7f0] px-4 py-10 text-center text-sm text-[#8a8268]">
                        Sin actividad registrada.
                      </p>
                    ) : (
                      <div className="relative pl-8">
                        <div className="absolute bottom-3 left-[13px] top-3 w-px bg-gradient-to-b from-[#9a7b4f]/60 via-[#9a7b4f]/25 to-transparent" />
                        <div className="space-y-4">
                          {sortedActivity.map((entry, i) => {
                            const statusLabel = labelForLeadStatus(
                              entry.status ?? d.status,
                              statusOptions.map((o) => ({ id: o.value, label: o.label }))
                            );
                            const timelineMeta: Record<
                              "created" | "status_change" | "updated" | "comment",
                              { title: string; icon: typeof History; iconClassName: string }
                            > = {
                              created: { title: "Lead creado", icon: Plus, iconClassName: "text-emerald-700" },
                              status_change: { title: "Cambio de estado", icon: Tag, iconClassName: "text-[#7f1d1d]" },
                              updated: { title: "Información actualizada", icon: History, iconClassName: "text-[#9a7b4f]" },
                              comment: { title: "Comentario", icon: MessageCircle, iconClassName: "text-[#141c2e]" },
                            };
                            const meta = timelineMeta[entry.type];
                            const Icon = meta.icon;

                            return (
                              <article
                                key={entry.id}
                                style={reveal(i * 45)}
                                className="relative rounded-[4px] border border-[#e6dfce] bg-[#fcfbf7] p-4 animate-in fade-in slide-in-from-bottom-1 duration-500"
                              >
                                <span className="absolute -left-8 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e6dfce] bg-white shadow-sm">
                                  <Icon className={cn("h-3.5 w-3.5", meta.iconClassName)} strokeWidth={2} />
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm text-[#141c2e]" style={{ fontWeight: 700 }}>
                                    {meta.title}
                                  </p>
                                  <span className="rounded-full border border-[#e2dbc9] bg-[#f4f1ea] px-2 py-0.5 text-[11px] font-medium text-[#6f6750]">
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-sm leading-relaxed text-[#4a4536]">{entry.description}</p>
                                <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs tabular-nums text-[#8a8268]">
                                  <Calendar className="h-3.5 w-3.5 text-[#9a7b4f]" />
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
                /* ───── Modo edición ───── */
                <div className="grid grid-cols-1 gap-6 text-sm lg:grid-cols-12 lg:items-start lg:gap-8">
                  <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
                    <section className={cn("p-5 sm:p-6", cardClass)} style={reveal(0)}>
                      <CardEyebrow>Fase del embudo</CardEyebrow>
                      <div className="mt-3">
                        <Label className="sr-only">Estado del lead</Label>
                        <select
                          value={
                            statusOptions.some((o) => o.value === draft.status)
                              ? draft.status
                              : statusOptions[0]?.value ?? draft.status
                          }
                          onChange={(e) => setDraft((dd) => (dd ? { ...dd, status: e.target.value } : dd))}
                          className={leadFieldClass}
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

                    <section className={cn("p-5 sm:p-6", cardClass)} style={reveal(60)}>
                      <CardEyebrow>Contacto</CardEyebrow>
                      <h3 style={serif} className="mt-0.5 text-2xl font-medium text-[#141c2e]">Datos del cliente</h3>
                      <div className="mt-4 space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Nombre completo</Label>
                          <input
                            value={draft.name}
                            onChange={(e) => setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                            className={leadFieldClass}
                            style={{ fontWeight: 500 }}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Correo</Label>
                            <input
                              type="email"
                              value={draft.email}
                              onChange={(e) => setDraft((dd) => (dd ? { ...dd, email: e.target.value } : dd))}
                              className={leadFieldClass}
                              style={{ fontWeight: 500 }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Teléfono</Label>
                            <input
                              value={draft.phone}
                              onChange={(e) => setDraft((dd) => (dd ? { ...dd, phone: e.target.value } : dd))}
                              className={leadFieldClass}
                              style={{ fontWeight: 500 }}
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className={cn("p-5 sm:p-6", cardClass)} style={reveal(120)}>
                      <CardEyebrow>Inventario</CardEyebrow>
                      <h3 style={serif} className="mt-0.5 text-2xl font-medium text-[#141c2e]">Propiedad o desarrollo</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Propiedad</Label>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a7b4f]" strokeWidth={1.75} />
                            <input
                              type="search"
                              value={propertySearchQuery}
                              onChange={(e) => setPropertySearchQuery(e.target.value)}
                              placeholder="Buscar propiedad…"
                              className={cn(leadFieldClass, "mb-2 h-9 py-0 pl-9")}
                            />
                          </div>
                          <select
                            value={draft.relatedPropertyId ?? ""}
                            onChange={(e) =>
                              setDraft((dd) => (dd ? { ...dd, relatedPropertyId: e.target.value || undefined } : dd))
                            }
                            className={leadFieldClass}
                            style={{ fontWeight: 500 }}
                          >
                            <option value="">Sin propiedad</option>
                            {filteredProperties.map((p) => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Desarrollo</Label>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a7b4f]" strokeWidth={1.75} />
                            <input
                              type="search"
                              value={developmentSearchQuery}
                              onChange={(e) => setDevelopmentSearchQuery(e.target.value)}
                              placeholder="Buscar desarrollo…"
                              className={cn(leadFieldClass, "mb-2 h-9 py-0 pl-9")}
                            />
                          </div>
                          <select
                            value={draft.relatedDevelopmentId ?? ""}
                            onChange={(e) =>
                              setDraft((dd) => (dd ? { ...dd, relatedDevelopmentId: e.target.value || undefined } : dd))
                            }
                            className={leadFieldClass}
                            style={{ fontWeight: 500 }}
                          >
                            <option value="">Sin desarrollo</option>
                            {filteredDevelopments.map((dev) => (
                              <option key={dev.id} value={dev.id}>{dev.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className={cn("p-5 sm:p-6", cardClass)} style={reveal(180)}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardEyebrow>Seguimiento</CardEyebrow>
                          <h3 style={serif} className="mt-0.5 text-2xl font-medium text-[#141c2e]">Notas del cliente</h3>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#d8cfbd] bg-white text-xs text-[#141c2e] hover:bg-[#f0ebde] hover:!text-[#141c2e]"
                          onClick={() =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    clientNotes: [
                                      ...prev.clientNotes,
                                      { id: newLeadClientNoteId(), date: new Date().toISOString().slice(0, 10), body: "" },
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
                      <p className="mt-1.5 text-xs text-[#8a8268]">
                        Cada nota tiene su propia fecha; puedes registrar reuniones, llamadas o acuerdos.
                      </p>
                      <div className="mt-4 space-y-4">
                        {draft.clientNotes.length === 0 ? (
                          <p className="rounded-[4px] border border-dashed border-[#ded6c3] bg-[#faf7f0] px-4 py-8 text-center text-sm text-[#8a8268]">
                            Aún no hay notas. Pulsa «Añadir nota» para crear la primera.
                          </p>
                        ) : (
                          draft.clientNotes.map((note) => (
                            <div key={note.id} className="rounded-[4px] border border-[#e6dfce] bg-[#fcfbf7] p-4">
                              <div className="flex flex-wrap items-end justify-between gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Fecha</Label>
                                  <input
                                    type="date"
                                    value={note.date.slice(0, 10)}
                                    onChange={(e) =>
                                      setDraft((dd) =>
                                        dd
                                          ? {
                                              ...dd,
                                              clientNotes: dd.clientNotes.map((n) =>
                                                n.id === note.id ? { ...n, date: e.target.value } : n
                                              ),
                                            }
                                          : dd
                                      )
                                    }
                                    className={cn(leadFieldClass, "w-auto min-w-[10rem]")}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-[#8a8268] hover:bg-[#7f1d1d]/8 hover:text-[#7f1d1d]"
                                  onClick={() =>
                                    setDraft((dd) =>
                                      dd ? { ...dd, clientNotes: dd.clientNotes.filter((n) => n.id !== note.id) } : dd
                                    )
                                  }
                                  aria-label="Eliminar nota"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </Button>
                              </div>
                              <div className="mt-3 space-y-1.5">
                                <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Contenido</Label>
                                <textarea
                                  rows={4}
                                  value={note.body}
                                  onChange={(e) =>
                                    setDraft((dd) =>
                                      dd
                                        ? {
                                            ...dd,
                                            clientNotes: dd.clientNotes.map((n) =>
                                              n.id === note.id ? { ...n, body: e.target.value } : n
                                            ),
                                          }
                                        : dd
                                    )
                                  }
                                  className={cn(leadFieldClass, "min-h-[88px] resize-y bg-white")}
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

                  <aside className="flex flex-col gap-6 lg:sticky lg:top-1 lg:col-span-5 xl:col-span-4">
                    <section
                      className={cn("p-5 sm:p-6", cardClass)}
                      style={reveal(90)}
                      title="De 1 a 6 estrellas; más estrellas = mayor urgencia de seguimiento."
                    >
                      <CardEyebrow>Prioridad</CardEyebrow>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <LeadPriorityStarsInput
                          value={draft.priorityStars}
                          onChange={(v: LeadPriorityStars) =>
                            setDraft((prev) => (prev ? { ...prev, priorityStars: v } : prev))
                          }
                          size="md"
                        />
                        <span className="rounded-[3px] border border-[#e6dfce] bg-[#faf7f0] px-2 py-0.5 text-xs tabular-nums text-[#6f6750]" style={{ fontWeight: 600 }}>
                          {draft.priorityStars}/6
                        </span>
                      </div>
                    </section>

                    <section className={cn("p-5 sm:p-6", cardClass)} style={reveal(150)}>
                      <CardEyebrow>Asignación</CardEyebrow>
                      <div className="mt-4 space-y-1.5">
                        <Label className="text-xs text-[#8a8268]" style={{ fontWeight: 500 }}>Asignado a</Label>
                        <select
                          value={draft.assignedToUserId}
                          onChange={(e) => setDraft((dd) => (dd ? { ...dd, assignedToUserId: e.target.value } : dd))}
                          className={leadFieldClass}
                          style={{ fontWeight: 500 }}
                        >
                          {assigneeSelectOptions.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                        {assigneeProfileOpen && assigneeTeamUser ? (
                          <button
                            type="button"
                            className="mt-2 text-left text-xs font-semibold text-[#7f1d1d] underline decoration-[#9a7b4f]/50 underline-offset-2 hover:text-[#a00d25]"
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
                /* ───── Vista de detalle (info) ───── */
                <div className="grid grid-cols-1 items-start gap-8 text-sm lg:grid-cols-12 lg:gap-10">
                  <main className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
                    <SectionLabel className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                      Contacto y oferta
                    </SectionLabel>

                    {/* Contacto */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <section
                        style={reveal(60)}
                        className={cn(
                          "group relative overflow-hidden p-5 animate-in fade-in slide-in-from-bottom-2 duration-500",
                          cardClass
                        )}
                      >
                        <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[#7f1d1d]" />
                        <div className="flex items-start gap-4 pl-1.5">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-[#7f1d1d]/15 bg-[#7f1d1d]/[0.07] text-[#7f1d1d]">
                            <Mail className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <CardEyebrow>Correo</CardEyebrow>
                            <a
                              href={`mailto:${encodeURIComponent(d.email)}`}
                              className="mt-1.5 block break-all text-[15px] text-[#141c2e] transition-colors hover:text-[#7f1d1d] hover:underline"
                              style={{ fontWeight: 600 }}
                            >
                              {d.email || "—"}
                            </a>
                          </div>
                        </div>
                      </section>
                      <section
                        style={reveal(120)}
                        className={cn(
                          "group relative overflow-hidden p-5 animate-in fade-in slide-in-from-bottom-2 duration-500",
                          cardClass
                        )}
                      >
                        <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[#141c2e]" />
                        <div className="flex items-start gap-4 pl-1.5">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-[#141c2e]/12 bg-[#141c2e]/[0.06] text-[#141c2e]">
                            <Phone className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <CardEyebrow>Teléfono</CardEyebrow>
                            <a
                              href={`tel:${d.phone.replace(/\s/g, "")}`}
                              className="mt-1.5 block text-[15px] tabular-nums text-[#141c2e] transition-colors group-hover:text-[#7f1d1d]"
                              style={{ fontWeight: 600 }}
                            >
                              {d.phone || "—"}
                            </a>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Propiedad / desarrollo */}
                    <section style={reveal(180)} className={cn("overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500", cardClass)}>
                      <div className="border-b border-[#ece5d4] px-5 py-4 sm:px-6">
                        <CardEyebrow>Inventario vinculado</CardEyebrow>
                        <h3 style={serif} className="mt-0.5 text-2xl font-medium leading-tight text-[#141c2e]">
                          Propiedad o desarrollo
                        </h3>
                      </div>
                      <div className="p-5 sm:p-6">
                        {selectedProperty ? (
                          <article className="flex flex-col overflow-hidden rounded-[4px] border border-[#e6dfce] bg-white lg:flex-row lg:items-stretch">
                            <div className="w-full min-w-0 lg:w-[64%] lg:flex-[0_0_64%]">
                              <div className="aspect-[16/10] w-full overflow-hidden bg-[#ece5d4] lg:h-full lg:aspect-auto lg:min-h-[260px]">
                                {selectedProperty.image ? (
                                  <img
                                    src={selectedProperty.image}
                                    alt={selectedProperty.title}
                                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full min-h-[180px] w-full items-center justify-center text-xs text-[#8a8268]">
                                    Sin imagen
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex w-full min-w-0 flex-col border-t border-[#e6dfce] p-5 lg:w-[36%] lg:flex-[0_0_36%] lg:border-l lg:border-t-0">
                              <p className="text-[15px] font-semibold leading-snug text-[#141c2e]">{selectedProperty.title}</p>
                              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#6f6750]">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9a7b4f]" strokeWidth={1.75} />
                                {selectedProperty.location || "Ubicación no definida"}
                              </p>
                              <p className="mt-1 text-xs text-[#6f6750]">
                                {selectedProperty.status === "alquiler" ? "Renta" : "Venta"} ·{" "}
                                {selectedProperty.type || "Tipo no definido"}
                              </p>
                              <p className="mt-3 text-xl font-bold tabular-nums tracking-tight text-[#7f1d1d]">
                                ${Number(selectedProperty.price || 0).toLocaleString("es-MX")}
                              </p>
                              <div className="mt-auto border-t border-[#ece5d4] pt-4">
                                <CardEyebrow>Desarrollo</CardEyebrow>
                                <p className="mt-1 text-sm text-[#141c2e]" style={{ fontWeight: 600 }}>
                                  {selectedDevelopment?.name ?? "Sin desarrollo vinculado"}
                                </p>
                              </div>
                            </div>
                          </article>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-[4px] border border-dashed border-[#ded6c3] bg-[#faf7f0] px-4 py-5 text-sm text-[#8a8268]">
                              <Building2 className="h-4 w-4 shrink-0 text-[#bcae90]" strokeWidth={1.6} />
                              Sin propiedad vinculada
                            </div>
                            <div className="rounded-[4px] border border-[#e6dfce] bg-[#faf7f0] px-4 py-4">
                              <CardEyebrow>Desarrollo</CardEyebrow>
                              <p className="mt-1 text-sm text-[#141c2e]" style={{ fontWeight: 600 }}>
                                {selectedDevelopment?.name ?? "Sin desarrollo vinculado"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </main>

                  {/* Sidebar: Seguimiento (dossier) */}
                  <aside className="flex flex-col lg:sticky lg:top-1 lg:col-span-5 xl:col-span-4">
                    <SectionLabel className="mb-4 animate-in fade-in slide-in-from-bottom-1 duration-500">
                      Seguimiento
                    </SectionLabel>
                    <div style={reveal(150)} className={cn("overflow-hidden animate-in fade-in slide-in-from-right-2 duration-500", cardClass)}>
                      {/* Prioridad */}
                      <div
                        className="border-b border-[#ece5d4] bg-gradient-to-br from-[#9a7b4f]/[0.08] to-transparent p-5 sm:p-6"
                        title="Prioridad del 1 al 6 (estrellas de izquierda a derecha)"
                      >
                        <CardEyebrow>Prioridad</CardEyebrow>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <LeadPriorityBadge stars={d.priorityStars} size="md" />
                          <span className="rounded-[3px] border border-[#e6dfce] bg-white/80 px-2.5 py-1 text-xs tabular-nums text-[#3f3a30] shadow-sm" style={{ fontWeight: 700 }}>
                            {d.priorityStars}/6
                          </span>
                        </div>
                      </div>

                      {/* Origen */}
                      <div className="border-b border-[#ece5d4] px-5 py-5 sm:px-6">
                        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a7b4f]">
                          <Tag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                          Origen
                        </p>
                        <p style={serif} className="mt-1.5 text-2xl font-medium text-[#141c2e]">{d.source || "—"}</p>
                      </div>

                      {/* Fechas clave — ledger */}
                      <div className="border-b border-[#ece5d4] px-5 py-5 sm:px-6">
                        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a7b4f]">
                          <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                          Fechas clave
                        </p>
                        <dl className="mt-4">
                          {[
                            { label: "Registro", date: formatLeadDate(d.createdAt), accent: true },
                            { label: "Último contacto", date: formatLeadDate(d.lastContact), accent: false },
                            { label: "Actualizado", date: formatLeadDate(d.updatedAt ?? d.lastContact), accent: false },
                          ].map((row, i, arr) => (
                            <div
                              key={row.label}
                              className={cn(
                                "flex items-baseline justify-between gap-4 py-2.5",
                                i < arr.length - 1 && "border-b border-dashed border-[#e6dfce]"
                              )}
                            >
                              <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#8a8268]">
                                <span
                                  className={cn("h-1.5 w-1.5 rotate-45", row.accent ? "bg-[#7f1d1d]" : "bg-[#cdbf9f]")}
                                  aria-hidden
                                />
                                {row.label}
                              </dt>
                              <dd className="text-sm tabular-nums text-[#141c2e]" style={{ fontWeight: 700 }}>{row.date}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      {/* Asignado */}
                      <div className="flex items-center gap-4 bg-[#faf7f0] px-5 py-5 sm:px-6">
                        {assigneePicture ? (
                          <img
                            src={assigneePicture}
                            alt={d.assignedTo}
                            className="h-14 w-14 shrink-0 rounded-[4px] object-cover shadow-[0_8px_20px_-10px_rgba(20,28,46,0.8)] ring-1 ring-[#9a7b4f]/60"
                            loading="lazy"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <CardEyebrow>Asignado a</CardEyebrow>
                          {assigneeProfileOpen && assigneeTeamUser ? (
                            <button
                              type="button"
                              style={serif}
                              className="truncate text-left text-xl font-medium text-[#7f1d1d] underline decoration-[#9a7b4f]/50 underline-offset-2 hover:text-[#a00d25]"
                              onClick={() => onViewTeamMember?.(assigneeTeamUser.id)}
                            >
                              {d.assignedTo}
                            </button>
                          ) : (
                            <p style={serif} className="mt-0.5 truncate text-xl font-medium text-[#141c2e]">{d.assignedTo}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

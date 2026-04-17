import { useMemo, useCallback, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { MapPin, Plus } from "lucide-react";
import type { Lead } from "../../data/leads";
import { LeadPriorityBadge } from "./LeadPriorityBadge";

const LEAD_ITEM = "VITERRA_LEAD_CARD";

/** Mismo patrón + acento que el antiguo bloque superior del tablero. */
const KANBAN_CARD_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

type Props = {
  leads: Lead[];
  /** Orden de columnas: etapas incorporadas + ids personalizados. */
  columnStatuses: string[];
  statusLabel: (status: string) => string;
  onStatusChange: (leadId: string, status: string) => void;
  onLeadOpen?: (lead: Lead) => void;
  canAddStage?: boolean;
  onAddStage?: (label: string) => void;
};

function DraggableLeadCard({
  lead,
  onOpenDetail,
}: {
  lead: Lead;
  onOpenDetail?: (lead: Lead) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: LEAD_ITEM,
      item: { id: lead.id },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [lead.id]
  );

  return (
    <div
      ref={dragRef}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 active:cursor-grabbing ${
        isDragging ? "scale-[0.98] opacity-60 shadow-lg" : "hover:border-slate-300/90 hover:shadow-md"
      }`}
      onClick={() => onOpenDetail?.(lead)}
      title={`Abrir detalle de ${lead.name}`}
    >
      {/* Cabecera: solo aquí patrón navy + franja de acento */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#182236] to-brand-navy px-3.5 pb-3 pt-3 pr-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: KANBAN_CARD_PATTERN }}
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
          aria-hidden
        />
        <div className="relative">
          <p className="font-heading text-sm font-semibold leading-snug text-white" style={{ fontWeight: 600 }}>
            {lead.name}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/75" style={{ fontWeight: 500 }}>
            <span className="capitalize">{lead.interest}</span>
            <span className="text-white/40"> · </span>
            {lead.propertyType}
          </p>
        </div>
      </div>
      {/* Cuerpo: fondo claro */}
      <div className="border-t border-slate-100/90 bg-white px-3.5 py-2.5">
        <div className="mb-2">
          <LeadPriorityBadge stars={lead.priorityStars} size="sm" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600" style={{ fontWeight: 500 }}>
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-gold/90" strokeWidth={1.5} aria-hidden />
          <span className="truncate underline decoration-primary/80 decoration-1 underline-offset-2">{lead.location}</span>
        </div>
        <p
          className="mt-2 truncate border-t border-slate-100 pt-2 text-[11px] text-slate-500"
          style={{
            fontFamily: 'Perpetua, "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
            fontWeight: 400,
          }}
        >
          Asignado: <span className="font-sans font-medium text-slate-700">{lead.assignedTo}</span>
        </p>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  leadsInColumn,
  onDropLead,
  onLeadOpen,
  statusLabel,
}: {
  status: string;
  leadsInColumn: Lead[];
  onDropLead: (leadId: string, status: string) => void;
  onLeadOpen?: (lead: Lead) => void;
  statusLabel: (s: string) => string;
}) {
  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: LEAD_ITEM,
      drop: (item: { id: string }) => {
        onDropLead(item.id, status);
      },
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [status, onDropLead]
  );

  return (
    <div className="flex w-[min(100%,268px)] shrink-0 flex-col sm:w-[248px]">
      <div className="relative overflow-hidden rounded-t-2xl border border-b-0 border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50/95 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" aria-hidden />
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading flex-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-navy" style={{ fontWeight: 600 }}>
            {statusLabel(status)}
          </span>
          <span
            className="font-heading min-w-[1.5rem] rounded-full bg-white/90 px-2 py-0.5 text-center text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80"
            style={{ fontWeight: 600 }}
          >
            {leadsInColumn.length}
          </span>
        </div>
      </div>
      <div
        ref={dropRef}
        className={`flex min-h-[240px] flex-1 flex-col gap-2.5 rounded-b-2xl border border-slate-200/80 bg-gradient-to-b from-white/90 to-slate-50/40 p-2.5 shadow-[inset_0_1px_2px_rgba(20,28,46,0.04)] transition-colors ${
          isOver ? "bg-primary/[0.04] ring-2 ring-primary/30 ring-offset-2 ring-offset-slate-50/50" : ""
        }`}
      >
        {leadsInColumn.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} onOpenDetail={onLeadOpen} />
        ))}
      </div>
    </div>
  );
}

function AddStagePanel({ onAdd }: { onAdd: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onAdd(t);
    setValue("");
    setOpen(false);
  };

  return (
    <div className="flex w-[min(100%,220px)] shrink-0 flex-col justify-start">
      <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 p-3 shadow-inner">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white py-6 text-center text-xs font-semibold uppercase tracking-[0.12em] text-brand-navy/80 transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-brand-navy"
            style={{ fontWeight: 600 }}
          >
            <Plus className="h-6 w-6 text-primary" strokeWidth={2} />
            Nueva etapa
          </button>
        ) : (
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500" style={{ fontWeight: 600 }}>
              Nombre de la etapa
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
              placeholder="Ej. Propuesta enviada"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-brand-navy placeholder:text-slate-400"
              style={{ fontWeight: 500 }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setValue("");
                }}
                className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                style={{ fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-brand-red-hover"
                style={{ fontWeight: 600 }}
              >
                Crear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LeadsKanbanBoard({
  leads,
  columnStatuses,
  statusLabel,
  onStatusChange,
  onLeadOpen,
  canAddStage,
  onAddStage,
}: Props) {
  const byStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of columnStatuses) {
      map[s] = [];
    }
    const fallback = columnStatuses[0] ?? "nuevo";
    for (const lead of leads) {
      const key = columnStatuses.includes(lead.status) ? lead.status : fallback;
      if (!map[key]) map[key] = [];
      map[key].push(lead);
    }
    return map;
  }, [leads, columnStatuses]);

  const handleDrop = useCallback(
    (leadId: string, newStatus: string) => {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        onStatusChange(leadId, newStatus);
      }
    },
    [leads, onStatusChange]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_16px_48px_-12px_rgba(20,28,46,0.18)] ring-1 ring-black/[0.03]">
        <div className="crm-kanban-scroll bg-gradient-to-b from-brand-canvas/55 via-slate-50/90 to-slate-100/80 px-4 py-5 pb-6 md:px-6">
          <p className="mb-4 text-center text-xs uppercase tracking-[0.28em] text-slate-500" style={{ fontWeight: 600 }}>
            Arrastra las tarjetas entre columnas para actualizar el estado
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1 md:gap-5">
            {columnStatuses.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leadsInColumn={byStatus[status] ?? []}
                onDropLead={handleDrop}
                onLeadOpen={onLeadOpen}
                statusLabel={statusLabel}
              />
            ))}
            {canAddStage && onAddStage ? <AddStagePanel onAdd={onAddStage} /> : null}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

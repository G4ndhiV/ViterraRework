import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import type { Lead } from "../../../data/leads";
import { csvFromRows, downloadCsv, formatMoney } from "../../../lib/kpiCompute";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
}

export function KpiDrilldownDialog({ open, onClose, title, description, leads, onSelectLead }: Props) {
  const handleExport = () => {
    const csv = csvFromRows(
      ["Lead", "Email", "Teléfono", "Etapa", "Asesor", "Presupuesto", "Última actividad"],
      leads.map((l) => ({
        Lead: l.name,
        Email: l.email,
        Teléfono: l.phone,
        Etapa: l.status,
        Asesor: l.assignedTo,
        Presupuesto: l.budget,
        "Última actividad": l.updatedAt ?? l.lastContact ?? l.createdAt,
      }))
    );
    downloadCsv(`drilldown-${title.toLowerCase().replace(/\s+/g, "-")}.csv`, csv);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-h-[80vh] sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{leads.length} leads</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              Cerrar
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Lead</th>
                <th className="px-3 py-2.5">Etapa</th>
                <th className="px-3 py-2.5">Asesor</th>
                <th className="px-3 py-2.5 text-right">Presupuesto</th>
                <th className="px-3 py-2.5">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    Sin coincidencias.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr
                    key={l.id}
                    className={`border-t border-slate-50 ${onSelectLead ? "cursor-pointer hover:bg-slate-50/70" : ""}`}
                    onClick={onSelectLead ? () => onSelectLead(l) : undefined}
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-brand-navy">{l.name}</p>
                      <p className="text-xs text-slate-500">{l.email || l.phone}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{l.status}</td>
                    <td className="px-3 py-2.5 text-slate-700">{l.assignedTo}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      ${formatMoney(Number(l.budget) || 0)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {(l.updatedAt ?? l.lastContact ?? l.createdAt ?? "").slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

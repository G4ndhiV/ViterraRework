import { useEffect } from "react";
import { FileText } from "lucide-react";
import { Switch } from "../../ui/switch";
import type { Development } from "../../../data/developments";
import { previewDevelopmentReferenceCode } from "../../../lib/developmentReferenceCode";
import { isPublicDevelopmentTokkoId } from "../../../lib/developmentTokkoId";
import {
  allowedDeliveryYears,
  coerceDeliveryYearOnStatusChange,
  DELIVERY_YEAR_UNDEFINED,
  deliveryYearHint,
  displayDeliveryYearSelect,
  formatDeliveryYear,
  isDeliveryYearValidForStatus,
  parseDeliveryYear,
} from "../../../lib/developmentDeliveryYear";
import {
  DevelopmentField,
  DevelopmentFieldGrid,
  DevelopmentFormSection,
  developmentFieldClass,
} from "./developmentFormUi";

const statuses: Development["status"][] = ["En Construcción", "Pre-venta", "Disponible", "Próximamente"];

type Props = {
  draft: Development;
  onDraftChange: (patch: Partial<Development>) => void;
  readOnly?: boolean;
};

export function DevelopmentFichaSection({ draft, onDraftChange, readOnly }: Props) {
  const currentYear = new Date().getFullYear();
  const yearOptions = allowedDeliveryYears(draft.status, currentYear);
  const selectValue = displayDeliveryYearSelect(draft.deliveryDate);
  const allowsUndefined =
    draft.status === "En Construcción" || draft.status === "Pre-venta";
  const deliveryTrimmed = draft.deliveryDate.trim() || DELIVERY_YEAR_UNDEFINED;
  const deliveryValid = isDeliveryYearValidForStatus(deliveryTrimmed, draft.status, currentYear);
  const referenceDisplay = previewDevelopmentReferenceCode(
    draft.referenceCode,
    draft.tokkoId,
    draft.id,
  );
  const showTokkoId = isPublicDevelopmentTokkoId(draft.tokkoId);

  useEffect(() => {
    if (readOnly || deliveryValid) return;
    const next = coerceDeliveryYearOnStatusChange(draft.deliveryDate, draft.status, currentYear);
    if (next !== draft.deliveryDate) onDraftChange({ deliveryDate: next });
  }, [draft.status, draft.deliveryDate, deliveryValid, readOnly, currentYear, onDraftChange]);

  return (
    <DevelopmentFormSection
      icon={FileText}
      title="Ficha del desarrollo"
      description="Datos principales visibles en listados y ficha pública."
    >
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-stone-200/90 bg-stone-50/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-brand-navy">Destacar en portada</p>
          <p className="text-[11px] text-slate-500">Aparece en la sección de desarrollos destacados del sitio.</p>
        </div>
        <Switch
          checked={Boolean(draft.featured)}
          disabled={readOnly}
          onCheckedChange={(featured) => onDraftChange({ featured })}
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-stone-200/90 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-brand-navy">Visible en sitio web</p>
          <p className="text-[11px] text-slate-500">Si está desactivado, no se muestra en el catálogo público.</p>
        </div>
        <Switch
          checked={draft.displayOnWeb !== false}
          disabled={readOnly}
          onCheckedChange={(v) => onDraftChange({ displayOnWeb: v })}
        />
      </div>

      <DevelopmentFieldGrid>
        <DevelopmentField label="Nombre" span={2}>
          <input
            required
            className={developmentFieldClass}
            value={draft.name}
            disabled={readOnly}
            placeholder="Ej. Residencial Bosque Real"
            onChange={(e) => onDraftChange({ name: e.target.value })}
          />
        </DevelopmentField>
        <DevelopmentField label="Estatus">
          <select
            className={developmentFieldClass}
            value={draft.status}
            disabled={readOnly}
            onChange={(e) => {
              const status = e.target.value as Development["status"];
              onDraftChange({
                status,
                deliveryDate: coerceDeliveryYearOnStatusChange(draft.deliveryDate, status, currentYear),
              });
            }}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </DevelopmentField>
        <DevelopmentField
          label="Año de entrega"
          hint={deliveryYearHint(draft.status, currentYear)}
        >
          <select
            className={developmentFieldClass}
            value={selectValue}
            disabled={readOnly}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                if (allowsUndefined) onDraftChange({ deliveryDate: DELIVERY_YEAR_UNDEFINED });
                return;
              }
              const y = parseInt(v, 10);
              if (Number.isFinite(y)) onDraftChange({ deliveryDate: formatDeliveryYear(y) });
            }}
          >
            {allowsUndefined ? (
              <option value="">{DELIVERY_YEAR_UNDEFINED}</option>
            ) : (
              <option value="" disabled hidden>
                Seleccionar año
              </option>
            )}
            {yearOptions
              .filter((y): y is number => y != null)
              .map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
          </select>
          {!deliveryValid && !allowsUndefined ? (
            <p className="mt-1 text-[11px] text-amber-700">Selecciona un año válido para este estatus.</p>
          ) : null}
        </DevelopmentField>
        <DevelopmentField
          label="Referencia"
          span={2}
          hint="Código en ficha pública y mensajes de contacto. Se asigna al guardar."
        >
          <input className={developmentFieldClass} value={referenceDisplay} readOnly disabled />
        </DevelopmentField>
        {showTokkoId ? (
          <DevelopmentField label="ID Tokko" span={2} hint="Sincronizado desde Tokko; no se modifica al editar.">
            <input className={developmentFieldClass} value={draft.tokkoId} readOnly disabled />
          </DevelopmentField>
        ) : null}
      </DevelopmentFieldGrid>
    </DevelopmentFormSection>
  );
}

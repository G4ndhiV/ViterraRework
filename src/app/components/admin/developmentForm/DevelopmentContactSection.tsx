import { ExternalLink, Link2, Phone } from "lucide-react";
import type { Development } from "../../../data/developments";
import { isValidWhatsappLinkInput } from "../../../lib/whatsappLink";
import {
  DevelopmentField,
  DevelopmentFieldGrid,
  DevelopmentFormSection,
  developmentFieldClass,
} from "./developmentFormUi";

type Props = {
  draft: Development;
  onDraftChange: (patch: Partial<Development>) => void;
  readOnly?: boolean;
};

export function DevelopmentContactSection({ draft, onDraftChange, readOnly }: Props) {
  const waTrim = (draft.inChargeWhatsapp ?? "").trim();
  const waValid = isValidWhatsappLinkInput(draft.inChargeWhatsapp ?? "");
  const waPreview =
    waTrim && /^https?:\/\//i.test(waTrim)
      ? waTrim
      : waTrim.replace(/\D/g, "").length >= 10
        ? `https://wa.me/${waTrim.replace(/\D/g, "")}`
        : null;

  return (
    <DevelopmentFormSection
      icon={Phone}
      title="Contacto"
      description="Teléfono para llamar y enlace de WhatsApp por separado en la ficha pública."
    >
      <DevelopmentFieldGrid>
        <DevelopmentField label="Responsable (nombre)">
          <input
            className={developmentFieldClass}
            value={draft.inChargeName ?? ""}
            disabled={readOnly}
            onChange={(e) => onDraftChange({ inChargeName: e.target.value })}
          />
        </DevelopmentField>
        <DevelopmentField label="Teléfono (llamada / web)" hint="Mínimo 10 dígitos con lada.">
          <input
            type="tel"
            className={developmentFieldClass}
            value={draft.inChargePhone ?? ""}
            disabled={readOnly}
            placeholder="+52 33 1234 5678"
            onChange={(e) => onDraftChange({ inChargePhone: e.target.value })}
          />
        </DevelopmentField>
        <DevelopmentField
          label="Enlace de WhatsApp"
          span={2}
          hint="URL wa.me o número con lada (distinto del teléfono de llamada)."
        >
          <div className="relative">
            <Link2
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              type="url"
              className={developmentFieldClass + " pl-10"}
              value={draft.inChargeWhatsapp ?? ""}
              disabled={readOnly}
              placeholder="https://wa.me/523318878494"
              onChange={(e) => onDraftChange({ inChargeWhatsapp: e.target.value })}
            />
          </div>
          {!waValid && waTrim ? (
            <p className="text-xs text-amber-700">
              Usa un enlace de WhatsApp (wa.me, api.whatsapp.com) o un número con al menos 10 dígitos.
            </p>
          ) : null}
          {waPreview && !readOnly ? (
            <a
              href={waPreview}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#128C7E] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Probar enlace
            </a>
          ) : null}
        </DevelopmentField>
        <DevelopmentField label="Correo" span={2}>
          <input
            type="email"
            className={developmentFieldClass}
            value={draft.inChargeEmail ?? ""}
            disabled={readOnly}
            placeholder="contacto@ejemplo.com"
            onChange={(e) => onDraftChange({ inChargeEmail: e.target.value })}
          />
        </DevelopmentField>
      </DevelopmentFieldGrid>
    </DevelopmentFormSection>
  );
}

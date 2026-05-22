import { AlignLeft } from "lucide-react";
import type { Development } from "../../../data/developments";
import { RichDescriptionEditor } from "../propertyForm/RichDescriptionEditor";
import {
  DevelopmentField,
  DevelopmentFieldGrid,
  DevelopmentFormSection,
  developmentFieldClass,
  developmentTextareaClass,
} from "./developmentFormUi";

type Props = {
  draft: Development;
  onDraftChange: (patch: Partial<Development>) => void;
  readOnly?: boolean;
};

export function DevelopmentDescriptionSection({ draft, onDraftChange, readOnly }: Props) {
  return (
    <DevelopmentFormSection
      icon={AlignLeft}
      title="Descripción"
      description="Tipo de proyecto, texto con formato para la ficha y resumen breve para listados."
    >
      <DevelopmentFieldGrid>
        <DevelopmentField label="Tipo de desarrollo" span={2}>
          <input
            required
            className={developmentFieldClass}
            value={draft.type}
            disabled={readOnly}
            placeholder="Conjunto, torre, lotes…"
            onChange={(e) => onDraftChange({ type: e.target.value })}
          />
        </DevelopmentField>
        <DevelopmentField
          label="Descripción con diseño"
          span={2}
          hint="Negritas, listas y enlaces visibles en el sitio público."
        >
          <RichDescriptionEditor
            value={draft.richDescription ?? ""}
            onChange={(richDescription) => onDraftChange({ richDescription })}
            disabled={readOnly}
            placeholder="Describe el desarrollo, amenidades destacadas, ubicación…"
          />
        </DevelopmentField>
        <DevelopmentField
          label="Descripción breve (opcional)"
          span={2}
          hint="Texto plano para listados o como respaldo si no hay HTML."
        >
          <textarea
            className={developmentTextareaClass}
            rows={4}
            value={draft.description}
            disabled={readOnly}
            placeholder="Resumen corto para tarjetas y SEO…"
            onChange={(e) => onDraftChange({ description: e.target.value })}
          />
        </DevelopmentField>
      </DevelopmentFieldGrid>
    </DevelopmentFormSection>
  );
}

import { useEffect, useState } from "react";
import { Ruler } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "../../PropertyCard";
import type { Development } from "../../../data/developments";
import {
  propertiesForDevelopmentFilter,
  resolveDevelopmentByTokkoId,
} from "../../../lib/propertyDevelopmentLink";
import { fetchTokkoPropertyTypes } from "../../../lib/supabaseReference";
import { PropertyDevelopmentSelect } from "./PropertyDevelopmentSelect";
import { StringListEditor } from "./StringListEditor";
import { PropertyTypeSearchSelect } from "./PropertyTypeSearchSelect";
import {
  PropertyField,
  PropertyFieldGrid,
  PropertyFormSection,
  propertyFieldClass,
} from "./propertyFormUi";

type Props = {
  client: SupabaseClient | null;
  draft: Property;
  developments: Development[];
  developmentsLoading?: boolean;
  catalogProperties?: Property[];
  onDraftChange: (patch: Partial<Property>) => void;
};

export function PropertyTechnicalSection({
  client,
  draft,
  developments,
  developmentsLoading = false,
  catalogProperties = [],
  onDraftChange,
}: Props) {
  const linkedDev = resolveDevelopmentByTokkoId(developments, draft.developmentTokkoId);
  const linkedCount = linkedDev
    ? propertiesForDevelopmentFilter(catalogProperties, linkedDev).length
    : undefined;
  const [propertyTypes, setPropertyTypes] = useState<{ tokko_type_id: string; name: string }[]>([]);

  useEffect(() => {
    if (!client) return;
    void fetchTokkoPropertyTypes(client).then(({ data }) => {
      if (!data) return;
      setPropertyTypes(
        data
          .filter((r) => r.tokko_type_id && r.name)
          .map((r) => ({ tokko_type_id: r.tokko_type_id, name: r.name }))
          .sort((a, b) => a.name.localeCompare(b.name, "es")),
      );
    });
  }, [client]);

  const numField = (
    label: string,
    key: keyof Pick<
      Property,
      | "totalSurface"
      | "roofedSurface"
      | "semiroofedSurface"
      | "unroofedSurface"
      | "frontMeasure"
      | "depthMeasure"
    >,
  ) => (
    <PropertyField label={label}>
      <input
        type="number"
        min={0}
        step="any"
        className={propertyFieldClass}
        value={draft[key] === undefined || draft[key] === null ? "" : Number(draft[key])}
        onChange={(e) =>
          onDraftChange({
            [key]: e.target.value === "" ? undefined : Number(e.target.value),
          } as Partial<Property>)
        }
      />
    </PropertyField>
  );

  return (
    <PropertyFormSection
      icon={Ruler}
      title="Ficha técnica"
      description="Tipo de inmueble y superficies (alineado a Tokko)."
    >
      <PropertyField label="Tipo de inmueble" span={2}>
        <PropertyTypeSearchSelect
          types={propertyTypes}
          typeName={draft.type}
          propertyTypeTokkoId={draft.propertyTypeTokkoId}
          onSelectCatalog={(tokkoTypeId, name) =>
            onDraftChange({ propertyTypeTokkoId: tokkoTypeId, type: name })
          }
          onSelectOther={(customName) =>
            onDraftChange({ propertyTypeTokkoId: undefined, type: customName })
          }
          onClear={() => onDraftChange({ propertyTypeTokkoId: undefined, type: "" })}
        />
        {!client ? (
          <p className="mt-2 text-[11px] text-amber-700">Conecta Supabase para cargar tipos Tokko.</p>
        ) : null}
      </PropertyField>

      <PropertyField
        label="Desarrollo / proyecto"
        span={2}
        hint="Las unidades y el rango de precio del desarrollo en el sitio se calculan desde las propiedades vinculadas con este mismo desarrollo."
      >
        <PropertyDevelopmentSelect
          developments={developments}
          developmentsLoading={developmentsLoading}
          developmentTokkoId={draft.developmentTokkoId}
          linkedPropertyCount={linkedCount}
          onSelect={(developmentTokkoId) => onDraftChange({ developmentTokkoId })}
        />
      </PropertyField>

      <PropertyFieldGrid>
        {numField("Superficie total (m²)", "totalSurface")}
        {numField("Superficie cubierta (m²)", "roofedSurface")}
        {numField("Semi-cubierta (m²)", "semiroofedSurface")}
        {numField("Descubierta (m²)", "unroofedSurface")}
        {numField("Frente (m)", "frontMeasure")}
        {numField("Fondo (m)", "depthMeasure")}
      </PropertyFieldGrid>

      <StringListEditor
        label="Etiquetas (tags)"
        items={draft.tags ?? []}
        placeholder="Ej. Gimnasio, Seguridad"
        onChange={(tags) => onDraftChange({ tags })}
      />
    </PropertyFormSection>
  );
}

import { Layers } from "lucide-react";
import type { Property } from "../../PropertyCard";
import type { Development } from "../../../data/developments";
import { propertiesForDevelopmentFilter } from "../../../lib/propertyDevelopmentLink";
import { DevelopmentFormSection } from "./developmentFormUi";
import { DevelopmentPropertyLinker } from "./DevelopmentPropertyLinker";

type Props = {
  draft: Development;
  catalogProperties: Property[];
  propertiesLoading?: boolean;
  linking?: boolean;
  onLinkProperty?: (property: Property, linkTokkoId: string) => void | Promise<void>;
  onUnlinkProperty?: (property: Property) => void | Promise<void>;
  onEditProperty?: (property: Property) => void;
};

function formatPrice(n: number) {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function DevelopmentInventorySection({
  draft,
  catalogProperties,
  propertiesLoading,
  linking,
  onLinkProperty,
  onUnlinkProperty,
  onEditProperty,
}: Props) {
  const linked = propertiesForDevelopmentFilter(catalogProperties, draft);
  const hasLinked = linked.length > 0;
  const tokkoUnits = draft.developmentUnits?.length ?? 0;

  return (
    <DevelopmentFormSection
      icon={Layers}
      title="Inventario vinculado"
      description="Busca propiedades del catálogo y asígnalas a este desarrollo. Unidades y rango de precio se actualizan al guardar o al vincular."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Unidades mostradas
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-navy">{draft.units}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {hasLinked
              ? `${linked.length} propiedad${linked.length === 1 ? "" : "es"} vinculada${linked.length === 1 ? "" : "s"}`
              : tokkoUnits > 0
                ? `${tokkoUnits} unidad${tokkoUnits === 1 ? "" : "es"} Tokko (sin propiedades vinculadas)`
                : "Valor manual en base de datos"}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200/90 bg-stone-50/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Rango de precio
          </p>
          <p className="mt-1 font-heading text-lg font-semibold text-brand-navy">{draft.priceRange || "—"}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {hasLinked ? "Calculado desde precios de propiedades vinculadas" : "Fallback manual o unidades Tokko"}
          </p>
        </div>
      </div>

      <DevelopmentPropertyLinker
        draft={draft}
        catalogProperties={catalogProperties}
        propertiesLoading={propertiesLoading}
        linking={linking}
        onLinkProperty={onLinkProperty}
        onUnlinkProperty={onUnlinkProperty}
      />

      {hasLinked && onEditProperty ? (
        <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200/90 bg-white">
          {linked.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-navy">
                  {p.publicationTitle?.trim() || p.title}
                </p>
                <p className="text-[11px] text-slate-500">
                  {[p.location, p.colony].filter(Boolean).join(" · ") || "Sin ubicación"} ·{" "}
                  {formatPrice(p.price)}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
                onClick={() => onEditProperty(p)}
              >
                Editar ficha
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </DevelopmentFormSection>
  );
}

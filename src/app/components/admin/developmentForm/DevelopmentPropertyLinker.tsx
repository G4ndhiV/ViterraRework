import { Building2, Check, Loader2, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Property } from "../../PropertyCard";
import type { Development } from "../../../data/developments";
import { previewDevelopmentReferenceCode } from "../../../lib/developmentReferenceCode";
import { developmentLinkTokkoId } from "../../../lib/propertyDevelopmentLink";
import { foldFeatureLabel } from "../../../lib/featureIcons";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { cn } from "../../ui/utils";
import { developmentFieldClass } from "./developmentFormUi";

type Props = {
  draft: Development;
  catalogProperties: Property[];
  propertiesLoading?: boolean;
  onLinkProperty?: (property: Property, linkTokkoId: string) => void | Promise<void>;
  onUnlinkProperty?: (property: Property) => void | Promise<void>;
  linking?: boolean;
};

function formatPrice(n: number) {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

function matchesProperty(p: Property, query: string): boolean {
  if (!query) return true;
  const q = foldFeatureLabel(query);
  const fields = [
    p.title,
    p.publicationTitle,
    p.location,
    p.colony,
    p.referenceCode,
    p.type,
    p.status,
  ].filter(Boolean);
  return fields.some((f) => foldFeatureLabel(String(f)).includes(q));
}

function PropertyMiniCard({
  property: p,
  linked,
  onLink,
  onUnlink,
  busy,
}: {
  property: Property;
  linked?: boolean;
  onLink?: () => void;
  onUnlink?: () => void;
  busy?: boolean;
}) {
  const headline = p.publicationTitle?.trim() || p.title;
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border p-2",
        linked ? "border-primary/25 bg-primary/[0.04]" : "border-stone-200/90 bg-white",
      )}
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
        {p.image ? (
          <ImageWithFallback src={p.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Building2 className="h-6 w-6" />
          </div>
        )}
        {linked ? (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-brand-navy">{headline}</p>
        <p className="line-clamp-1 text-[11px] text-slate-500">
          {[p.location, p.colony].filter(Boolean).join(" · ") || "Sin ubicación"}
        </p>
        <p className="text-[10px] font-medium text-slate-600">
          {formatPrice(p.price)} · {p.type}
        </p>
      </div>
      {linked ? (
        onUnlink ? (
          <button
            type="button"
            disabled={busy}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            onClick={() => void onUnlink()}
          >
            <X className="mr-0.5 inline h-3.5 w-3.5" />
            Quitar
          </button>
        ) : null
      ) : onLink ? (
        <button
          type="button"
          disabled={busy}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          onClick={() => void onLink()}
        >
          Vincular
        </button>
      ) : null}
    </li>
  );
}

export function DevelopmentPropertyLinker({
  draft,
  catalogProperties,
  propertiesLoading = false,
  onLinkProperty,
  onUnlinkProperty,
  linking = false,
}: Props) {
  const [query, setQuery] = useState("");
  const linkTokkoId = developmentLinkTokkoId(draft);

  const linked = useMemo(
    () =>
      catalogProperties.filter(
        (p) => (p.developmentTokkoId?.trim().toLowerCase() ?? "") === linkTokkoId.toLowerCase(),
      ),
    [catalogProperties, linkTokkoId],
  );

  const linkable = useMemo(() => {
    const linkedIds = new Set(linked.map((p) => p.id));
    return catalogProperties.filter((p) => !linkedIds.has(p.id));
  }, [catalogProperties, linked]);

  const filteredLinkable = useMemo(() => {
    const q = query.trim();
    return linkable.filter((p) => matchesProperty(p, q)).slice(0, 40);
  }, [linkable, query]);

  if (propertiesLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-stone-200/90 bg-stone-50/80 px-4 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-slate-600">Cargando propiedades del catálogo…</p>
      </div>
    );
  }

  if (!onLinkProperty && !onUnlinkProperty) {
    return (
      <p className="text-[11px] text-slate-500">
        Sin conexión para vincular propiedades. Guarda el desarrollo y recarga el panel.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {linked.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vinculadas ({linked.length})
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {linked.map((p) => (
              <PropertyMiniCard
                key={p.id}
                property={p}
                linked
                busy={linking}
                onUnlink={onUnlinkProperty ? () => onUnlinkProperty(p) : undefined}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Buscar propiedades
        </p>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className={cn(developmentFieldClass, "pl-10")}
            value={query}
            placeholder="Título, ubicación, referencia…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filteredLinkable.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-xs text-slate-500">
            {query.trim()
              ? `Sin coincidencias para «${query}».`
              : linkable.length === 0
                ? "Todas las propiedades del catálogo ya están vinculadas a este desarrollo."
                : "Escribe para buscar propiedades."}
          </p>
        ) : (
          <ul className="max-h-[min(320px,45vh)] overflow-y-auto rounded-xl border border-stone-200/90 bg-stone-50/40 p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredLinkable.map((p) => (
                <PropertyMiniCard
                  key={p.id}
                  property={p}
                  busy={linking}
                  onLink={
                    onLinkProperty
                      ? () => onLinkProperty(p, linkTokkoId)
                      : undefined
                  }
                />
              ))}
            </div>
          </ul>
        )}
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Referencia del desarrollo:{" "}
          <span className="font-mono font-medium text-slate-700">
            {previewDevelopmentReferenceCode(draft.referenceCode, draft.tokkoId, draft.id)}
          </span>
        </p>
      </div>
    </div>
  );
}

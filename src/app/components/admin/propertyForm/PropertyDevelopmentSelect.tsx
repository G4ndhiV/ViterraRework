import { Building2, Check, ExternalLink, Loader2, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Development } from "../../../data/developments";
import { resolveDevelopmentByTokkoId } from "../../../lib/propertyDevelopmentLink";
import { foldFeatureLabel } from "../../../lib/featureIcons";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { cn } from "../../ui/utils";
import { propertyFieldClass } from "./propertyFormUi";

type Props = {
  developments: Development[];
  developmentsLoading?: boolean;
  developmentTokkoId?: string;
  linkedPropertyCount?: number;
  onSelect: (tokkoId: string | undefined) => void;
};

function matchesDev(d: Development, query: string): boolean {
  if (!query) return true;
  const q = foldFeatureLabel(query);
  const fields = [d.name, d.location, d.colony, d.type, d.referenceCode, d.tokkoId, d.status].filter(
    Boolean,
  );
  return fields.some((f) => foldFeatureLabel(String(f)).includes(q));
}

function linkKey(d: Development): string | null {
  const tokko = d.tokkoId?.trim();
  return tokko || null;
}

function DevelopmentMiniCard({
  development: d,
  active,
  onClick,
}: {
  development: Development;
  active?: boolean;
  onClick: () => void;
}) {
  const cover = d.images?.[0] ?? d.image;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 rounded-xl border p-2 text-left transition",
        active
          ? "border-primary/40 bg-primary/[0.06] ring-2 ring-primary/20"
          : "border-stone-200/90 bg-white hover:border-stone-300 hover:shadow-sm",
      )}
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
        {cover ? (
          <ImageWithFallback src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Building2 className="h-6 w-6" />
          </div>
        )}
        {active ? (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-1 text-sm font-semibold text-brand-navy">{d.name}</p>
        <p className="line-clamp-1 text-[11px] text-slate-500">
          {[d.type, d.location].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-slate-600">
          {d.units} unid. · {d.priceRange || "Sin rango"}
        </p>
      </div>
    </button>
  );
}

export function PropertyDevelopmentSelect({
  developments,
  developmentsLoading = false,
  developmentTokkoId,
  linkedPropertyCount,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [browseOpen, setBrowseOpen] = useState(!developmentTokkoId?.trim());

  const selectable = useMemo(
    () =>
      developments
        .map((d) => ({ d, key: linkKey(d) }))
        .filter((x): x is { d: Development; key: string } => Boolean(x.key))
        .sort((a, b) => a.d.name.localeCompare(b.d.name, "es")),
    [developments],
  );

  const selected = useMemo(
    () => resolveDevelopmentByTokkoId(developments, developmentTokkoId),
    [developments, developmentTokkoId],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    return selectable.filter(({ d }) => matchesDev(d, q));
  }, [selectable, query]);

  const orphanTokko = developmentTokkoId?.trim() && !selected ? developmentTokkoId.trim() : null;

  if (developmentsLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-stone-200/90 bg-stone-50/80 px-4 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-slate-600">Cargando desarrollos del catálogo…</p>
      </div>
    );
  }

  if (selected) {
    const cover = selected.images?.[0] ?? selected.image;
    return (
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.04] to-white ring-1 ring-primary/15">
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[16/10] w-full shrink-0 bg-stone-100 sm:aspect-auto sm:h-36 sm:w-44">
            {cover ? (
              <ImageWithFallback src={cover} alt={selected.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[8rem] items-center justify-center text-slate-300">
                <Building2 className="h-10 w-10" />
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-md bg-brand-navy/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {selected.status}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Desarrollo vinculado
              </p>
              <h4 className="font-heading mt-1 text-lg font-semibold text-brand-navy">{selected.name}</h4>
              <p className="mt-1 text-sm text-slate-600">
                {[selected.type, selected.location, selected.colony].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-medium text-slate-700">
                  {selected.units} unidades
                </span>
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-medium text-slate-700">
                  {selected.priceRange || "Rango por definir"}
                </span>
                {linkedPropertyCount !== undefined ? (
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                    {linkedPropertyCount} en inventario
                  </span>
                ) : null}
              </div>
              {selected.tokkoId ? (
                <p className="mt-2 font-mono text-[10px] text-slate-400">ID {selected.tokkoId}</p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                onClick={() => {
                  setBrowseOpen(true);
                }}
              >
                Cambiar desarrollo
              </button>
              <a
                href={`/desarrollos/${selected.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver ficha
              </a>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                onClick={() => {
                  onSelect(undefined);
                  setBrowseOpen(true);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Quitar vínculo
              </button>
            </div>
          </div>
        </div>
        {browseOpen ? (
          <div className="border-t border-primary/10 bg-white/80 p-4">
            <PickerPanel
              query={query}
              setQuery={setQuery}
              filtered={filtered}
              selectableCount={selectable.length}
              activeTokko={developmentTokkoId}
              onPick={(key) => {
                onSelect(key);
                setBrowseOpen(false);
                setQuery("");
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orphanTokko ? (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900">
          <p className="font-medium">Vínculo guardado (ID {orphanTokko})</p>
          <p className="mt-0.5 text-[11px] text-amber-800/90">
            No aparece en el catálogo cargado. Elige un desarrollo de la lista o quita el vínculo.
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-red-700 hover:underline"
            onClick={() => onSelect(undefined)}
          >
            Quitar vínculo
          </button>
        </div>
      ) : null}

      <PickerPanel
        query={query}
        setQuery={setQuery}
        filtered={filtered}
        selectableCount={selectable.length}
        activeTokko={developmentTokkoId}
        onPick={(key) => {
          onSelect(key);
          setQuery("");
        }}
      />
    </div>
  );
}

function PickerPanel({
  query,
  setQuery,
  filtered,
  selectableCount,
  activeTokko,
  onPick,
}: {
  query: string;
  setQuery: (v: string) => void;
  filtered: { d: Development; key: string }[];
  selectableCount: number;
  activeTokko?: string;
  onPick: (tokkoKey: string) => void;
}) {
  const activeNorm = activeTokko?.trim().toLowerCase() ?? "";

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          className={cn(propertyFieldClass, "pl-10")}
          value={query}
          placeholder="Buscar por nombre, ubicación, tipo o referencia…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {selectableCount === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-200/90 bg-amber-50/50 px-4 py-6 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-amber-600/50" />
          <p className="text-sm font-medium text-amber-900">No hay desarrollos en el catálogo</p>
          <p className="mt-1 text-[11px] text-amber-800/80">
            Crea uno en la pestaña Desarrollos del panel admin y vuelve aquí.
          </p>
        </div>
      ) : (
        <div className="max-h-[min(280px,40vh)] overflow-y-auto rounded-xl border border-stone-200/90 bg-stone-50/40 p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-slate-500">Sin coincidencias para «{query}».</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {filtered.map(({ d, key }) => (
                <li key={d.id}>
                  <DevelopmentMiniCard
                    development={d}
                    active={key.toLowerCase() === activeNorm}
                    onClick={() => onPick(key)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-slate-500">
        {selectableCount} desarrollo{selectableCount === 1 ? "" : "s"} disponible
        {query.trim() ? ` · ${filtered.length} coincidencia${filtered.length === 1 ? "" : "s"}` : ""}
      </p>
    </>
  );
}

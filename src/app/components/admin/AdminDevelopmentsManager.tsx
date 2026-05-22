import { useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Calendar,
  Download,
  Edit,
  Eye,
  Link2,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Table2,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Development } from "../../data/developments";
import type { Property } from "../PropertyCard";
import { copyPublicPageUrl } from "../../lib/copyPublicLink";
import { PdfDownloadDropdown } from "../pdf/PdfDownloadDropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { AdminDevelopmentsMap } from "./AdminDevelopmentsMap";
import { DevelopmentFormDialog } from "./DevelopmentFormDialog";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  developments: Development[];
  catalogProperties?: Property[];
  propertiesLoading?: boolean;
  propertyLinking?: boolean;
  onLinkProperty?: (property: Property, linkTokkoId: string) => void | Promise<void>;
  onUnlinkProperty?: (property: Property) => void | Promise<void>;
  onSave: (input: Development) => boolean | Promise<boolean>;
  onDelete: (id: string) => void | Promise<void>;
  onEditProperty?: (property: Property) => void;
}

type DevelopmentFormState =
  | { mode: "create" }
  | { mode: "edit"; development: Development };

const DEVELOPMENT_STATUSES: Development["status"][] = [
  "En Construcción",
  "Pre-venta",
  "Disponible",
  "Próximamente",
];

export function AdminDevelopmentsManager({
  developments,
  catalogProperties = [],
  propertiesLoading = false,
  propertyLinking = false,
  onLinkProperty,
  onUnlinkProperty,
  onSave,
  onDelete,
  onEditProperty,
}: Props) {
  const { user } = useAuth();
  const readOnly = user?.role === "asesor" || user?.role === "lider_grupo";
  const [developmentForm, setDevelopmentForm] = useState<DevelopmentFormState | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newDevelopmentId, setNewDevelopmentId] = useState(() => crypto.randomUUID());
  const [searchQuery, setSearchQuery] = useState("");
  const [referenceCodeQuery, setReferenceCodeQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [constructionFilter, setConstructionFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [inventoryView, setInventoryView] = useState<"cards" | "list" | "map">("cards");
  const typeOptions = useMemo(
    () => Array.from(new Set(developments.map((d) => d.type).filter(Boolean))),
    [developments]
  );
  const locationOptions = useMemo(
    () => Array.from(new Set(developments.map((d) => d.location).filter(Boolean))),
    [developments]
  );
  const deliveryOptions = useMemo(
    () => Array.from(new Set(developments.map((d) => d.deliveryDate).filter(Boolean))),
    [developments]
  );

  const filteredDevelopments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const refQ = referenceCodeQuery.trim().toLowerCase();
    return developments.filter((d) => {
      const matchesSearch =
        !q ||
        [d.name, d.location, d.type, d.status, d.colony].some((field) =>
          field.toLowerCase().includes(q)
        );
      const matchesReferenceCode =
        !refQ || (d.referenceCode ?? "").trim().toLowerCase().includes(refQ);
      const matchesType = typeFilter === "all" || d.type === typeFilter;
      const matchesLocation = locationFilter === "all" || d.location === locationFilter;
      const matchesConstruction = constructionFilter === "all" || d.status === constructionFilter;
      const matchesState =
        stateFilter === "all" ||
        (stateFilter === "featured" ? !!d.featured : !d.featured);
      const matchesDelivery = deliveryFilter === "all" || d.deliveryDate === deliveryFilter;
      return (
        matchesSearch &&
        matchesReferenceCode &&
        matchesType &&
        matchesLocation &&
        matchesConstruction &&
        matchesState &&
        matchesDelivery
      );
    });
  }, [
    developments,
    searchQuery,
    referenceCodeQuery,
    typeFilter,
    locationFilter,
    constructionFilter,
    stateFilter,
    deliveryFilter,
  ]);
  const preSaleCount = developments.filter((d) => d.status === "Pre-venta").length;
  const availableCount = developments.filter((d) => d.status === "Disponible").length;
  const featuredCount = useMemo(() => developments.filter((d) => d.featured).length, [developments]);

  const openCreate = () => {
    setNewDevelopmentId(crypto.randomUUID());
    setDevelopmentForm({ mode: "create" });
  };

  const openEdit = (d: Development) => {
    setDevelopmentForm({ mode: "edit", development: d });
  };

  const toggleFeatured = (d: Development) => {
    if (readOnly) return;
    void onSave({ ...d, featured: !d.featured });
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.14)] ring-1 ring-slate-900/[0.04]">
        <div
          className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
          aria-hidden
        />
        <div className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 600 }}>
              Gestión de Desarrollos
            </h2>
            <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
              Administra proyectos propios, estados y visibilidad en el sitio.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
            <div
              className="inline-flex w-full flex-wrap rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 shadow-[inset_0_1px_2px_rgba(20,28,46,0.06)] sm:w-auto"
              role="group"
              aria-label="Vista del inventario"
            >
              <button
                type="button"
                aria-label="Vista de tarjetas"
                onClick={() => setInventoryView("cards")}
                className={cn(
                  "inline-flex h-11 flex-1 items-center justify-center rounded-xl transition-all sm:h-10 sm:flex-none sm:w-10",
                  inventoryView === "cards"
                    ? "bg-brand-navy text-white shadow-md shadow-brand-navy/25"
                    : "text-slate-600 hover:bg-white/80 hover:text-brand-navy",
                )}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Vista de lista"
                onClick={() => setInventoryView("list")}
                className={cn(
                  "inline-flex h-11 flex-1 items-center justify-center rounded-xl transition-all sm:h-10 sm:flex-none sm:w-10",
                  inventoryView === "list"
                    ? "bg-brand-navy text-white shadow-md shadow-brand-navy/25"
                    : "text-slate-600 hover:bg-white/80 hover:text-brand-navy",
                )}
              >
                <Table2 className="h-4 w-4 shrink-0" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Vista de mapa"
                onClick={() => setInventoryView("map")}
                className={cn(
                  "inline-flex h-11 flex-1 items-center justify-center rounded-xl transition-all sm:h-10 sm:flex-none sm:w-10",
                  inventoryView === "map"
                    ? "bg-brand-navy text-white shadow-md shadow-brand-navy/25"
                    : "text-slate-600 hover:bg-white/80 hover:text-brand-navy",
                )}
              >
                <MapIcon className="h-4 w-4 shrink-0" strokeWidth={2} />
              </button>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C8102E] px-5 py-2.5 font-medium text-white transition-all hover:bg-[#a00d25] sm:w-auto"
                style={{ fontWeight: 600 }}
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={2} />
                Nuevo Desarrollo
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">Tipos</option>
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">Ubicación</option>
            {locationOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={constructionFilter}
            onChange={(e) => setConstructionFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">Estado de la construcción</option>
            {DEVELOPMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            aria-label="Filtrar desarrollos destacados"
          >
            <option value="all">Todos</option>
            <option value="featured">Solo destacados</option>
            <option value="normal">No destacados</option>
          </select>
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">Período de entrega</option>
            {deliveryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar desarrollos por nombre..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-navy placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold tracking-wide text-slate-400"
              aria-hidden
            >
              REF
            </span>
            <input
              type="search"
              value={referenceCodeQuery}
              onChange={(e) => setReferenceCodeQuery(e.target.value)}
              placeholder="Código de referencia..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-brand-navy tabular-nums placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              aria-label="Filtrar por código de referencia"
              autoComplete="off"
            />
          </div>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
          <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-primary to-brand-burgundy opacity-90" aria-hidden />
          <div className="mb-1.5 flex items-start justify-between gap-2 pl-1">
            <p className="font-heading min-w-0 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
              Total desarrollos
            </p>
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-brand-gold/90" strokeWidth={1.5} />
          </div>
          <p className="font-heading pl-1 text-2xl leading-tight text-brand-navy" style={{ fontWeight: 700 }}>
            {developments.length}
          </p>
          <p className="mt-1 pl-1 text-[11px] leading-snug text-slate-500" style={{ fontWeight: 500 }}>
            Proyectos en el panel
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
          <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-burgundy to-brand-gold opacity-90" aria-hidden />
          <div className="mb-1.5 flex items-start justify-between gap-2 pl-1">
            <p className="font-heading min-w-0 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
              Pre-venta
            </p>
            <Activity className="h-3.5 w-3.5 shrink-0 text-brand-gold/90" strokeWidth={1.5} />
          </div>
          <p className="font-heading pl-1 text-2xl leading-tight text-brand-navy" style={{ fontWeight: 700 }}>
            {preSaleCount}
          </p>
          <p className="mt-1 pl-1 text-[11px] leading-snug text-slate-500" style={{ fontWeight: 500 }}>
            En etapa pre-venta
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
          <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-navy to-slate-600 opacity-90" aria-hidden />
          <div className="mb-1.5 flex items-start justify-between gap-2 pl-1">
            <p className="font-heading min-w-0 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
              Disponibles
            </p>
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-brand-gold/90" strokeWidth={1.5} />
          </div>
          <p className="font-heading pl-1 text-2xl leading-tight text-brand-navy" style={{ fontWeight: 700 }}>
            {availableCount}
          </p>
          <p className="mt-1 pl-1 text-[11px] leading-snug text-slate-500" style={{ fontWeight: 500 }}>
            Estado disponible
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
          <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-gold to-primary opacity-90" aria-hidden />
          <div className="mb-1.5 flex items-start justify-between gap-2 pl-1">
            <p className="font-heading min-w-0 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
              Destacados
            </p>
            <Activity className="h-3.5 w-3.5 shrink-0 text-brand-gold/90" strokeWidth={1.5} />
          </div>
          <p className="font-heading pl-1 text-2xl leading-tight text-brand-navy" style={{ fontWeight: 700 }}>
            {featuredCount}
          </p>
          <p className="mt-1 pl-1 text-[11px] leading-snug text-slate-500" style={{ fontWeight: 500 }}>
            Marcados como destacados
          </p>
        </div>
      </div>

      {inventoryView === "map" && filteredDevelopments.length > 0 && (
        <div className="space-y-3">
          <AdminDevelopmentsMap developments={filteredDevelopments} mapHeightClassName="h-[min(60vh,560px)] min-h-[320px]" />
        </div>
      )}

      {inventoryView === "list" && filteredDevelopments.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_8px_32px_-10px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50/95 to-white">
                <tr>
                  <th
                    className="font-heading px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75 sm:px-6 sm:py-4"
                    style={{ fontWeight: 600 }}
                  >
                    Desarrollo
                  </th>
                  <th
                    className="font-heading px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75 sm:px-6 sm:py-4"
                    style={{ fontWeight: 600 }}
                  >
                    Tipo
                  </th>
                  <th
                    className="font-heading px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75 sm:px-6 sm:py-4"
                    style={{ fontWeight: 600 }}
                  >
                    Ubicación
                  </th>
                  <th
                    className="font-heading px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75 sm:px-6 sm:py-4"
                    style={{ fontWeight: 600 }}
                  >
                    Estado
                  </th>
                  <th
                    className="font-heading px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75 sm:px-6 sm:py-4"
                    style={{ fontWeight: 600 }}
                  >
                    Entrega
                  </th>
                  <th
                    className="font-heading px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75 sm:px-6 sm:py-4"
                    style={{ fontWeight: 600 }}
                  >
                    Rango
                  </th>
                  <th
                    className="font-heading px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75 sm:px-6 sm:py-4"
                    style={{ fontWeight: 600 }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredDevelopments.map((development) => (
                  <tr key={development.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={development.image}
                          alt=""
                          className="h-12 w-16 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-medium text-slate-900" style={{ fontWeight: 600 }}>
                            {development.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500" style={{ fontWeight: 500 }}>
                            {development.units} unidades
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-800 sm:px-6 sm:py-4" style={{ fontWeight: 500 }}>
                      {development.type}
                    </td>
                    <td className="max-w-[11rem] px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4" style={{ fontWeight: 500 }}>
                      <span className="line-clamp-2">{development.location}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
                      <span
                        className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ring-1 ring-slate-200/80"
                        style={{ fontWeight: 600 }}
                      >
                        {development.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4" style={{ fontWeight: 500 }}>
                      {development.deliveryDate}
                    </td>
                    <td className="max-w-[10rem] px-4 py-3 text-right text-sm font-semibold text-slate-900 sm:px-6 sm:py-4" style={{ fontWeight: 700 }}>
                      <span className="line-clamp-2">{development.priceRange}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right sm:px-6 sm:py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => copyPublicPageUrl(`/desarrollos/${development.id}`)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Copiar enlace público"
                          aria-label="Copiar enlace público"
                        >
                          <Link2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <PdfDownloadDropdown data={development} type="development" />
                        <a
                          href={`/desarrollos/${development.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Ver en sitio"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </a>
                        {!readOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(development)}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(development.id)}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inventoryView === "cards" && (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevelopments.map((development) => (
          <div
            key={development.id}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all group"
          >
            {readOnly ? (
              <div className="relative block h-48 w-full overflow-hidden bg-slate-100 p-0 text-left">
                <img
                  src={development.image}
                  alt=""
                  className="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute top-3 right-3">
                  <span
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-sm text-slate-900 border border-slate-200"
                    style={{ fontWeight: 600 }}
                  >
                    {development.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openEdit(development)}
                className="relative block h-48 w-full cursor-pointer overflow-hidden bg-slate-100 p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                aria-label={`Abrir ficha: ${development.name}`}
              >
              <img
                src={development.image}
                alt=""
                className="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute top-3 right-3">
                <span
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-sm text-slate-900 border border-slate-200"
                  style={{ fontWeight: 600 }}
                >
                  {development.status.toUpperCase()}
                </span>
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  className={cn(
                    "absolute left-3 top-3 z-10 rounded-lg p-1.5 shadow-sm transition",
                    development.featured
                      ? "bg-amber-400 text-amber-950 hover:bg-amber-300"
                      : "bg-white/90 text-slate-500 hover:bg-white hover:text-amber-600",
                  )}
                  title={development.featured ? "Quitar de destacados" : "Destacar desarrollo"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFeatured(development);
                  }}
                >
                  <Star
                    className="h-4 w-4"
                    strokeWidth={2}
                    fill={development.featured ? "currentColor" : "none"}
                  />
                </button>
              ) : development.featured ? (
                <span className="absolute left-3 top-3 rounded-lg bg-amber-400/95 p-1.5 text-amber-950">
                  <Star className="h-4 w-4 fill-current" />
                </span>
              ) : null}
              </button>
            )}

            <div className="p-5">
              <span
                className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2 block"
                style={{ letterSpacing: "0.05em", fontWeight: 500 }}
              >
                {development.type}
              </span>
              <h3 className="font-semibold text-slate-900 mb-2" style={{ fontWeight: 600 }}>
                {development.name}
              </h3>
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                <MapPin className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                {development.location}
              </p>
              <p className="text-sm text-slate-600 mb-4 flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                Entrega: {development.deliveryDate}
              </p>

              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Building2 className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium" style={{ fontWeight: 500 }}>
                    {development.units} unidades
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="min-w-0 w-full">
                  <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide" style={{ letterSpacing: "0.05em", fontWeight: 500 }}>
                    Rango
                  </p>
                  <p
                    className="text-base font-semibold leading-snug text-slate-900 break-words"
                    style={{ fontWeight: 700 }}
                  >
                    {development.priceRange}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => copyPublicPageUrl(`/desarrollos/${development.id}`)}
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                    title="Copiar enlace público"
                    aria-label="Copiar enlace público"
                  >
                    <Link2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <PdfDownloadDropdown data={development} type="development" />
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(development)}
                        className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(development.id)}
                        className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </>
                  )}
                  <a
                    href={`/desarrollos/${development.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                    title="Ver en sitio"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {filteredDevelopments.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-20 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontWeight: 600 }}>
              {developments.length === 0 ? "No hay desarrollos" : "Sin resultados"}
            </h3>
            <p className="text-sm text-slate-600 mb-6" style={{ fontWeight: 500 }}>
              {developments.length === 0
                ? "Comienza agregando tu primer desarrollo al catálogo"
                : "Prueba con otro término de búsqueda."}
            </p>
            {developments.length === 0 && !readOnly && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8102E] px-6 py-2.5 font-medium text-white transition-all hover:bg-[#a00d25]"
                style={{ fontWeight: 600 }}
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={2} />
                Nuevo Desarrollo
              </button>
            )}
          </div>
        </div>
      )}

      <DevelopmentFormDialog
        open={developmentForm !== null}
        onOpenChange={(o) => {
          if (!o) setDevelopmentForm(null);
        }}
        mode={developmentForm?.mode ?? "create"}
        development={developmentForm?.mode === "edit" ? developmentForm.development : null}
        newId={newDevelopmentId}
        onSave={async (payload) => {
          const ok = await onSave(payload);
          if (ok) setDevelopmentForm(null);
        }}
        readOnly={readOnly}
        catalogProperties={catalogProperties}
        propertiesLoading={propertiesLoading}
        propertyLinking={propertyLinking}
        onLinkProperty={onLinkProperty}
        onUnlinkProperty={onUnlinkProperty}
        onEditProperty={onEditProperty}
      />

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este desarrollo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se ocultará del panel admin. Las propiedades vinculadas conservan su desarrollo asignado hasta que
              lo cambies en cada ficha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTargetId) void onDelete(deleteTargetId);
                setDeleteTargetId(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

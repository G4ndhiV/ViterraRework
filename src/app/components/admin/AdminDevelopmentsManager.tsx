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
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Development } from "../../data/developments";
import { copyPublicPageUrl } from "../../lib/copyPublicLink";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { cn } from "../ui/utils";
import { AdminDevelopmentsMap } from "./AdminDevelopmentsMap";

interface Props {
  developments: Development[];
  onSave: (input: Development) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

type DevelopmentStatus = Development["status"];

const statuses: DevelopmentStatus[] = ["En Construcción", "Pre-venta", "Disponible", "Próximamente"];

const emptyForm = {
  name: "",
  location: "",
  colony: "",
  fullAddress: "",
  type: "",
  description: "",
  image: "",
  status: "Disponible" as DevelopmentStatus,
  units: 1,
  deliveryDate: "",
  priceRange: "",
};

export function AdminDevelopmentsManager({ developments, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Development | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [constructionFilter, setConstructionFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [inventoryView, setInventoryView] = useState<"cards" | "list" | "map">("cards");
  const [newDevelopmentId, setNewDevelopmentId] = useState(() => crypto.randomUUID());
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
    return developments.filter((d) => {
      const matchesSearch =
        !q ||
        [d.name, d.location, d.type, d.status, d.colony].some((field) =>
          field.toLowerCase().includes(q)
        );
      const matchesType = typeFilter === "all" || d.type === typeFilter;
      const matchesLocation = locationFilter === "all" || d.location === locationFilter;
      const matchesConstruction = constructionFilter === "all" || d.status === constructionFilter;
      const matchesState =
        stateFilter === "all" ||
        (stateFilter === "featured" ? !!d.featured : !d.featured);
      const matchesDelivery = deliveryFilter === "all" || d.deliveryDate === deliveryFilter;
      return (
        matchesSearch &&
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
    setEditing(null);
    setForm(emptyForm);
    setNewDevelopmentId(crypto.randomUUID());
    setOpen(true);
  };

  const openEdit = (d: Development) => {
    setEditing(d);
    setForm({
      name: d.name,
      location: d.location,
      colony: d.colony,
      fullAddress: d.fullAddress,
      type: d.type,
      description: d.description,
      image: d.image,
      status: d.status,
      units: d.units,
      deliveryDate: d.deliveryDate,
      priceRange: d.priceRange,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim() || !form.type.trim()) return;
    const id = editing?.id ?? newDevelopmentId;
    const payload: Development = {
      id,
      name: form.name.trim(),
      location: form.location.trim(),
      colony: form.colony.trim() || form.location.trim(),
      fullAddress: form.fullAddress.trim() || form.location.trim(),
      type: form.type.trim(),
      description: form.description.trim() || "Sin descripción",
      image: form.image.trim() || "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1280&q=80",
      images: editing?.images?.length ? editing.images : [form.image.trim() || "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1280&q=80"],
      status: form.status,
      units: Math.max(1, Number(form.units) || 1),
      deliveryDate: form.deliveryDate.trim() || "Por definir",
      priceRange: form.priceRange.trim() || "Por definir",
      amenities: editing?.amenities ?? [],
      services: editing?.services ?? [],
      additionalFeatures: editing?.additionalFeatures ?? [],
      developmentUnits: editing?.developmentUnits ?? [],
      coordinates: editing?.coordinates ?? { lat: 20.67, lng: -103.35 },
      featured: editing?.featured ?? false,
    };
    onSave(payload);
    setOpen(false);
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
            <button
              type="button"
              onClick={openCreate}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C8102E] px-5 py-2.5 font-medium text-white transition-all hover:bg-[#a00d25] sm:w-auto"
              style={{ fontWeight: 600 }}
            >
              <Plus className="h-4.5 w-4.5" strokeWidth={2} />
              Nuevo Desarrollo
            </button>
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
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">Estado</option>
            <option value="featured">Destacado</option>
            <option value="normal">No destacado</option>
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
        <div className="mt-3 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar desarrollos por nombre..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-navy placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
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
                        <a
                          href={`/desarrollos/${development.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Ver en sitio"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </a>
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
                          onClick={() => {
                            if (window.confirm("¿Eliminar este desarrollo?")) onDelete(development.id);
                          }}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
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
            </button>

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
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                    title="Exportar información (próximamente)"
                    aria-label="Exportar información"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                  </button>
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
                    onClick={() => {
                      if (window.confirm("¿Eliminar este desarrollo?")) onDelete(development.id);
                    }}
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
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
            {developments.length === 0 && (
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

      <Dialog open={open} onOpenChange={setOpen} key={editing?.id ?? `new-${newDevelopmentId}`}>
        <DialogContent
          hideCloseButton
          className={cn(
            "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 sm:!max-w-none"
          )}
        >
          <div className="h-0.5 shrink-0 bg-gradient-to-r from-brand-gold/90 via-primary to-brand-burgundy/90" aria-hidden />
          <form id="viterra-development-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/90 px-4 py-4 sm:px-5">
              <DialogHeader className="gap-0 p-0 text-left">
                <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>
                  <span className="text-primary/90">Panel admin</span>
                  <span className="text-slate-400"> · </span>
                  Desarrollos
                </p>
                <div className="mt-3 flex flex-col gap-4 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-6">
                  <div className="min-w-0 flex-1 space-y-1">
                    <DialogTitle
                      className="font-heading text-2xl leading-tight tracking-tight text-brand-navy sm:text-3xl"
                      style={{ fontWeight: 700 }}
                    >
                      {editing ? "Editar desarrollo" : "Nuevo desarrollo"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                      Completa los datos del desarrollo. La ficha será visible en el sitio público.
                    </DialogDescription>
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2 min-[1100px]:w-auto min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-end min-[1100px]:gap-3">
                    <div className="flex items-center gap-1 min-[1100px]:mr-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 border-stone-300 bg-white text-slate-600 hover:bg-stone-50 hover:text-slate-800"
                        title="Copiar enlace público"
                        aria-label="Copiar enlace público"
                        onClick={() =>
                          copyPublicPageUrl(`/desarrollos/${editing?.id ?? newDevelopmentId}`)
                        }
                      >
                        <Link2 className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 border-stone-300 bg-white text-slate-600 hover:bg-stone-50 hover:text-slate-800"
                        title="Exportar información (próximamente)"
                        aria-label="Exportar información"
                      >
                        <Download className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-fit shrink-0 border-stone-300 bg-white px-4 text-slate-700 hover:bg-stone-50 hover:text-slate-800"
                        style={{ fontWeight: 600 }}
                      >
                        Cerrar
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      className="h-10 w-full min-w-[10rem] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-brand-red-hover min-[1100px]:w-auto"
                    >
                      {editing ? "Guardar cambios" : "Crear desarrollo"}
                    </Button>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Nombre
                    </Label>
                    <input
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Ej. Residencial Bosque Real"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Tipo
                    </Label>
                    <input
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Conjunto residencial, torre..."
                      value={form.type}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Ubicación
                    </Label>
                    <input
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Colonia
                    </Label>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={form.colony}
                      onChange={(e) => setForm((p) => ({ ...p, colony: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                    Dirección completa
                  </Label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={form.fullAddress}
                    onChange={(e) => setForm((p) => ({ ...p, fullAddress: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Estatus
                    </Label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as DevelopmentStatus }))}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Unidades
                    </Label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={form.units}
                      onChange={(e) => setForm((p) => ({ ...p, units: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Entrega
                    </Label>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={form.deliveryDate}
                      onChange={(e) => setForm((p) => ({ ...p, deliveryDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                      Rango de precio
                    </Label>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={form.priceRange}
                      onChange={(e) => setForm((p) => ({ ...p, priceRange: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                    URL de imagen
                  </Label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    placeholder="https://..."
                    value={form.image}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                    Descripción
                  </Label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

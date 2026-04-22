import { useEffect, useState } from "react";
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
import { copyPublicPageUrl } from "../../lib/copyPublicLink";
import type { Property } from "../PropertyCard";
import { Download, Link2 } from "lucide-react";
import { MAX_FEATURED_PROPERTIES } from "../../lib/supabaseProperties";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  property: Property | null;
  /** Id que se asignará al crear (calculado en el padre) */
  newId: string;
  onSave: (property: Property) => void;
  /** Propiedades destacadas excluyendo la ficha actual (edit) o todas (crear). */
  otherFeaturedCount: number;
};

const defaultImage =
  "https://images.unsplash.com/photo-1520106392146-ef585c111254?w=1080&q=80";

export function PropertyFormDialog({
  open,
  onOpenChange,
  mode,
  property,
  newId,
  onSave,
  otherFeaturedCount,
}: Props) {
  const [draft, setDraft] = useState<Property | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && property) {
      setDraft({ ...property });
    } else if (mode === "create") {
      setDraft({
        id: newId,
        title: "",
        price: 0,
        location: "",
        bedrooms: 2,
        bathrooms: 2,
        area: 100,
        image: defaultImage,
        type: "Apartamento",
        status: "venta",
        featured: false,
        coordinates: { lat: 20.676208, lng: -103.34721 },
        amenities: [],
        services: [],
        additionalFeatures: [],
      });
    }
  }, [open, mode, property, newId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) {
      window.alert("Indica un título para la propiedad.");
      return;
    }
    const wasFeatured = mode === "edit" && property ? Boolean(property.featured) : false;
    if (draft.featured && !wasFeatured && otherFeaturedCount >= MAX_FEATURED_PROPERTIES) {
      window.alert(
        `Solo pueden destacarse hasta ${MAX_FEATURED_PROPERTIES} propiedades en la portada. Quita una estrella en otra ficha e inténtalo de nuevo.`
      );
      return;
    }
    onSave({
      ...draft,
      id: mode === "create" ? newId : property?.id ?? draft.id,
      price: Number(draft.price) || 0,
      bedrooms: Number(draft.bedrooms) || 0,
      bathrooms: Number(draft.bathrooms) || 0,
      area: Number(draft.area) || 0,
      featured: Boolean(draft.featured),
    });
    onOpenChange(false);
  };

  if (mode === "edit" && !property) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      key={mode === "edit" && property ? property.id : `create-${newId}`}
    >
      <DialogContent
        hideCloseButton
        className={cn(
          "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 sm:!max-w-none"
        )}
      >
        <div className="h-0.5 shrink-0 bg-gradient-to-r from-brand-gold/90 via-primary to-brand-burgundy/90" aria-hidden />
        {!draft ? (
          <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-slate-500" style={{ fontWeight: 500 }}>
            Cargando formulario…
          </div>
        ) : (
        <form id="viterra-property-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/90 px-4 py-4 sm:px-5">
            <DialogHeader className="gap-0 p-0 text-left">
              <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>
                <span className="text-primary/90">Panel admin</span>
                <span className="text-slate-400"> · </span>
                Propiedades
              </p>
              <div className="mt-3 flex flex-col gap-4 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-6">
                <div className="min-w-0 flex-1 space-y-1">
                  <DialogTitle
                    className="font-heading text-2xl leading-tight tracking-tight text-brand-navy sm:text-3xl"
                    style={{ fontWeight: 700 }}
                  >
                    {mode === "create" ? "Nueva propiedad" : "Editar propiedad"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                    Completa los datos del inmueble. La ficha será visible en el sitio público.
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
                      onClick={() => copyPublicPageUrl(`/propiedades/${draft.id}`)}
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
                    {mode === "create" ? "Crear propiedad" : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto space-y-4 px-4 py-5 sm:px-6 lg:px-8">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                Título
              </Label>
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                style={{ fontWeight: 500 }}
                placeholder="Ej. Casa con vista al parque"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                  Precio (USD)
                </Label>
                <input
                  type="number"
                  min={0}
                  value={draft.price || ""}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, price: Number(e.target.value) } : d))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  style={{ fontWeight: 500 }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                  Operación
                </Label>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, status: e.target.value as Property["status"] } : d
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  style={{ fontWeight: 500 }}
                >
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                Ubicación
              </Label>
              <input
                value={draft.location}
                onChange={(e) => setDraft((d) => (d ? { ...d, location: e.target.value } : d))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                style={{ fontWeight: 500 }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                  Rec.
                </Label>
                <input
                  type="number"
                  min={0}
                  value={draft.bedrooms}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, bedrooms: Number(e.target.value) } : d))
                  }
                  className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm"
                  style={{ fontWeight: 500 }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                  Baños
                </Label>
                <input
                  type="number"
                  min={0}
                  value={draft.bathrooms}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, bathrooms: Number(e.target.value) } : d))
                  }
                  className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm"
                  style={{ fontWeight: 500 }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                  m²
                </Label>
                <input
                  type="number"
                  min={0}
                  value={draft.area}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, area: Number(e.target.value) } : d))
                  }
                  className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm"
                  style={{ fontWeight: 500 }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                Tipo
              </Label>
              <input
                value={draft.type}
                onChange={(e) => setDraft((d) => (d ? { ...d, type: e.target.value } : d))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                style={{ fontWeight: 500 }}
                placeholder="Casa, Penthouse…"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-slate-600" style={{ fontWeight: 600 }}>
                URL de imagen
              </Label>
              <input
                value={draft.image}
                onChange={(e) => setDraft((d) => (d ? { ...d, image: e.target.value } : d))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                style={{ fontWeight: 500 }}
                placeholder="https://…"
              />
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3">
              <input
                id="viterra-property-featured"
                type="checkbox"
                checked={Boolean(draft.featured)}
                disabled={
                  !draft.featured &&
                  otherFeaturedCount >= MAX_FEATURED_PROPERTIES
                }
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, featured: e.target.checked } : d))
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
              />
              <label htmlFor="viterra-property-featured" className="cursor-pointer text-sm text-slate-700" style={{ fontWeight: 500 }}>
                Destacar en la portada (inicio)
                <span className="mt-1 block text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Máximo {MAX_FEATURED_PROPERTIES} propiedades. Otras destacadas ahora: {otherFeaturedCount}.
                </span>
              </label>
            </div>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

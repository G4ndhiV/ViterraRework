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
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { copyPublicPageUrl } from "../../lib/copyPublicLink";
import type { Property } from "../PropertyCard";
import { Download, Link2, Star } from "lucide-react";
import { ImageGalleryEditor } from "./ImageGalleryEditor";
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
      const gallery =
        property.images?.length
          ? [...property.images]
          : property.image
            ? [property.image]
            : [defaultImage];
      setDraft({ ...property, image: gallery[0] ?? property.image, images: gallery });
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
        images: [defaultImage],
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
    const imgs =
      draft.images && draft.images.length > 0
        ? draft.images
        : draft.image
          ? [draft.image]
          : [defaultImage];
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
      image: imgs[0] ?? defaultImage,
      images: imgs,
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
          <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/90 px-3 py-2.5 sm:px-4 sm:py-3">
            <DialogHeader className="gap-0 p-0 text-left">
              <p className="text-[10px] text-slate-500" style={{ fontWeight: 500 }}>
                <span className="text-primary/90">Panel admin</span>
                <span className="text-slate-400"> · </span>
                Propiedades
              </p>
              <div className="mt-1.5 flex flex-col gap-2 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <DialogTitle
                    className="font-heading text-xl leading-tight tracking-tight text-brand-navy sm:text-2xl"
                    style={{ fontWeight: 700 }}
                  >
                    {mode === "create" ? "Nueva propiedad" : "Editar propiedad"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                    Completa los datos del inmueble. La ficha será visible en el sitio público.
                  </DialogDescription>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-1.5 min-[1100px]:w-auto min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-end min-[1100px]:gap-2">
                  <div className="flex items-center gap-1 min-[1100px]:mr-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 border-stone-300 bg-white text-slate-600 hover:bg-stone-50 hover:text-slate-800"
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
                      className="h-9 w-9 shrink-0 border-stone-300 bg-white text-slate-600 hover:bg-stone-50 hover:text-slate-800"
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
                      className="h-9 w-fit shrink-0 border-stone-300 bg-white px-3 text-sm text-slate-700 hover:bg-stone-50 hover:text-slate-800"
                      style={{ fontWeight: 600 }}
                    >
                      Regresar
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-fit shrink-0 border-stone-300 bg-white px-3 text-sm text-slate-700 hover:bg-stone-50 hover:text-slate-800"
                      style={{ fontWeight: 600 }}
                    >
                      Cerrar
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="h-9 w-full min-w-[10rem] bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-brand-red-hover min-[1100px]:w-auto"
                  >
                    {mode === "create" ? "Crear propiedad" : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6">
            <div className="mx-auto grid max-w-[120rem] grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[min(100%,26rem)_minmax(0,1fr)] xl:gap-x-6 xl:gap-y-3 xl:items-start">
              <div className="min-w-0 xl:sticky xl:top-1 xl:col-start-1 xl:row-start-1 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto xl:pr-1">
                <ImageGalleryEditor
                  segment="hero"
                  variant="featured"
                  label="Galería"
                  hint="Arrastra o sube fotos. La primera es la portada en el sitio público."
                  images={draft.images?.length ? draft.images : draft.image ? [draft.image] : []}
                  onChange={(next) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            images: next,
                            image: next[0] ?? defaultImage,
                          }
                        : d
                    )
                  }
                />
              </div>

              <section
                className={cn(
                  "min-w-0 space-y-2.5 rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_6px_24px_-10px_rgba(20,28,46,0.1)] sm:p-3.5 xl:col-start-2 xl:row-start-1",
                  "xl:max-h-[min(28rem,calc(100dvh-13rem))] xl:overflow-y-auto xl:pr-1"
                )}
              >
                <div className="flex flex-col gap-3 border-b border-slate-200/60 pb-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-3">
                  <div className="min-w-0 sm:flex-1 sm:pt-0.5">
                    <h3 className="font-heading text-base text-brand-navy sm:text-lg" style={{ fontWeight: 700 }}>
                      Datos del inmueble
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500" style={{ fontWeight: 500 }}>
                      Información pública en ficha y listados.
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex w-full shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 shadow-sm sm:mt-0 sm:max-w-[min(100%,20rem)] sm:py-1.5",
                      draft.featured
                        ? "border-amber-300/50 bg-gradient-to-r from-amber-50/90 to-amber-50/20 ring-1 ring-amber-200/30"
                        : "border-slate-200/80 bg-gradient-to-r from-slate-50/70 to-white ring-1 ring-slate-900/[0.04]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                        draft.featured
                          ? "border-amber-200/80 bg-amber-100/80 text-amber-700"
                          : "border-slate-200/90 bg-white text-amber-500/80"
                      )}
                      aria-hidden
                    >
                      <Star
                        className="h-3.5 w-3.5"
                        strokeWidth={2}
                        fill={draft.featured ? "currentColor" : "none"}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-0.5">
                      <Label
                        htmlFor="viterra-property-featured"
                        className={cn(
                          "block cursor-pointer text-[12px] leading-tight text-slate-800 sm:text-sm",
                          !draft.featured && otherFeaturedCount >= MAX_FEATURED_PROPERTIES && "text-slate-500"
                        )}
                        style={{ fontWeight: 600 }}
                      >
                        <span className="sm:hidden">Todos</span>
                        <span className="hidden sm:inline">Destacar en la portada</span>
                      </Label>
                    </div>
                    <div className="flex shrink-0 self-center pl-0.5">
                      <Switch
                        id="viterra-property-featured"
                        checked={Boolean(draft.featured)}
                        disabled={
                          !draft.featured && otherFeaturedCount >= MAX_FEATURED_PROPERTIES
                        }
                        onCheckedChange={(v) =>
                          setDraft((d) => (d ? { ...d, featured: v } : d))
                        }
                        className="data-[state=unchecked]:bg-slate-200/80"
                        aria-label="Destacar en la portada de inicio"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                    Título
                  </Label>
                  <input
                    required
                    value={draft.title}
                    onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                    style={{ fontWeight: 500 }}
                    placeholder="Ej. Casa con vista al parque"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                      Precio
                    </Label>
                    <input
                      type="number"
                      min={0}
                      value={draft.price || ""}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, price: Number(e.target.value) } : d))
                      }
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                      style={{ fontWeight: 500 }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                      Operación
                    </Label>
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, status: e.target.value as Property["status"] } : d
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
                      style={{ fontWeight: 500 }}
                    >
                      <option value="venta">Venta</option>
                      <option value="alquiler">Alquiler</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                    Ubicación
                  </Label>
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft((d) => (d ? { ...d, location: e.target.value } : d))}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                    style={{ fontWeight: 500 }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                      Rec.
                    </Label>
                    <input
                      type="number"
                      min={0}
                      value={draft.bedrooms}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, bedrooms: Number(e.target.value) } : d))
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      style={{ fontWeight: 500 }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                      Baños
                    </Label>
                    <input
                      type="number"
                      min={0}
                      value={draft.bathrooms}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, bathrooms: Number(e.target.value) } : d))
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      style={{ fontWeight: 500 }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                      m²
                    </Label>
                    <input
                      type="number"
                      min={0}
                      value={draft.area}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, area: Number(e.target.value) } : d))
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      style={{ fontWeight: 500 }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase leading-none text-slate-600" style={{ fontWeight: 600 }}>
                    Tipo
                  </Label>
                  <input
                    value={draft.type}
                    onChange={(e) => setDraft((d) => (d ? { ...d, type: e.target.value } : d))}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                    style={{ fontWeight: 500 }}
                    placeholder="Casa, Penthouse…"
                  />
                </div>
              </section>

              <div className="min-w-0 xl:col-span-2 xl:row-start-2">
                <ImageGalleryEditor
                  segment="gallery"
                  variant="featured"
                  label="Galería"
                  hint="Arrastra o sube fotos. La primera es la portada en el sitio público."
                  images={draft.images?.length ? draft.images : draft.image ? [draft.image] : []}
                  onChange={(next) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            images: next,
                            image: next[0] ?? defaultImage,
                          }
                        : d
                    )
                  }
                />
              </div>
            </div>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

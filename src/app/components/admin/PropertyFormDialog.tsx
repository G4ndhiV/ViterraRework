import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import type { Property } from "../PropertyCard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  property: Property | null;
  /** Id que se asignará al crear (calculado en el padre) */
  newId: string;
  onSave: (property: Property) => void;
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
        coordinates: { lat: 20.676208, lng: -103.34721 },
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
    onSave({
      ...draft,
      id: mode === "create" ? newId : property?.id ?? draft.id,
      price: Number(draft.price) || 0,
      bedrooms: Number(draft.bedrooms) || 0,
      bathrooms: Number(draft.bathrooms) || 0,
      area: Number(draft.area) || 0,
    });
    onOpenChange(false);
  };

  if (mode === "edit" && !property) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto border-slate-200/80 p-0 sm:max-w-lg">
        <div className="h-1.5 bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy" aria-hidden />
        {!draft ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500" style={{ fontWeight: 500 }}>
            Cargando formulario…
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="border-b border-slate-100 px-6 pb-4 pt-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="font-heading text-xl text-brand-navy" style={{ fontWeight: 600 }}>
                {mode === "create" ? "Nueva propiedad" : "Editar propiedad"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                Completa los datos del inmueble. La ficha será visible en el sitio público.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-4">
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
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-brand-red-hover text-primary-foreground"
            >
              {mode === "create" ? "Crear propiedad" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

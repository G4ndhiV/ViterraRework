import { Link } from "react-router";
import { Bed, Bath, Square, MapPin, Heart, X } from "lucide-react";
import { useState, useCallback } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cn } from "./ui/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  type: string;
  status: "venta" | "alquiler";
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface PropertyCardProps {
  property: Property;
  /** editorial: líneas rectas, tipografía manual Viterra, menos “app” */
  variant?: "default" | "editorial";
  /**
   * Listado del mapa: la superficie de la tarjeta solo marca selección en el mapa.
   * El modal se abre solo desde “Vista previa”; “Ver detalles” va a la ficha.
   */
  mapSearchSelection?: boolean;
  onMapSearchSelect?: () => void;
}

export function PropertyCard({
  property,
  variant = "default",
  mapSearchSelection = false,
  onMapSearchSelect,
}: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const ed = variant === "editorial";

  const openPreview = useCallback(() => setPreviewOpen(true), []);

  const handleMapSearchSurface = useCallback(() => {
    onMapSearchSelect?.();
  }, [onMapSearchSelect]);

  return (
    <>
      <article
        className={cn(
          "overflow-hidden border transition-all duration-500 ease-out group",
          ed
            ? "rounded-xl border-white/25 bg-transparent shadow-[0_22px_56px_-14px_rgba(20,28,46,0.55)] ring-1 ring-inset ring-white/10 hover:-translate-y-1 hover:shadow-[0_30px_72px_-12px_rgba(20,28,46,0.62)] hover:border-white/40"
            : "rounded-lg border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl hover:-translate-y-1"
        )}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={mapSearchSelection ? handleMapSearchSurface : openPreview}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (mapSearchSelection) handleMapSearchSurface();
              else openPreview();
            }
          }}
          className={cn(
            "block w-full text-left relative overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            ed ? "aspect-[4/3] h-auto min-h-[240px]" : "h-64"
          )}
        >
          <ImageWithFallback
            src={property.image}
            alt={property.title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700",
              ed ? "group-hover:scale-[1.03]" : "group-hover:scale-110"
            )}
          />
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />
          {ed && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-canvas/50 via-brand-canvas/15 to-transparent"
              aria-hidden
            />
          )}
          <div className={cn("absolute flex flex-wrap gap-1.5", ed ? "top-3.5 left-3.5" : "top-4 left-4")}>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground backdrop-blur-sm border",
                ed
                  ? "rounded-md border-primary/25 bg-primary px-3 py-1.5 shadow-md shadow-black/25"
                  : "border-white/20 px-3 py-1.5 rounded-lg"
              )}
              style={!ed ? { backgroundColor: "rgba(200, 16, 46, 0.9)", borderColor: "#C8102E" } : undefined}
            >
              {property.status === "venta" ? "En venta" : "En alquiler"}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm border",
                ed
                  ? "rounded-md border-white/55 bg-white/92 px-3 py-1.5 text-brand-navy shadow-sm shadow-black/10"
                  : "px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 border-slate-200"
              )}
            >
              {property.type}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className={cn(
              "absolute z-[1] backdrop-blur-sm flex items-center justify-center transition-all duration-300 border",
              ed
                ? "top-3.5 right-3.5 h-10 w-10 rounded-full border-white/50 bg-white/88 text-brand-navy/55 shadow-md shadow-black/15 hover:scale-105 hover:border-white/70 hover:bg-white/95 hover:text-brand-navy"
                : "top-4 right-4 w-10 h-10 bg-white/90 rounded-full border-slate-200 hover:bg-white hover:scale-110"
            )}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-all",
                isFavorite ? "scale-110" : ed ? "text-brand-navy/50" : "text-slate-600"
              )}
              style={isFavorite ? { fill: "#C8102E", color: "#C8102E" } : {}}
              strokeWidth={1.5}
            />
          </button>
        </div>

        <div
          className={cn(
            ed
              ? "border-t border-white/25 bg-brand-glass-fill-strong p-6 backdrop-blur-xl md:p-7"
              : "p-6"
          )}
        >
          <button
            type="button"
            onClick={mapSearchSelection ? handleMapSearchSurface : openPreview}
            className="w-full text-left"
          >
            <h3
              className={cn(
                "text-slate-900 mb-2 transition-colors tracking-tight",
                ed
                  ? "font-heading text-lg font-medium text-brand-navy group-hover:text-brand-burgundy"
                  : "text-xl font-semibold hover:text-slate-700"
              )}
              style={!ed ? { fontWeight: 600 } : undefined}
            >
              {property.title}
            </h3>
          </button>

          <div className={cn("mb-4 flex items-center gap-1", ed ? "text-brand-navy/60" : "text-slate-600")}>
            <MapPin className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span className={cn("text-sm", ed ? "font-normal tracking-wide" : "font-medium")} style={!ed ? { fontWeight: 500 } : undefined}>
              {property.location}
            </span>
          </div>

          <div className={cn("mb-5 flex items-center gap-5", ed ? "text-brand-navy/70" : "text-slate-600")}>
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Square className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">{property.area} m²</span>
            </div>
          </div>

          <div
            className={cn(
              "flex gap-4 border-t pt-5",
              ed
                ? "flex-col items-stretch border-brand-navy/12 sm:flex-row sm:items-center sm:justify-between"
                : "items-center justify-between border-slate-200"
            )}
          >
            <div className={ed ? "min-w-0" : undefined}>
              <p className={cn("text-slate-900", ed ? "font-heading text-2xl font-medium tracking-tight text-brand-navy" : "text-2xl font-semibold")} style={!ed ? { fontWeight: 700 } : undefined}>
                ${property.price.toLocaleString()}
              </p>
              {property.status === "alquiler" && (
                <p className={cn("text-xs font-medium", ed ? "mt-0.5 font-tertiary italic text-brand-navy/55" : "text-slate-500")} style={!ed ? { fontWeight: 500 } : undefined}>
                  por mes
                </p>
              )}
            </div>
            {ed ? (
              <button
                type="button"
                onClick={mapSearchSelection ? handleMapSearchSurface : openPreview}
                className="w-full shrink-0 rounded-md border border-brand-navy/18 bg-white/50 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-navy shadow-sm backdrop-blur-sm transition-all hover:border-primary hover:bg-primary/10 hover:text-primary sm:w-auto sm:py-2"
              >
                Ver detalle
              </button>
            ) : mapSearchSelection ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={openPreview}
                  className="rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition-all hover:border-primary hover:text-primary"
                  style={{ fontWeight: 600 }}
                >
                  Vista previa
                </button>
                <Link
                  to={`/propiedades/${property.id}`}
                  onClick={() => onMapSearchSelect?.()}
                  className="group/btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ fontWeight: 600, backgroundColor: "#C8102E" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#a00d25")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C8102E")}
                >
                  Ver detalles
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={openPreview}
                className="group/btn px-5 py-2.5 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm font-medium inline-flex items-center gap-2"
                style={{ fontWeight: 600, backgroundColor: "#C8102E" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#a00d25")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C8102E")}
              >
                Ver Detalles
              </button>
            )}
          </div>
        </div>
      </article>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[min(92dvh,600px)] w-[calc(100%-1.5rem)] max-w-[400px] gap-0 overflow-hidden rounded-sm border-0 bg-transparent p-0 shadow-none sm:w-full [&>button]:hidden">
          <div className="flex max-h-[inherit] flex-col overflow-hidden rounded-sm border border-slate-300 bg-white shadow-[0_20px_50px_rgba(20,28,46,0.28)]">
            <div className="relative h-[min(38vh,188px)] min-h-[160px] shrink-0 overflow-hidden bg-brand-navy sm:h-[188px]">
              <ImageWithFallback src={property.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button
                type="button"
                aria-label="Cerrar vista previa"
                onClick={() => setPreviewOpen(false)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-sm border border-white/40 bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
              <div className="absolute bottom-2.5 left-2.5 flex max-w-[calc(100%-2.75rem)] flex-wrap gap-1.5">
                <span className="rounded-sm bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                  {property.status === "venta" ? "En venta" : "En alquiler"}
                </span>
                <span className="rounded-sm border border-white/60 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-navy">
                  {property.type}
                </span>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col border-t-4 border-primary bg-white px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-4">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="font-heading line-clamp-2 text-left text-base font-semibold leading-snug text-brand-navy sm:text-lg">
                  {property.title}
                </DialogTitle>
                <DialogDescription className="flex items-start gap-1.5 text-left text-xs leading-snug text-slate-600" style={{ fontWeight: 500 }}>
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.5} />
                  <span className="line-clamp-2">{property.location}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 flex border border-slate-300 bg-slate-50/80 text-[11px] text-slate-800 sm:text-xs">
                <div className="flex flex-1 flex-col items-center gap-1 border-r border-slate-300 py-2.5">
                  <Bed className="h-3.5 w-3.5 text-brand-navy" strokeWidth={1.5} />
                  <span className="font-medium tabular-nums">{property.bedrooms} rec.</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1 border-r border-slate-300 py-2.5">
                  <Bath className="h-3.5 w-3.5 text-brand-navy" strokeWidth={1.5} />
                  <span className="font-medium tabular-nums">{property.bathrooms} baños</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1 py-2.5">
                  <Square className="h-3.5 w-3.5 text-brand-navy" strokeWidth={1.5} />
                  <span className="font-medium tabular-nums">{property.area} m²</span>
                </div>
              </div>

              <div className="mt-3 border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Precio</p>
                <p className="font-heading mt-1 text-xl font-semibold tabular-nums text-brand-navy sm:text-2xl">
                  ${property.price.toLocaleString()}
                  {property.status === "alquiler" && (
                    <span className="ml-1.5 font-tertiary text-sm font-normal not-italic text-slate-600">/ mes</span>
                  )}
                </p>
              </div>

              <DialogFooter className="mt-4 flex w-full flex-col gap-2 p-0 sm:mt-4">
                <Button
                  type="button"
                  className="font-heading h-10 w-full rounded-sm bg-primary text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground hover:bg-brand-red-hover"
                  asChild
                >
                  <Link to={`/propiedades/${property.id}`} onClick={() => setPreviewOpen(false)}>
                    Ver ficha completa
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="w-full py-1.5 text-center text-xs font-medium uppercase tracking-wide text-slate-600 transition-colors hover:text-brand-navy"
                >
                  Seguir explorando
                </button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

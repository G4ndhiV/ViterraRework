import { Building2, Calendar, MapPin, Star } from "lucide-react";
import type { Development } from "../../../data/developments";
import { displayDeliveryDate } from "../../../data/developments";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { cn } from "../../ui/utils";

type Props = {
  draft: Development;
  className?: string;
};

export function DevelopmentFormPreview({ draft, className }: Props) {
  const cover = draft.images?.[0] ?? draft.image;

  return (
    <div className={cn("sticky top-5", className)}>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        Vista previa · sitio público
      </p>
      <article className="overflow-hidden border border-brand-navy/[0.08] bg-white shadow-[0_20px_50px_-24px_rgba(20,28,46,0.35)]">
        <div className="relative aspect-[5/4] overflow-hidden bg-stone-100">
          {cover ? (
            <ImageWithFallback src={cover} alt={draft.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Building2 className="h-10 w-10 opacity-30" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
          <span className="absolute left-3 top-3 border border-white/20 bg-brand-navy/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            {draft.status}
          </span>
          {draft.featured ? (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 bg-amber-400/95 px-2 py-1 text-[10px] font-bold uppercase text-amber-950">
              <Star className="h-3 w-3 fill-current" />
              Destacado
            </span>
          ) : null}
        </div>
        <div className="border-t border-brand-navy/[0.06] p-5">
          {draft.type?.trim() ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{draft.type}</p>
          ) : null}
          <h3 className="font-heading mt-1 line-clamp-2 text-lg font-semibold text-brand-navy">
            {draft.name || "Sin nombre"}
          </h3>
          {(draft.location || draft.colony) && (
            <p className="mt-2 flex items-start gap-1.5 text-[13px] text-brand-navy/45">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{[draft.location, draft.colony].filter(Boolean).join(" · ")}</span>
            </p>
          )}
          <div className="mt-4 space-y-1.5 border-t border-brand-navy/[0.06] pt-3 text-[11px] text-slate-600">
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Entrega: {displayDeliveryDate(draft.deliveryDate)}
            </p>
            <p>
              <span className="font-semibold text-brand-navy">{draft.units}</span> unidades
            </p>
            <p className="font-medium text-brand-navy">{draft.priceRange || "Rango por definir"}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

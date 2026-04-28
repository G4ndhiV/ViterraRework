import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Bath,
  Briefcase,
  Building2,
  Car,
  Cctv,
  Dog,
  Droplets,
  Fence,
  Flame,
  Home,
  Landmark,
  Package,
  Shield,
  Store,
  Sun,
  TreePine,
  Users,
  UtensilsCrossed,
  Volleyball,
  Waves,
  Wifi,
  Wind,
  Wrench,
  Zap,
  Dumbbell,
  Mountain,
} from "lucide-react";
import { cn } from "./ui/utils";

/** Normaliza texto para buscar palabras clave (acentos → ASCII). */
function foldFeatureLabel(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Icono sugerido según el texto del ítem (amenidad/servicio/extra).
 * Cubre términos frecuentes en español de catálogos Tokko.
 */
function iconForFeatureLabel(label: string): LucideIcon | null {
  const n = foldFeatureLabel(label);
  const rules: { test: RegExp; Icon: LucideIcon }[] = [
    { test: /alberca|piscina|pool/, Icon: Waves },
    { test: /pileta/, Icon: Waves },
    { test: /gimnasio|\bgym\b/, Icon: Dumbbell },
    { test: /seguridad|vigilancia|portero|caseta/, Icon: Shield },
    { test: /cctv|camara|videovigilancia/, Icon: Cctv },
    { test: /parrill|asador|bbq/, Icon: Flame },
    { test: /mascota|pet/, Icon: Dog },
    { test: /wifi|internet|fibra/, Icon: Wifi },
    { test: /agua|cloaca|desague|drenaje|potable/, Icon: Droplets },
    { test: /electric|luz\b|alumbrad/, Icon: Zap },
    { test: /gas\b|natural/, Icon: Flame },
    { test: /aire|acondicionado|climat|minisplit/, Icon: Wind },
    { test: /parque|jardin|verde|arbol|pet park/, Icon: TreePine },
    { test: /estacion|cochera|parking|garage/, Icon: Car },
    { test: /cocina|comedor/, Icon: UtensilsCrossed },
    { test: /spa|hidromas|sauna|jacuzzi/, Icon: Bath },
    { test: /oficina|cowork|escritorio/, Icon: Briefcase },
    { test: /sala de reuniones|reuniones/, Icon: Briefcase },
    { test: /niño|kids|infantil|juego/, Icon: Baby },
    { test: /deport|sport|pickle|padel|cancha|golf|simulador/, Icon: Volleyball },
    { test: /sala de juegos|playroom/, Icon: Volleyball },
    { test: /roof|terraza|balcon|deck/, Icon: Home },
    { test: /patio|jardin/, Icon: TreePine },
    { test: /living|comedor diario/, Icon: Home },
    { test: /vista|panoram|montaña/, Icon: Mountain },
    { test: /sum|salon|eventos/, Icon: Users },
    { test: /centro comercial|plaza|comercial/, Icon: Store },
    { test: /yoga|pilates|meditacion/, Icon: Home },
    { test: /lavander|lavadero|lavado/, Icon: Droplets },
    { test: /vestidor/, Icon: Home },
    { test: /biblioteca/, Icon: Landmark },
    { test: /dependencia|baño de servicio|bano de servicio/, Icon: Bath },
    { test: /baulera|altillo|sotano|deposito/, Icon: Package },
    { test: /paviment|via publica|alumbrad public/, Icon: Fence },
    { test: /escritura|notaria|potencial alto para alquilar/, Icon: Landmark },
    { test: /ilumin|natural|luminosidad/, Icon: Sun },
    { test: /elevador|ascensor/, Icon: Building2 },
  ];
  for (const { test, Icon } of rules) {
    if (test.test(n)) return Icon;
  }
  return null;
}

const CATEGORY_STYLES = {
  amenity: {
    sectionIcon: "text-slate-600",
    cardIcon: "text-slate-500",
  },
  service: {
    sectionIcon: "text-slate-600",
    cardIcon: "text-slate-500",
  },
  extra: {
    sectionIcon: "text-slate-600",
    cardIcon: "text-slate-500",
  },
} as const;

export function FeatureSection({
  variant,
  title,
  items,
  keyPrefix,
}: {
  variant: keyof typeof CATEGORY_STYLES;
  title: string;
  items: string[];
  keyPrefix: string;
}) {
  if (items.length === 0) return null;
  const meta = CATEGORY_STYLES[variant];
  const SectionIcon = variant === "amenity" ? Home : variant === "service" ? Wrench : Package;
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <SectionIcon className={cn("h-5 w-5 shrink-0", meta.sectionIcon)} strokeWidth={1.8} aria-hidden />
        <h4 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>
          {title}
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((feature, idx) => {
          const ItemIcon = iconForFeatureLabel(feature);
          return (
            <div
              key={`${keyPrefix}-${idx}`}
              className={cn(
                "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                ItemIcon ? "flex items-center gap-3" : "block"
              )}
            >
              {ItemIcon ? <ItemIcon className={cn("h-4.5 w-4.5 shrink-0", meta.cardIcon)} strokeWidth={1.8} /> : null}
              <p className="min-w-0 flex-1 text-sm font-medium leading-normal text-slate-900" style={{ fontWeight: 500 }}>
                {feature}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

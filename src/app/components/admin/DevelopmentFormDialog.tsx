import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { copyPublicPageUrl } from "../../lib/copyPublicLink";
import type { Development } from "../../data/developments";
import type { Property } from "../PropertyCard";
import {
  AlignLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  ImageIcon,
  Layers,
  Link2,
  ListChecks,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { DevelopmentAmenitiesSection } from "./developmentForm/DevelopmentAmenitiesSection";
import { DevelopmentContactSection } from "./developmentForm/DevelopmentContactSection";
import { DevelopmentDescriptionSection } from "./developmentForm/DevelopmentDescriptionSection";
import { DevelopmentFichaSection } from "./developmentForm/DevelopmentFichaSection";
import { DevelopmentFormPreview } from "./developmentForm/DevelopmentFormPreview";
import { DevelopmentInventorySection } from "./developmentForm/DevelopmentInventorySection";
import {
  defaultDeliveryDateForStatus,
  validateDeliveryDateForSave,
} from "../../lib/developmentDeliveryYear";
import { previewDevelopmentReferenceCode } from "../../lib/developmentReferenceCode";
import { isValidPhoneForCall } from "../../lib/phoneLink";
import { isValidWhatsappLinkInput } from "../../lib/whatsappLink";
import { DevelopmentLocationSection } from "./developmentForm/DevelopmentLocationSection";
import { DevelopmentMediaSection } from "./developmentForm/DevelopmentMediaSection";
import {
  DEVELOPMENT_FORM_STEPS,
  DevelopmentFormStepId,
} from "./developmentForm/developmentFormUi";

const DEFAULT_DEV_IMAGE =
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1280&q=80";

const STEP_ICONS: Record<DevelopmentFormStepId, typeof ImageIcon> = {
  medios: ImageIcon,
  ficha: FileText,
  ubicacion: MapPin,
  descripcion: AlignLeft,
  amenidades: ListChecks,
  contacto: Phone,
  inventario: Layers,
};

function emptyDevelopmentDraft(id: string): Development {
  return {
    id,
    name: "",
    location: "",
    colony: "",
    fullAddress: "",
    type: "",
    description: "",
    image: DEFAULT_DEV_IMAGE,
    images: [DEFAULT_DEV_IMAGE],
    status: "Disponible",
    units: 0,
    deliveryDate: defaultDeliveryDateForStatus("Disponible"),
    priceRange: "Por definir",
    amenities: [],
    services: [],
    additionalFeatures: [],
    developmentUnits: [],
    videos: [],
    tours3d: [],
    richDescription: "",
    coordinates: { lat: 20.676208, lng: -103.34721 },
    featured: false,
    displayOnWeb: true,
    inChargePhone: "",
    inChargeWhatsapp: "",
    inChargeEmail: "",
    inChargeName: "",
  };
}

function developmentFromSource(d: Development): Development {
  const gallery = d.images?.length ? [...d.images] : d.image ? [d.image] : [DEFAULT_DEV_IMAGE];
  return {
    ...d,
    image: gallery[0] ?? DEFAULT_DEV_IMAGE,
    images: gallery,
    amenities: d.amenities ?? [],
    services: d.services ?? [],
    additionalFeatures: d.additionalFeatures ?? [],
    developmentUnits: d.developmentUnits ?? [],
    coordinates: d.coordinates ?? { lat: 20.676208, lng: -103.34721 },
    inChargePhone: d.inChargePhone ?? "",
    inChargeWhatsapp: d.inChargeWhatsapp ?? "",
    inChargeEmail: d.inChargeEmail ?? "",
    inChargeName: d.inChargeName ?? "",
    richDescription: d.richDescription ?? "",
    videos: d.videos ?? [],
    tours3d: d.tours3d ?? [],
    displayOnWeb: d.displayOnWeb !== false,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  development: Development | null;
  newId: string;
  onSave: (development: Development) => void | boolean | Promise<void | boolean>;
  readOnly?: boolean;
  catalogProperties?: Property[];
  propertiesLoading?: boolean;
  propertyLinking?: boolean;
  onLinkProperty?: (property: Property, linkTokkoId: string) => void | Promise<void>;
  onUnlinkProperty?: (property: Property) => void | Promise<void>;
  onEditProperty?: (property: Property) => void;
};

export function DevelopmentFormDialog({
  open,
  onOpenChange,
  mode,
  development,
  newId,
  onSave,
  readOnly = false,
  catalogProperties = [],
  propertiesLoading = false,
  propertyLinking = false,
  onLinkProperty,
  onUnlinkProperty,
  onEditProperty,
}: Props) {
  const [draft, setDraft] = useState<Development | null>(null);
  const [activeStep, setActiveStep] = useState<DevelopmentFormStepId>("medios");
  const developmentId = mode === "create" ? newId : development?.id ?? newId;
  const client = getSupabaseClient();

  useEffect(() => {
    if (!open) return;
    setActiveStep("medios");
    if (mode === "edit" && development) {
      setDraft(developmentFromSource(development));
    } else if (mode === "create") {
      setDraft(emptyDevelopmentDraft(newId));
    }
  }, [open, mode, development, newId]);

  const patchDraft = (patch: Partial<Development>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || readOnly || saving) return;
    if (!draft.name.trim()) {
      window.alert("Indica un nombre para el desarrollo.");
      setActiveStep("ficha");
      return;
    }
    if (!draft.location.trim()) {
      window.alert("Indica la ubicación.");
      setActiveStep("ubicacion");
      return;
    }
    if (!draft.type.trim()) {
      window.alert("Indica el tipo de desarrollo.");
      setActiveStep("descripcion");
      return;
    }
    const deliveryErr = validateDeliveryDateForSave(draft.deliveryDate, draft.status);
    if (deliveryErr) {
      window.alert(deliveryErr);
      setActiveStep("ficha");
      return;
    }
    const phone = draft.inChargePhone?.trim() ?? "";
    if (phone && !isValidPhoneForCall(phone)) {
      window.alert("El teléfono debe tener al menos 10 dígitos (con lada) para el botón Llamar en la ficha pública.");
      setActiveStep("contacto");
      return;
    }
    const wa = draft.inChargeWhatsapp?.trim() ?? "";
    if (wa && !isValidWhatsappLinkInput(wa)) {
      window.alert(
        "El enlace de WhatsApp debe ser de wa.me / whatsapp.com o un número con al menos 10 dígitos (no uses enlaces de mapas u otros sitios).",
      );
      setActiveStep("contacto");
      return;
    }
    const gallery =
      draft.images && draft.images.length > 0
        ? draft.images
        : draft.image
          ? [draft.image]
          : [DEFAULT_DEV_IMAGE];
    setSaving(true);
    try {
      const result = onSave({
        ...draft,
        id: developmentId,
        name: draft.name.trim(),
        location: draft.location.trim(),
        colony: draft.colony.trim() || draft.location.trim(),
        fullAddress: draft.fullAddress.trim() || draft.location.trim(),
        type: draft.type.trim(),
        description: draft.description.trim() || "Sin descripción",
        richDescription: draft.richDescription?.trim() || undefined,
        videos: draft.videos,
        tours3d: draft.tours3d,
        inChargeWhatsapp: draft.inChargeWhatsapp?.trim() || undefined,
        image: gallery[0] ?? DEFAULT_DEV_IMAGE,
        images: gallery,
        deliveryDate: draft.deliveryDate.trim() || "Por definir",
        featured: Boolean(draft.featured),
        displayOnWeb: draft.displayOnWeb !== false,
        inChargePhone: draft.inChargePhone?.trim() ?? "",
        inChargeEmail: draft.inChargeEmail?.trim() ?? "",
        inChargeName: draft.inChargeName?.trim() || undefined,
        tokkoId: development?.tokkoId ?? draft.tokkoId,
        referenceCode:
          development?.referenceCode ??
          draft.referenceCode ??
          previewDevelopmentReferenceCode(draft.referenceCode, draft.tokkoId, developmentId),
        developmentUnits: development?.developmentUnits ?? draft.developmentUnits ?? [],
        payload: development?.payload ?? draft.payload,
      });
      const ok = result instanceof Promise ? await result : result !== false;
      if (ok !== false) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit" && !development) return null;

  const stepIndex = DEVELOPMENT_FORM_STEPS.findIndex((s) => s.id === activeStep);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      key={mode === "edit" && development ? development.id : `create-${newId}`}
    >
      <DialogContent
        hideCloseButton
        className={cn(
          "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-row gap-0 overflow-hidden rounded-none border-0 bg-stone-100 p-0 shadow-none",
        )}
      >
        {!draft ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Cargando…</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 w-full flex-1">
            <aside className="hidden w-[17rem] shrink-0 flex-col border-r border-white/10 bg-brand-navy text-white md:flex">
              <div className="border-b border-white/10 px-5 py-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">Desarrollos</p>
                <h2 className="font-heading mt-1 text-xl font-semibold tracking-tight">
                  {mode === "create" ? "Nuevo desarrollo" : "Editar desarrollo"}
                </h2>
                <p className="mt-1 text-xs text-white/65">
                  Paso {stepIndex + 1} de {DEVELOPMENT_FORM_STEPS.length}
                </p>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                {DEVELOPMENT_FORM_STEPS.map((step, i) => {
                  const Icon = STEP_ICONS[step.id];
                  const active = activeStep === step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                        active
                          ? "bg-white/12 text-white ring-1 ring-white/20"
                          : "text-white/75 hover:bg-white/8",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                          active ? "bg-primary text-white" : "bg-white/10",
                        )}
                      >
                        {active ? <Icon className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{step.label}</span>
                        <span className="block text-[11px] text-white/55">{step.short}</span>
                      </span>
                      {active ? <ChevronRight className="h-4 w-4 shrink-0 opacity-80" /> : null}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-stone-200/90 bg-white px-4 py-3 sm:px-6">
                <select
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium md:hidden"
                  value={activeStep}
                  onChange={(e) => setActiveStep(e.target.value as DevelopmentFormStepId)}
                >
                  {DEVELOPMENT_FORM_STEPS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => copyPublicPageUrl(`/desarrollos/${draft.id}`)}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => window.open(`/desarrollos/${draft.id}`, "_blank", "noopener")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver en sitio
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="rounded-xl">
                      <X className="mr-2 h-4 w-4" />
                      Cerrar
                    </Button>
                  </DialogClose>
                  {!readOnly ? (
                    <Button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-primary px-5 font-semibold shadow-md"
                    >
                      {saving
                        ? "Guardando…"
                        : mode === "create"
                          ? "Crear desarrollo"
                          : "Guardar"}
                    </Button>
                  ) : null}
                </div>
              </header>

              <div className="flex min-h-0 flex-1">
                <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
                  <div className="mx-auto max-w-3xl space-y-6">
                    {activeStep === "medios" && (
                      <DevelopmentMediaSection
                        client={client}
                        developmentId={developmentId}
                        draft={draft}
                        onDraftChange={patchDraft}
                      />
                    )}
                    {activeStep === "ficha" && (
                      <DevelopmentFichaSection
                        draft={draft}
                        onDraftChange={patchDraft}
                        readOnly={readOnly}
                      />
                    )}
                    {activeStep === "ubicacion" && (
                      <DevelopmentLocationSection draft={draft} onDraftChange={patchDraft} />
                    )}
                    {activeStep === "descripcion" && (
                      <DevelopmentDescriptionSection
                        draft={draft}
                        onDraftChange={patchDraft}
                        readOnly={readOnly}
                      />
                    )}
                    {activeStep === "amenidades" && (
                      <DevelopmentAmenitiesSection draft={draft} onDraftChange={patchDraft} />
                    )}
                    {activeStep === "contacto" && (
                      <DevelopmentContactSection
                        draft={draft}
                        onDraftChange={patchDraft}
                        readOnly={readOnly}
                      />
                    )}
                    {activeStep === "inventario" && (
                      <DevelopmentInventorySection
                        draft={draft}
                        catalogProperties={catalogProperties}
                        propertiesLoading={propertiesLoading}
                        linking={propertyLinking}
                        onLinkProperty={onLinkProperty}
                        onUnlinkProperty={onUnlinkProperty}
                        onEditProperty={onEditProperty}
                      />
                    )}
                  </div>
                </main>
                <aside className="hidden w-[17.5rem] shrink-0 overflow-y-auto border-l border-stone-200/80 bg-stone-50/50 p-5 lg:block xl:w-[19rem]">
                  <DevelopmentFormPreview draft={draft} />
                </aside>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

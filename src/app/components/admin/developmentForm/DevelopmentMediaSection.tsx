import { type ReactNode } from "react";
import { Box, Check, Film, ImageIcon } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cn } from "../../ui/utils";
import type { Development } from "../../../data/developments";
import { developmentTours3dList, developmentVideosList } from "../../../lib/developmentMedia";
import { uploadDevelopmentImage, uploadDevelopmentVideo } from "../../../lib/supabasePropertyMedia";
import { PropertyPhotosEditor } from "../propertyForm/PropertyPhotosEditor";
import { PropertyTours3dEditor } from "../propertyForm/PropertyTours3dEditor";
import { PropertyVideosEditor } from "../propertyForm/PropertyVideosEditor";
import { DevelopmentFormSection } from "./developmentFormUi";

type Props = {
  client: SupabaseClient | null;
  developmentId: string;
  draft: Development;
  onDraftChange: (patch: Partial<Development>) => void;
};

function MediaPanel({
  icon: Icon,
  title,
  description,
  active,
  children,
}: {
  icon: typeof Film;
  title: string;
  description: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition",
        active ? "border-primary/30 ring-1 ring-primary/15" : "border-stone-200/90",
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            active ? "bg-primary/10 text-primary" : "bg-stone-100 text-slate-500",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-heading text-sm font-semibold text-brand-navy">{title}</h4>
            {active ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Check className="h-3 w-3" />
                Activo
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function DevelopmentMediaSection({ client, developmentId, draft, onDraftChange }: Props) {
  const images = draft.images?.length > 0 ? draft.images : draft.image ? [draft.image] : [];
  const videos = developmentVideosList(draft);
  const tours3d = developmentTours3dList(draft);
  const hasVideo = videos.length > 0;
  const hasTour = tours3d.length > 0;

  const onImagesChange = (next: string[]) => {
    onDraftChange({
      images: next,
      image: next[0] ?? "",
    });
  };

  const onUploadFile = client
    ? (file: File) => uploadDevelopmentImage(client, developmentId, file)
    : undefined;

  return (
    <div className="space-y-6">
      <DevelopmentFormSection
        icon={ImageIcon}
        title="Galería"
        description="Fotos del desarrollo en el sitio público. La primera imagen es la portada."
      >
        <PropertyPhotosEditor
          images={images}
          onChange={onImagesChange}
          onUploadFile={onUploadFile}
          disabled={!client}
        />
        {!client ? (
          <p className="mt-3 text-[11px] text-amber-700">
            Conecta Supabase para subir imágenes a Storage.
          </p>
        ) : null}
      </DevelopmentFormSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <MediaPanel
          icon={Film}
          title="Videos"
          description="Enlaces (YouTube, Vimeo) y/o archivos subidos en la ficha del desarrollo."
          active={hasVideo}
        >
          <PropertyVideosEditor
            client={client}
            propertyId={developmentId}
            videos={videos}
            uploadVideo={uploadDevelopmentVideo}
            maxVideosLabel="desarrollo"
            onChange={(next) =>
              onDraftChange({
                videos: next,
                videoUrl: undefined,
              })
            }
          />
        </MediaPanel>

        <MediaPanel
          icon={Box}
          title="Recorrido 3D"
          description="Enlaces Matterport, Kuula u otro visor embebible."
          active={hasTour}
        >
          <PropertyTours3dEditor
            tours={tours3d}
            onChange={(next) =>
              onDraftChange({
                tours3d: next,
                tour3dUrl: undefined,
              })
            }
          />
        </MediaPanel>
      </div>
    </div>
  );
}

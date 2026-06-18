import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Loader2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { cropImageToDataUrl } from "../../../lib/cropImage";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

type Props = {
  open: boolean;
  imageSrc: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dataUrl: string) => void;
};

export function ProfilePictureCropDialog({ open, imageSrc, onOpenChange, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [processing, setProcessing] = useState(false);
  const resetKey = useRef(0);

  useEffect(() => {
    if (!open || !imageSrc) return;
    resetKey.current += 1;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setMediaSize(null);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const dataUrl = await cropImageToDataUrl(imageSrc, croppedAreaPixels, 512, 0.88);
      onConfirm(dataUrl);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo recortar la imagen.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border border-slate-200/90 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-slate-200/80 px-5 py-4 text-left">
          <DialogTitle className="font-heading text-lg text-brand-navy">Recortar foto</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Ajusta el encuadre y el zoom. La foto se guardará como cuadrado para tu perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[min(55vw,280px)] w-full bg-slate-900 sm:h-[320px]">
          {imageSrc ? (
            <Cropper
              key={resetKey.current}
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={setMediaSize}
            />
          ) : null}
        </div>

        <div className="space-y-2 border-b border-slate-200/80 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Zoom
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-primary"
            aria-label="Zoom del recorte"
          />
          {mediaSize ? (
            <p className="text-[10px] text-slate-500">
              Original {mediaSize.naturalWidth}×{mediaSize.naturalHeight}px
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 px-5 py-4 sm:gap-2">
          <Button type="button" variant="outline" disabled={processing} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-primary hover:bg-primary/90"
            disabled={processing || !croppedAreaPixels}
            onClick={() => void handleConfirm()}
          >
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Usar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

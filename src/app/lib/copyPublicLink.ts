import { toast } from "sonner";
import { publicPageUrl } from "./publicListingUrl";

/** Copia la URL absoluta del sitio para una ruta pública (p. ej. `/propiedades/1`). */
export function copyPublicPageUrl(path: string): void {
  const url = publicPageUrl(path);

  void navigator.clipboard.writeText(url).then(
    () => {
      toast.success("Enlace copiado exitosamente");
    },
    () => {
      toast.error("No se pudo copiar el enlace");
    }
  );
}

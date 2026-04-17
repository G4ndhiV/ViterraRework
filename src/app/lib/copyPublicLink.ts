import { toast } from "sonner";

/** Copia la URL absoluta del sitio para una ruta pública (p. ej. `/propiedades/1`). */
export function copyPublicPageUrl(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url =
    typeof window !== "undefined" ? `${window.location.origin}${normalized}` : normalized;

  void navigator.clipboard.writeText(url).then(
    () => {
      toast.success("Enlace copiado exitosamente");
    },
    () => {
      toast.error("No se pudo copiar el enlace");
    }
  );
}

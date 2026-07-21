import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Cloud, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { getSupabaseClient } from "../../lib/supabaseClient";

type SyncStep = "idle" | "syncing" | "done" | "error";

/** Modos del recurso "properties" en tokko-sync (ninguno borra propiedades). */
type ImportMode = "new_only" | "update_only" | "sync_all";

const MODE_OPTIONS: Array<{ value: ImportMode; label: string; description: string }> = [
  {
    value: "new_only",
    label: "Solo propiedades nuevas",
    description:
      "Trae únicamente las propiedades que aún no existen en el sitio. Las ya publicadas o editadas manualmente no se tocan.",
  },
  {
    value: "update_only",
    label: "Solo actualizar existentes",
    description:
      "Actualiza las propiedades que ya están en el sitio con los datos actuales de Tokko (precio, fotos, título, descripción…). Los cambios hechos solo en el CRM y no en Tokko se sobrescriben. No agrega nuevas.",
  },
  {
    value: "sync_all",
    label: "Importar nuevas y actualizar todo",
    description:
      "Agrega las propiedades nuevas y además actualiza las existentes con los datos actuales de Tokko. Los cambios hechos solo en el CRM y no en Tokko se sobrescriben.",
  },
];

type TokkoPropertiesSummary = {
  upserted: number;
  created?: number;
  updated?: number;
  skippedExisting?: number;
  skippedNew?: number;
  errors: string[];
};

type TokkoSyncResponse = {
  ok: boolean;
  error?: string;
  summary?: {
    properties?: TokkoPropertiesSummary;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
};

/** Extrae un mensaje de error legible de un FunctionsHttpError de supabase-js (ver provisionTokkoUser). */
async function messageFromFunctionsError(error: { message: string; context?: unknown }): Promise<string> {
  const ctx = error.context as { clone?: () => Response; response?: Response } | undefined;
  const maybeResponse =
    ctx && typeof ctx.clone === "function" ? (ctx as unknown as Response) : (ctx?.response ?? null);

  if (maybeResponse) {
    try {
      const parsed = (await maybeResponse.clone().json()) as { error?: string };
      if (parsed?.error) return parsed.error;
    } catch {
      try {
        const text = (await maybeResponse.clone().text()).trim();
        if (text) return text;
      } catch {
        // ignorado
      }
    }
  }

  if (/Failed to send|TypeError|fetch/i.test(error.message)) {
    return "No se pudo contactar la función tokko-sync. Verifica que esté desplegada (`supabase functions deploy tokko-sync`).";
  }
  return error.message;
}

/** Importa propiedades desde Tokko Broker: solo nuevas, solo actualizar existentes, o ambas. */
export function PropertyImportDialog({ open, onOpenChange, onImportComplete }: Props) {
  const [step, setStep] = useState<SyncStep>("idle");
  const [mode, setMode] = useState<ImportMode>("new_only");
  const [summary, setSummary] = useState<TokkoPropertiesSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedOption = MODE_OPTIONS.find((o) => o.value === mode) ?? MODE_OPTIONS[0];

  const handleImport = async () => {
    const client = getSupabaseClient();
    if (!client) {
      toast.error("Error de configuración: Supabase no disponible");
      return;
    }

    setStep("syncing");
    setErrorMessage(null);

    const { data, error } = await client.functions.invoke<TokkoSyncResponse>("tokko-sync", {
      // insertOnlyNew acompaña a propertiesMode a propósito: si la Edge Function desplegada
      // fuera una versión vieja que ignora propertiesMode, caería al modo "solo nuevas"
      // (seguro, sin sobrescribir ni borrar) en lugar del modo completo con borrado.
      body: { resources: ["properties"], propertiesMode: mode, insertOnlyNew: true, dryRun: false },
    });

    if (error) {
      const message = await messageFromFunctionsError(error);
      setErrorMessage(message);
      setStep("error");
      toast.error("No se pudo importar desde Tokko");
      return;
    }

    if (!data?.ok) {
      setErrorMessage(data?.error ?? "Respuesta inesperada del servidor");
      setStep("error");
      toast.error("No se pudo importar desde Tokko");
      return;
    }

    const propsSummary = data.summary?.properties ?? { upserted: 0, errors: [] };
    setSummary(propsSummary);
    setStep("done");

    const createdCount = propsSummary.created ?? propsSummary.upserted;
    const updatedCount = propsSummary.updated ?? 0;
    if (propsSummary.errors.length === 0) {
      if (createdCount === 0 && updatedCount === 0) {
        toast.success("No hay cambios que importar de Tokko");
      } else {
        const parts = [
          createdCount > 0 ? `${createdCount} nuevas` : null,
          updatedCount > 0 ? `${updatedCount} actualizadas` : null,
        ].filter(Boolean);
        toast.success(`Importación de Tokko: ${parts.join(" · ")}`);
      }
    } else {
      toast.warning(`${propsSummary.upserted} procesadas, ${propsSummary.errors.length} con errores`);
    }

    onImportComplete();
  };

  const handleClose = () => {
    onOpenChange(false);
    // Deja el resultado visible un momento tras cerrar; se resetea la próxima vez que se abra vacío.
    setTimeout(() => {
      setStep("idle");
      setMode("new_only");
      setSummary(null);
      setErrorMessage(null);
    }, 200);
  };

  const primaryLabel =
    mode === "new_only"
      ? "Buscar propiedades nuevas"
      : mode === "update_only"
        ? "Actualizar existentes"
        : "Importar y actualizar todo";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar de Tokko Broker</DialogTitle>
          <DialogDescription>
            {step === "idle" && "Sincroniza las propiedades de tu cuenta de Tokko Broker con el sitio."}
            {step === "syncing" && "Sincronizando con Tokko Broker..."}
            {step === "done" && "Importación completada."}
            {step === "error" && "Ocurrió un error al importar."}
          </DialogDescription>
        </DialogHeader>

        {step === "idle" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="tokko-import-mode"
                className="text-xs font-semibold uppercase tracking-widest text-slate-500"
              >
                Qué importar
              </label>
              <div className="relative">
                <select
                  id="tokko-import-mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ImportMode)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0"
                >
                  {MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="rounded-full bg-slate-200 p-2">
                <Cloud className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-slate-600">{selectedOption.description}</p>
            </div>

            {mode !== "new_only" && (
              <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-xs text-yellow-900">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <p>
                  Al actualizar, los datos de Tokko sobrescriben los del CRM (título incluido).
                  Si corregiste algo solo en el CRM, primero refléjalo en Tokko para no perderlo.
                  Nunca se eliminan propiedades.
                </p>
              </div>
            )}
          </div>
        )}

        {step === "syncing" && (
          <div className="space-y-3 py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-600" strokeWidth={1.5} />
            <p className="text-sm text-slate-600">
              Comparando tu catálogo con Tokko Broker. Esto puede tardar unos minutos si hay muchas
              propiedades.
            </p>
          </div>
        )}

        {step === "done" && summary && (
          <div className="space-y-3">
            <div
              className={`rounded-lg border p-4 ${
                summary.errors.length > 0
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {summary.errors.length > 0 ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" strokeWidth={2} />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" strokeWidth={2} />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      summary.errors.length > 0 ? "text-yellow-900" : "text-green-900"
                    }`}
                  >
                    {(() => {
                      const created = summary.created ?? summary.upserted;
                      const updated = summary.updated ?? 0;
                      if (created === 0 && updated === 0) return "Sin cambios: todo estaba al día";
                      const parts = [
                        created > 0 ? `${created} nueva${created === 1 ? "" : "s"}` : null,
                        updated > 0 ? `${updated} actualizada${updated === 1 ? "" : "s"}` : null,
                      ].filter(Boolean);
                      return `Propiedades: ${parts.join(" · ")}`;
                    })()}
                  </p>
                  {typeof summary.skippedExisting === "number" && summary.skippedExisting > 0 && (
                    <p className="mt-1 text-sm text-slate-600">
                      {summary.skippedExisting} ya existían y no se modificaron.
                    </p>
                  )}
                  {typeof summary.skippedNew === "number" && summary.skippedNew > 0 && (
                    <p className="mt-1 text-sm text-slate-600">
                      {summary.skippedNew} son nuevas en Tokko y no se agregaron (elige otra opción
                      para importarlas).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <p className="mb-2 font-medium">Errores:</p>
                <ul className="space-y-1 text-xs">
                  {summary.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === "error" && errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={2} />
            <p>{errorMessage}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            {step === "done" || step === "error" ? "Cerrar" : "Cancelar"}
          </Button>
          {step !== "syncing" && (
            <Button
              type="button"
              onClick={handleImport}
              className="bg-slate-900 text-white hover:bg-black"
            >
              {step === "idle" && primaryLabel}
              {step === "done" && "Ejecutar de nuevo"}
              {step === "error" && "Reintentar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

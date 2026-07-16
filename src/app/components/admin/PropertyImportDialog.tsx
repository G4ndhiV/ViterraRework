import { useState } from "react";
import { AlertCircle, CheckCircle2, Cloud, Loader2 } from "lucide-react";
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

type TokkoPropertiesSummary = {
  upserted: number;
  skippedExisting?: number;
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

/** Importa propiedades nuevas directamente desde Tokko Broker (sin tocar ni borrar las existentes). */
export function PropertyImportDialog({ open, onOpenChange, onImportComplete }: Props) {
  const [step, setStep] = useState<SyncStep>("idle");
  const [summary, setSummary] = useState<TokkoPropertiesSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImport = async () => {
    const client = getSupabaseClient();
    if (!client) {
      toast.error("Error de configuración: Supabase no disponible");
      return;
    }

    setStep("syncing");
    setErrorMessage(null);

    const { data, error } = await client.functions.invoke<TokkoSyncResponse>("tokko-sync", {
      body: { resources: ["properties"], insertOnlyNew: true, dryRun: false },
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

    if (propsSummary.errors.length === 0) {
      toast.success(
        propsSummary.upserted > 0
          ? `${propsSummary.upserted} propiedades nuevas importadas de Tokko`
          : "No hay propiedades nuevas en Tokko"
      );
    } else {
      toast.warning(`${propsSummary.upserted} importadas, ${propsSummary.errors.length} con errores`);
    }

    onImportComplete();
  };

  const handleClose = () => {
    onOpenChange(false);
    // Deja el resultado visible un momento tras cerrar; se resetea la próxima vez que se abra vacío.
    setTimeout(() => {
      setStep("idle");
      setSummary(null);
      setErrorMessage(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar de Tokko Broker</DialogTitle>
          <DialogDescription>
            {step === "idle" && "Trae las propiedades nuevas de tu cuenta de Tokko Broker al sitio."}
            {step === "syncing" && "Sincronizando con Tokko Broker..."}
            {step === "done" && "Importación completada."}
            {step === "error" && "Ocurrió un error al importar."}
          </DialogDescription>
        </DialogHeader>

        {step === "idle" && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="rounded-full bg-slate-200 p-3">
              <Cloud className="h-6 w-6 text-slate-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-600">
              Se conectará a tu cuenta de <strong>Tokko Broker</strong> y traerá únicamente las
              propiedades que aún no existen en el sitio. Las propiedades ya publicadas o editadas
              manualmente no se modifican ni se eliminan.
            </p>
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
                    {summary.upserted} propiedad{summary.upserted === 1 ? "" : "es"} nueva
                    {summary.upserted === 1 ? "" : "s"} importada{summary.upserted === 1 ? "" : "s"}
                  </p>
                  {typeof summary.skippedExisting === "number" && summary.skippedExisting > 0 && (
                    <p className="mt-1 text-sm text-slate-600">
                      {summary.skippedExisting} ya existían en el sitio y no se modificaron.
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
              {step === "idle" && "Buscar propiedades nuevas"}
              {step === "done" && "Buscar de nuevo"}
              {step === "error" && "Reintentar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { copyButtonClass } from "./profileUi";

type Props = {
  value: string;
  label?: string;
  disabled?: boolean;
};

export function ProfileCopyButton({ value, label = "Correo", disabled }: Props) {
  const [copied, setCopied] = useState(false);
  const trimmed = value.trim();

  if (!trimmed) {
    return <span className="inline-block h-7 w-[4.5rem] shrink-0" aria-hidden />;
  }

  const handleCopy = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      toast.success(`${label} copiado al portapapeles.`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(`No se pudo copiar el ${label.toLowerCase()}.`);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void handleCopy()}
      className={copyButtonClass}
      title={`Copiar ${label.toLowerCase()}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600" strokeWidth={2} aria-hidden />
      ) : (
        <Copy className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      )}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

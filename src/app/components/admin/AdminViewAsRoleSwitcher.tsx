import type { AdminViewAsRole } from "../../lib/adminViewAsRole";
import { roleLabelEs } from "../../lib/leadsAccess";
import { cn } from "../ui/utils";

const OPTIONS: { id: AdminViewAsRole; label: string }[] = [
  { id: "admin", label: "Admin" },
  { id: "lider_grupo", label: "Líder" },
  { id: "asesor", label: "Asesor" },
];

type Props = {
  value: AdminViewAsRole;
  onChange: (value: AdminViewAsRole) => void;
};

export function AdminViewAsRoleSwitcher({ value, onChange }: Props) {
  const isPreview = value !== "admin";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2",
        isPreview
          ? "border-amber-200/80 bg-amber-50/60"
          : "border-slate-200/70 bg-slate-50/50",
      )}
      role="region"
      aria-label="Vista previa del CRM por rol"
    >
      <p className="min-w-0 text-xs text-slate-600" style={{ fontWeight: 500 }}>
        {isPreview ? (
          <>
            <span className="font-semibold text-amber-900">Vista previa:</span>{" "}
            <span className="text-amber-800">{roleLabelEs(value)}</span>
            <span className="hidden text-slate-500 sm:inline"> · tu sesión sigue siendo admin</span>
          </>
        ) : (
          <span className="text-slate-500">Ver como</span>
        )}
      </p>

      <div className="flex shrink-0 flex-wrap gap-1" role="group" aria-label="Rol de vista previa">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "inline-flex h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold transition",
              value === opt.id
                ? opt.id === "admin"
                  ? "border-primary/30 bg-primary text-white"
                  : "border-slate-400/40 bg-slate-600 text-white"
                : "border-transparent bg-white text-slate-600 hover:bg-slate-100",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

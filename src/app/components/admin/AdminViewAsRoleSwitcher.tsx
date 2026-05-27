import type { AdminViewAsRole } from "../../lib/adminViewAsRole";
import { cn } from "../ui/utils";

const OPTIONS: { id: AdminViewAsRole; label: string }[] = [
  { id: "admin",       label: "Admin"  },
  { id: "lider_grupo", label: "Líder"  },
  { id: "asesor",      label: "Asesor" },
];

type Props = {
  value: AdminViewAsRole;
  onChange: (value: AdminViewAsRole) => void;
};

export function AdminViewAsRoleSwitcher({ value, onChange }: Props) {
  const isPreview = value !== "admin";

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "0.75rem 1rem",
      }}
      role="region"
      aria-label="Vista previa del CRM por rol"
    >
      {/* Label */}
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 500,
          marginBottom: "0.5rem",
          color: isPreview ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.3)",
        }}
      >
        {isPreview ? "Vista previa" : "Ver como"}
      </p>

      {/* Segment control */}
      <div
        role="group"
        aria-label="Rol de vista previa"
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "8px",
          padding: "3px",
          gap: "2px",
        }}
      >
        {OPTIONS.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={isActive}
              className={cn(
                "relative flex-1 rounded-md text-center transition-all duration-150",
                "text-[11px] font-semibold leading-none",
              )}
              style={{
                height: "28px",
                border: "none",
                cursor: "pointer",
                background: isActive
                  ? isPreview
                    ? "rgba(251,191,36,0.18)"
                    : "rgba(255,255,255,0.12)"
                  : "transparent",
                color: isActive
                  ? isPreview
                    ? "rgb(251,191,36)"
                    : "rgba(255,255,255,0.92)"
                  : "rgba(255,255,255,0.35)",
                boxShadow: isActive
                  ? "0 1px 3px rgba(0,0,0,0.3)"
                  : "none",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import type { LeadPriorityStars } from "../../data/leads";
import { clampLeadPriorityStars } from "../../data/leads";
import { Star } from "lucide-react";
import { cn } from "../ui/utils";
import { priorityStarRowClassName } from "./leadPriorityStarStyles";

const TOTAL = 6;

type Props = {
  value: LeadPriorityStars;
  onChange: (value: LeadPriorityStars) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** Selector interactivo: 1–6 estrellas (clic en la estrella n fija prioridad n). */
export function LeadPriorityStarsInput({
  value,
  onChange,
  disabled,
  size = "md",
  className,
}: Props) {
  const v = clampLeadPriorityStars(value);
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="radiogroup"
      aria-label={`Prioridad, ${v} de ${TOTAL} estrellas`}
    >
      {Array.from({ length: TOTAL }, (_, i) => {
        const n = (i + 1) as LeadPriorityStars;
        const filled = n <= v;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(n)}
            className={cn(
              "rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-50",
              !disabled && "cursor-pointer"
            )}
            aria-checked={filled}
            role="radio"
            aria-label={`Prioridad ${n} de ${TOTAL}`}
          >
            <Star
              className={priorityStarRowClassName(filled, i, dim)}
              strokeWidth={filled ? 0 : 1.35}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

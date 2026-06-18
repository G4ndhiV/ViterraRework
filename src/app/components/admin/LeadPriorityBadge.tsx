import { clampLeadPriorityStars } from "../../data/leads";
import { Star } from "lucide-react";
import { cn } from "../ui/utils";
import { priorityStarRowClassName } from "./leadPriorityStarStyles";

const TOTAL = 6;

type Props = {
  stars: number;
  size?: "sm" | "md";
  className?: string;
};

export function LeadPriorityBadge({ stars, size = "sm", className }: Props) {
  const s = clampLeadPriorityStars(stars);
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const label = `Prioridad ${s} de ${TOTAL} estrellas`;

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={label}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: TOTAL }, (_, i) => (
        <Star
          key={i}
          className={priorityStarRowClassName(i < s, i, dim)}
          strokeWidth={i < s ? 0 : 1.35}
          aria-hidden
        />
      ))}
    </span>
  );
}

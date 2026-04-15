import { cn } from "../ui/utils";

const EMPTY_STAR = "fill-transparent text-slate-200/95 stroke-slate-300/85";

/** Color por posición (1–6): navy → oro cálido → rojo corporativo. */
export function priorityStarFilledClass(slotIndex: number): string {
  if (slotIndex < 2) return "fill-[#2c3a52] text-[#2c3a52]";
  if (slotIndex < 4)
    return "fill-[#c4a35a] text-[#a8863d] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]";
  if (slotIndex === 5)
    return "fill-primary text-primary drop-shadow-[0_0_10px_rgba(200,16,46,0.28)]";
  return "fill-primary text-primary";
}

export { EMPTY_STAR };

export function priorityStarRowClassName(filled: boolean, slotIndex: number, dim: string) {
  return cn(dim, "shrink-0", filled ? priorityStarFilledClass(slotIndex) : EMPTY_STAR);
}

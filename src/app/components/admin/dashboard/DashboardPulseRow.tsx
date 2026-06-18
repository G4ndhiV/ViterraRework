import { cn } from "../../ui/utils";

export type PulseChip = {
  id: string;
  label: string;
  value: number;
  hint: string;
  tone?: "default" | "warn" | "neutral";
  onClick: () => void;
};

type Props = {
  chips: PulseChip[];
};

export function DashboardPulseRow({ chips }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {chips.map((chip) => {
        const warn = chip.tone === "warn" && chip.value > 0;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={chip.onClick}
            className={cn(
              "flex flex-col rounded-2xl border px-4 py-3.5 text-left shadow-sm transition hover:shadow-md",
              warn
                ? "border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-white hover:border-amber-300"
                : "border-slate-200/80 bg-white hover:border-slate-300",
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {chip.label}
            </span>
            <p className="font-heading mt-2 text-2xl font-semibold text-brand-navy">{chip.value}</p>
            <p className="mt-1 text-xs text-slate-500">{chip.hint}</p>
          </button>
        );
      })}
    </div>
  );
}

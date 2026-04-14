import type { ReactNode } from "react";

export function EditorSection({
  title,
  children,
  sectionId,
}: {
  title: string;
  children: ReactNode;
  /** Coincide con ids de vista previa (`viterra-form-${sectionId}`) */
  sectionId?: string;
}) {
  return (
    <div
      id={sectionId ? `viterra-form-${sectionId}` : undefined}
      className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 scroll-mt-4"
    >
      <h3 className="mb-4 border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-800">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function LabeledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy/25"
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy/25"
    />
  );
}

export function ImageUrlField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <LabeledField label={label} hint={hint}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <TextInput value={value} onChange={onChange} placeholder="https://…" />
        </div>
        <div className="h-24 w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-28 sm:w-40">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">Vista previa</div>
          )}
        </div>
      </div>
    </LabeledField>
  );
}

export function NumberInput({
  value,
  onChange,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy/25"
    />
  );
}

import { cn } from "../../ui/utils";

export const profilePageShell = "mx-auto flex w-full max-w-6xl flex-col pb-8";

export const profilePageHeader =
  "mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between";

export const profileCard =
  "overflow-hidden rounded-2xl border border-slate-200/75 bg-white shadow-[0_20px_50px_-28px_rgba(20,28,46,0.12)] ring-1 ring-slate-900/[0.04]";

export const profileCardAccent =
  "h-1 w-full shrink-0 bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy";

export const profileCardBody = "flex flex-col lg:flex-row lg:items-stretch";

export const profileIdentityAside =
  "flex flex-col items-center border-b border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white px-5 py-8 text-center lg:w-[17.5rem] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-6 lg:py-8";

export const profileMainColumn = "min-w-0 flex-1 flex flex-col";

export const profileTabPanel = "flex-1 p-5 sm:p-7 md:p-8";

export const profileCardFooter =
  "border-t border-slate-200/90 bg-slate-50/80 px-5 py-4 sm:px-7 md:px-8";

export const avatarFrame =
  "relative h-28 w-28 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] sm:h-32 sm:w-32";

export const avatarInitialClass =
  "flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-navy/10 to-slate-100 text-3xl font-semibold text-brand-navy sm:text-4xl";

export const inputClass =
  "h-11 w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 text-sm text-brand-navy shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] ring-2 ring-transparent transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-primary/12";

export const readClass =
  "flex min-h-11 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 text-sm text-slate-700 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]";

export const profileSectionTitle =
  "mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500";

export const tabListClass =
  "inline-flex max-w-full gap-0.5 overflow-x-auto rounded-2xl bg-slate-100/95 p-1 ring-1 ring-slate-200/80 ring-inset [scrollbar-gutter:stable]";

export function tabButtonClass(active: boolean) {
  return cn(
    "shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 sm:px-4",
    active
      ? "bg-white text-brand-navy shadow-[0_1px_3px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/90"
      : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
  );
}

export const copyButtonClass =
  "inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-brand-navy";

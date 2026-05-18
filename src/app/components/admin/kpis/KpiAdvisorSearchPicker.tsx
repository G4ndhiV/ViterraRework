import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Users, X } from "lucide-react";
import type { User } from "../../../contexts/AuthContext";
import { roleLabelEs } from "../../../lib/leadsAccess";
import { foldSearchText } from "../../../lib/searchText";
import { KpiUserAvatar } from "./KpiUserAvatar";
import { cn } from "../../ui/utils";

type Props = {
  advisors: User[];
  value: string | null;
  onChange: (advisorId: string | null) => void;
  className?: string;
};

function advisorHaystack(u: User): string {
  return foldSearchText([u.name, u.email, u.tokkoUserId, roleLabelEs(u.role)].filter(Boolean).join(" "));
}

export function KpiAdvisorSearchPicker({ advisors, value, onChange, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => (value ? advisors.find((u) => u.id === value) : null),
    [advisors, value],
  );

  const filtered = useMemo(() => {
    const q = foldSearchText(query);
    if (!q) return advisors;
    return advisors.filter((u) => advisorHaystack(u).includes(q));
  }, [advisors, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const displayValue = open ? query : "";

  const pick = (id: string | null) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Asesor
      </label>

      {selected && !open ? (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-3 py-2.5 shadow-sm">
          <KpiUserAvatar user={selected} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-navy">{selected.name || selected.email}</p>
            <p className="truncate text-[11px] text-slate-500">
              {roleLabelEs(selected.role)}
              {selected.email ? ` · ${selected.email}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
            title="Quitar filtro de asesor"
            aria-label="Quitar filtro de asesor"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.75}
        />
        <input
          ref={inputRef}
          type="search"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected ? "Buscar otro asesor…" : "Buscar asesor por nombre o correo…"}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white py-0 pl-9 pr-3 text-sm text-brand-navy shadow-sm placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          aria-label="Buscar y seleccionar asesor"
          aria-expanded={open}
          aria-haspopup="listbox"
          autoComplete="off"
        />
      </div>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/90 p-2 shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(null)}
            className={cn(
              "mb-1.5 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
              !value
                ? "border-primary/50 bg-white shadow-sm ring-2 ring-primary/15"
                : "border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-white",
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-navy">Todos los asesores</p>
              <p className="text-[11px] text-slate-500">Métricas de todo el equipo visible</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {advisors.length}
            </span>
          </button>

          {filtered.length === 0 ? (
            <p className="rounded-xl bg-white px-3 py-6 text-center text-xs text-slate-500">
              No hay asesores que coincidan con «{query}».
            </p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((u) => {
                const active = value === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(u.id)}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      active
                        ? "border-primary/50 bg-white shadow-sm ring-2 ring-primary/15"
                        : "border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-white",
                    )}
                  >
                    <KpiUserAvatar user={u} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-navy">{u.name || u.email}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {roleLabelEs(u.role)}
                        {u.tokkoUserId ? ` · ID ${u.tokkoUserId}` : ""}
                        {u.email ? ` · ${u.email}` : ""}
                      </p>
                    </div>
                    {active ? (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Activo
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {selected && !open ? (
        <p className="mt-1.5 text-[10px] text-slate-500">
          Filtrando métricas de{" "}
          <span className="font-semibold text-slate-600">{selected.name}</span>
        </p>
      ) : null}
    </div>
  );
}

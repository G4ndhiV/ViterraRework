import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Check, AlertTriangle, Layers } from "lucide-react";
import { useSiteContent } from "../../../contexts/SiteContentContext";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "../../../data/siteContent";
import {
  AboutEditorForm,
  ContactEditorForm,
  DevelopmentsEditorForm,
  HomeEditorForm,
  ServicesEditorForm,
} from "./siteEditor/SiteEditorForms";
import { EDITOR_PAGE_BLOCKS, type SiteKey } from "./siteEditor/editorBlocks";
import { SitePreviewCanvas } from "./siteEditor/SitePreviewCanvas";
import { cn } from "../ui/utils";
import { mergeSiteSection } from "../../../lib/siteContentMerge";

const SITE_LABELS: Record<SiteKey, string> = {
  home: "Inicio",
  contact: "Contacto",
  services: "Servicios",
  about: "Acerca de",
  developments: "Desarrollos",
};

const ORDER: SiteKey[] = ["home", "contact", "services", "about", "developments"];

const PREVIEW_PATH: Record<SiteKey, string> = {
  home: "/",
  contact: "/contacto",
  services: "/servicios",
  about: "/nosotros",
  developments: "/desarrollos",
};

function cloneSection<K extends SiteKey>(key: K, data: SiteContent): SiteContent[K] {
  return JSON.parse(JSON.stringify(data[key])) as SiteContent[K];
}

export function AdminSiteEditor() {
  const { content, setSection, resetToDefaults } = useSiteContent();
  const [tab, setTab] = useState<SiteKey>("home");
  const [draft, setDraft] = useState<SiteContent[SiteKey]>(() => cloneSection("home", content));
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(cloneSection(tab, content));
    setDirty(false);
  }, [tab, content]);

  useEffect(() => {
    setActiveBlockId(EDITOR_PAGE_BLOCKS[tab][0]?.id ?? null);
  }, [tab]);

  const mergedContent = useMemo(() => {
    const section = mergeSiteSection(tab, draft);
    return { ...content, [tab]: section } as SiteContent;
  }, [content, tab, draft]);

  const previewPath = PREVIEW_PATH[tab];

  const markDirty = useCallback(() => setDirty(true), []);

  const handleSave = () => {
    setSection(tab, draft as SiteContent[typeof tab]);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
  };

  const tryChangeTab = (next: SiteKey) => {
    if (dirty) {
      const ok = window.confirm("Tienes cambios sin guardar en esta sección. ¿Descartarlos y cambiar de pestaña?");
      if (!ok) return;
    }
    setTab(next);
  };

  const handleResetSection = () => {
    if (!window.confirm(`¿Restaurar «${SITE_LABELS[tab]}» a los textos e imágenes por defecto?`)) return;
    const def = cloneSection(tab, DEFAULT_SITE_CONTENT);
    setDraft(def);
    setSection(tab, def);
    setDirty(false);
  };

  const handleResetAll = () => {
    if (!window.confirm("¿Restaurar todo el sitio a los valores por defecto?")) return;
    resetToDefaults();
    setTab("home");
  };

  const scrollPreviewToBlock = (blockId: string) => {
    setActiveBlockId(blockId);
    requestAnimationFrame(() => {
      document.getElementById(`viterra-block-${blockId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const blocks = EDITOR_PAGE_BLOCKS[tab];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Páginas del sitio</p>
        <div
          className="inline-flex max-w-full flex-wrap gap-0.5 rounded-2xl bg-slate-100/95 p-1 ring-1 ring-slate-200/80 ring-inset"
          role="tablist"
          aria-label="Elegir página a editar"
        >
          {ORDER.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => tryChangeTab(key)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 sm:px-4 sm:py-2.5",
                tab === key
                  ? "bg-white text-brand-navy shadow-[0_1px_3px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/90"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
              )}
            >
              {SITE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          Cambios sin guardar en «{SITE_LABELS[tab]}». Pulsa <strong>Guardar cambios</strong> para persistirlos en este navegador.
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
          <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
          Guardado. Los visitantes verán los cambios en este mismo navegador (almacenamiento local).
        </div>
      )}

      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.12)] ring-1 ring-slate-100">
          <div className="h-1 w-full bg-gradient-to-r from-brand-gold/80 via-primary to-brand-burgundy/90" aria-hidden />
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-brand-navy text-white shadow-inner">
                <Layers className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                  Bloques editables
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                  Selecciona un bloque para mostrar solo sus campos en el formulario. La vista previa se desplazará al mismo bloque.
                </p>
              </div>
            </div>
            <nav
              className="-mx-1 flex gap-0 overflow-x-auto border-b border-slate-200/90 sm:mx-0"
              role="tablist"
              aria-label="Bloques de la página actual"
            >
              {blocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={activeBlockId === b.id}
                  onClick={() => scrollPreviewToBlock(b.id)}
                  className={cn(
                    "relative shrink-0 rounded-t-lg px-3 py-2.5 text-left text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                    activeBlockId === b.id
                      ? "border-b-2 border-primary bg-slate-50/90 text-brand-navy"
                      : "border-b-2 border-transparent text-slate-500 hover:bg-slate-50/60 hover:text-slate-800"
                  )}
                >
                  <span className="block max-w-[10rem] truncate sm:max-w-[14rem]">{b.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Los enlaces del menú no navegan fuera del editor; el contenido editable refleja el borrador de la pestaña actual.
        </p>

        <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-h-0 min-w-0 flex-1 space-y-4">
          <div className="max-h-[min(70vh,920px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            {tab === "home" && (
              <HomeEditorForm
                draft={draft as SiteContent["home"]}
                activeSectionId={activeBlockId}
                onChange={(next) => { setDraft(next); markDirty(); }}
              />
            )}
            {tab === "contact" && (
              <ContactEditorForm
                draft={draft as SiteContent["contact"]}
                activeSectionId={activeBlockId}
                onChange={(next) => { setDraft(next); markDirty(); }}
              />
            )}
            {tab === "services" && (
              <ServicesEditorForm
                draft={draft as SiteContent["services"]}
                activeSectionId={activeBlockId}
                onChange={(next) => { setDraft(next); markDirty(); }}
              />
            )}
            {tab === "about" && (
              <AboutEditorForm
                draft={draft as SiteContent["about"]}
                activeSectionId={activeBlockId}
                onChange={(next) => { setDraft(next); markDirty(); }}
              />
            )}
            {tab === "developments" && (
              <DevelopmentsEditorForm
                draft={draft as SiteContent["developments"]}
                activeSectionId={activeBlockId}
                onChange={(next) => { setDraft(next); markDirty(); }}
              />
            )}
          </div>

          <div className="grid w-full gap-3 lg:grid-cols-3">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-navy px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e2a45]"
            >
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={handleResetSection}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
              Restaurar esta sección
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              Restaurar todo el sitio
            </button>
          </div>
        </div>

        <div className="w-full min-w-0 shrink-0 xl:sticky xl:top-4 xl:w-[min(100%,520px)] xl:max-w-[520px]">
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-inner">
            <div className="max-h-[min(68vh,680px)] overflow-y-auto overflow-x-hidden">
              <SitePreviewCanvas
                key={tab}
                mergedContent={mergedContent}
                previewPath={previewPath}
                activeBlockId={activeBlockId}
                setActiveBlockId={setActiveBlockId}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

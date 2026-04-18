import type { SiteContent, ServiceCardLink } from "../../../../data/siteContent";
import { mergeSiteSection } from "../../../../lib/siteContentMerge";
import { EditorSection, ImageUrlField, LabeledField, NumberInput, TextArea, TextInput } from "./editorUi";

const LINK_OPTIONS: { value: ServiceCardLink; label: string }[] = [
  { value: "", label: "Sin enlace" },
  { value: "/renta", label: "Renta (listado)" },
  { value: "/venta", label: "Compra (listado)" },
  { value: "/desarrollos", label: "Desarrollos" },
  { value: "/contacto", label: "Contacto" },
];

function pickSection(activeSectionId: string | null, sectionId: string): boolean {
  return activeSectionId === sectionId;
}

type H = SiteContent["home"];
export function HomeEditorForm({
  draft,
  onChange,
  activeSectionId,
}: {
  draft: H;
  onChange: (next: H) => void;
  activeSectionId: string | null;
}) {
  const p = (patch: Partial<H>) => onChange({ ...draft, ...patch });
  const s = (id: string) => pickSection(activeSectionId, id);
  return (
    <div className="space-y-6">
      {activeSectionId == null && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Elige un bloque en «Secciones de esta página» (vista previa) para editar sus textos aquí.
        </p>
      )}
      {s("home-hero") && (
      <EditorSection title="Portada principal" sectionId="home-hero">
        <ImageUrlField label="Imagen de fondo" value={draft.heroImage} onChange={(v) => p({ heroImage: v })} hint="Pega la URL de una imagen (por ejemplo de Unsplash o tu hosting)." />
        <LabeledField label="Línea superior (etiqueta pequeña)">
          <TextInput value={draft.heroKicker} onChange={(v) => p({ heroKicker: v })} />
        </LabeledField>
        <LabeledField label="Título principal">
          <TextInput value={draft.heroTitle} onChange={(v) => p({ heroTitle: v })} />
        </LabeledField>
        <LabeledField label="Subtítulo">
          <TextArea value={draft.heroSubtitle} onChange={(v) => p({ heroSubtitle: v })} rows={2} />
        </LabeledField>
        <LabeledField label="Enlace: texto hacia Desarrollos">
          <TextInput value={draft.heroLinkDevLabel} onChange={(v) => p({ heroLinkDevLabel: v })} />
        </LabeledField>
        <LabeledField label="Enlace: texto hacia Nosotros">
          <TextInput value={draft.heroLinkAboutLabel} onChange={(v) => p({ heroLinkAboutLabel: v })} />
        </LabeledField>
        <LabeledField label="Botón principal">
          <TextInput value={draft.heroCtaPrimary} onChange={(v) => p({ heroCtaPrimary: v })} />
        </LabeledField>
        <LabeledField label="Enlace secundario (texto)">
          <TextInput value={draft.heroCtaSecondary} onChange={(v) => p({ heroCtaSecondary: v })} />
        </LabeledField>
      </EditorSection>
      )}

      {s("home-search") && (
      <EditorSection title="Búsqueda" sectionId="home-search">
        <ImageUrlField label="Imagen de fondo de la sección" value={draft.searchImage} onChange={(v) => p({ searchImage: v })} />
        <LabeledField label="Etiqueta pequeña">
          <TextInput value={draft.searchKicker} onChange={(v) => p({ searchKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.searchTitle} onChange={(v) => p({ searchTitle: v })} />
        </LabeledField>
        <LabeledField label="Descripción">
          <TextArea value={draft.searchSubtitle} onChange={(v) => p({ searchSubtitle: v })} rows={2} />
        </LabeledField>
      </EditorSection>
      )}

      {s("home-selection") && (
      <EditorSection title="Selección de propiedades" sectionId="home-selection">
        <LabeledField label="Etiqueta">
          <TextInput value={draft.selectionKicker} onChange={(v) => p({ selectionKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.selectionTitle} onChange={(v) => p({ selectionTitle: v })} />
        </LabeledField>
        <LabeledField label="Descripción">
          <TextArea value={draft.selectionSubtitle} onChange={(v) => p({ selectionSubtitle: v })} rows={2} />
        </LabeledField>
        <LabeledField label="Texto del enlace al catálogo">
          <TextInput value={draft.selectionCatalogLink} onChange={(v) => p({ selectionCatalogLink: v })} />
        </LabeledField>
        <LabeledField label="Texto enlace renta">
          <TextInput value={draft.selectionRentLabel} onChange={(v) => p({ selectionRentLabel: v })} />
        </LabeledField>
        <LabeledField label="Texto enlace venta">
          <TextInput value={draft.selectionSaleLabel} onChange={(v) => p({ selectionSaleLabel: v })} />
        </LabeledField>
      </EditorSection>
      )}

      {s("home-experience") && (
      <EditorSection title="Bloque Experiencia" sectionId="home-experience">
        <ImageUrlField label="Imagen" value={draft.experienceImage} onChange={(v) => p({ experienceImage: v })} />
        <LabeledField label="Etiqueta">
          <TextInput value={draft.experienceKicker} onChange={(v) => p({ experienceKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.experienceTitle} onChange={(v) => p({ experienceTitle: v })} />
        </LabeledField>
        <LabeledField label="Texto destacado (cursiva)">
          <TextArea value={draft.experienceLead} onChange={(v) => p({ experienceLead: v })} rows={2} />
        </LabeledField>
        <LabeledField label="Párrafo">
          <TextArea value={draft.experienceBody} onChange={(v) => p({ experienceBody: v })} rows={3} />
        </LabeledField>
        <LabeledField label="Botón">
          <TextInput value={draft.experienceCta} onChange={(v) => p({ experienceCta: v })} />
        </LabeledField>
      </EditorSection>
      )}

      {s("home-closing") && (
      <EditorSection title="Cierre (antes del pie de página)" sectionId="home-closing">
        <LabeledField label="Etiqueta pequeña">
          <TextInput value={draft.closingKicker} onChange={(v) => p({ closingKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.closingTitle} onChange={(v) => p({ closingTitle: v })} />
        </LabeledField>
        <LabeledField label="Texto">
          <TextArea value={draft.closingSubtitle} onChange={(v) => p({ closingSubtitle: v })} rows={2} />
        </LabeledField>
        <LabeledField label="Botón principal">
          <TextInput value={draft.closingBtnPrimary} onChange={(v) => p({ closingBtnPrimary: v })} />
        </LabeledField>
        <LabeledField label="Botón secundario">
          <TextInput value={draft.closingBtnSecondary} onChange={(v) => p({ closingBtnSecondary: v })} />
        </LabeledField>
      </EditorSection>
      )}
    </div>
  );
}

type C = SiteContent["contact"];
export function ContactEditorForm({
  draft,
  onChange,
  activeSectionId,
}: {
  draft: C;
  onChange: (next: C) => void;
  activeSectionId: string | null;
}) {
  const p = (patch: Partial<C>) => onChange({ ...draft, ...patch });
  const s = (id: string) => pickSection(activeSectionId, id);
  return (
    <div className="space-y-6">
      {activeSectionId == null && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Elige un bloque en «Secciones de esta página» para editar sus textos aquí.
        </p>
      )}
      {s("contact-hero") && (
      <EditorSection title="Cabecera" sectionId="contact-hero">
        <LabeledField label="Título">
          <TextInput value={draft.heroTitle} onChange={(v) => p({ heroTitle: v })} />
        </LabeledField>
        <LabeledField label="Subtítulo" hint="Se muestra bajo el título; no afecta la posición de las flechas.">
          <TextArea value={draft.heroSubtitle} onChange={(v) => p({ heroSubtitle: v })} rows={2} />
        </LabeledField>
      </EditorSection>
      )}

      {s("contact-info") && (
      <EditorSection title="Datos de contacto" sectionId="contact-info">
        <LabeledField label="Título del bloque">
          <TextInput value={draft.infoTitle} onChange={(v) => p({ infoTitle: v })} />
        </LabeledField>
        <LabeledField label="Título — Dirección">
          <TextInput value={draft.addressTitle} onChange={(v) => p({ addressTitle: v })} />
        </LabeledField>
        <LabeledField label="Dirección (varias líneas)" hint="Pulsa Enter para nueva línea.">
          <TextArea value={draft.addressLines} onChange={(v) => p({ addressLines: v })} rows={3} />
        </LabeledField>
        <LabeledField label="Título — Teléfono">
          <TextInput value={draft.phoneTitle} onChange={(v) => p({ phoneTitle: v })} />
        </LabeledField>
        <LabeledField label="Teléfonos (una línea cada uno)">
          <TextArea value={draft.phoneLines} onChange={(v) => p({ phoneLines: v })} rows={3} />
        </LabeledField>
        <LabeledField label="Título — Email">
          <TextInput value={draft.emailTitle} onChange={(v) => p({ emailTitle: v })} />
        </LabeledField>
        <LabeledField label="Correos (una línea cada uno)">
          <TextArea value={draft.emailLines} onChange={(v) => p({ emailLines: v })} rows={3} />
        </LabeledField>
        <LabeledField label="Título — Horario">
          <TextInput value={draft.hoursTitle} onChange={(v) => p({ hoursTitle: v })} />
        </LabeledField>
        <LabeledField label="Horario">
          <TextArea value={draft.hoursLines} onChange={(v) => p({ hoursLines: v })} rows={4} />
        </LabeledField>
      </EditorSection>
      )}

      {s("contact-whatsapp") && (
      <EditorSection title="Caja WhatsApp" sectionId="contact-whatsapp">
        <LabeledField label="Título">
          <TextInput value={draft.quickTitle} onChange={(v) => p({ quickTitle: v })} />
        </LabeledField>
        <LabeledField label="Texto">
          <TextArea value={draft.quickSubtitle} onChange={(v) => p({ quickSubtitle: v })} rows={2} />
        </LabeledField>
        <LabeledField label="Texto del botón">
          <TextInput value={draft.quickWhatsappLabel} onChange={(v) => p({ quickWhatsappLabel: v })} />
        </LabeledField>
        <LabeledField label="Enlace de WhatsApp" hint="Ej: https://wa.me/5213312345678">
          <TextInput value={draft.quickWhatsappHref} onChange={(v) => p({ quickWhatsappHref: v })} />
        </LabeledField>
      </EditorSection>
      )}

      {s("contact-form") && (
      <EditorSection title="Formulario" sectionId="contact-form">
        <LabeledField label="Título del formulario">
          <TextInput value={draft.formTitle} onChange={(v) => p({ formTitle: v })} />
        </LabeledField>
        <LabeledField label="Mensaje de éxito — título">
          <TextInput value={draft.successTitle} onChange={(v) => p({ successTitle: v })} />
        </LabeledField>
        <LabeledField label="Mensaje de éxito — texto">
          <TextArea value={draft.successSubtitle} onChange={(v) => p({ successSubtitle: v })} rows={2} />
        </LabeledField>
      </EditorSection>
      )}

      {s("contact-map") && (
      <EditorSection title="Mapa" sectionId="contact-map">
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledField label="Latitud">
            <NumberInput value={draft.mapLat} onChange={(v) => p({ mapLat: v })} step="any" />
          </LabeledField>
          <LabeledField label="Longitud">
            <NumberInput value={draft.mapLng} onChange={(v) => p({ mapLng: v })} step="any" />
          </LabeledField>
        </div>
        <LabeledField label="Título en el mapa (ventana)">
          <TextInput value={draft.mapPopupTitle} onChange={(v) => p({ mapPopupTitle: v })} />
        </LabeledField>
        <LabeledField label="Dirección en el mapa (ventana)" hint="Varias líneas: se respetan en el globo del mapa.">
          <TextArea value={draft.mapPopupAddress} onChange={(v) => p({ mapPopupAddress: v })} rows={3} />
        </LabeledField>
        <LabeledField label="Etiqueta pequeña (sección mapa abajo)">
          <TextInput value={draft.mapSectionKicker} onChange={(v) => p({ mapSectionKicker: v })} />
        </LabeledField>
        <LabeledField label="Título sección mapa">
          <TextInput value={draft.mapSectionTitle} onChange={(v) => p({ mapSectionTitle: v })} />
        </LabeledField>
      </EditorSection>
      )}
    </div>
  );
}

type S = SiteContent["services"];
export function ServicesEditorForm({
  draft,
  onChange,
  activeSectionId,
}: {
  draft: S;
  onChange: (next: S) => void;
  activeSectionId: string | null;
}) {
  const safe = mergeSiteSection("services", draft);
  const p = (patch: Partial<S>) => onChange(mergeSiteSection("services", { ...draft, ...patch }));
  const updateCard = (index: number, patch: Partial<S["cards"][0]>) => {
    const cards = safe.cards.map((c, i) => (i === index ? { ...c, ...patch } : c)) as S["cards"];
    p({ cards });
  };
  const s = (id: string) => pickSection(activeSectionId, id);
  return (
    <div className="space-y-6">
      {activeSectionId == null && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Elige un bloque en «Secciones de esta página» para editar sus textos aquí.
        </p>
      )}
      {s("services-hero") && (
      <EditorSection title="Cabecera" sectionId="services-hero">
        <ImageUrlField label="Imagen de fondo" value={safe.heroImage} onChange={(v) => p({ heroImage: v })} />
        <LabeledField label="Título">
          <TextInput value={safe.heroTitle} onChange={(v) => p({ heroTitle: v })} />
        </LabeledField>
        <LabeledField label="Subtítulo" hint="Se muestra bajo el título; no afecta la posición de las flechas.">
          <TextArea value={safe.heroSubtitle} onChange={(v) => p({ heroSubtitle: v })} rows={2} />
        </LabeledField>
      </EditorSection>
      )}

      {safe.cards.map((card, index) =>
        s(`services-card-${index}`) ? (
        <EditorSection key={index} title={`Tarjeta ${index + 1}`} sectionId={`services-card-${index}`}>
          <LabeledField label="Título">
            <TextInput value={card.title} onChange={(v) => updateCard(index, { title: v })} />
          </LabeledField>
          <LabeledField label="Descripción">
            <TextArea value={card.description} onChange={(v) => updateCard(index, { description: v })} rows={3} />
          </LabeledField>
          <LabeledField label="Viñeta 1">
            <TextInput value={card.bullets[0]} onChange={(v) => {
              const bullets = [...card.bullets] as [string, string, string];
              bullets[0] = v;
              updateCard(index, { bullets });
            }} />
          </LabeledField>
          <LabeledField label="Viñeta 2">
            <TextInput value={card.bullets[1]} onChange={(v) => {
              const bullets = [...card.bullets] as [string, string, string];
              bullets[1] = v;
              updateCard(index, { bullets });
            }} />
          </LabeledField>
          <LabeledField label="Viñeta 3">
            <TextInput value={card.bullets[2]} onChange={(v) => {
              const bullets = [...card.bullets] as [string, string, string];
              bullets[2] = v;
              updateCard(index, { bullets });
            }} />
          </LabeledField>
          <LabeledField label="Texto del enlace (opcional)">
            <TextInput value={card.linkLabel} onChange={(v) => updateCard(index, { linkLabel: v })} />
          </LabeledField>
          <LabeledField label="Enlazar a" hint="Los listados de Renta y Compra son independientes; aquí solo eliges a qué página lleva el botón.">
            <select
              value={card.linkTo}
              onChange={(e) => updateCard(index, { linkTo: e.target.value as ServiceCardLink })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {LINK_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </LabeledField>
        </EditorSection>
        ) : null
      )}

      {s("services-cta") && (
      <EditorSection title="Llamado a la acción (final)" sectionId="services-cta">
        <LabeledField label="Título">
          <TextInput value={safe.ctaTitle} onChange={(v) => p({ ctaTitle: v })} />
        </LabeledField>
        <LabeledField label="Subtítulo">
          <TextArea value={safe.ctaSubtitle} onChange={(v) => p({ ctaSubtitle: v })} rows={2} />
        </LabeledField>
        <LabeledField label="Texto del botón">
          <TextInput value={safe.ctaButton} onChange={(v) => p({ ctaButton: v })} />
        </LabeledField>
      </EditorSection>
      )}
    </div>
  );
}

type A = SiteContent["about"];
export function AboutEditorForm({
  draft,
  onChange,
  activeSectionId,
}: {
  draft: A;
  onChange: (next: A) => void;
  activeSectionId: string | null;
}) {
  const p = (patch: Partial<A>) => onChange({ ...draft, ...patch });
  const s = (id: string) => pickSection(activeSectionId, id);
  return (
    <div className="space-y-6">
      {activeSectionId == null && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Elige un bloque en «Secciones de esta página» para editar sus textos aquí.
        </p>
      )}
      {s("about-hero") && (
      <EditorSection title="Cabecera" sectionId="about-hero">
        <LabeledField label="Título">
          <TextInput value={draft.heroTitle} onChange={(v) => p({ heroTitle: v })} />
        </LabeledField>
        <LabeledField label="Subtítulo" hint="Se muestra bajo el título; no afecta la posición de las flechas.">
          <TextArea value={draft.heroSubtitle} onChange={(v) => p({ heroSubtitle: v })} rows={2} />
        </LabeledField>
      </EditorSection>
      )}

      {s("about-story") && (
      <EditorSection title="Historia" sectionId="about-story">
        <LabeledField label="Etiqueta">
          <TextInput value={draft.storyKicker} onChange={(v) => p({ storyKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.storyTitle} onChange={(v) => p({ storyTitle: v })} />
        </LabeledField>
        <LabeledField label="Párrafo 1">
          <TextArea value={draft.storyP1} onChange={(v) => p({ storyP1: v })} rows={4} />
        </LabeledField>
        <LabeledField label="Párrafo 2">
          <TextArea value={draft.storyP2} onChange={(v) => p({ storyP2: v })} rows={4} />
        </LabeledField>
        <LabeledField label="Párrafo 3">
          <TextArea value={draft.storyP3} onChange={(v) => p({ storyP3: v })} rows={4} />
        </LabeledField>
        <ImageUrlField label="Imagen" value={draft.storyImage} onChange={(v) => p({ storyImage: v })} />
      </EditorSection>
      )}

      {s("about-mission") && (
      <EditorSection title="Misión y visión" sectionId="about-mission">
        <LabeledField label="Misión — título">
          <TextInput value={draft.missionTitle} onChange={(v) => p({ missionTitle: v })} />
        </LabeledField>
        <LabeledField label="Misión — texto">
          <TextArea value={draft.missionText} onChange={(v) => p({ missionText: v })} rows={4} />
        </LabeledField>
        <LabeledField label="Visión — título">
          <TextInput value={draft.visionTitle} onChange={(v) => p({ visionTitle: v })} />
        </LabeledField>
        <LabeledField label="Visión — texto">
          <TextArea value={draft.visionText} onChange={(v) => p({ visionText: v })} rows={4} />
        </LabeledField>
      </EditorSection>
      )}

      {s("about-values") && (
      <EditorSection title="Valores (4 bloques)" sectionId="about-values">
        <LabeledField label="Etiqueta pequeña">
          <TextInput value={draft.valuesKicker} onChange={(v) => p({ valuesKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.valuesTitle} onChange={(v) => p({ valuesTitle: v })} />
        </LabeledField>
        <LabeledField label="Introducción">
          <TextArea value={draft.valuesIntro} onChange={(v) => p({ valuesIntro: v })} rows={2} />
        </LabeledField>
        {draft.values.map((val, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">Valor {i + 1}</p>
            <LabeledField label="Título">
              <TextInput
                value={val.title}
                onChange={(v) => {
                  const values = draft.values.map((x, j) => (j === i ? { ...x, title: v } : x));
                  p({ values });
                }}
              />
            </LabeledField>
            <LabeledField label="Texto">
              <TextArea
                value={val.text}
                onChange={(v) => {
                  const values = draft.values.map((x, j) => (j === i ? { ...x, text: v } : x));
                  p({ values });
                }}
                rows={2}
              />
            </LabeledField>
          </div>
        ))}
      </EditorSection>
      )}

      {s("about-stats") && (
      <EditorSection title="Cifras (4 estadísticas)" sectionId="about-stats">
        {draft.stats.map((st, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-2">
            <LabeledField label={`Cifra ${i + 1}`}>
              <TextInput
                value={st.value}
                onChange={(v) => {
                  const stats = draft.stats.map((x, j) => (j === i ? { ...x, value: v } : x));
                  p({ stats });
                }}
              />
            </LabeledField>
            <LabeledField label={`Etiqueta ${i + 1}`}>
              <TextInput
                value={st.label}
                onChange={(v) => {
                  const stats = draft.stats.map((x, j) => (j === i ? { ...x, label: v } : x));
                  p({ stats });
                }}
              />
            </LabeledField>
          </div>
        ))}
      </EditorSection>
      )}

      {s("about-timeline") && (
      <EditorSection title="Línea de tiempo" sectionId="about-timeline">
        <LabeledField label="Etiqueta">
          <TextInput value={draft.timelineKicker} onChange={(v) => p({ timelineKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.timelineTitle} onChange={(v) => p({ timelineTitle: v })} />
        </LabeledField>
        <LabeledField label="Introducción">
          <TextArea value={draft.timelineIntro} onChange={(v) => p({ timelineIntro: v })} rows={2} />
        </LabeledField>
        {draft.milestones.map((m, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">Hito {i + 1}</p>
            <LabeledField label="Año">
              <TextInput
                value={m.year}
                onChange={(v) => {
                  const milestones = draft.milestones.map((x, j) => (j === i ? { ...x, year: v } : x));
                  p({ milestones });
                }}
              />
            </LabeledField>
            <LabeledField label="Título">
              <TextInput
                value={m.title}
                onChange={(v) => {
                  const milestones = draft.milestones.map((x, j) => (j === i ? { ...x, title: v } : x));
                  p({ milestones });
                }}
              />
            </LabeledField>
            <LabeledField label="Descripción">
              <TextArea
                value={m.description}
                onChange={(v) => {
                  const milestones = draft.milestones.map((x, j) => (j === i ? { ...x, description: v } : x));
                  p({ milestones });
                }}
                rows={3}
              />
            </LabeledField>
          </div>
        ))}
      </EditorSection>
      )}

      {s("about-team") && (
      <EditorSection title="Equipo" sectionId="about-team">
        <LabeledField label="Etiqueta">
          <TextInput value={draft.teamKicker} onChange={(v) => p({ teamKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.teamTitle} onChange={(v) => p({ teamTitle: v })} />
        </LabeledField>
        <LabeledField label="Introducción">
          <TextArea value={draft.teamIntro} onChange={(v) => p({ teamIntro: v })} rows={2} />
        </LabeledField>
        {draft.team.map((member, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">Persona {i + 1}</p>
            <LabeledField label="Nombre">
              <TextInput
                value={member.name}
                onChange={(v) => {
                  const team = draft.team.map((x, j) => (j === i ? { ...x, name: v } : x));
                  p({ team });
                }}
              />
            </LabeledField>
            <LabeledField label="Cargo">
              <TextInput
                value={member.role}
                onChange={(v) => {
                  const team = draft.team.map((x, j) => (j === i ? { ...x, role: v } : x));
                  p({ team });
                }}
              />
            </LabeledField>
            <LabeledField label="Iniciales (2 letras)">
              <TextInput
                value={member.initials}
                onChange={(v) => {
                  const team = draft.team.map((x, j) => (j === i ? { ...x, initials: v } : x));
                  p({ team });
                }}
              />
            </LabeledField>
            <ImageUrlField
              label="Foto (cuadrada)"
              value={member.image ?? ""}
              onChange={(v) => {
                const team = draft.team.map((x, j) =>
                  j === i ? { ...x, image: v.trim() || undefined } : x
                );
                p({ team });
              }}
              hint="URL de imagen; se muestra en recorte cuadrado. Si está vacío, se usan las iniciales."
            />
          </div>
        ))}
      </EditorSection>
      )}
    </div>
  );
}

type D = SiteContent["developments"];
export function DevelopmentsEditorForm({
  draft,
  onChange,
  activeSectionId,
}: {
  draft: D;
  onChange: (next: D) => void;
  activeSectionId: string | null;
}) {
  const p = (patch: Partial<D>) => onChange({ ...draft, ...patch });
  const s = (id: string) => pickSection(activeSectionId, id);
  return (
    <div className="space-y-6">
      {activeSectionId == null && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Elige un bloque en «Secciones de esta página» para editar sus textos aquí.
        </p>
      )}
      {s("dev-hero") && (
      <EditorSection title="Cabecera de la página" sectionId="dev-hero">
        <ImageUrlField label="Imagen de fondo" value={draft.heroImage} onChange={(v) => p({ heroImage: v })} hint="La lista de proyectos sigue viniendo del catálogo de desarrollos." />
        <LabeledField label="Título">
          <TextInput value={draft.heroTitle} onChange={(v) => p({ heroTitle: v })} />
        </LabeledField>
        <LabeledField label="Subtítulo" hint="Se muestra bajo el título; no afecta la posición de las flechas.">
          <TextArea value={draft.heroSubtitle} onChange={(v) => p({ heroSubtitle: v })} rows={3} />
        </LabeledField>
      </EditorSection>
      )}

      {s("dev-featured") && (
      <EditorSection title="Sección proyectos destacados (títulos)" sectionId="dev-featured">
        <LabeledField label="Etiqueta pequeña">
          <TextInput value={draft.featuredKicker} onChange={(v) => p({ featuredKicker: v })} />
        </LabeledField>
        <LabeledField label="Título">
          <TextInput value={draft.featuredTitle} onChange={(v) => p({ featuredTitle: v })} />
        </LabeledField>
      </EditorSection>
      )}
    </div>
  );
}

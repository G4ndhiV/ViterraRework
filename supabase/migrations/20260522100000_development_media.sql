-- Medios, descripción HTML y WhatsApp separado en desarrollos.

alter table public.developments
  add column if not exists property_videos jsonb not null default '[]'::jsonb,
  add column if not exists property_tours_3d jsonb not null default '[]'::jsonb,
  add column if not exists rich_description text,
  add column if not exists in_charge_whatsapp text,
  add column if not exists video_url text,
  add column if not exists tour_3d_url text;

comment on column public.developments.property_videos is
  'Lista Viterra: [{ "id", "kind", "url"?, "storagePath"?, "label"? }].';
comment on column public.developments.property_tours_3d is
  'Lista Viterra: [{ "id", "url", "label"? }].';
comment on column public.developments.rich_description is 'Descripción HTML para ficha pública.';
comment on column public.developments.in_charge_whatsapp is 'Enlace o número WhatsApp del responsable.';
comment on column public.developments.video_url is 'Primer video (legacy).';
comment on column public.developments.tour_3d_url is 'Primer tour 3D (legacy).';

-- Catálogo de tags de inmueble (Tokko GET /property_tag/) + vínculo N:M con properties.

create table public.tokko_property_tags (
  id uuid primary key default gen_random_uuid(),
  tokko_tag_id text not null unique,
  name text not null default '',
  tag_type smallint,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_tag_links (
  property_id uuid not null references public.properties (id) on delete cascade,
  tag_id uuid not null references public.tokko_property_tags (id) on delete cascade,
  primary key (property_id, tag_id)
);

create index property_tag_links_tag_id_idx on public.property_tag_links (tag_id);

alter table public.tokko_property_tags enable row level security;
alter table public.property_tag_links enable row level security;

create policy tokko_property_tags_select_public on public.tokko_property_tags for select to anon, authenticated using (true);

create policy property_tag_links_select_public on public.property_tag_links for select to anon, authenticated using (true);

grant select on public.tokko_property_tags to anon, authenticated;
grant select on public.property_tag_links to anon, authenticated;

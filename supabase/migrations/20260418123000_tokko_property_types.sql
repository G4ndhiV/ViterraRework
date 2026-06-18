-- Catálogo Tokko GET /property_type/ + referencia en properties.

create table public.tokko_property_types (
  id uuid primary key default gen_random_uuid(),
  tokko_type_id text not null unique,
  code text,
  name text not null default '',
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties
  add column if not exists property_type_tokko_id text;

create index if not exists properties_property_type_tokko_id_idx on public.properties (property_type_tokko_id);

alter table public.tokko_property_types enable row level security;

create policy tokko_property_types_select_public on public.tokko_property_types for select to anon, authenticated using (true);

grant select on public.tokko_property_types to anon, authenticated;

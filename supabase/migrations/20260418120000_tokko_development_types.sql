-- Catálogo Tokko GET /development_type/ + referencia en developments.

create table public.tokko_development_types (
  id uuid primary key default gen_random_uuid(),
  tokko_type_id text not null unique,
  code text,
  name text not null default '',
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.developments
  add column if not exists development_type_tokko_id text;

create index if not exists developments_development_type_tokko_id_idx on public.developments (development_type_tokko_id);

alter table public.tokko_development_types enable row level security;

create policy tokko_development_types_select_public on public.tokko_development_types for select to anon, authenticated using (true);

grant select on public.tokko_development_types to anon, authenticated;

-- Tokko → Supabase: core tables for properties, developments, CRM.
-- Edge Function uses service_role (bypasses RLS). Policies below are for anon/auth clients.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Properties (site + admin; synced from Tokko /property or /properties)
-- ---------------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  tokko_id text not null unique,
  title text not null default '',
  price numeric,
  location text,
  bedrooms integer,
  bathrooms integer,
  area numeric,
  image text,
  type text,
  status text not null default 'venta' check (status in ('venta', 'alquiler')),
  lat double precision,
  lng double precision,
  development_tokko_id text,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_development_tokko_id_idx on public.properties (development_tokko_id);

-- ---------------------------------------------------------------------------
-- Developments + units (synced from Tokko /development(s))
-- ---------------------------------------------------------------------------
create table public.developments (
  id uuid primary key default gen_random_uuid(),
  tokko_id text not null unique,
  name text not null default '',
  location text,
  colony text,
  full_address text,
  type text,
  description text,
  image text,
  images text[] not null default array[]::text[],
  status text,
  units integer,
  delivery_date text,
  price_range text,
  amenities text[] not null default array[]::text[],
  services text[] not null default array[]::text[],
  additional_features text[] not null default array[]::text[],
  lat double precision,
  lng double precision,
  featured boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.development_units (
  id uuid primary key default gen_random_uuid(),
  tokko_id text,
  development_id uuid not null references public.developments (id) on delete cascade,
  unit_type text,
  address text,
  spaces integer,
  bedrooms integer,
  covered_area numeric,
  total_area numeric,
  parking boolean not null default false,
  price numeric,
  for_rent boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint development_units_development_tokko_unique unique (development_id, tokko_id)
);

create index development_units_development_id_idx on public.development_units (development_id);

-- ---------------------------------------------------------------------------
-- CRM (Tokko /contact, /web_contact); notes when API exposes them
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tokko_id text not null,
  name text not null default '',
  email text,
  phone text,
  interest text,
  property_type text,
  budget numeric,
  location text,
  status text not null default 'nuevo',
  priority_stars smallint not null default 3 check (priority_stars between 1 and 6),
  source text,
  assigned_to text,
  assigned_to_user_id text,
  lead_kind text not null default 'contact' check (lead_kind in ('contact', 'web_contact')),
  created_at timestamptz,
  last_contact timestamptz,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_tokko_kind_unique unique (lead_kind, tokko_id)
);

create table public.lead_client_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  tokko_note_id text unique,
  note_date date,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_client_notes_lead_id_idx on public.lead_client_notes (lead_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.developments enable row level security;
alter table public.development_units enable row level security;
alter table public.leads enable row level security;
alter table public.lead_client_notes enable row level security;

-- Catalog: public read (tighten later, e.g. only published rows).
create policy properties_select_public on public.properties for select to anon, authenticated using (true);

create policy developments_select_public on public.developments for select to anon, authenticated using (true);

create policy development_units_select_public on public.development_units for select to anon, authenticated using (true);

-- CRM: permissive for authenticated JWT until you scope by org / auth.uid().
create policy leads_all_authenticated on public.leads for all to authenticated using (true) with check (true);

create policy lead_client_notes_all_authenticated on public.lead_client_notes for all to authenticated using (true) with check (true);

grant select on public.properties to anon, authenticated;
grant select on public.developments to anon, authenticated;
grant select on public.development_units to anon, authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.lead_client_notes to authenticated;

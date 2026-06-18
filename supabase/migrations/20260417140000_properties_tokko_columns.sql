-- Propiedad Tokko: columnas alineadas al payload (además de payload JSONB).

alter table public.properties
  add column if not exists images text[] not null default array[]::text[],
  add column if not exists colony text,
  add column if not exists full_address text,
  add column if not exists description text,
  add column if not exists rich_description text,
  add column if not exists amenities text[] not null default array[]::text[],
  add column if not exists services text[] not null default array[]::text[],
  add column if not exists additional_features text[] not null default array[]::text[],
  add column if not exists reference_code text,
  add column if not exists public_url text,
  add column if not exists deleted_at timestamptz,
  add column if not exists publication_title text,
  add column if not exists featured boolean not null default false,
  add column if not exists surface_land numeric,
  add column if not exists expenses numeric,
  add column if not exists age integer,
  add column if not exists parking_spaces integer;

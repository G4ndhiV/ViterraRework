-- Campos explícitos del API Tokko (development) además del payload JSONB.

alter table public.developments
  add column if not exists web_url text,
  add column if not exists reference_code text,
  add column if not exists publication_title text,
  add column if not exists deleted_at timestamptz,
  add column if not exists display_on_web boolean not null default true,
  add column if not exists construction_status smallint,
  add column if not exists financing_details text,
  add column if not exists in_charge_name text,
  add column if not exists in_charge_email text,
  add column if not exists in_charge_phone text;

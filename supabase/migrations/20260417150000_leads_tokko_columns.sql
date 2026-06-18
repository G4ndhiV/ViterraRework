-- Leads Tokko (contact / web_contact): columnas explícitas además de payload.

alter table public.leads
  add column if not exists deleted_at timestamptz,
  add column if not exists is_owner boolean,
  add column if not exists is_company boolean,
  add column if not exists work_name text,
  add column if not exists work_email text,
  add column if not exists work_position text,
  add column if not exists document_number text,
  add column if not exists cellphone text,
  add column if not exists other_email text,
  add column if not exists other_phone text,
  add column if not exists tag_names text[] not null default array[]::text[],
  add column if not exists birthdate date;

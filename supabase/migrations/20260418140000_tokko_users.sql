-- Usuarios / asesores Tokko (GET /user/).

create table public.tokko_users (
  id uuid primary key default gen_random_uuid(),
  tokko_user_id text not null unique,
  name text not null default '',
  email text,
  phone text,
  cellphone text,
  picture text,
  position text,
  branch_tokko_id text,
  deleted_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tokko_users_branch_tokko_id_idx on public.tokko_users (branch_tokko_id);

alter table public.tokko_users enable row level security;

create policy tokko_users_select_public on public.tokko_users for select to anon, authenticated using (true);

grant select on public.tokko_users to anon, authenticated;

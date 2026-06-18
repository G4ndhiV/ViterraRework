-- Feed de actividades del inventario (propiedades / desarrollos) para timeline en admin.

create table public.catalog_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entity_type text not null check (entity_type in ('property', 'development')),
  entity_id uuid not null,
  action text not null check (action in ('created', 'updated', 'deleted', 'price_changed')),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_name text,
  source text not null default 'admin' check (source in ('admin', 'tokko_sync')),
  snapshot jsonb not null default '{}'::jsonb,
  diff jsonb
);

create index catalog_activities_created_at_idx on public.catalog_activities (created_at desc);
create index catalog_activities_entity_idx on public.catalog_activities (entity_type, entity_id);

alter table public.catalog_activities enable row level security;

create policy catalog_activities_select_authenticated
  on public.catalog_activities
  for select
  to authenticated
  using (true);

create policy catalog_activities_insert_matched_actor
  on public.catalog_activities
  for insert
  to authenticated
  with check (actor_user_id = auth.uid());

grant select, insert on public.catalog_activities to authenticated;

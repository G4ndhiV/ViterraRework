-- KPI module: metas (targets) y snapshots históricos por usuario / grupo / empresa.
-- Las gráficas de tendencia 6/12 meses leen de `kpi_monthly_snapshots`.
-- Las cards "% meta" leen de `kpi_targets`.

-- ---------------------------------------------------------------------------
-- kpi_targets
-- ---------------------------------------------------------------------------
create table if not exists public.kpi_targets (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('user', 'group', 'company')),
  -- user.id (uuid) o user_groups.id (uuid). null cuando scope='company'.
  scope_id text,
  metric text not null check (metric in (
    'sales_count',
    'sales_volume',
    'new_leads',
    'conversion_rate',
    'response_time_hours',
    'appointments_completed'
  )),
  period text not null check (period in ('monthly', 'quarterly', 'yearly')),
  target_value numeric not null,
  effective_from date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint kpi_targets_unique_scope unique (scope, scope_id, metric, period, effective_from)
);

create index if not exists kpi_targets_scope_idx on public.kpi_targets (scope, scope_id);
create index if not exists kpi_targets_metric_idx on public.kpi_targets (metric);

-- ---------------------------------------------------------------------------
-- kpi_monthly_snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.kpi_monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('user', 'group', 'company')),
  scope_id text,
  -- Día 1 del mes correspondiente (YYYY-MM-01).
  month date not null,
  metrics jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  constraint kpi_monthly_snapshots_unique unique (scope, scope_id, month)
);

create index if not exists kpi_monthly_snapshots_month_idx on public.kpi_monthly_snapshots (month desc);
create index if not exists kpi_monthly_snapshots_scope_idx on public.kpi_monthly_snapshots (scope, scope_id);

-- ---------------------------------------------------------------------------
-- Helpers para RLS y cómputo
-- ---------------------------------------------------------------------------
create or replace function public.kpi_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tokko_users tu
    where tu.id = auth.uid()
      and tu.role = 'admin'
  );
$$;

revoke all on function public.kpi_is_admin() from public;
grant execute on function public.kpi_is_admin() to authenticated;

create or replace function public.kpi_is_leader_for_group(target_group text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_groups g
    where g.id::text = target_group
      and g.leader_id = auth.uid()
      and g.deleted_at is null
  );
$$;

revoke all on function public.kpi_is_leader_for_group(text) from public;
grant execute on function public.kpi_is_leader_for_group(text) to authenticated;

create or replace function public.kpi_is_leader_for_user(target_user text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_groups g
    join public.user_group_members m on m.group_id = g.id
    where g.leader_id = auth.uid()
      and g.deleted_at is null
      and m.user_id::text = target_user
  );
$$;

revoke all on function public.kpi_is_leader_for_user(text) from public;
grant execute on function public.kpi_is_leader_for_user(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.kpi_targets enable row level security;
alter table public.kpi_monthly_snapshots enable row level security;

-- Lectura amplia: la app filtra por scope visible (admin / líder / asesor).
create policy kpi_targets_select_authenticated
  on public.kpi_targets
  for select
  to authenticated
  using (true);

-- Escritura solo admin o líder del grupo / del usuario, o el propio usuario para sus metas.
create policy kpi_targets_insert_admin_or_leader
  on public.kpi_targets
  for insert
  to authenticated
  with check (
    public.kpi_is_admin()
    or (scope = 'group' and public.kpi_is_leader_for_group(scope_id))
    or (scope = 'user' and (
      scope_id = auth.uid()::text
      or public.kpi_is_leader_for_user(scope_id)
    ))
  );

create policy kpi_targets_update_admin_or_leader
  on public.kpi_targets
  for update
  to authenticated
  using (
    public.kpi_is_admin()
    or (scope = 'group' and public.kpi_is_leader_for_group(scope_id))
    or (scope = 'user' and (
      scope_id = auth.uid()::text
      or public.kpi_is_leader_for_user(scope_id)
    ))
  )
  with check (
    public.kpi_is_admin()
    or (scope = 'group' and public.kpi_is_leader_for_group(scope_id))
    or (scope = 'user' and (
      scope_id = auth.uid()::text
      or public.kpi_is_leader_for_user(scope_id)
    ))
  );

create policy kpi_targets_delete_admin_or_leader
  on public.kpi_targets
  for delete
  to authenticated
  using (
    public.kpi_is_admin()
    or (scope = 'group' and public.kpi_is_leader_for_group(scope_id))
    or (scope = 'user' and public.kpi_is_leader_for_user(scope_id))
  );

create policy kpi_monthly_snapshots_select_authenticated
  on public.kpi_monthly_snapshots
  for select
  to authenticated
  using (true);

create policy kpi_monthly_snapshots_write_admin
  on public.kpi_monthly_snapshots
  for all
  to authenticated
  using (public.kpi_is_admin())
  with check (public.kpi_is_admin());

grant select, insert, update, delete on public.kpi_targets to authenticated;
grant select, insert, update, delete on public.kpi_monthly_snapshots to authenticated;

-- ---------------------------------------------------------------------------
-- Cómputo de snapshots mensuales (admin lo dispara desde el botón "Recalcular histórico").
-- Recorre `leads`, agrega por usuario asignado y por grupo del lead, y `upsert`-ea.
-- También calcula el snapshot de toda la empresa (scope='company').
-- ---------------------------------------------------------------------------
create or replace function public.recompute_kpi_monthly_snapshots(month_start date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  month_first date := date_trunc('month', month_start)::date;
  month_next date := (month_first + interval '1 month')::date;
  rows_written integer := 0;
begin
  if not public.kpi_is_admin() then
    raise exception 'not authorized: only admin may recompute KPI snapshots';
  end if;

  -- Snapshot por usuario (asesor) basado en `assigned_to_user_id` de los leads.
  with lead_window as (
    select
      l.assigned_to_user_id as scope_id,
      l.status,
      l.budget,
      l.created_at,
      l.last_contact,
      l.updated_at
    from public.leads l
    where l.assigned_to_user_id is not null and l.assigned_to_user_id <> ''
      and (
        (l.created_at >= month_first and l.created_at < month_next)
        or (l.last_contact >= month_first and l.last_contact < month_next)
        or (l.updated_at >= month_first and l.updated_at < month_next)
      )
  ),
  agg_user as (
    select
      scope_id,
      count(*) filter (where created_at >= month_first and created_at < month_next) as new_leads,
      count(*) filter (where status = 'cerrado' and coalesce(updated_at, last_contact, created_at) >= month_first and coalesce(updated_at, last_contact, created_at) < month_next) as sales_count,
      coalesce(sum(budget) filter (where status = 'cerrado' and coalesce(updated_at, last_contact, created_at) >= month_first and coalesce(updated_at, last_contact, created_at) < month_next), 0) as sales_volume,
      avg(extract(epoch from (last_contact - created_at)) / 3600.0) filter (where last_contact is not null and created_at is not null) as response_time_hours
    from lead_window
    group by scope_id
  )
  insert into public.kpi_monthly_snapshots (scope, scope_id, month, metrics, computed_at)
  select
    'user',
    scope_id,
    month_first,
    jsonb_build_object(
      'new_leads', coalesce(new_leads, 0),
      'sales_count', coalesce(sales_count, 0),
      'sales_volume', coalesce(sales_volume, 0),
      'response_time_hours', coalesce(response_time_hours, 0)
    ),
    now()
  from agg_user
  on conflict (scope, scope_id, month) do update
  set metrics = excluded.metrics,
      computed_at = now();

  get diagnostics rows_written = row_count;

  -- Snapshot por grupo: suma de leads de todos los miembros del grupo.
  with member_user as (
    select g.id::text as group_id, m.user_id::text as user_id
    from public.user_groups g
    join public.user_group_members m on m.group_id = g.id
    where g.deleted_at is null
  ),
  lead_window as (
    select
      l.assigned_to_user_id as user_id,
      l.status,
      l.budget,
      l.created_at,
      l.last_contact,
      l.updated_at
    from public.leads l
    where l.assigned_to_user_id is not null and l.assigned_to_user_id <> ''
      and (
        (l.created_at >= month_first and l.created_at < month_next)
        or (l.last_contact >= month_first and l.last_contact < month_next)
        or (l.updated_at >= month_first and l.updated_at < month_next)
      )
  ),
  agg_group as (
    select
      mu.group_id as scope_id,
      count(*) filter (where lw.created_at >= month_first and lw.created_at < month_next) as new_leads,
      count(*) filter (where lw.status = 'cerrado' and coalesce(lw.updated_at, lw.last_contact, lw.created_at) >= month_first and coalesce(lw.updated_at, lw.last_contact, lw.created_at) < month_next) as sales_count,
      coalesce(sum(lw.budget) filter (where lw.status = 'cerrado' and coalesce(lw.updated_at, lw.last_contact, lw.created_at) >= month_first and coalesce(lw.updated_at, lw.last_contact, lw.created_at) < month_next), 0) as sales_volume,
      avg(extract(epoch from (lw.last_contact - lw.created_at)) / 3600.0) filter (where lw.last_contact is not null and lw.created_at is not null) as response_time_hours
    from member_user mu
    join lead_window lw on lw.user_id = mu.user_id
    group by mu.group_id
  )
  insert into public.kpi_monthly_snapshots (scope, scope_id, month, metrics, computed_at)
  select
    'group',
    scope_id,
    month_first,
    jsonb_build_object(
      'new_leads', coalesce(new_leads, 0),
      'sales_count', coalesce(sales_count, 0),
      'sales_volume', coalesce(sales_volume, 0),
      'response_time_hours', coalesce(response_time_hours, 0)
    ),
    now()
  from agg_group
  on conflict (scope, scope_id, month) do update
  set metrics = excluded.metrics,
      computed_at = now();

  -- Snapshot de empresa (toda la base).
  with lead_window as (
    select
      l.status,
      l.budget,
      l.created_at,
      l.last_contact,
      l.updated_at
    from public.leads l
    where (
      (l.created_at >= month_first and l.created_at < month_next)
      or (l.last_contact >= month_first and l.last_contact < month_next)
      or (l.updated_at >= month_first and l.updated_at < month_next)
    )
  ),
  agg_company as (
    select
      count(*) filter (where created_at >= month_first and created_at < month_next) as new_leads,
      count(*) filter (where status = 'cerrado' and coalesce(updated_at, last_contact, created_at) >= month_first and coalesce(updated_at, last_contact, created_at) < month_next) as sales_count,
      coalesce(sum(budget) filter (where status = 'cerrado' and coalesce(updated_at, last_contact, created_at) >= month_first and coalesce(updated_at, last_contact, created_at) < month_next), 0) as sales_volume,
      avg(extract(epoch from (last_contact - created_at)) / 3600.0) filter (where last_contact is not null and created_at is not null) as response_time_hours
    from lead_window
  )
  insert into public.kpi_monthly_snapshots (scope, scope_id, month, metrics, computed_at)
  select
    'company',
    null,
    month_first,
    jsonb_build_object(
      'new_leads', coalesce(new_leads, 0),
      'sales_count', coalesce(sales_count, 0),
      'sales_volume', coalesce(sales_volume, 0),
      'response_time_hours', coalesce(response_time_hours, 0)
    ),
    now()
  from agg_company
  on conflict (scope, scope_id, month) do update
  set metrics = excluded.metrics,
      computed_at = now();

  return rows_written;
end;
$$;

revoke all on function public.recompute_kpi_monthly_snapshots(date) from public;
grant execute on function public.recompute_kpi_monthly_snapshots(date) to authenticated;

comment on table public.kpi_targets is
  'Metas / objetivos por usuario, grupo o empresa. Lectura: authenticated. Escritura: admin o líder con scope.';

comment on table public.kpi_monthly_snapshots is
  'Snapshots mensuales agregados (leads, ventas, etc.) por usuario, grupo y empresa. Calculados con recompute_kpi_monthly_snapshots().';

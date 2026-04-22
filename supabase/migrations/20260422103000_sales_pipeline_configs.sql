-- Configuración del pipeline Kanban por equipo (`group_id` = id de `user_groups` o `__default__` para el embudo global).

create table if not exists public.sales_pipeline_configs (
  group_id text primary key,
  config jsonb not null default '{"customStages":[],"stageOrder":[],"stageColors":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sales_pipeline_configs is
  'Embudo por equipo: customStages, stageOrder, stageColors (JSON). group_id __default__ = pipeline global.';

-- Embudo estándar para nuevos proyectos (coincide con LEAD_STATUS_LABEL en la app).
insert into public.sales_pipeline_configs (group_id, config)
values (
  '__default__',
  jsonb_build_object(
    'customStages',
    '[]'::jsonb,
    'stageOrder',
    '["nuevo","contactado","calificado","negociacion","cerrado","perdido"]'::jsonb,
    'stageColors',
    '{}'::jsonb
  )
)
on conflict (group_id) do nothing;

alter table public.sales_pipeline_configs enable row level security;

create policy sales_pipeline_configs_all_authenticated
  on public.sales_pipeline_configs
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.sales_pipeline_configs to authenticated;

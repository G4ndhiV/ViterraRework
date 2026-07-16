-- Corrige "infinite recursion detected in policy for relation user_groups"
-- (y "...user_group_members").
--
-- Causa: la política SELECT de `user_groups` consulta `user_group_members` en crudo, y la
-- política SELECT de `user_group_members` (redefinida en 20260619120000_lider_grupo_lead_scope.sql)
-- consulta `user_groups` en crudo de vuelta. Postgres detecta el ciclo A -> B -> A entre las
-- políticas de ambas tablas y aborta con "infinite recursion detected in policy for relation X".
--
-- Se intentó envolver las consultas cruzadas en funciones security definer manteniendo FORCE
-- ROW LEVEL SECURITY (como en 20260619130000_force_row_level_security.sql) y NO alcanza: se
-- verificó empíricamente (Postgres 17, tabla con FORCE ROW LEVEL SECURITY + función security
-- definer propiedad del mismo dueño de la tabla) que Postgres sigue aplicando la política del
-- lado de adentro de la función — con FORCE activo, ni siquiera `set local row_security = off`
-- está permitido para el dueño (error: "query would be affected by row-level security policy...
-- To disable the policy for the table's owner, use ALTER TABLE NO FORCE ROW LEVEL SECURITY").
-- Es decir, dentro de una función security definer, tocar una tabla con FORCE sigue
-- reevaluando su política — si esa política vuelve a llamar a la misma función, el ciclo
-- persiste igual, ahora escondido dentro de la función.
--
-- Fix real (verificado end-to-end con 4 escenarios: admin, líder, miembro no-líder, usuario
-- sin relación — los 4 dan el resultado esperado sin error):
-- 1) Quitar FORCE ROW LEVEL SECURITY de estas dos tablas puntuales. RLS sigue activa para los
--    roles `anon`/`authenticated` (que es la superficie real que protege de usuarios finales);
--    FORCE solo afecta al rol dueño de la tabla (p. ej. el rol de las migraciones) — un acceso
--    ya de por sí confiable (Dashboard/SQL editor de Supabase, `service_role` de las Edge
--    Functions, que además ya bypassea RLS de por sí). No son tablas con PII sensible de
--    clientes como `leads`/`properties`; son equipos/membresías internas del CRM.
-- 2) Con FORCE fuera, las funciones security definer (mismo patrón que viterra_is_admin() con
--    tokko_users) sí bypasean RLS de verdad al ejecutar, cortando el ciclo A -> B -> A.

alter table public.user_groups no force row level security;
alter table public.user_group_members no force row level security;

create or replace function public.viterra_is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_group_members m
    join public.user_groups g on g.id = m.group_id
    where m.group_id = p_group_id
      and m.user_id = auth.uid()
      and g.deleted_at is null
  );
$$;

create or replace function public.viterra_group_leader_id(p_group_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select g.leader_id
  from public.user_groups g
  where g.id = p_group_id
    and g.deleted_at is null
  limit 1;
$$;

revoke all on function public.viterra_is_group_member(uuid) from public;
revoke all on function public.viterra_group_leader_id(uuid) from public;
grant execute on function public.viterra_is_group_member(uuid) to authenticated;
grant execute on function public.viterra_group_leader_id(uuid) to authenticated;

-- user_groups: ya no consulta user_group_members en crudo (pasa por la función bypass).
drop policy if exists user_groups_select_scoped on public.user_groups;
create policy user_groups_select_scoped
  on public.user_groups
  for select
  to authenticated
  using (
    deleted_at is null
    and (
      public.viterra_is_admin()
      or public.viterra_has_permission('manage_users')
      or leader_id = auth.uid()
      or public.viterra_is_group_member(id)
    )
  );

-- user_group_members: ya no consulta user_groups en crudo (pasa por la función bypass).
drop policy if exists user_group_members_select_scoped on public.user_group_members;
create policy user_group_members_select_scoped
  on public.user_group_members
  for select
  to authenticated
  using (
    public.viterra_is_admin()
    or public.viterra_has_permission('manage_users')
    or public.viterra_group_leader_id(group_id) = auth.uid()
    or public.viterra_is_group_member(group_id)
  );

drop policy if exists user_group_members_write_admin on public.user_group_members;
create policy user_group_members_write_admin
  on public.user_group_members
  for all
  to authenticated
  using (
    public.viterra_is_admin()
    or public.viterra_has_permission('manage_users')
    or public.viterra_group_leader_id(group_id) = auth.uid()
  )
  with check (
    public.viterra_is_admin()
    or public.viterra_has_permission('manage_users')
    or public.viterra_group_leader_id(group_id) = auth.uid()
  );

-- Corrige "infinite recursion detected in policy for relation user_groups"
-- (y "...user_group_members").
--
-- Causa: la política SELECT de `user_groups` consulta `user_group_members` en crudo, y la
-- política SELECT de `user_group_members` (redefinida en 20260619120000_lider_grupo_lead_scope.sql)
-- consulta `user_groups` en crudo de vuelta. Postgres detecta el ciclo A -> B -> A entre las
-- políticas de ambas tablas y aborta con "infinite recursion detected in policy for relation X".
--
-- Fix: envolver cada consulta cruzada en una función security definer de una sola tabla —
-- el mismo patrón que ya usan viterra_is_admin()/viterra_has_permission() para consultar
-- `tokko_users` (que también tiene FORCE ROW LEVEL SECURITY, ver
-- 20260619130000_force_row_level_security.sql) sin recursión, porque el rol dueño de las
-- funciones (el rol de las migraciones) tiene el atributo BYPASSRLS: eso hace que, dentro de
-- la función, la tabla se lea sin volver a evaluar su política — independientemente de FORCE
-- ROW LEVEL SECURITY, que solo quita la excepción por defecto del dueño, no el bypass de un
-- rol con BYPASSRLS. Verificado empíricamente (Postgres 17, tabla con FORCE ROW LEVEL
-- SECURITY + rol dueño con BYPASSRLS): funciona igual que tokko_users, para los 4 escenarios
-- (admin, líder, miembro no-líder, usuario sin relación). No hace falta ni conviene tocar
-- FORCE ROW LEVEL SECURITY en estas tablas.
--
-- Parámetros/comparaciones en texto (`::text`) a propósito: el esquema real de
-- `user_group_members.group_id` no coincide con el tipo `uuid` que declara
-- 20260618100000_user_groups.sql (hay drift entre esa migración y la tabla real — el intento
-- anterior de este archivo, con parámetros `uuid`, falló en el SQL Editor con
-- "operator does not exist: text = uuid"). Mismo patrón defensivo que ya usa
-- viterra_is_leader_for_assigned_user() en 20260619120000_lider_grupo_lead_scope.sql
-- (castea m.user_id::text), así funciona sin importar si las columnas terminan siendo
-- uuid o text.

create or replace function public.viterra_is_group_member(p_group_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_group_members m
    join public.user_groups g on g.id::text = m.group_id::text
    where m.group_id::text = p_group_id
      and m.user_id::text = auth.uid()::text
      and g.deleted_at is null
  );
$$;

create or replace function public.viterra_group_leader_id(p_group_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select g.leader_id::text
  from public.user_groups g
  where g.id::text = p_group_id
    and g.deleted_at is null
  limit 1;
$$;

revoke all on function public.viterra_is_group_member(text) from public;
revoke all on function public.viterra_group_leader_id(text) from public;
grant execute on function public.viterra_is_group_member(text) to authenticated;
grant execute on function public.viterra_group_leader_id(text) to authenticated;

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
      or public.viterra_is_group_member(id::text)
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
    or public.viterra_group_leader_id(group_id::text) = auth.uid()::text
    or public.viterra_is_group_member(group_id::text)
  );

drop policy if exists user_group_members_write_admin on public.user_group_members;
create policy user_group_members_write_admin
  on public.user_group_members
  for all
  to authenticated
  using (
    public.viterra_is_admin()
    or public.viterra_has_permission('manage_users')
    or public.viterra_group_leader_id(group_id::text) = auth.uid()::text
  )
  with check (
    public.viterra_is_admin()
    or public.viterra_has_permission('manage_users')
    or public.viterra_group_leader_id(group_id::text) = auth.uid()::text
  );

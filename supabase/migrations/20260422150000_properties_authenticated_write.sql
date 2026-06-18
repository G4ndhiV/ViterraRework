-- Viterra admin: el panel marca `properties.featured` y edita filas del catálogo.
-- Solo existía SELECT para anon/authenticated; los UPDATE fallaban (sin permiso / sin política RLS).

create policy properties_insert_authenticated
  on public.properties
  for insert
  to authenticated
  with check (true);

create policy properties_update_authenticated
  on public.properties
  for update
  to authenticated
  using (true)
  with check (true);

grant insert, update on public.properties to authenticated;

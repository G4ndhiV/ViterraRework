-- Viterra admin: crear y editar desarrollos desde el panel (mismo patrón que properties).

create policy developments_insert_authenticated
  on public.developments
  for insert
  to authenticated
  with check (true);

create policy developments_update_authenticated
  on public.developments
  for update
  to authenticated
  using (true)
  with check (true);

create policy development_units_insert_authenticated
  on public.development_units
  for insert
  to authenticated
  with check (true);

create policy development_units_update_authenticated
  on public.development_units
  for update
  to authenticated
  using (true)
  with check (true);

create policy development_units_delete_authenticated
  on public.development_units
  for delete
  to authenticated
  using (true);

grant insert, update on public.developments to authenticated;
grant insert, update, delete on public.development_units to authenticated;

-- CRM: columnas de acceso + obligar cambio de contraseña en primer acceso (tras aprovisionar Auth).
-- La función solo limpia el flag para auth.uid(); el cambio real de contraseña lo hace el cliente (auth.updateUser).

alter table public.tokko_users
  add column if not exists role text;

alter table public.tokko_users
  add column if not exists permissions text[] not null default '{}'::text[];

alter table public.tokko_users
  add column if not exists must_change_password boolean not null default false;

comment on column public.tokko_users.must_change_password is
  'Si es true, el usuario debe cambiar la contraseña en el CRM antes de usar el panel (Edge Function de aprovisionamiento).';

create or replace function public.complete_tokko_initial_password()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.tokko_users
  set
    must_change_password = false,
    updated_at = now()
  where id = auth.uid()
    and must_change_password is true;
end;
$$;

revoke all on function public.complete_tokko_initial_password() from public;
grant execute on function public.complete_tokko_initial_password() to authenticated;

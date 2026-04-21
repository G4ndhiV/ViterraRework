-- Asegura deleted_at en tokko_users (proyectos donde la tabla existía sin esta columna o el cache de PostgREST no la veía).
alter table public.tokko_users
  add column if not exists deleted_at timestamptz;

-- Caché del último feed de Instagram exitoso (leído por la API serverless).
create table if not exists public.instagram_feed_cache (
  username text primary key,
  posts jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.instagram_feed_cache enable row level security;

-- Lectura pública (solo posts ya cacheados; no secretos).
drop policy if exists "instagram_feed_cache_public_read" on public.instagram_feed_cache;
create policy "instagram_feed_cache_public_read"
  on public.instagram_feed_cache
  for select
  to anon, authenticated
  using (true);

-- Escritura solo service_role (bypass RLS) — la API usa SUPABASE_SERVICE_ROLE_KEY.
comment on table public.instagram_feed_cache is
  'Último feed Instagram OK; escrito por api/instagram-feed con service role.';

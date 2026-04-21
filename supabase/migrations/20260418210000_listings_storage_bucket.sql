-- Bucket público para fotos de propiedades y desarrollos (copiadas desde Tokko/CDN).
-- La función Edge `mirror-listing-media` sube con service_role (bypass RLS).
-- La lectura pública permite usar URLs .../storage/v1/object/public/listings/... en <img>.

insert into storage.buckets (id, name, public, file_size_limit)
values ('listings', 'listings', true, 52428800)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "listings_select_public" on storage.objects;

create policy "listings_select_public"
on storage.objects for select
to public
using (bucket_id = 'listings');

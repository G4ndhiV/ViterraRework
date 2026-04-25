-- Corrige leads cuyo status quedó en ids de etapa custom erróneos → embudo estándar `cerrado`.

update public.leads
set
  status = 'cerrado',
  updated_at = now(),
  synced_at = now()
where lower(trim(status)) in (
  lower('custom_d529860c-0a6e-425f-b01b-90ee43cb0d76'),
  lower('custom_78123a90-66af-419f-a940-e7ecc4a2e390'),
  lower('custom_4aac6d8a-1fce-4dc0-84ad-1863cd4159ea')
);

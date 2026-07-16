-- Allow properties to have both sale and rental prices simultaneously
alter table public.properties add column if not exists rental_price numeric;
alter table public.properties drop constraint if exists properties_status_check;
alter table public.properties add constraint properties_status_check check (status in ('venta', 'alquiler', 'venta_y_alquiler'));

-- Update existing rows with only sale price to 'venta', and only rental to 'alquiler'
-- Properties with both prices should be set to 'venta_y_alquiler' (manual update by admin)

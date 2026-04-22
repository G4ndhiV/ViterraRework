alter table public.properties
  add column if not exists total_surface numeric,
  add column if not exists roofed_surface numeric,
  add column if not exists semiroofed_surface numeric,
  add column if not exists unroofed_surface numeric,
  add column if not exists front_measure numeric,
  add column if not exists depth_measure numeric,
  add column if not exists floors_amount integer,
  add column if not exists situation text,
  add column if not exists orientation smallint,
  add column if not exists half_bathrooms integer,
  add column if not exists credit_eligible boolean,
  add column if not exists tags text[] not null default array[]::text[];

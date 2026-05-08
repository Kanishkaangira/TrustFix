alter table public.technician_live_tracking
  add column if not exists customer_lat double precision,
  add column if not exists customer_lng double precision;

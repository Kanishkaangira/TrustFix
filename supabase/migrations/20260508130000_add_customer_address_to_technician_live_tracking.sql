alter table public.technician_live_tracking
  add column if not exists customer_address text;

update public.technician_live_tracking live_tracking
set customer_address = booking.address_snapshot
from public.bookings booking
where booking.id = live_tracking.booking_id
  and coalesce(nullif(btrim(live_tracking.customer_address), ''), '') = '';

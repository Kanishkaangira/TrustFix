create table if not exists public.technician_live_tracking (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  current_lat double precision not null,
  current_lng double precision not null,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (booking_id)
);

alter table public.technician_live_tracking replica identity full;
alter table public.technician_live_tracking enable row level security;

revoke all on table public.technician_live_tracking from anon, authenticated;
grant select, insert, update, delete on table public.technician_live_tracking to authenticated;

drop policy if exists "technician_live_tracking_select_related" on public.technician_live_tracking;
create policy "technician_live_tracking_select_related"
on public.technician_live_tracking
for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.bookings booking
    where booking.id = technician_live_tracking.booking_id
      and (
        booking.user_id = (select auth.uid())
        or booking.technician_id = (select auth.uid())
      )
  )
);

drop policy if exists "technician_live_tracking_insert_own" on public.technician_live_tracking;
create policy "technician_live_tracking_insert_own"
on public.technician_live_tracking
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and technician_id = (select auth.uid())
  and exists (
    select 1
    from public.bookings booking
    where booking.id = technician_live_tracking.booking_id
      and booking.technician_id = (select auth.uid())
  )
);

drop policy if exists "technician_live_tracking_update_own" on public.technician_live_tracking;
create policy "technician_live_tracking_update_own"
on public.technician_live_tracking
for update
to authenticated
using (
  (select auth.uid()) is not null
  and technician_id = (select auth.uid())
)
with check (
  (select auth.uid()) is not null
  and technician_id = (select auth.uid())
  and exists (
    select 1
    from public.bookings booking
    where booking.id = technician_live_tracking.booking_id
      and booking.technician_id = (select auth.uid())
  )
);

drop policy if exists "technician_live_tracking_delete_own" on public.technician_live_tracking;
create policy "technician_live_tracking_delete_own"
on public.technician_live_tracking
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and technician_id = (select auth.uid())
  and exists (
    select 1
    from public.bookings booking
    where booking.id = technician_live_tracking.booking_id
      and booking.technician_id = (select auth.uid())
  )
);

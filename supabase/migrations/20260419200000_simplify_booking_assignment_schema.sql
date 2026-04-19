alter table public.bookings
  add column if not exists technician_id uuid;

alter table public.bookings
  drop constraint if exists bookings_technician_id_fkey;

alter table public.bookings
  add constraint bookings_technician_id_fkey
  foreign key (technician_id)
  references public.technician_profiles(id)
  on delete set null;

create index if not exists bookings_technician_id_idx
  on public.bookings(technician_id, created_at desc);

drop policy if exists "bookings_select_technician_assigned_or_notified" on public.bookings;
create policy "bookings_select_technician_assigned_or_notified"
on public.bookings
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    technician_id = (select auth.uid())
    or exists (
      select 1
      from public.booking_assignments ba
      where ba.booking_id = bookings.id
        and ba.technician_id = (select auth.uid())
        and ba.status in ('notified', 'accepted', 'completed')
    )
  )
);

update public.bookings b
set
  technician_id = (
    select ba.technician_id
    from public.booking_assignments ba
    where ba.booking_id = b.id
      and ba.status = 'accepted'
    order by ba.accepted_at desc nulls last, ba.updated_at desc
    limit 1
  ),
  status = case
    when b.status in ('requested', 'confirmed', 'assigned') then 'accepted'
    else b.status
  end,
  updated_at = timezone('utc', now())
where b.technician_id is null
  and exists (
    select 1
    from public.booking_assignments ba
    where ba.booking_id = b.id
      and ba.status = 'accepted'
  );

create or replace function public.claim_booking_assignment(
  p_booking_id uuid,
  p_technician_id uuid
)
returns table (
  success boolean,
  assignment_id uuid,
  assignment_status text,
  message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_assignment_id uuid;
begin
  perform 1
  from public.bookings
  where id = p_booking_id
  for update;

  if exists (
    select 1
    from public.booking_assignments
    where booking_id = p_booking_id
      and technician_id <> p_technician_id
      and status = 'accepted'
  ) then
    update public.booking_assignments
    set
      status = 'cancelled',
      responded_at = coalesce(responded_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
    where booking_id = p_booking_id
      and technician_id = p_technician_id
      and status = 'notified';

    return query
    select false, null::uuid, 'cancelled'::text, 'Another technician already accepted this job.'::text;
    return;
  end if;

  update public.booking_assignments
  set
    status = 'accepted',
    responded_at = coalesce(responded_at, timezone('utc', now())),
    accepted_at = coalesce(accepted_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  where booking_id = p_booking_id
    and technician_id = p_technician_id
    and status = 'notified'
  returning id into claimed_assignment_id;

  if claimed_assignment_id is null then
    select id
    into claimed_assignment_id
    from public.booking_assignments
    where booking_id = p_booking_id
      and technician_id = p_technician_id
      and status = 'accepted'
    limit 1;

    if claimed_assignment_id is not null then
      return query
      select true, claimed_assignment_id, 'accepted'::text, 'Job already assigned to you.'::text;
      return;
    end if;

    return query
    select false, null::uuid, 'not_available'::text, 'This job is no longer available.'::text;
    return;
  end if;

  update public.booking_assignments
  set
    status = 'cancelled',
    responded_at = coalesce(responded_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  where booking_id = p_booking_id
    and technician_id <> p_technician_id
    and status = 'notified';

  update public.bookings
  set
    technician_id = p_technician_id,
    status = case
      when status in ('requested', 'confirmed', 'assigned') then 'accepted'
      else status
    end,
    updated_at = timezone('utc', now())
  where id = p_booking_id;

  return query
  select true, claimed_assignment_id, 'accepted'::text, 'Job assigned successfully.'::text;
end;
$$;

drop table if exists public.booking_estimate_items cascade;
drop table if exists public.booking_estimates cascade;
drop table if exists public.booking_otp_verifications cascade;
drop table if exists public.booking_route_events cascade;
drop table if exists public.booking_work_evidence cascade;
drop table if exists public.technician_documents cascade;
drop table if exists public.technician_service_areas cascade;
drop table if exists public.technician_payout_accounts cascade;
drop table if exists public.technician_ledger_entries cascade;

drop function if exists public.prepare_booking_estimate_item();
drop function if exists public.refresh_booking_estimate_totals();

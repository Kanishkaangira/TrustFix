alter table public.bookings
  drop constraint if exists bookings_technician_service_id_fkey;

drop index if exists public.bookings_technician_service_id_idx;

alter table public.bookings
  drop column if exists technician_service_id;

create or replace function public.dispatch_booking_to_available_technicians(p_booking_id uuid)
returns table (
  assignment_id uuid,
  assigned_technician_id uuid,
  assignment_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_booking public.bookings%rowtype;
  next_round integer;
begin
  select *
  into target_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if coalesce(target_booking.payment_status, '') <> 'booking_fee_paid' then
    return;
  end if;

  if exists (
    select 1
    from public.booking_assignments
    where booking_id = p_booking_id
      and status = 'accepted'
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.booking_assignments
    where booking_id = p_booking_id
      and status = 'notified'
  ) then
    return query
    select
      ba.id as assignment_id,
      ba.technician_id as assigned_technician_id,
      ba.status as assignment_status
    from public.booking_assignments ba
    where ba.booking_id = p_booking_id
      and ba.status = 'notified'
    order by ba.offered_at desc;
    return;
  end if;

  select coalesce(max(assignment_round), 0) + 1
  into next_round
  from public.booking_assignments
  where booking_id = p_booking_id;

  return query
  with inserted as (
    insert into public.booking_assignments (
      booking_id,
      technician_id,
      assignment_round,
      status
    )
    select
      p_booking_id,
      technician.id,
      next_round,
      'notified'
    from public.technician_profiles technician
    where technician.status = 'active'
      and technician.is_available = true
    on conflict (booking_id, technician_id, assignment_round) do nothing
    returning id, technician_id, status
  )
  select
    inserted.id as assignment_id,
    inserted.technician_id as assigned_technician_id,
    inserted.status as assignment_status
  from inserted;

  if exists (
    select 1
    from public.booking_assignments
    where booking_id = p_booking_id
      and assignment_round = next_round
      and status = 'notified'
  ) then
    update public.bookings
    set
      status = case
        when status in ('requested', 'confirmed') then 'assigned'
        else status
      end,
      updated_at = timezone('utc', now())
    where id = p_booking_id;
  end if;
end;
$$;

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

drop trigger if exists technician_services_set_updated_at on public.technician_services;
drop policy if exists "technician_services_manage_own" on public.technician_services;
drop table if exists public.technician_services cascade;

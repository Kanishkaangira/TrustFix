drop function if exists public.dispatch_booking_to_available_technicians(uuid);

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
    inner join public.technician_services service_match
      on service_match.technician_id = technician.id
      and service_match.service_id = target_booking.service_id
      and service_match.is_active = true
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

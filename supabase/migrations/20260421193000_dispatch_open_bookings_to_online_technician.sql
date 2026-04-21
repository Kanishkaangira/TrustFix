create or replace function public.dispatch_open_bookings_to_technician(
  p_technician_id uuid
)
returns table (
  booking_id uuid,
  assignment_id uuid,
  assignment_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_technician public.technician_profiles%rowtype;
begin
  select *
  into target_technician
  from public.technician_profiles
  where id = p_technician_id;

  if not found then
    raise exception 'Technician profile not found.';
  end if;

  if target_technician.status <> 'active' or target_technician.is_available = false then
    return;
  end if;

  return query
  with candidate_bookings as (
    select
      booking.id,
      coalesce((
        select max(assignment.assignment_round)
        from public.booking_assignments assignment
        where assignment.booking_id = booking.id
      ), 0) + 1 as next_round
    from public.bookings booking
    where booking.payment_status = 'booking_fee_paid'
      and booking.technician_id is null
      and booking.status not in ('completed', 'cancelled')
      and not exists (
        select 1
        from public.booking_assignments accepted_assignment
        where accepted_assignment.booking_id = booking.id
          and accepted_assignment.status = 'accepted'
      )
      and not exists (
        select 1
        from public.booking_assignments technician_assignment
        where technician_assignment.booking_id = booking.id
          and technician_assignment.technician_id = p_technician_id
      )
  ),
  inserted as (
    insert into public.booking_assignments (
      booking_id,
      technician_id,
      assignment_round,
      status
    )
    select
      candidate_bookings.id,
      p_technician_id,
      candidate_bookings.next_round,
      'notified'
    from candidate_bookings
    returning
      public.booking_assignments.booking_id,
      public.booking_assignments.id,
      public.booking_assignments.status
  ),
  touched_bookings as (
    update public.bookings booking
    set
      status = case
        when booking.status in ('requested', 'confirmed') then 'assigned'
        else booking.status
      end,
      updated_at = timezone('utc', now())
    where booking.id in (select inserted.booking_id from inserted)
    returning booking.id
  )
  select
    inserted.booking_id,
    inserted.id as assignment_id,
    inserted.status as assignment_status
  from inserted;
end;
$$;

grant execute on function public.dispatch_open_bookings_to_technician(uuid) to authenticated;

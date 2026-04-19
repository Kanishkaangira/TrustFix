alter table public.bookings
  add column if not exists technician_service_id uuid;

alter table public.bookings
  drop constraint if exists bookings_technician_service_id_fkey;

alter table public.bookings
  add constraint bookings_technician_service_id_fkey
  foreign key (technician_service_id)
  references public.technician_services(id)
  on delete set null;

create index if not exists bookings_technician_service_id_idx
  on public.bookings(technician_service_id, created_at desc);

update public.bookings b
set technician_service_id = (
  select ts.id
  from public.technician_services ts
  where ts.technician_id = b.technician_id
    and ts.service_id = b.service_id
    and ts.is_active = true
  order by ts.is_primary desc, ts.updated_at desc, ts.created_at desc
  limit 1
)
where b.technician_id is not null
  and b.technician_service_id is null;

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
  matched_technician_service_id uuid;
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

  select ts.id
  into matched_technician_service_id
  from public.technician_services ts
  inner join public.bookings b
    on b.id = p_booking_id
  where ts.technician_id = p_technician_id
    and ts.service_id = b.service_id
    and ts.is_active = true
  order by ts.is_primary desc, ts.updated_at desc, ts.created_at desc
  limit 1;

  update public.bookings
  set
    technician_id = p_technician_id,
    technician_service_id = matched_technician_service_id,
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

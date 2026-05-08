do $$
begin
  if to_regclass('public.booking_severity_pricing') is not null
    and to_regclass('public.severity_pricing') is null then
    execute 'alter table public.booking_severity_pricing rename to severity_pricing';
  end if;

  if to_regclass('public.booking_verification_otps') is not null
    and to_regclass('public.verification_otps') is null then
    execute 'alter table public.booking_verification_otps rename to verification_otps';
  end if;

  if to_regclass('public.booking_assignments') is not null
    and to_regclass('public.job_assignment') is null then
    execute 'alter table public.booking_assignments rename to job_assignment';
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.severity_pricing') is not null then
    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.severity_pricing'::regclass
        and conname = 'booking_severity_pricing_severity_chk'
    ) then
      execute 'alter table public.severity_pricing rename constraint booking_severity_pricing_severity_chk to severity_pricing_severity_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.severity_pricing'::regclass
        and conname = 'booking_severity_pricing_visit_charge_chk'
    ) then
      execute 'alter table public.severity_pricing rename constraint booking_severity_pricing_visit_charge_chk to severity_pricing_visit_charge_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.severity_pricing'::regclass
        and conname = 'booking_severity_pricing_platform_fee_chk'
    ) then
      execute 'alter table public.severity_pricing rename constraint booking_severity_pricing_platform_fee_chk to severity_pricing_platform_fee_chk';
    end if;
  end if;

  if to_regclass('public.verification_otps') is not null then
    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.verification_otps'::regclass
        and conname = 'booking_verification_otps_purpose_chk'
    ) then
      execute 'alter table public.verification_otps rename constraint booking_verification_otps_purpose_chk to verification_otps_purpose_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.verification_otps'::regclass
        and conname = 'booking_verification_otps_status_chk'
    ) then
      execute 'alter table public.verification_otps rename constraint booking_verification_otps_status_chk to verification_otps_status_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.verification_otps'::regclass
        and conname = 'booking_verification_otps_code_format_chk'
    ) then
      execute 'alter table public.verification_otps rename constraint booking_verification_otps_code_format_chk to verification_otps_code_format_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.verification_otps'::regclass
        and conname = 'booking_verification_otps_attempt_count_chk'
    ) then
      execute 'alter table public.verification_otps rename constraint booking_verification_otps_attempt_count_chk to verification_otps_attempt_count_chk';
    end if;
  end if;

  if to_regclass('public.job_assignment') is not null then
    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.job_assignment'::regclass
        and conname = 'booking_assignments_status_chk'
    ) then
      execute 'alter table public.job_assignment rename constraint booking_assignments_status_chk to job_assignment_status_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.job_assignment'::regclass
        and conname = 'booking_assignments_commission_percent_snapshot_chk'
    ) then
      execute 'alter table public.job_assignment rename constraint booking_assignments_commission_percent_snapshot_chk to job_assignment_commission_percent_snapshot_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.job_assignment'::regclass
        and conname = 'booking_assignments_commission_scope_snapshot_chk'
    ) then
      execute 'alter table public.job_assignment rename constraint booking_assignments_commission_scope_snapshot_chk to job_assignment_commission_scope_snapshot_chk';
    end if;

    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.job_assignment'::regclass
        and conname = 'booking_assignments_unique'
    ) then
      execute 'alter table public.job_assignment rename constraint booking_assignments_unique to job_assignment_unique';
    end if;
  end if;
end;
$$;

alter index if exists public.booking_severity_pricing_sort_order_idx
  rename to severity_pricing_sort_order_idx;

alter index if exists public.booking_verification_otps_booking_id_created_at_idx
  rename to verification_otps_booking_id_created_at_idx;

alter index if exists public.booking_verification_otps_status_expires_at_idx
  rename to verification_otps_status_expires_at_idx;

alter index if exists public.booking_assignments_booking_id_idx
  rename to job_assignment_booking_id_idx;

alter index if exists public.booking_assignments_technician_id_idx
  rename to job_assignment_technician_id_idx;

create or replace function public.prepare_booking()
returns trigger
language plpgsql
as $$
declare
  selected_service public.services%rowtype;
  selected_problem public.service_problems%rowtype;
  selected_booking_pricing public.severity_pricing%rowtype;
  selected_address public.addresses%rowtype;
  selected_profile public.profiles%rowtype;
begin
  select *
  into selected_service
  from public.services
  where id = new.service_id
    and is_active = true;

  if not found then
    raise exception 'Invalid or inactive service.';
  end if;

  new.service_name_snapshot = selected_service.name;
  select *
  into selected_booking_pricing
  from public.severity_pricing
  where severity = new.severity;

  if not found then
    raise exception 'Missing severity pricing configuration.';
  end if;

  new.visit_charge = case
    when coalesce(new.visit_charge, 0) > 0 then new.visit_charge
    else selected_booking_pricing.visit_charge
  end;
  new.platform_fee = case
    when coalesce(new.platform_fee, 0) > 0 then new.platform_fee
    else selected_booking_pricing.platform_fee
  end;

  select *
  into selected_profile
  from public.profiles
  where id = new.user_id;

  if not found then
    raise exception 'Invalid customer profile.';
  end if;

  new.customer_name_snapshot = nullif(btrim(coalesce(selected_profile.full_name, '')), '');
  new.customer_phone_snapshot = nullif(btrim(coalesce(selected_profile.phone, '')), '');

  if new.service_problem_id is not null then
    select *
    into selected_problem
    from public.service_problems
    where id = new.service_problem_id
      and is_active = true;

    if not found then
      raise exception 'Invalid or inactive service problem.';
    end if;

    if selected_problem.service_id <> new.service_id then
      raise exception 'Selected problem does not belong to the selected service.';
    end if;

    new.problem_name_snapshot = selected_problem.name;
  else
    new.problem_name_snapshot = nullif(btrim(coalesce(new.custom_problem, '')), '');
  end if;

  if new.address_id is not null then
    select *
    into selected_address
    from public.addresses
    where id = new.address_id
      and user_id = new.user_id;

    if not found then
      raise exception 'Selected address does not belong to this user.';
    end if;

    new.address_label_snapshot = selected_address.label;
    new.address_snapshot = selected_address.display_address;
    new.pincode = nullif(btrim(coalesce(selected_address.postal_code, '')), '');
  else
    new.address_label_snapshot = null;
    new.address_snapshot = null;
    new.pincode = null;
  end if;

  if new.severity = 'moderate'
    and nullif(btrim(coalesce(new.scheduled_slot_label, '')), '') is null then
    new.scheduled_slot_label = 'Within 24 hours';
  elsif new.severity = 'urgent'
    and nullif(btrim(coalesce(new.scheduled_slot_label, '')), '') is null then
    new.scheduled_slot_label = '15-30 mins';
  end if;

  new.urgency_surcharge = 0;

  new.protection_fee = case
    when new.protection_selected then greatest(coalesce(new.protection_fee, 0), 19)
    else 0
  end;

  new.estimated_total =
    coalesce(new.visit_charge, 0)
    + coalesce(new.urgency_surcharge, 0)
    + coalesce(new.platform_fee, 0)
    + coalesce(new.protection_fee, 0);

  return new;
end;
$$;

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
    from public.job_assignment
    where booking_id = p_booking_id
      and status = 'accepted'
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.job_assignment
    where booking_id = p_booking_id
      and status = 'notified'
  ) then
    return query
    select
      ba.id as assignment_id,
      ba.technician_id as assigned_technician_id,
      ba.status as assignment_status
    from public.job_assignment ba
    where ba.booking_id = p_booking_id
      and ba.status = 'notified'
    order by ba.offered_at desc;
    return;
  end if;

  select coalesce(max(assignment_round), 0) + 1
  into next_round
  from public.job_assignment
  where booking_id = p_booking_id;

  return query
  with inserted as (
    insert into public.job_assignment (
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
    from public.job_assignment
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
        from public.job_assignment assignment
        where assignment.booking_id = booking.id
      ), 0) + 1 as next_round
    from public.bookings booking
    where booking.payment_status = 'booking_fee_paid'
      and booking.technician_id is null
      and booking.status not in ('completed', 'cancelled')
      and not exists (
        select 1
        from public.job_assignment accepted_assignment
        where accepted_assignment.booking_id = booking.id
          and accepted_assignment.status = 'accepted'
      )
      and not exists (
        select 1
        from public.job_assignment technician_assignment
        where technician_assignment.booking_id = booking.id
          and technician_assignment.technician_id = p_technician_id
      )
  ),
  inserted as (
    insert into public.job_assignment (
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
      public.job_assignment.booking_id,
      public.job_assignment.id,
      public.job_assignment.status
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
    from public.job_assignment
    where booking_id = p_booking_id
      and technician_id <> p_technician_id
      and status = 'accepted'
  ) then
    update public.job_assignment
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

  update public.job_assignment
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
    from public.job_assignment
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

  update public.job_assignment
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

drop trigger if exists booking_severity_pricing_set_updated_at on public.severity_pricing;
drop trigger if exists severity_pricing_set_updated_at on public.severity_pricing;
create trigger severity_pricing_set_updated_at
  before update on public.severity_pricing
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_verification_otps_set_updated_at on public.verification_otps;
drop trigger if exists verification_otps_set_updated_at on public.verification_otps;
create trigger verification_otps_set_updated_at
  before update on public.verification_otps
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_assignments_set_updated_at on public.job_assignment;
drop trigger if exists job_assignment_set_updated_at on public.job_assignment;
create trigger job_assignment_set_updated_at
  before update on public.job_assignment
  for each row
  execute procedure public.set_updated_at();

grant select on table public.severity_pricing to authenticated;
grant select on table public.verification_otps to authenticated;
grant select, insert, update on table public.job_assignment to authenticated;
grant execute on function public.dispatch_booking_to_available_technicians(uuid) to authenticated;
grant execute on function public.dispatch_open_bookings_to_technician(uuid) to authenticated;
grant execute on function public.claim_booking_assignment(uuid, uuid) to authenticated;

drop policy if exists "booking_severity_pricing_select_authenticated" on public.severity_pricing;
drop policy if exists "severity_pricing_select_authenticated" on public.severity_pricing;
create policy "severity_pricing_select_authenticated"
on public.severity_pricing
for select
to authenticated
using (true);

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
      from public.job_assignment ba
      where ba.booking_id = bookings.id
        and ba.technician_id = (select auth.uid())
        and ba.status in ('notified', 'accepted', 'completed')
    )
  )
);

drop policy if exists "booking_verification_otps_select_owner" on public.verification_otps;
drop policy if exists "verification_otps_select_owner" on public.verification_otps;
create policy "verification_otps_select_owner"
on public.verification_otps
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = verification_otps.booking_id
      and b.user_id = (select auth.uid())
  )
);

drop policy if exists "booking_assignments_select_own" on public.job_assignment;
drop policy if exists "job_assignment_select_own" on public.job_assignment;
create policy "job_assignment_select_own"
on public.job_assignment
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_assignments_update_own" on public.job_assignment;
drop policy if exists "job_assignment_update_own" on public.job_assignment;
create policy "job_assignment_update_own"
on public.job_assignment
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_assignments_insert_own" on public.job_assignment;
drop policy if exists "job_assignment_insert_own" on public.job_assignment;
create policy "job_assignment_insert_own"
on public.job_assignment
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

-- TrustFix technician-side schema
-- Run this after trustfix_core_schema.sql.
-- Keeps the live technician flow focused on:
-- onboarding, service mapping, dispatch, job acceptance, completion,
-- subscriptions, and payout tracking.

create extension if not exists pgcrypto;

create table if not exists public.technician_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  email text,
  city text,
  service_area_summary text,
  bio text,
  profile_photo_url text,
  status text not null default 'pending_review',
  is_available boolean not null default false,
  rating numeric(4, 2) not null default 0,
  completed_jobs_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_profiles_display_name_not_blank_chk check (btrim(display_name) <> ''),
  constraint technician_profiles_status_chk check (
    status in ('pending_review', 'active', 'paused', 'suspended')
  )
);

create table if not exists public.subscription_plans (
  code text primary key,
  name text not null,
  description text,
  monthly_fee numeric(10, 2) not null default 0,
  commission_percent numeric(5, 2) not null default 0,
  commission_scope text not null default 'labour_parts',
  visit_fee_commissionable boolean not null default false,
  priority_rank integer not null default 0,
  max_active_leads integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint subscription_plans_code_not_blank_chk check (btrim(code) <> ''),
  constraint subscription_plans_name_not_blank_chk check (btrim(name) <> ''),
  constraint subscription_plans_commission_percent_chk check (commission_percent >= 0),
  constraint subscription_plans_commission_scope_chk check (
    commission_scope in ('labour_only', 'labour_parts')
  )
);

create table if not exists public.technician_subscriptions (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  plan_code text not null references public.subscription_plans(code) on delete restrict,
  status text not null default 'active',
  auto_renew boolean not null default true,
  current_period_start timestamptz not null default timezone('utc', now()),
  current_period_end timestamptz,
  gateway_subscription_id text,
  gateway_order_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_subscriptions_status_chk check (
    status in ('pending', 'active', 'expired', 'cancelled')
  )
);

create table if not exists public.booking_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  assignment_round integer not null default 1,
  status text not null default 'notified',
  plan_code_snapshot text references public.subscription_plans(code) on delete set null,
  commission_percent_snapshot numeric(5, 2) not null default 0,
  commission_scope_snapshot text not null default 'labour_parts',
  algorithm_score numeric(8, 4),
  offered_at timestamptz not null default timezone('utc', now()),
  responded_at timestamptz,
  accepted_at timestamptz,
  declined_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_assignments_status_chk check (
    status in ('notified', 'accepted', 'declined', 'expired', 'cancelled', 'completed')
  ),
  constraint booking_assignments_commission_percent_snapshot_chk check (
    commission_percent_snapshot >= 0
  ),
  constraint booking_assignments_commission_scope_snapshot_chk check (
    commission_scope_snapshot in ('labour_only', 'labour_parts')
  ),
  constraint booking_assignments_unique unique (booking_id, technician_id, assignment_round)
);

create table if not exists public.booking_completion_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  summary text,
  plan_code_snapshot text references public.subscription_plans(code) on delete set null,
  commission_percent_snapshot numeric(5, 2) not null default 0,
  final_labour_amount numeric(10, 2) not null default 0,
  final_parts_amount numeric(10, 2) not null default 0,
  final_visit_charge numeric(10, 2) not null default 0,
  platform_fee_amount numeric(10, 2) not null default 0,
  protection_fee_amount numeric(10, 2) not null default 0,
  urgency_surcharge_amount numeric(10, 2) not null default 0,
  final_customer_total numeric(10, 2) not null default 0,
  commissionable_labour_amount numeric(10, 2) not null default 0,
  commissionable_parts_amount numeric(10, 2) not null default 0,
  commissionable_total numeric(10, 2) not null default 0,
  commission_base numeric(10, 2) not null default 0,
  commission_amount numeric(10, 2) not null default 0,
  technician_payout_amount numeric(10, 2) not null default 0,
  payment_request_status text not null default 'pending',
  payment_requested_at timestamptz,
  payment_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_completion_reports_commission_percent_snapshot_chk check (
    commission_percent_snapshot >= 0
  ),
  constraint booking_completion_reports_payment_request_status_chk check (
    payment_request_status in ('pending', 'requested', 'paid', 'failed')
  )
);

alter table public.bookings
  drop constraint if exists bookings_technician_id_fkey;

alter table public.bookings
  add constraint bookings_technician_id_fkey
  foreign key (technician_id)
  references public.technician_profiles(id)
  on delete set null;

create index if not exists technician_subscriptions_technician_id_idx
  on public.technician_subscriptions(technician_id, status);

create index if not exists booking_assignments_booking_id_idx
  on public.booking_assignments(booking_id, offered_at desc);

create index if not exists booking_assignments_technician_id_idx
  on public.booking_assignments(technician_id, offered_at desc);

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

drop trigger if exists technician_profiles_set_updated_at on public.technician_profiles;
create trigger technician_profiles_set_updated_at
  before update on public.technician_profiles
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists subscription_plans_set_updated_at on public.subscription_plans;
create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists technician_subscriptions_set_updated_at on public.technician_subscriptions;
create trigger technician_subscriptions_set_updated_at
  before update on public.technician_subscriptions
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_assignments_set_updated_at on public.booking_assignments;
create trigger booking_assignments_set_updated_at
  before update on public.booking_assignments
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_completion_reports_set_updated_at on public.booking_completion_reports;
create trigger booking_completion_reports_set_updated_at
  before update on public.booking_completion_reports
  for each row
  execute procedure public.set_updated_at();

alter table public.technician_profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.technician_subscriptions enable row level security;
alter table public.booking_assignments enable row level security;
alter table public.booking_completion_reports enable row level security;

revoke all on table public.technician_profiles from anon, authenticated;
revoke all on table public.subscription_plans from anon, authenticated;
revoke all on table public.technician_subscriptions from anon, authenticated;
revoke all on table public.booking_assignments from anon, authenticated;
revoke all on table public.booking_completion_reports from anon, authenticated;

grant select, insert, update on table public.technician_profiles to authenticated;
grant select on table public.subscription_plans to authenticated;
grant select, insert, update on table public.technician_subscriptions to authenticated;
grant select, insert, update on table public.booking_assignments to authenticated;
grant select, insert, update on table public.booking_completion_reports to authenticated;
grant execute on function public.dispatch_booking_to_available_technicians(uuid) to authenticated;
grant execute on function public.dispatch_open_bookings_to_technician(uuid) to authenticated;
grant execute on function public.claim_booking_assignment(uuid, uuid) to authenticated;

drop policy if exists "technician_profiles_select_own" on public.technician_profiles;
create policy "technician_profiles_select_own"
on public.technician_profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "technician_profiles_insert_own" on public.technician_profiles;
create policy "technician_profiles_insert_own"
on public.technician_profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "technician_profiles_update_own" on public.technician_profiles;
create policy "technician_profiles_update_own"
on public.technician_profiles
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "subscription_plans_select_authenticated" on public.subscription_plans;
create policy "subscription_plans_select_authenticated"
on public.subscription_plans
for select
to authenticated
using (is_active = true);

drop policy if exists "technician_subscriptions_manage_own" on public.technician_subscriptions;
create policy "technician_subscriptions_manage_own"
on public.technician_subscriptions
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_assignments_select_own" on public.booking_assignments;
create policy "booking_assignments_select_own"
on public.booking_assignments
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_assignments_update_own" on public.booking_assignments;
create policy "booking_assignments_update_own"
on public.booking_assignments
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_assignments_insert_own" on public.booking_assignments;
create policy "booking_assignments_insert_own"
on public.booking_assignments
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_completion_reports_manage_own" on public.booking_completion_reports;
create policy "booking_completion_reports_manage_own"
on public.booking_completion_reports
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

insert into public.subscription_plans (
  code,
  name,
  description,
  monthly_fee,
  commission_percent,
  commission_scope,
  visit_fee_commissionable,
  priority_rank,
  max_active_leads,
  is_active
)
values
  ('basic', 'Basic', 'Starter technician plan', 299, 20, 'labour_parts', false, 1, 10, true),
  ('pro', 'Pro', 'Recommended full-time technician plan', 599, 14, 'labour_parts', false, 2, null, true),
  ('elite', 'Elite', 'Highest priority and lowest commission plan', 999, 9, 'labour_parts', false, 3, null, true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  monthly_fee = excluded.monthly_fee,
  commission_percent = excluded.commission_percent,
  commission_scope = excluded.commission_scope,
  visit_fee_commissionable = excluded.visit_fee_commissionable,
  priority_rank = excluded.priority_rank,
  max_active_leads = excluded.max_active_leads,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

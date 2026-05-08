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
  subscription_plan_code text,
  subscription_status text not null default 'inactive',
  is_available boolean not null default false,
  rating numeric(4, 2) not null default 0,
  completed_jobs_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_profiles_display_name_not_blank_chk check (btrim(display_name) <> ''),
  constraint technician_profiles_status_chk check (
    status in ('pending_review', 'active', 'paused', 'suspended')
  ),
  constraint technician_profiles_subscription_status_chk check (
    subscription_status in ('inactive', 'pending', 'active', 'expired', 'cancelled')
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

create table if not exists public.job_assignment (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  assignment_round integer not null default 1,
  status text not null default 'notified',
  algorithm_score numeric(8, 4),
  offered_at timestamptz not null default timezone('utc', now()),
  responded_at timestamptz,
  accepted_at timestamptz,
  declined_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint job_assignment_status_chk check (
    status in ('notified', 'accepted', 'declined', 'expired', 'cancelled', 'completed')
  ),
  constraint job_assignment_unique unique (booking_id, technician_id, assignment_round)
);

alter table public.bookings
  drop constraint if exists bookings_technician_id_fkey;

alter table public.bookings
  add constraint bookings_technician_id_fkey
  foreign key (technician_id)
  references public.technician_profiles(id)
  on delete set null;

alter table public.technician_profiles
  drop constraint if exists technician_profiles_subscription_plan_code_fkey;

alter table public.technician_profiles
  add constraint technician_profiles_subscription_plan_code_fkey
  foreign key (subscription_plan_code)
  references public.subscription_plans(code)
  on delete set null;

create index if not exists technician_subscriptions_technician_id_idx
  on public.technician_subscriptions(technician_id, status);

create index if not exists job_assignment_booking_id_idx
  on public.job_assignment(booking_id, offered_at desc);

create index if not exists job_assignment_technician_id_idx
  on public.job_assignment(technician_id, offered_at desc);

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

create or replace function public.refresh_technician_profile_subscription_snapshot(
  p_technician_id uuid
)
returns void
language plpgsql
as $$
declare
  latest_subscription public.technician_subscriptions%rowtype;
begin
  if p_technician_id is null then
    return;
  end if;

  select *
  into latest_subscription
  from public.technician_subscriptions
  where technician_id = p_technician_id
  order by
    case status
      when 'active' then 1
      when 'pending' then 2
      when 'expired' then 3
      when 'cancelled' then 4
      else 5
    end,
    coalesce(current_period_end, current_period_start, created_at) desc,
    created_at desc
  limit 1;

  if latest_subscription.id is null then
    update public.technician_profiles
    set
      subscription_plan_code = null,
      subscription_status = 'inactive'
    where id = p_technician_id;

    return;
  end if;

  update public.technician_profiles
  set
    subscription_plan_code = latest_subscription.plan_code,
    subscription_status = latest_subscription.status
  where id = p_technician_id;
end;
$$;

create or replace function public.sync_technician_profile_subscription_snapshot()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_technician_profile_subscription_snapshot(old.technician_id);
    return old;
  end if;

  perform public.refresh_technician_profile_subscription_snapshot(new.technician_id);

  if tg_op = 'UPDATE' and old.technician_id is distinct from new.technician_id then
    perform public.refresh_technician_profile_subscription_snapshot(old.technician_id);
  end if;

  return new;
end;
$$;

create or replace function public.sync_new_technician_profile_subscription_snapshot()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_technician_profile_subscription_snapshot(new.id);
  return new;
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

drop trigger if exists technician_subscriptions_sync_profile_snapshot on public.technician_subscriptions;
create trigger technician_subscriptions_sync_profile_snapshot
  after insert or update or delete on public.technician_subscriptions
  for each row
  execute procedure public.sync_technician_profile_subscription_snapshot();

drop trigger if exists technician_profiles_sync_subscription_snapshot on public.technician_profiles;
create trigger technician_profiles_sync_subscription_snapshot
  after insert on public.technician_profiles
  for each row
  execute procedure public.sync_new_technician_profile_subscription_snapshot();

drop trigger if exists job_assignment_set_updated_at on public.job_assignment;
create trigger job_assignment_set_updated_at
  before update on public.job_assignment
  for each row
  execute procedure public.set_updated_at();

alter table public.technician_profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.technician_subscriptions enable row level security;
alter table public.job_assignment enable row level security;

revoke all on table public.technician_profiles from anon, authenticated;
revoke all on table public.subscription_plans from anon, authenticated;
revoke all on table public.technician_subscriptions from anon, authenticated;
revoke all on table public.job_assignment from anon, authenticated;

grant select, insert, update on table public.technician_profiles to authenticated;
grant select on table public.subscription_plans to authenticated;
grant select, insert, update on table public.technician_subscriptions to authenticated;
grant select, insert, update on table public.job_assignment to authenticated;
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

drop policy if exists "job_assignment_select_own" on public.job_assignment;
create policy "job_assignment_select_own"
on public.job_assignment
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "job_assignment_update_own" on public.job_assignment;
create policy "job_assignment_update_own"
on public.job_assignment
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "job_assignment_insert_own" on public.job_assignment;
create policy "job_assignment_insert_own"
on public.job_assignment
for insert
to authenticated
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


-- TrustFix technician-side schema
-- Run this after trustfix_core_schema.sql.
-- Adds technician onboarding, subscriptions, dispatch, estimate, OTP,
-- completion, and ledger tables for the technician workflow.

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

create table if not exists public.technician_services (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  years_experience integer not null default 0,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_services_years_experience_chk check (years_experience >= 0),
  constraint technician_services_unique unique (technician_id, service_id)
);

create table if not exists public.technician_service_areas (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  label text not null,
  city text not null,
  state text not null,
  postal_code text,
  radius_km numeric(6, 2) not null default 10,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_service_areas_label_not_blank_chk check (btrim(label) <> ''),
  constraint technician_service_areas_city_not_blank_chk check (btrim(city) <> ''),
  constraint technician_service_areas_state_not_blank_chk check (btrim(state) <> ''),
  constraint technician_service_areas_radius_chk check (radius_km > 0)
);

create table if not exists public.technician_documents (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  document_type text not null,
  document_url text not null,
  verification_status text not null default 'pending',
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_documents_type_chk check (
    document_type in ('aadhaar', 'pan', 'certificate', 'license', 'profile_photo', 'other')
  ),
  constraint technician_documents_verification_status_chk check (
    verification_status in ('pending', 'approved', 'rejected', 'expired')
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

create table if not exists public.technician_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  payout_method text not null,
  account_holder_name text,
  upi_id text,
  bank_name text,
  account_number_masked text,
  ifsc_code text,
  is_default boolean not null default false,
  verification_status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_payout_accounts_method_chk check (
    payout_method in ('upi', 'bank')
  ),
  constraint technician_payout_accounts_verification_status_chk check (
    verification_status in ('pending', 'verified', 'rejected')
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

create table if not exists public.booking_otp_verifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  otp_code text not null,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_otp_verifications_otp_code_chk check (char_length(btrim(otp_code)) between 4 and 8)
);

create table if not exists public.booking_estimates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  version_no integer not null,
  diagnosis text,
  labour_amount numeric(10, 2) not null default 0,
  parts_amount numeric(10, 2) not null default 0,
  visit_charge numeric(10, 2) not null default 0,
  platform_fee numeric(10, 2) not null default 0,
  customer_total numeric(10, 2) not null default 0,
  approval_status text not null default 'draft',
  sent_at timestamptz,
  customer_action_at timestamptz,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_estimates_version_unique unique (booking_id, version_no),
  constraint booking_estimates_approval_status_chk check (
    approval_status in ('draft', 'sent', 'approved', 'rejected', 'superseded')
  )
);

create table if not exists public.booking_estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.booking_estimates(id) on delete cascade,
  line_type text not null,
  name text not null,
  quantity numeric(10, 2) not null default 1,
  unit_amount numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_estimate_items_line_type_chk check (
    line_type in ('labour', 'part', 'visit_charge', 'platform_fee', 'adjustment')
  ),
  constraint booking_estimate_items_name_not_blank_chk check (btrim(name) <> ''),
  constraint booking_estimate_items_quantity_chk check (quantity >= 0)
);

create table if not exists public.booking_route_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  event_type text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint booking_route_events_type_chk check (
    event_type in (
      'accepted',
      'en_route',
      'arrived',
      'otp_verified',
      'work_started',
      'work_completed',
      'payment_requested',
      'payment_received'
    )
  )
);

create table if not exists public.booking_work_evidence (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  media_type text not null,
  file_url text not null,
  caption text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_work_evidence_media_type_chk check (
    media_type in ('before', 'during', 'after', 'invoice', 'part_bill')
  )
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

create table if not exists public.technician_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  entry_type text not null,
  direction text not null,
  amount numeric(10, 2) not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_ledger_entries_entry_type_chk check (
    entry_type in ('earning', 'commission', 'subscription_fee', 'adjustment', 'payout')
  ),
  constraint technician_ledger_entries_direction_chk check (
    direction in ('credit', 'debit')
  )
);

create index if not exists technician_services_technician_id_idx
  on public.technician_services(technician_id);

create index if not exists technician_service_areas_technician_id_idx
  on public.technician_service_areas(technician_id);

create index if not exists technician_documents_technician_id_idx
  on public.technician_documents(technician_id);

create index if not exists technician_subscriptions_technician_id_idx
  on public.technician_subscriptions(technician_id, status);

create index if not exists technician_payout_accounts_technician_id_idx
  on public.technician_payout_accounts(technician_id);

create index if not exists booking_assignments_booking_id_idx
  on public.booking_assignments(booking_id, offered_at desc);

create index if not exists booking_assignments_technician_id_idx
  on public.booking_assignments(technician_id, offered_at desc);

create index if not exists booking_estimates_booking_id_idx
  on public.booking_estimates(booking_id, version_no desc);

create index if not exists booking_estimate_items_estimate_id_idx
  on public.booking_estimate_items(estimate_id);

create index if not exists booking_route_events_booking_id_idx
  on public.booking_route_events(booking_id, created_at desc);

create index if not exists booking_work_evidence_booking_id_idx
  on public.booking_work_evidence(booking_id, created_at desc);

create index if not exists technician_ledger_entries_technician_id_idx
  on public.technician_ledger_entries(technician_id, created_at desc);

create or replace function public.prepare_booking_estimate_item()
returns trigger
language plpgsql
as $$
begin
  new.line_total = coalesce(new.quantity, 0) * coalesce(new.unit_amount, 0);
  return new;
end;
$$;

create or replace function public.refresh_booking_estimate_totals()
returns trigger
language plpgsql
as $$
declare
  target_estimate_id uuid;
begin
  target_estimate_id = coalesce(new.estimate_id, old.estimate_id);

  update public.booking_estimates e
  set
    labour_amount = coalesce((
      select sum(line_total)
      from public.booking_estimate_items
      where estimate_id = target_estimate_id
        and line_type = 'labour'
    ), 0),
    parts_amount = coalesce((
      select sum(line_total)
      from public.booking_estimate_items
      where estimate_id = target_estimate_id
        and line_type = 'part'
    ), 0),
    visit_charge = coalesce((
      select sum(line_total)
      from public.booking_estimate_items
      where estimate_id = target_estimate_id
        and line_type = 'visit_charge'
    ), 0),
    platform_fee = coalesce((
      select sum(line_total)
      from public.booking_estimate_items
      where estimate_id = target_estimate_id
        and line_type = 'platform_fee'
    ), 0),
    customer_total = coalesce((
      select sum(line_total)
      from public.booking_estimate_items
      where estimate_id = target_estimate_id
    ), 0),
    updated_at = timezone('utc', now())
  where e.id = target_estimate_id;

  return null;
end;
$$;

create or replace function public.dispatch_booking_to_available_technicians(p_booking_id uuid)
returns table (
  assignment_id uuid,
  technician_id uuid,
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
    select id, technician_id, status
    from public.booking_assignments
    where booking_id = p_booking_id
      and status = 'notified'
    order by offered_at desc;
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
  select id, technician_id, status
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

drop trigger if exists technician_services_set_updated_at on public.technician_services;
create trigger technician_services_set_updated_at
  before update on public.technician_services
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists technician_service_areas_set_updated_at on public.technician_service_areas;
create trigger technician_service_areas_set_updated_at
  before update on public.technician_service_areas
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists technician_documents_set_updated_at on public.technician_documents;
create trigger technician_documents_set_updated_at
  before update on public.technician_documents
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

drop trigger if exists technician_payout_accounts_set_updated_at on public.technician_payout_accounts;
create trigger technician_payout_accounts_set_updated_at
  before update on public.technician_payout_accounts
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_assignments_set_updated_at on public.booking_assignments;
create trigger booking_assignments_set_updated_at
  before update on public.booking_assignments
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_otp_verifications_set_updated_at on public.booking_otp_verifications;
create trigger booking_otp_verifications_set_updated_at
  before update on public.booking_otp_verifications
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_estimates_set_updated_at on public.booking_estimates;
create trigger booking_estimates_set_updated_at
  before update on public.booking_estimates
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_estimate_items_set_updated_at on public.booking_estimate_items;
create trigger booking_estimate_items_set_updated_at
  before update on public.booking_estimate_items
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_estimate_items_prepare_trigger on public.booking_estimate_items;
create trigger booking_estimate_items_prepare_trigger
  before insert or update on public.booking_estimate_items
  for each row
  execute procedure public.prepare_booking_estimate_item();

drop trigger if exists booking_estimate_items_refresh_after_insert on public.booking_estimate_items;
create trigger booking_estimate_items_refresh_after_insert
  after insert on public.booking_estimate_items
  for each row
  execute procedure public.refresh_booking_estimate_totals();

drop trigger if exists booking_estimate_items_refresh_after_update on public.booking_estimate_items;
create trigger booking_estimate_items_refresh_after_update
  after update on public.booking_estimate_items
  for each row
  execute procedure public.refresh_booking_estimate_totals();

drop trigger if exists booking_estimate_items_refresh_after_delete on public.booking_estimate_items;
create trigger booking_estimate_items_refresh_after_delete
  after delete on public.booking_estimate_items
  for each row
  execute procedure public.refresh_booking_estimate_totals();

drop trigger if exists booking_work_evidence_set_updated_at on public.booking_work_evidence;
create trigger booking_work_evidence_set_updated_at
  before update on public.booking_work_evidence
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists booking_completion_reports_set_updated_at on public.booking_completion_reports;
create trigger booking_completion_reports_set_updated_at
  before update on public.booking_completion_reports
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists technician_ledger_entries_set_updated_at on public.technician_ledger_entries;
create trigger technician_ledger_entries_set_updated_at
  before update on public.technician_ledger_entries
  for each row
  execute procedure public.set_updated_at();

alter table public.technician_profiles enable row level security;
alter table public.technician_services enable row level security;
alter table public.technician_service_areas enable row level security;
alter table public.technician_documents enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.technician_subscriptions enable row level security;
alter table public.technician_payout_accounts enable row level security;
alter table public.booking_assignments enable row level security;
alter table public.booking_otp_verifications enable row level security;
alter table public.booking_estimates enable row level security;
alter table public.booking_estimate_items enable row level security;
alter table public.booking_route_events enable row level security;
alter table public.booking_work_evidence enable row level security;
alter table public.booking_completion_reports enable row level security;
alter table public.technician_ledger_entries enable row level security;

revoke all on table public.technician_profiles from anon, authenticated;
revoke all on table public.technician_services from anon, authenticated;
revoke all on table public.technician_service_areas from anon, authenticated;
revoke all on table public.technician_documents from anon, authenticated;
revoke all on table public.subscription_plans from anon, authenticated;
revoke all on table public.technician_subscriptions from anon, authenticated;
revoke all on table public.technician_payout_accounts from anon, authenticated;
revoke all on table public.booking_assignments from anon, authenticated;
revoke all on table public.booking_otp_verifications from anon, authenticated;
revoke all on table public.booking_estimates from anon, authenticated;
revoke all on table public.booking_estimate_items from anon, authenticated;
revoke all on table public.booking_route_events from anon, authenticated;
revoke all on table public.booking_work_evidence from anon, authenticated;
revoke all on table public.booking_completion_reports from anon, authenticated;
revoke all on table public.technician_ledger_entries from anon, authenticated;

grant select, insert, update on table public.technician_profiles to authenticated;
grant select, insert, update, delete on table public.technician_services to authenticated;
grant select, insert, update, delete on table public.technician_service_areas to authenticated;
grant select, insert, update, delete on table public.technician_documents to authenticated;
grant select on table public.subscription_plans to authenticated;
grant select, insert, update on table public.technician_subscriptions to authenticated;
grant select, insert, update, delete on table public.technician_payout_accounts to authenticated;
grant select, insert, update on table public.booking_assignments to authenticated;
grant select, insert, update on table public.booking_otp_verifications to authenticated;
grant select, insert, update on table public.booking_estimates to authenticated;
grant select, insert, update, delete on table public.booking_estimate_items to authenticated;
grant select, insert on table public.booking_route_events to authenticated;
grant select, insert, update, delete on table public.booking_work_evidence to authenticated;
grant select, insert, update on table public.booking_completion_reports to authenticated;
grant select, insert, update on table public.technician_ledger_entries to authenticated;
grant execute on function public.dispatch_booking_to_available_technicians(uuid) to authenticated;
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

drop policy if exists "technician_services_manage_own" on public.technician_services;
create policy "technician_services_manage_own"
on public.technician_services
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "technician_service_areas_manage_own" on public.technician_service_areas;
create policy "technician_service_areas_manage_own"
on public.technician_service_areas
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "technician_documents_manage_own" on public.technician_documents;
create policy "technician_documents_manage_own"
on public.technician_documents
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

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

drop policy if exists "technician_payout_accounts_manage_own" on public.technician_payout_accounts;
create policy "technician_payout_accounts_manage_own"
on public.technician_payout_accounts
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

drop policy if exists "booking_otp_verifications_manage_own" on public.booking_otp_verifications;
create policy "booking_otp_verifications_manage_own"
on public.booking_otp_verifications
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_estimates_manage_own" on public.booking_estimates;
create policy "booking_estimates_manage_own"
on public.booking_estimates
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_estimate_items_manage_own" on public.booking_estimate_items;
create policy "booking_estimate_items_manage_own"
on public.booking_estimate_items
for all
to authenticated
using (
  exists (
    select 1
    from public.booking_estimates e
    where e.id = booking_estimate_items.estimate_id
      and e.technician_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.booking_estimates e
    where e.id = booking_estimate_items.estimate_id
      and e.technician_id = (select auth.uid())
  )
);

drop policy if exists "booking_route_events_manage_own" on public.booking_route_events;
create policy "booking_route_events_manage_own"
on public.booking_route_events
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_work_evidence_manage_own" on public.booking_work_evidence;
create policy "booking_work_evidence_manage_own"
on public.booking_work_evidence
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "booking_completion_reports_manage_own" on public.booking_completion_reports;
create policy "booking_completion_reports_manage_own"
on public.booking_completion_reports
for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "technician_ledger_entries_select_own" on public.technician_ledger_entries;
create policy "technician_ledger_entries_select_own"
on public.technician_ledger_entries
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "technician_ledger_entries_insert_own" on public.technician_ledger_entries;
create policy "technician_ledger_entries_insert_own"
on public.technician_ledger_entries
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "technician_ledger_entries_update_own" on public.technician_ledger_entries;
create policy "technician_ledger_entries_update_own"
on public.technician_ledger_entries
for update
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

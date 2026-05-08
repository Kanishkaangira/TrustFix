-- TrustFix payment schema
-- Run this after trustfix_core_schema.sql and, if used, trustfix_technician_schema.sql.
-- Keeps only the payment tables required by the current live flow:
--   1. booking_financial_records
--   2. payment_orders
--   3. technician_payout_requests

create extension if not exists pgcrypto;

create table if not exists public.booking_financial_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  technician_id uuid references public.technician_profiles(id) on delete cascade,
  address_id uuid references public.addresses(id) on delete set null,
  service_id uuid references public.services(id) on delete restrict,
  service_problem_id uuid references public.service_problems(id) on delete set null,
  custom_problem text,
  severity text,
  scheduled_date date,
  scheduled_slot_label text,
  protection_selected boolean not null default false,
  visit_charge numeric(10, 2) not null default 0,
  platform_fee_amount numeric(10, 2) not null default 0,
  protection_fee_amount numeric(10, 2) not null default 0,
  initial_amount numeric(10, 2) not null default 0,
  status text not null default 'created',
  summary text,
  final_labour_amount numeric(10, 2) not null default 0,
  final_parts_amount numeric(10, 2) not null default 0,
  final_visit_charge numeric(10, 2) not null default 0,
  urgency_surcharge_amount numeric(10, 2) not null default 0,
  final_customer_total numeric(10, 2) not null default 0,
  payment_requested_at timestamptz,
  payment_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_financial_records_booking_id_record_type_key unique (booking_id, record_type),
  constraint booking_financial_records_record_type_chk check (
    record_type in ('checkout', 'completion')
  ),
  constraint booking_financial_records_checkout_required_chk check (
    record_type <> 'checkout'
    or (
      user_id is not null
      and service_id is not null
      and severity in ('minor', 'moderate', 'urgent')
      and (
        service_problem_id is not null
        or nullif(btrim(custom_problem), '') is not null
      )
    )
  ),
  constraint booking_financial_records_completion_required_chk check (
    record_type <> 'completion'
    or (
      booking_id is not null
      and technician_id is not null
    )
  ),
  constraint booking_financial_records_status_chk check (
    (
      record_type = 'checkout'
      and status in ('created', 'order_created', 'paid', 'failed', 'cancelled', 'expired')
    )
    or (
      record_type = 'completion'
      and status in ('pending', 'requested', 'paid', 'failed')
    )
  ),
  constraint booking_financial_records_severity_chk check (
    severity is null
    or severity in ('minor', 'moderate', 'urgent')
  ),
  constraint booking_financial_records_minor_schedule_chk check (
    severity is null
    or severity <> 'minor'
    or (
      scheduled_date is not null
      and nullif(btrim(coalesce(scheduled_slot_label, '')), '') is not null
    )
  ),
  constraint booking_financial_records_visit_charge_chk check (visit_charge >= 0),
  constraint booking_financial_records_platform_fee_amount_chk check (platform_fee_amount >= 0),
  constraint booking_financial_records_protection_fee_amount_chk check (protection_fee_amount >= 0),
  constraint booking_financial_records_initial_amount_chk check (initial_amount >= 0),
  constraint booking_financial_records_final_labour_amount_chk check (final_labour_amount >= 0),
  constraint booking_financial_records_final_parts_amount_chk check (final_parts_amount >= 0),
  constraint booking_financial_records_final_visit_charge_chk check (final_visit_charge >= 0),
  constraint booking_financial_records_urgency_surcharge_amount_chk check (urgency_surcharge_amount >= 0),
  constraint booking_financial_records_final_customer_total_chk check (final_customer_total >= 0)
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  technician_id uuid references public.technician_profiles(id) on delete set null,
  provider text not null default 'razorpay',
  payment_stage text not null,
  status text not null default 'created',
  collection_mode text not null default 'online',
  currency text not null default 'INR',
  amount numeric(10, 2) not null default 0,
  amount_paid numeric(10, 2) not null default 0,
  amount_refunded numeric(10, 2) not null default 0,
  platform_fee_amount numeric(10, 2) not null default 0,
  visit_fee_amount numeric(10, 2) not null default 0,
  labour_amount numeric(10, 2) not null default 0,
  parts_amount numeric(10, 2) not null default 0,
  protection_fee_amount numeric(10, 2) not null default 0,
  urgency_surcharge_amount numeric(10, 2) not null default 0,
  invoice_version_no integer,
  receipt text,
  provider_order_id text unique,
  provider_payment_id text,
  provider_signature text,
  provider_link_id text,
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payment_orders_provider_chk check (provider in ('razorpay')),
  constraint payment_orders_payment_stage_chk check (
    payment_stage in ('booking_fee', 'final_invoice', 'combined_invoice', 'subscription')
  ),
  constraint payment_orders_collection_mode_chk check (collection_mode in ('online')),
  constraint payment_orders_status_chk check (
    status in (
      'created',
      'order_created',
      'checkout_opened',
      'authorized',
      'captured',
      'failed',
      'cancelled',
      'refunded'
    )
  ),
  constraint payment_orders_currency_chk check (btrim(currency) <> ''),
  constraint payment_orders_amount_chk check (amount >= 0),
  constraint payment_orders_amount_paid_chk check (amount_paid >= 0),
  constraint payment_orders_amount_refunded_chk check (amount_refunded >= 0),
  constraint payment_orders_platform_fee_amount_chk check (platform_fee_amount >= 0),
  constraint payment_orders_visit_fee_amount_chk check (visit_fee_amount >= 0),
  constraint payment_orders_labour_amount_chk check (labour_amount >= 0),
  constraint payment_orders_parts_amount_chk check (parts_amount >= 0),
  constraint payment_orders_protection_fee_amount_chk check (protection_fee_amount >= 0),
  constraint payment_orders_urgency_surcharge_amount_chk check (urgency_surcharge_amount >= 0)
);

create table if not exists public.technician_payout_requests (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  status text not null default 'pending',
  gross_amount numeric(10, 2) not null default 0,
  visit_fee_amount numeric(10, 2) not null default 0,
  labour_amount numeric(10, 2) not null default 0,
  parts_amount numeric(10, 2) not null default 0,
  plan_code_snapshot text references public.subscription_plans(code) on delete set null,
  commission_percent_snapshot numeric(5, 2) not null default 0,
  commission_scope_snapshot text not null default 'labour_parts',
  visit_fee_commissionable_snapshot boolean not null default false,
  commissionable_visit_fee_amount numeric(10, 2) not null default 0,
  commissionable_labour_amount numeric(10, 2) not null default 0,
  commissionable_parts_amount numeric(10, 2) not null default 0,
  commission_base_amount numeric(10, 2) not null default 0,
  commission_amount numeric(10, 2) not null default 0,
  net_amount numeric(10, 2) not null default 0,
  requested_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  provider_payout_id text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint technician_payout_requests_status_chk check (
    status in ('pending', 'processing', 'paid', 'failed', 'cancelled')
  ),
  constraint technician_payout_requests_gross_amount_chk check (gross_amount >= 0),
  constraint technician_payout_requests_visit_fee_amount_chk check (visit_fee_amount >= 0),
  constraint technician_payout_requests_labour_amount_chk check (labour_amount >= 0),
  constraint technician_payout_requests_parts_amount_chk check (parts_amount >= 0),
  constraint technician_payout_requests_commission_percent_snapshot_chk check (commission_percent_snapshot >= 0),
  constraint technician_payout_requests_commission_scope_snapshot_chk check (
    commission_scope_snapshot in ('labour_only', 'labour_parts')
  ),
  constraint technician_payout_requests_commissionable_visit_fee_amount_chk check (
    commissionable_visit_fee_amount >= 0
  ),
  constraint technician_payout_requests_commissionable_labour_amount_chk check (
    commissionable_labour_amount >= 0
  ),
  constraint technician_payout_requests_commissionable_parts_amount_chk check (
    commissionable_parts_amount >= 0
  ),
  constraint technician_payout_requests_commission_base_amount_chk check (commission_base_amount >= 0),
  constraint technician_payout_requests_commission_amount_chk check (commission_amount >= 0),
  constraint technician_payout_requests_net_amount_chk check (net_amount >= 0)
);

create index if not exists booking_financial_records_user_id_created_at_idx
  on public.booking_financial_records(user_id, created_at desc);

create index if not exists booking_financial_records_technician_id_created_at_idx
  on public.booking_financial_records(technician_id, created_at desc);

create index if not exists booking_financial_records_record_type_status_idx
  on public.booking_financial_records(record_type, status);

create index if not exists payment_orders_booking_id_idx
  on public.payment_orders(booking_id);

create index if not exists payment_orders_user_id_created_at_idx
  on public.payment_orders(user_id, created_at desc);

create index if not exists payment_orders_technician_id_created_at_idx
  on public.payment_orders(technician_id, created_at desc);

create index if not exists payment_orders_status_idx
  on public.payment_orders(status);

create index if not exists technician_payout_requests_technician_id_idx
  on public.technician_payout_requests(technician_id, requested_at desc);

drop trigger if exists booking_financial_records_set_updated_at on public.booking_financial_records;
create trigger booking_financial_records_set_updated_at
  before update on public.booking_financial_records
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists payment_orders_set_updated_at on public.payment_orders;
create trigger payment_orders_set_updated_at
  before update on public.payment_orders
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists technician_payout_requests_set_updated_at on public.technician_payout_requests;
create trigger technician_payout_requests_set_updated_at
  before update on public.technician_payout_requests
  for each row
  execute procedure public.set_updated_at();

alter table public.booking_financial_records enable row level security;
alter table public.payment_orders enable row level security;
alter table public.technician_payout_requests enable row level security;

revoke all on table public.booking_financial_records from anon, authenticated;
revoke all on table public.payment_orders from anon, authenticated;
revoke all on table public.technician_payout_requests from anon, authenticated;

grant select, insert, update on table public.booking_financial_records to authenticated;
grant select, insert, update on table public.payment_orders to authenticated;
grant select, insert, update on table public.technician_payout_requests to authenticated;

drop policy if exists "booking_financial_records_select_own" on public.booking_financial_records;
create policy "booking_financial_records_select_own"
on public.booking_financial_records
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (user_id is not null and (select auth.uid()) = user_id)
    or (technician_id is not null and (select auth.uid()) = technician_id)
  )
);

drop policy if exists "booking_financial_records_insert_own" on public.booking_financial_records;
create policy "booking_financial_records_insert_own"
on public.booking_financial_records
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (
    (user_id is not null and (select auth.uid()) = user_id)
    or (technician_id is not null and (select auth.uid()) = technician_id)
  )
);

drop policy if exists "booking_financial_records_update_own" on public.booking_financial_records;
create policy "booking_financial_records_update_own"
on public.booking_financial_records
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (user_id is not null and (select auth.uid()) = user_id)
    or (technician_id is not null and (select auth.uid()) = technician_id)
  )
)
with check (
  (select auth.uid()) is not null
  and (
    (user_id is not null and (select auth.uid()) = user_id)
    or (technician_id is not null and (select auth.uid()) = technician_id)
  )
);

drop policy if exists "payment_orders_select_customer_own" on public.payment_orders;
create policy "payment_orders_select_customer_own"
on public.payment_orders
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "payment_orders_select_technician_own" on public.payment_orders;
create policy "payment_orders_select_technician_own"
on public.payment_orders
for select
to authenticated
using (
  technician_id is not null
  and (select auth.uid()) is not null
  and (select auth.uid()) = technician_id
);

drop policy if exists "payment_orders_insert_customer_own" on public.payment_orders;
create policy "payment_orders_insert_customer_own"
on public.payment_orders
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and (
    booking_id is null
    or booking_id in (
      select id
      from public.bookings
      where user_id = (select auth.uid())
    )
  )
);

drop policy if exists "payment_orders_update_customer_own" on public.payment_orders;
create policy "payment_orders_update_customer_own"
on public.payment_orders
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "technician_payout_requests_select_own" on public.technician_payout_requests;
create policy "technician_payout_requests_select_own"
on public.technician_payout_requests
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "technician_payout_requests_insert_own" on public.technician_payout_requests;
create policy "technician_payout_requests_insert_own"
on public.technician_payout_requests
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

drop policy if exists "technician_payout_requests_update_own" on public.technician_payout_requests;
create policy "technician_payout_requests_update_own"
on public.technician_payout_requests
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = technician_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = technician_id);

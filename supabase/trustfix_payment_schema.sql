-- TrustFix payment schema
-- Run this after trustfix_core_schema.sql and, if used, trustfix_technician_schema.sql.
-- Keeps only the payment tables required by the current live flow:
--   1. payment_orders
--   2. technician_payout_requests

create extension if not exists pgcrypto;

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
  commission_base_amount numeric(10, 2) not null default 0,
  technician_settlement_amount numeric(10, 2) not null default 0,
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
  constraint payment_orders_urgency_surcharge_amount_chk check (urgency_surcharge_amount >= 0),
  constraint payment_orders_commission_base_amount_chk check (commission_base_amount >= 0),
  constraint payment_orders_technician_settlement_amount_chk check (technician_settlement_amount >= 0)
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
  platform_fee_amount numeric(10, 2) not null default 0,
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
  constraint technician_payout_requests_platform_fee_amount_chk check (platform_fee_amount >= 0),
  constraint technician_payout_requests_commission_base_amount_chk check (commission_base_amount >= 0),
  constraint technician_payout_requests_commission_amount_chk check (commission_amount >= 0),
  constraint technician_payout_requests_net_amount_chk check (net_amount >= 0)
);

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

alter table public.payment_orders enable row level security;
alter table public.technician_payout_requests enable row level security;

revoke all on table public.payment_orders from anon, authenticated;
revoke all on table public.technician_payout_requests from anon, authenticated;

grant select, insert, update on table public.payment_orders to authenticated;
grant select, insert, update on table public.technician_payout_requests to authenticated;

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

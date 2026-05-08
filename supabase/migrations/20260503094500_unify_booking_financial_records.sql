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
  plan_code_snapshot text references public.subscription_plans(code) on delete set null,
  commission_percent_snapshot numeric(5, 2) not null default 0,
  final_labour_amount numeric(10, 2) not null default 0,
  final_parts_amount numeric(10, 2) not null default 0,
  final_visit_charge numeric(10, 2) not null default 0,
  urgency_surcharge_amount numeric(10, 2) not null default 0,
  final_customer_total numeric(10, 2) not null default 0,
  commissionable_labour_amount numeric(10, 2) not null default 0,
  commissionable_parts_amount numeric(10, 2) not null default 0,
  commissionable_total numeric(10, 2) not null default 0,
  commission_base numeric(10, 2) not null default 0,
  commission_amount numeric(10, 2) not null default 0,
  technician_payout_amount numeric(10, 2) not null default 0,
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
  constraint booking_financial_records_commission_percent_snapshot_chk check (commission_percent_snapshot >= 0),
  constraint booking_financial_records_final_labour_amount_chk check (final_labour_amount >= 0),
  constraint booking_financial_records_final_parts_amount_chk check (final_parts_amount >= 0),
  constraint booking_financial_records_final_visit_charge_chk check (final_visit_charge >= 0),
  constraint booking_financial_records_urgency_surcharge_amount_chk check (urgency_surcharge_amount >= 0),
  constraint booking_financial_records_final_customer_total_chk check (final_customer_total >= 0),
  constraint booking_financial_records_commissionable_labour_amount_chk check (commissionable_labour_amount >= 0),
  constraint booking_financial_records_commissionable_parts_amount_chk check (commissionable_parts_amount >= 0),
  constraint booking_financial_records_commissionable_total_chk check (commissionable_total >= 0),
  constraint booking_financial_records_commission_base_chk check (commission_base >= 0),
  constraint booking_financial_records_commission_amount_chk check (commission_amount >= 0),
  constraint booking_financial_records_technician_payout_amount_chk check (technician_payout_amount >= 0)
);

create index if not exists booking_financial_records_user_id_created_at_idx
  on public.booking_financial_records(user_id, created_at desc);

create index if not exists booking_financial_records_technician_id_created_at_idx
  on public.booking_financial_records(technician_id, created_at desc);

create index if not exists booking_financial_records_record_type_status_idx
  on public.booking_financial_records(record_type, status);

drop trigger if exists booking_financial_records_set_updated_at on public.booking_financial_records;
create trigger booking_financial_records_set_updated_at
  before update on public.booking_financial_records
  for each row
  execute procedure public.set_updated_at();

insert into public.booking_financial_records (
  id,
  record_type,
  user_id,
  address_id,
  service_id,
  service_problem_id,
  custom_problem,
  severity,
  scheduled_date,
  scheduled_slot_label,
  protection_selected,
  visit_charge,
  platform_fee_amount,
  protection_fee_amount,
  initial_amount,
  status,
  created_at,
  updated_at
)
select
  checkout_session.id,
  'checkout',
  checkout_session.user_id,
  checkout_session.address_id,
  checkout_session.service_id,
  checkout_session.service_problem_id,
  checkout_session.custom_problem,
  checkout_session.severity,
  checkout_session.scheduled_date,
  checkout_session.scheduled_slot_label,
  checkout_session.protection_selected,
  checkout_session.visit_charge,
  checkout_session.platform_fee,
  checkout_session.protection_fee,
  checkout_session.initial_amount,
  checkout_session.status,
  checkout_session.created_at,
  checkout_session.updated_at
from public.booking_checkout_sessions checkout_session
on conflict (id) do nothing;

insert into public.booking_financial_records (
  id,
  record_type,
  user_id,
  booking_id,
  technician_id,
  address_id,
  service_id,
  service_problem_id,
  custom_problem,
  severity,
  scheduled_date,
  scheduled_slot_label,
  protection_selected,
  visit_charge,
  status,
  summary,
  plan_code_snapshot,
  commission_percent_snapshot,
  final_labour_amount,
  final_parts_amount,
  final_visit_charge,
  platform_fee_amount,
  protection_fee_amount,
  urgency_surcharge_amount,
  final_customer_total,
  commissionable_labour_amount,
  commissionable_parts_amount,
  commissionable_total,
  commission_base,
  commission_amount,
  technician_payout_amount,
  payment_requested_at,
  payment_completed_at,
  created_at,
  updated_at
)
select
  completion_report.id,
  'completion',
  booking.user_id,
  completion_report.booking_id,
  completion_report.technician_id,
  booking.address_id,
  booking.service_id,
  booking.service_problem_id,
  booking.custom_problem,
  booking.severity,
  booking.scheduled_date,
  booking.scheduled_slot_label,
  booking.protection_selected,
  booking.visit_charge,
  completion_report.payment_request_status,
  completion_report.summary,
  completion_report.plan_code_snapshot,
  completion_report.commission_percent_snapshot,
  completion_report.final_labour_amount,
  completion_report.final_parts_amount,
  completion_report.final_visit_charge,
  completion_report.platform_fee_amount,
  completion_report.protection_fee_amount,
  completion_report.urgency_surcharge_amount,
  completion_report.final_customer_total,
  completion_report.commissionable_labour_amount,
  completion_report.commissionable_parts_amount,
  completion_report.commissionable_total,
  completion_report.commission_base,
  completion_report.commission_amount,
  completion_report.technician_payout_amount,
  completion_report.payment_requested_at,
  completion_report.payment_completed_at,
  completion_report.created_at,
  completion_report.updated_at
from public.booking_completion_reports completion_report
left join public.bookings booking
  on booking.id = completion_report.booking_id
on conflict (id) do nothing;

update public.booking_financial_records financial_record
set
  booking_id = payment_order.booking_id,
  updated_at = timezone('utc', now())
from public.payment_orders payment_order
where financial_record.record_type = 'checkout'
  and payment_order.payment_stage = 'booking_fee'
  and payment_order.booking_id is not null
  and coalesce(
    nullif(payment_order.notes ->> 'financial_record_id', ''),
    nullif(payment_order.notes ->> 'checkout_session_id', '')
  ) = financial_record.id::text;

update public.payment_orders
set notes = jsonb_set(
  notes,
  '{financial_record_id}',
  to_jsonb(notes ->> 'checkout_session_id'),
  true
)
where payment_stage = 'booking_fee'
  and coalesce(notes ->> 'financial_record_id', '') = ''
  and coalesce(notes ->> 'checkout_session_id', '') <> '';

update public.payment_orders payment_order
set notes = jsonb_set(
  coalesce(payment_order.notes, '{}'::jsonb),
  '{financial_record_id}',
  to_jsonb(financial_record.id::text),
  true
)
from public.booking_financial_records financial_record
where payment_order.payment_stage = 'final_invoice'
  and payment_order.booking_id = financial_record.booking_id
  and financial_record.record_type = 'completion'
  and coalesce(payment_order.notes ->> 'financial_record_id', '') = '';

update public.payment_orders
set notes = coalesce(notes, '{}'::jsonb) - 'checkout_session_id'
where coalesce(notes, '{}'::jsonb) ? 'checkout_session_id';

alter table public.booking_financial_records enable row level security;

revoke all on table public.booking_financial_records from anon, authenticated;
grant select, insert, update on table public.booking_financial_records to authenticated;

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

drop table if exists public.booking_checkout_sessions cascade;
drop table if exists public.booking_completion_reports cascade;

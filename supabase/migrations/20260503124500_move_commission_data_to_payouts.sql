alter table if exists public.technician_payout_requests
  add column if not exists plan_code_snapshot text references public.subscription_plans(code) on delete set null,
  add column if not exists commission_percent_snapshot numeric(5, 2) not null default 0,
  add column if not exists commission_scope_snapshot text not null default 'labour_parts',
  add column if not exists visit_fee_commissionable_snapshot boolean not null default false,
  add column if not exists commissionable_visit_fee_amount numeric(10, 2) not null default 0,
  add column if not exists commissionable_labour_amount numeric(10, 2) not null default 0,
  add column if not exists commissionable_parts_amount numeric(10, 2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.technician_payout_requests'::regclass
      and conname = 'technician_payout_requests_commission_percent_snapshot_chk'
  ) then
    alter table public.technician_payout_requests
      add constraint technician_payout_requests_commission_percent_snapshot_chk
      check (commission_percent_snapshot >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.technician_payout_requests'::regclass
      and conname = 'technician_payout_requests_commission_scope_snapshot_chk'
  ) then
    alter table public.technician_payout_requests
      add constraint technician_payout_requests_commission_scope_snapshot_chk
      check (commission_scope_snapshot in ('labour_only', 'labour_parts'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.technician_payout_requests'::regclass
      and conname = 'technician_payout_requests_commissionable_visit_fee_amount_chk'
  ) then
    alter table public.technician_payout_requests
      add constraint technician_payout_requests_commissionable_visit_fee_amount_chk
      check (commissionable_visit_fee_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.technician_payout_requests'::regclass
      and conname = 'technician_payout_requests_commissionable_labour_amount_chk'
  ) then
    alter table public.technician_payout_requests
      add constraint technician_payout_requests_commissionable_labour_amount_chk
      check (commissionable_labour_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.technician_payout_requests'::regclass
      and conname = 'technician_payout_requests_commissionable_parts_amount_chk'
  ) then
    alter table public.technician_payout_requests
      add constraint technician_payout_requests_commissionable_parts_amount_chk
      check (commissionable_parts_amount >= 0);
  end if;
end;
$$;

with computed as (
  select
    payout.id,
    tp.subscription_plan_code as plan_code_snapshot,
    coalesce(sp.commission_percent, 0)::numeric(5, 2) as commission_percent_snapshot,
    coalesce(sp.commission_scope, 'labour_parts') as commission_scope_snapshot,
    coalesce(sp.visit_fee_commissionable, false) as visit_fee_commissionable_snapshot,
    round((
      coalesce(payout.visit_fee_amount, 0)
      + coalesce(payout.labour_amount, 0)
      + coalesce(payout.parts_amount, 0)
    )::numeric, 2) as gross_amount,
    round((
      case
        when coalesce(sp.visit_fee_commissionable, false) then coalesce(payout.visit_fee_amount, 0)
        else 0
      end
    )::numeric, 2) as commissionable_visit_fee_amount,
    round(coalesce(payout.labour_amount, 0)::numeric, 2) as commissionable_labour_amount,
    round((
      case
        when coalesce(sp.commission_scope, 'labour_parts') = 'labour_parts' then coalesce(payout.parts_amount, 0)
        else 0
      end
    )::numeric, 2) as commissionable_parts_amount
  from public.technician_payout_requests payout
  join public.technician_profiles tp
    on tp.id = payout.technician_id
  left join public.subscription_plans sp
    on sp.code = tp.subscription_plan_code
),
finalized as (
  select
    computed.*,
    round((
      computed.commissionable_visit_fee_amount
      + computed.commissionable_labour_amount
      + computed.commissionable_parts_amount
    )::numeric, 2) as commission_base_amount,
    round((
      (
        computed.commissionable_visit_fee_amount
        + computed.commissionable_labour_amount
        + computed.commissionable_parts_amount
      ) * computed.commission_percent_snapshot / 100.0
    )::numeric, 2) as commission_amount
  from computed
)
update public.technician_payout_requests payout
set
  plan_code_snapshot = finalized.plan_code_snapshot,
  commission_percent_snapshot = finalized.commission_percent_snapshot,
  commission_scope_snapshot = finalized.commission_scope_snapshot,
  visit_fee_commissionable_snapshot = finalized.visit_fee_commissionable_snapshot,
  gross_amount = finalized.gross_amount,
  commissionable_visit_fee_amount = finalized.commissionable_visit_fee_amount,
  commissionable_labour_amount = finalized.commissionable_labour_amount,
  commissionable_parts_amount = finalized.commissionable_parts_amount,
  commission_base_amount = finalized.commission_base_amount,
  commission_amount = finalized.commission_amount,
  net_amount = greatest(
    round((finalized.gross_amount - finalized.commission_amount)::numeric, 2),
    0
  ),
  updated_at = timezone('utc', now())
from finalized
where payout.id = finalized.id;

alter table if exists public.booking_financial_records
  drop column if exists plan_code_snapshot cascade,
  drop column if exists commission_percent_snapshot cascade,
  drop column if exists commissionable_labour_amount cascade,
  drop column if exists commissionable_parts_amount cascade,
  drop column if exists commissionable_total cascade,
  drop column if exists commission_base cascade,
  drop column if exists commission_amount cascade,
  drop column if exists technician_payout_amount cascade;

alter table if exists public.payment_orders
  drop column if exists commission_base_amount cascade,
  drop column if exists technician_settlement_amount cascade;

alter table if exists public.job_assignment
  drop column if exists plan_code_snapshot cascade,
  drop column if exists commission_percent_snapshot cascade,
  drop column if exists commission_scope_snapshot cascade;

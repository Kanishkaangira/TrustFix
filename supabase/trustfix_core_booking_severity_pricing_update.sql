-- TrustFix existing-db update for DB-driven booking severity pricing.
-- Keeps pricing editable in the database and removes the old service_severity_pricing table.

drop table if exists public.service_severity_pricing cascade;

create table if not exists public.severity_pricing (
  severity text primary key,
  visit_charge numeric(10, 2) not null default 0,
  platform_fee numeric(10, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint severity_pricing_severity_chk
    check (severity in ('minor', 'moderate', 'urgent')),
  constraint severity_pricing_visit_charge_chk
    check (visit_charge >= 0),
  constraint severity_pricing_platform_fee_chk
    check (platform_fee >= 0)
);

create index if not exists severity_pricing_sort_order_idx
  on public.severity_pricing(sort_order);

drop trigger if exists severity_pricing_set_updated_at on public.severity_pricing;
create trigger severity_pricing_set_updated_at
  before update on public.severity_pricing
  for each row
  execute procedure public.set_updated_at();

alter table public.severity_pricing enable row level security;

revoke all on table public.severity_pricing from anon, authenticated;
grant select on table public.severity_pricing to authenticated;

drop policy if exists "severity_pricing_select_authenticated" on public.severity_pricing;
create policy "severity_pricing_select_authenticated"
on public.severity_pricing
for select
to authenticated
using (true);

insert into public.severity_pricing (
  severity,
  visit_charge,
  platform_fee,
  sort_order
)
values
  ('minor', 70, 30, 1),
  ('moderate', 100, 50, 2),
  ('urgent', 150, 100, 3)
on conflict (severity) do update
set
  visit_charge = excluded.visit_charge,
  platform_fee = excluded.platform_fee,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

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

  new.visit_charge = selected_booking_pricing.visit_charge;
  new.labour_cost = selected_service.base_labour_cost;
  new.platform_fee = selected_booking_pricing.platform_fee;

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
    new.parts_cost = coalesce(selected_problem.estimated_parts_price, 0);
  else
    new.problem_name_snapshot = nullif(btrim(coalesce(new.custom_problem, '')), '');
    new.parts_cost = 0;
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
  else
    new.address_label_snapshot = null;
    new.address_snapshot = null;
  end if;

  new.urgency_surcharge = 0;

  if new.protection_selected then
    new.protection_fee = 19;
  else
    new.protection_fee = 0;
  end if;

  new.estimated_total =
    coalesce(new.visit_charge, 0)
    + coalesce(new.labour_cost, 0)
    + coalesce(new.parts_cost, 0)
    + coalesce(new.urgency_surcharge, 0)
    + coalesce(new.platform_fee, 0)
    + coalesce(new.protection_fee, 0);

  return new;
end;
$$;


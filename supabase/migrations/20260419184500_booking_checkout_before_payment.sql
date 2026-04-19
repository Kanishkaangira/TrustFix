create table if not exists public.booking_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address_id uuid references public.addresses(id) on delete set null,
  service_id uuid not null references public.services(id) on delete restrict,
  service_problem_id uuid references public.service_problems(id) on delete set null,
  custom_problem text,
  severity text not null,
  scheduled_date date,
  scheduled_slot_label text,
  protection_selected boolean not null default false,
  visit_charge numeric(10, 2) not null default 0,
  platform_fee numeric(10, 2) not null default 0,
  protection_fee numeric(10, 2) not null default 0,
  initial_amount numeric(10, 2) not null default 0,
  status text not null default 'created',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_checkout_sessions_problem_required_chk
    check (
      service_problem_id is not null
      or nullif(btrim(custom_problem), '') is not null
    ),
  constraint booking_checkout_sessions_severity_chk
    check (severity in ('minor', 'moderate', 'urgent')),
  constraint booking_checkout_sessions_status_chk
    check (status in ('created', 'order_created', 'paid', 'failed', 'cancelled', 'expired')),
  constraint booking_checkout_sessions_minor_schedule_chk
    check (
      severity <> 'minor'
      or (
        scheduled_date is not null
        and nullif(btrim(coalesce(scheduled_slot_label, '')), '') is not null
      )
    )
);

create index if not exists booking_checkout_sessions_user_id_created_at_idx
  on public.booking_checkout_sessions(user_id, created_at desc);

drop trigger if exists booking_checkout_sessions_set_updated_at on public.booking_checkout_sessions;
create trigger booking_checkout_sessions_set_updated_at
  before update on public.booking_checkout_sessions
  for each row
  execute procedure public.set_updated_at();

alter table public.booking_checkout_sessions enable row level security;

revoke all on table public.booking_checkout_sessions from anon, authenticated;
grant select on table public.booking_checkout_sessions to authenticated;

drop policy if exists "booking_checkout_sessions_select_own" on public.booking_checkout_sessions;
create policy "booking_checkout_sessions_select_own"
on public.booking_checkout_sessions
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.prepare_booking()
returns trigger
language plpgsql
as $$
declare
  selected_service public.services%rowtype;
  selected_problem public.service_problems%rowtype;
  selected_booking_pricing public.booking_severity_pricing%rowtype;
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
  from public.booking_severity_pricing
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
  else
    new.address_label_snapshot = null;
    new.address_snapshot = null;
  end if;

  new.urgency_surcharge = coalesce(new.urgency_surcharge, 0);
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

update public.bookings
set estimated_total =
  coalesce(visit_charge, 0)
  + coalesce(platform_fee, 0)
  + coalesce(protection_fee, 0)
  + coalesce(urgency_surcharge, 0);

update public.booking_status_history bsh
set estimated_total =
  coalesce(b.visit_charge, 0)
  + coalesce(b.platform_fee, 0)
  + coalesce(b.protection_fee, 0)
  + coalesce(b.urgency_surcharge, 0)
from public.bookings b
where b.id = bsh.booking_id;

alter table public.bookings
  drop column if exists labour_cost,
  drop column if exists parts_cost;

revoke insert on table public.bookings from authenticated;

drop policy if exists "bookings_insert_own" on public.bookings;

drop policy if exists "bookings_update_requested_or_cancel_own" on public.bookings;
create policy "bookings_update_requested_or_cancel_own"
on public.bookings
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and status in ('requested', 'confirmed')
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and status in ('requested', 'confirmed', 'cancelled')
  and (
    address_id is null
    or address_id in (
      select id
      from public.addresses
      where user_id = (select auth.uid())
    )
  )
);

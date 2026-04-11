-- TrustFix core Supabase schema
-- Run this once in Supabase SQL Editor on a fresh project.
-- Covers:
--   profiles
--   addresses
--   services
--   service_problems
--   bookings
--   booking_status_history
--
-- Notes:
-- 1. This script assumes Supabase Auth is already enabled.
-- 2. auth.users remains the source of truth for authentication.
-- 3. Profiles are auto-created from auth.users via trigger.
-- 4. Service catalog tables are read-only to authenticated clients.
-- 5. Bookings are owner-scoped with RLS and automatic status-history logging.
-- 6. allow_custom_problem and payment_status are kept for future flows.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.generate_booking_number()
returns text
language plpgsql
as $$
begin
  return 'TF-'
    || to_char(timezone('utc', now()), 'YYYYMMDD')
    || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_email_format_chk
    check (
      email is null
      or btrim(email) = ''
      or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country_code text not null default 'IN',
  is_default boolean not null default false,
  display_address text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint addresses_label_not_blank_chk check (btrim(label) <> ''),
  constraint addresses_line1_not_blank_chk check (btrim(address_line_1) <> ''),
  constraint addresses_city_not_blank_chk check (btrim(city) <> ''),
  constraint addresses_state_not_blank_chk check (btrim(state) <> ''),
  constraint addresses_postal_not_blank_chk check (btrim(postal_code) <> '')
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  description text,
  icon_name text,
  accent_color text,
  base_visit_charge numeric(10, 2) not null default 0,
  base_labour_cost numeric(10, 2) not null default 0,
  platform_fee numeric(10, 2) not null default 0,
  allow_custom_problem boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_slug_not_blank_chk check (btrim(slug) <> ''),
  constraint services_name_not_blank_chk check (btrim(name) <> '')
);

create table if not exists public.service_problems (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  slug text not null,
  name text not null,
  icon_name text,
  tag text,
  default_severity text not null default 'minor',
  estimated_parts_name text,
  estimated_parts_mrp numeric(10, 2),
  estimated_parts_price numeric(10, 2),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_problems_unique_slug_per_service unique (service_id, slug),
  constraint service_problems_slug_not_blank_chk check (btrim(slug) <> ''),
  constraint service_problems_name_not_blank_chk check (btrim(name) <> ''),
  constraint service_problems_default_severity_chk
    check (default_severity in ('minor', 'moderate', 'urgent'))
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default public.generate_booking_number(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address_id uuid references public.addresses(id) on delete set null,
  service_id uuid not null references public.services(id) on delete restrict,
  service_problem_id uuid references public.service_problems(id) on delete set null,
  custom_problem text,
  severity text not null,
  status text not null default 'requested',
  scheduled_date date,
  scheduled_slot_label text,
  address_label_snapshot text,
  address_snapshot text,
  service_name_snapshot text not null,
  problem_name_snapshot text,
  visit_charge numeric(10, 2) not null default 0,
  labour_cost numeric(10, 2) not null default 0,
  parts_cost numeric(10, 2) not null default 0,
  urgency_surcharge numeric(10, 2) not null default 0,
  platform_fee numeric(10, 2) not null default 0,
  protection_selected boolean not null default false,
  protection_fee numeric(10, 2) not null default 0,
  estimated_total numeric(10, 2) not null default 0,
  payment_status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_problem_required_chk
    check (
      service_problem_id is not null
      or nullif(btrim(custom_problem), '') is not null
    ),
  constraint bookings_severity_chk
    check (severity in ('minor', 'moderate', 'urgent')),
  constraint bookings_status_chk
    check (
      status in (
        'requested',
        'confirmed',
        'assigned',
        'en_route',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),
  constraint bookings_payment_status_chk
    check (
      payment_status in (
        'pending',
        'authorized',
        'paid',
        'failed',
        'refunded',
        'waived'
      )
    ),
  constraint bookings_minor_schedule_chk
    check (
      severity <> 'minor'
      or (
        scheduled_date is not null
        and nullif(btrim(coalesce(scheduled_slot_label, '')), '') is not null
      )
    )
);

alter table public.bookings
  drop constraint if exists bookings_address_id_fkey;

alter table public.bookings
  add constraint bookings_address_id_fkey
  foreign key (address_id)
  references public.addresses(id)
  on delete set null;

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint booking_status_history_status_chk
    check (
      status in (
        'requested',
        'confirmed',
        'assigned',
        'en_route',
        'in_progress',
        'completed',
        'cancelled'
      )
    )
);

create index if not exists addresses_user_id_idx
  on public.addresses(user_id);

drop index if exists public.addresses_one_default_per_user_idx;
create unique index if not exists addresses_one_default_per_user_idx
  on public.addresses(user_id)
  where is_default;

create index if not exists services_sort_order_idx
  on public.services(sort_order, is_active);

create index if not exists service_problems_service_id_idx
  on public.service_problems(service_id);

create index if not exists bookings_user_id_created_at_idx
  on public.bookings(user_id, created_at desc);

create index if not exists bookings_address_id_idx
  on public.bookings(address_id);

create index if not exists bookings_service_id_idx
  on public.bookings(service_id);

create index if not exists bookings_status_idx
  on public.bookings(status);

create index if not exists booking_status_history_booking_id_created_at_idx
  on public.booking_status_history(booking_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    phone
  )
  values (
    new.id,
    new.phone
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_profile_phone_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set
    phone = new.phone,
    updated_at = timezone('utc', now())
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

drop trigger if exists on_auth_user_phone_updated on auth.users;
create trigger on_auth_user_phone_updated
  after update of phone on auth.users
  for each row
  when (old.phone is distinct from new.phone)
  execute procedure public.sync_profile_phone_from_auth();

create or replace function public.ensure_single_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false
    where user_id = new.user_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and is_default = true;
  elsif tg_op = 'insert' and not exists (
    select 1
    from public.addresses
    where user_id = new.user_id
      and is_default = true
  ) then
    new.is_default = true;
  end if;

  return new;
end;
$$;

create or replace function public.prepare_address()
returns trigger
language plpgsql
as $$
begin
  new.display_address = concat_ws(
    ', ',
    nullif(btrim(new.address_line_1), ''),
    nullif(btrim(new.address_line_2), ''),
    nullif(btrim(new.city), ''),
    nullif(btrim(new.state), ''),
    nullif(btrim(new.postal_code), ''),
    nullif(btrim(new.country_code), '')
  );

  return new;
end;
$$;

create or replace function public.prepare_booking()
returns trigger
language plpgsql
as $$
declare
  selected_service public.services%rowtype;
  selected_problem public.service_problems%rowtype;
  selected_address public.addresses%rowtype;
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
  new.visit_charge = selected_service.base_visit_charge;
  new.labour_cost = selected_service.base_labour_cost;
  new.platform_fee = selected_service.platform_fee;

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

  new.urgency_surcharge = case new.severity
    when 'moderate' then 50
    when 'urgent' then 150
    else 0
  end;

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

create or replace function public.log_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (
      booking_id,
      status
    )
    values (
      new.id,
      new.status
    );

    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.booking_status_history (
      booking_id,
      status
    )
    values (
      new.id,
      new.status
    );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at
  before update on public.addresses
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists service_problems_set_updated_at on public.service_problems;
create trigger service_problems_set_updated_at
  before update on public.service_problems
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists addresses_single_default_trigger on public.addresses;
create trigger addresses_single_default_trigger
  before insert or update on public.addresses
  for each row
  execute procedure public.ensure_single_default_address();

drop trigger if exists addresses_prepare_trigger on public.addresses;
create trigger addresses_prepare_trigger
  before insert or update on public.addresses
  for each row
  execute procedure public.prepare_address();

drop trigger if exists bookings_prepare_trigger on public.bookings;
create trigger bookings_prepare_trigger
  before insert or update on public.bookings
  for each row
  execute procedure public.prepare_booking();

drop trigger if exists bookings_status_history_trigger on public.bookings;
create trigger bookings_status_history_trigger
  after insert or update of status on public.bookings
  for each row
  execute procedure public.log_booking_status_change();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.services enable row level security;
alter table public.service_problems enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.addresses from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.service_problems from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;
revoke all on table public.booking_status_history from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.addresses to authenticated;
grant select on table public.services to authenticated;
grant select on table public.service_problems to authenticated;
grant select, insert, update on table public.bookings to authenticated;
grant select on table public.booking_status_history to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own"
on public.addresses
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own"
on public.addresses
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own"
on public.addresses
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own"
on public.addresses
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "services_select_authenticated" on public.services;
create policy "services_select_authenticated"
on public.services
for select
to authenticated
using (is_active = true);

drop policy if exists "service_problems_select_authenticated" on public.service_problems;
create policy "service_problems_select_authenticated"
on public.service_problems
for select
to authenticated
using (is_active = true);

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
on public.bookings
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
on public.bookings
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and status = 'requested'
  and (
    address_id is null
    or address_id in (
      select id
      from public.addresses
      where user_id = (select auth.uid())
    )
  )
);

drop policy if exists "bookings_update_requested_or_cancel_own" on public.bookings;
create policy "bookings_update_requested_or_cancel_own"
on public.bookings
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and status = 'requested'
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and status in ('requested', 'cancelled')
  and (
    address_id is null
    or address_id in (
      select id
      from public.addresses
      where user_id = (select auth.uid())
    )
  )
);

drop policy if exists "booking_status_history_select_owner" on public.booking_status_history;
create policy "booking_status_history_select_owner"
on public.booking_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_status_history.booking_id
      and b.user_id = (select auth.uid())
  )
);

insert into public.services (
  slug,
  name,
  short_name,
  description,
  icon_name,
  accent_color,
  base_visit_charge,
  base_labour_cost,
  platform_fee,
  allow_custom_problem,
  is_active,
  sort_order
)
values
  ('ac', 'AC Repair', 'AC Repair', 'AC repair, cooling issues and gas refill.', 'snowflake', '#2563EB', 149, 350, 49, true, true, 1),
  ('plumbing', 'Plumbing', 'Plumbing', 'Leaks, drainage, taps and water flow issues.', 'pipe-wrench', '#16A34A', 99, 200, 49, true, true, 2),
  ('electrician', 'Electrical', 'Electrician', 'Switches, wiring, fan and power issues.', 'lightning-bolt', '#D97706', 99, 250, 49, true, true, 3),
  ('carpentry', 'Carpentry', 'Carpentry', 'Doors, windows, furniture and fitting work.', 'hammer', '#F97316', 99, 280, 49, true, true, 4),
  ('cleaning', 'Deep Cleaning', 'Cleaning', 'Home, sofa, carpet and kitchen cleaning.', 'broom', '#E11D48', 0, 499, 49, true, true, 5),
  ('appliance', 'Appliance Repair', 'Appliance', 'Repair for washer, fridge, microwave and more.', 'tools', '#DB2777', 149, 300, 49, true, true, 6)
on conflict (slug) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  icon_name = excluded.icon_name,
  accent_color = excluded.accent_color,
  base_visit_charge = excluded.base_visit_charge,
  base_labour_cost = excluded.base_labour_cost,
  platform_fee = excluded.platform_fee,
  allow_custom_problem = excluded.allow_custom_problem,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.service_problems (
  service_id,
  slug,
  name,
  icon_name,
  tag,
  default_severity,
  estimated_parts_name,
  estimated_parts_mrp,
  estimated_parts_price,
  is_active,
  sort_order
)
values
  ((select id from public.services where slug = 'ac'), 'not_cooling', 'Not Cooling', 'thermometer', 'Most Common', 'moderate', 'Gas R-32', 900, 750, true, 1),
  ((select id from public.services where slug = 'ac'), 'water_leaking', 'Water Leaking', 'water', 'Common', 'minor', null, null, null, true, 2),
  ((select id from public.services where slug = 'ac'), 'noisy_unit', 'Noisy Unit', 'volume-high', 'Minor', 'minor', null, null, null, true, 3),
  ((select id from public.services where slug = 'ac'), 'wont_start', 'Won''t Start', 'power', 'Urgent', 'urgent', null, null, null, true, 4),
  ((select id from public.services where slug = 'ac'), 'poor_airflow', 'Poor Airflow', 'weather-windy', 'Minor', 'minor', null, null, null, true, 5),
  ((select id from public.services where slug = 'ac'), 'gas_refill', 'Gas Refill', 'gas-cylinder', 'Scheduled', 'moderate', 'Gas R-32', 900, 750, true, 6),

  ((select id from public.services where slug = 'electrician'), 'no_power', 'No Power', 'power-plug-off', 'Urgent', 'urgent', null, null, null, true, 1),
  ((select id from public.services where slug = 'electrician'), 'short_circuit', 'Short Circuit', 'flash', 'Urgent', 'urgent', 'MCB Switch', 250, 180, true, 2),
  ((select id from public.services where slug = 'electrician'), 'fan_not_working', 'Fan Not Working', 'fan', 'Common', 'minor', null, null, null, true, 3),
  ((select id from public.services where slug = 'electrician'), 'switch_sparking', 'Switch Sparking', 'alert', 'Urgent', 'urgent', null, null, null, true, 4),
  ((select id from public.services where slug = 'electrician'), 'flickering', 'Light Flickering', 'lightbulb-on-outline', 'Minor', 'minor', null, null, null, true, 5),
  ((select id from public.services where slug = 'electrician'), 'wiring_issue', 'Wiring Issue', 'tools', 'Moderate', 'moderate', 'Copper Wire 2m', 180, 120, true, 6),

  ((select id from public.services where slug = 'plumbing'), 'pipe_leakage', 'Pipe Leakage', 'water', 'Urgent', 'urgent', 'PVC Pipe 1m', 120, 85, true, 1),
  ((select id from public.services where slug = 'plumbing'), 'blocked_drain', 'Blocked Drain', 'shower-head', 'Common', 'moderate', null, null, null, true, 2),
  ((select id from public.services where slug = 'plumbing'), 'no_water', 'No Water Flow', 'water-off', 'Urgent', 'urgent', null, null, null, true, 3),
  ((select id from public.services where slug = 'plumbing'), 'tap_dripping', 'Tap Dripping', 'water-outline', 'Minor', 'minor', 'Tap Washer Kit', 80, 55, true, 4),
  ((select id from public.services where slug = 'plumbing'), 'toilet_issue', 'Toilet Issue', 'toilet', 'Moderate', 'moderate', null, null, null, true, 5),
  ((select id from public.services where slug = 'plumbing'), 'water_heater', 'Water Heater', 'water-boiler', 'Moderate', 'moderate', null, null, null, true, 6),

  ((select id from public.services where slug = 'appliance'), 'washing_machine', 'Washing Machine', 'washing-machine', 'Common', 'moderate', null, null, null, true, 1),
  ((select id from public.services where slug = 'appliance'), 'fridge', 'Refrigerator', 'fridge-outline', 'Common', 'moderate', 'Compressor Gas', 600, 480, true, 2),
  ((select id from public.services where slug = 'appliance'), 'microwave', 'Microwave', 'microwave', 'Minor', 'minor', null, null, null, true, 3),
  ((select id from public.services where slug = 'appliance'), 'geyser', 'Geyser', 'water-boiler', 'Common', 'moderate', 'Heating Element', 450, 320, true, 4),
  ((select id from public.services where slug = 'appliance'), 'tv', 'Television', 'television', 'Minor', 'minor', null, null, null, true, 5),
  ((select id from public.services where slug = 'appliance'), 'chimney', 'Chimney', 'office-building', 'Scheduled', 'minor', null, null, null, true, 6),

  ((select id from public.services where slug = 'carpentry'), 'door_repair', 'Door Repair', 'door', 'Common', 'minor', null, null, null, true, 1),
  ((select id from public.services where slug = 'carpentry'), 'furniture_fix', 'Furniture Fix', 'sofa-outline', 'Minor', 'minor', null, null, null, true, 2),
  ((select id from public.services where slug = 'carpentry'), 'window_repair', 'Window Repair', 'window-closed-variant', 'Minor', 'minor', null, null, null, true, 3),
  ((select id from public.services where slug = 'carpentry'), 'cabinet_install', 'Cabinet Install', 'archive-outline', 'Scheduled', 'minor', null, null, null, true, 4),
  ((select id from public.services where slug = 'carpentry'), 'lock_repair', 'Lock Repair', 'lock-outline', 'Urgent', 'urgent', null, null, null, true, 5),
  ((select id from public.services where slug = 'carpentry'), 'custom_work', 'Custom Work', 'hammer', 'Scheduled', 'minor', null, null, null, true, 6),

  ((select id from public.services where slug = 'cleaning'), 'full_home', 'Full Home Clean', 'home-outline', 'Popular', 'minor', null, null, null, true, 1),
  ((select id from public.services where slug = 'cleaning'), 'kitchen', 'Kitchen Deep Clean', 'silverware-fork-knife', 'Common', 'minor', null, null, null, true, 2),
  ((select id from public.services where slug = 'cleaning'), 'bathroom', 'Bathroom Clean', 'shower', 'Common', 'minor', null, null, null, true, 3),
  ((select id from public.services where slug = 'cleaning'), 'sofa', 'Sofa Shampooing', 'sofa', 'Popular', 'minor', null, null, null, true, 4),
  ((select id from public.services where slug = 'cleaning'), 'carpet', 'Carpet Cleaning', 'rug', 'Minor', 'minor', null, null, null, true, 5),
  ((select id from public.services where slug = 'cleaning'), 'post_construct', 'Post Construction', 'home-city-outline', 'Scheduled', 'minor', null, null, null, true, 6)
on conflict (service_id, slug) do update
set
  name = excluded.name,
  icon_name = excluded.icon_name,
  tag = excluded.tag,
  default_severity = excluded.default_severity,
  estimated_parts_name = excluded.estimated_parts_name,
  estimated_parts_mrp = excluded.estimated_parts_mrp,
  estimated_parts_price = excluded.estimated_parts_price,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

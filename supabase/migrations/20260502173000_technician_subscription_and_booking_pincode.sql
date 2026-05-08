alter table public.technician_profiles
  add column if not exists subscription_plan_code text,
  add column if not exists subscription_status text not null default 'inactive';

alter table public.technician_profiles
  drop constraint if exists technician_profiles_subscription_status_chk;

alter table public.technician_profiles
  add constraint technician_profiles_subscription_status_chk
  check (
    subscription_status in ('inactive', 'pending', 'active', 'expired', 'cancelled')
  );

alter table public.technician_profiles
  drop constraint if exists technician_profiles_subscription_plan_code_fkey;

alter table public.technician_profiles
  add constraint technician_profiles_subscription_plan_code_fkey
  foreign key (subscription_plan_code)
  references public.subscription_plans(code)
  on delete set null;

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

do $$
declare
  technician_record record;
begin
  for technician_record in
    select id
    from public.technician_profiles
  loop
    perform public.refresh_technician_profile_subscription_snapshot(technician_record.id);
  end loop;
end;
$$;

alter table public.technician_payout_requests
  drop constraint if exists technician_payout_requests_platform_fee_amount_chk;

alter table public.technician_payout_requests
  drop column if exists platform_fee_amount;

alter table public.bookings
  add column if not exists pincode text;

alter table public.bookings
  drop constraint if exists bookings_pincode_not_blank_chk;

alter table public.bookings
  add constraint bookings_pincode_not_blank_chk
  check (
    pincode is null
    or btrim(pincode) <> ''
  );

update public.bookings booking
set pincode = nullif(btrim(coalesce(address.postal_code, '')), '')
from public.addresses address
where booking.address_id = address.id
  and booking.pincode is distinct from nullif(btrim(coalesce(address.postal_code, '')), '');

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
    new.pincode = nullif(btrim(coalesce(selected_address.postal_code, '')), '');
  else
    new.address_label_snapshot = null;
    new.address_snapshot = null;
    new.pincode = null;
  end if;

  if new.severity = 'moderate'
    and nullif(btrim(coalesce(new.scheduled_slot_label, '')), '') is null then
    new.scheduled_slot_label = 'Within 24 hours';
  elsif new.severity = 'urgent'
    and nullif(btrim(coalesce(new.scheduled_slot_label, '')), '') is null then
    new.scheduled_slot_label = '15-30 mins';
  end if;

  new.urgency_surcharge = 0;

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

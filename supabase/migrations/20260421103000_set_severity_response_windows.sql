-- Auto-fill response windows for non-minor bookings.
-- Moderate bookings should carry a 24-hour response window.
-- Urgent bookings should carry a 15-30 minute response window.

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

update public.bookings
set scheduled_slot_label = case
  when severity = 'moderate' then 'Within 24 hours'
  when severity = 'urgent' then '15-30 mins'
  else scheduled_slot_label
end
where severity in ('moderate', 'urgent')
  and nullif(btrim(coalesce(scheduled_slot_label, '')), '') is null;

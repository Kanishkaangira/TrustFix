-- TrustFix migration for fixed booking slot pricing.
-- Removes service_severity_pricing and uses global severity charges instead.

drop table if exists public.service_severity_pricing cascade;

create or replace function public.prepare_booking()
returns trigger
language plpgsql
as $$
declare
  selected_service public.services%rowtype;
  selected_problem public.service_problems%rowtype;
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
  new.visit_charge = case
    when new.severity = 'urgent' then 150
    when new.severity = 'moderate' then 100
    else 70
  end;
  new.labour_cost = selected_service.base_labour_cost;
  new.platform_fee = case
    when new.severity = 'urgent' then 100
    when new.severity = 'moderate' then 50
    else 30
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

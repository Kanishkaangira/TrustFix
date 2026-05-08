alter table public.addresses
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

alter table public.addresses
  drop constraint if exists addresses_coordinates_pair_chk;

alter table public.addresses
  add constraint addresses_coordinates_pair_chk
  check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  );

alter table public.addresses
  drop constraint if exists addresses_latitude_range_chk;

alter table public.addresses
  add constraint addresses_latitude_range_chk
  check (latitude is null or latitude between -90 and 90);

alter table public.addresses
  drop constraint if exists addresses_longitude_range_chk;

alter table public.addresses
  add constraint addresses_longitude_range_chk
  check (longitude is null or longitude between -180 and 180);

alter table public.bookings
  add column if not exists destination_latitude_snapshot numeric(9, 6),
  add column if not exists destination_longitude_snapshot numeric(9, 6);

alter table public.bookings
  drop constraint if exists bookings_destination_coordinates_pair_chk;

alter table public.bookings
  add constraint bookings_destination_coordinates_pair_chk
  check (
    (destination_latitude_snapshot is null and destination_longitude_snapshot is null)
    or (
      destination_latitude_snapshot is not null
      and destination_longitude_snapshot is not null
    )
  );

alter table public.bookings
  drop constraint if exists bookings_destination_latitude_range_chk;

alter table public.bookings
  add constraint bookings_destination_latitude_range_chk
  check (
    destination_latitude_snapshot is null
    or destination_latitude_snapshot between -90 and 90
  );

alter table public.bookings
  drop constraint if exists bookings_destination_longitude_range_chk;

alter table public.bookings
  add constraint bookings_destination_longitude_range_chk
  check (
    destination_longitude_snapshot is null
    or destination_longitude_snapshot between -180 and 180
  );

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
    new.destination_latitude_snapshot = selected_address.latitude;
    new.destination_longitude_snapshot = selected_address.longitude;
  else
    new.address_label_snapshot = null;
    new.address_snapshot = null;
    new.destination_latitude_snapshot = null;
    new.destination_longitude_snapshot = null;
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

update public.bookings as booking
set
  destination_latitude_snapshot = address.latitude,
  destination_longitude_snapshot = address.longitude
from public.addresses as address
where booking.address_id = address.id
  and (
    booking.destination_latitude_snapshot is distinct from address.latitude
    or booking.destination_longitude_snapshot is distinct from address.longitude
  );

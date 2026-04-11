-- TrustFix migration: revert safe address deletion
-- Run this once on an existing project to go back to hard-deleting addresses.

begin;

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own"
on public.addresses
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own"
on public.addresses
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

grant select, insert, update, delete on table public.addresses to authenticated;

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

drop index if exists addresses_one_default_per_user_idx;
create unique index if not exists addresses_one_default_per_user_idx
  on public.addresses(user_id)
  where is_default;

alter table public.bookings
  drop constraint if exists bookings_address_id_fkey;

alter table public.bookings
  add constraint bookings_address_id_fkey
  foreign key (address_id)
  references public.addresses(id)
  on delete set null;

alter table public.addresses
  drop column if exists deleted_at;

commit;

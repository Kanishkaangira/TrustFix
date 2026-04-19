-- TrustFix migration to fully separate customer and technician profile tables.
-- - public.profiles stays customer-only
-- - public.technician_profiles links directly to auth.users
-- - deleting a customer profile row will not delete technician profile rows

alter table public.technician_profiles
  drop constraint if exists technician_profiles_id_fkey;

alter table public.technician_profiles
  add constraint technician_profiles_id_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(nullif(trim(new.raw_user_meta_data ->> 'app_role'), ''), 'customer') = 'technician' then
    return new;
  end if;

  insert into public.profiles (
    id,
    phone,
    email
  )
  values (
    new.id,
    new.phone,
    new.email
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
    email = coalesce(new.email, email),
    updated_at = timezone('utc', now())
  where id = new.id;

  return new;
end;
$$;

delete from public.profiles p
where exists (
  select 1
  from public.technician_profiles tp
  where tp.id = p.id
)
and not exists (
  select 1
  from public.addresses a
  where a.user_id = p.id
)
and not exists (
  select 1
  from public.bookings b
  where b.user_id = p.id
)
and not exists (
  select 1
  from public.payment_orders po
  where po.user_id = p.id
);

-- Booking arrival OTP flow for technician safety verification.

create table if not exists public.booking_verification_otps (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  purpose text not null default 'arrival_verification',
  otp_code text not null,
  status text not null default 'generated',
  generated_for_phone text,
  generated_by_technician_id uuid references auth.users(id) on delete set null,
  verified_by_technician_id uuid references auth.users(id) on delete set null,
  attempt_count integer not null default 0,
  expires_at timestamptz not null,
  last_attempt_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_verification_otps_purpose_chk
    check (purpose in ('arrival_verification', 'completion_verification')),
  constraint booking_verification_otps_status_chk
    check (status in ('generated', 'verified', 'expired', 'cancelled')),
  constraint booking_verification_otps_code_format_chk
    check (otp_code ~ '^[0-9]{4,6}$'),
  constraint booking_verification_otps_attempt_count_chk
    check (attempt_count >= 0)
);

create index if not exists booking_verification_otps_booking_id_created_at_idx
  on public.booking_verification_otps(booking_id, created_at desc);

create index if not exists booking_verification_otps_status_expires_at_idx
  on public.booking_verification_otps(status, expires_at desc);

drop trigger if exists booking_verification_otps_set_updated_at on public.booking_verification_otps;
create trigger booking_verification_otps_set_updated_at
  before update on public.booking_verification_otps
  for each row
  execute procedure public.set_updated_at();

alter table public.booking_verification_otps enable row level security;

revoke all on table public.booking_verification_otps from anon, authenticated;
grant select on table public.booking_verification_otps to authenticated;

drop policy if exists "booking_verification_otps_select_owner" on public.booking_verification_otps;
create policy "booking_verification_otps_select_owner"
on public.booking_verification_otps
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_verification_otps.booking_id
      and b.user_id = (select auth.uid())
  )
);

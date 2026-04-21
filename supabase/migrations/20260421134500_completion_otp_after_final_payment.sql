alter table public.booking_verification_otps
  drop constraint if exists booking_verification_otps_purpose_chk;

alter table public.booking_verification_otps
  add constraint booking_verification_otps_purpose_chk
  check (purpose in ('arrival_verification', 'completion_verification'));

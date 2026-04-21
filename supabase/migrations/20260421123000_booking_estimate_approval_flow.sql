alter table public.bookings
  add column if not exists estimate_rework_requested_at timestamptz,
  add column if not exists estimate_version_no integer not null default 0,
  add column if not exists proposed_labour_charge numeric(10, 2) not null default 0,
  add column if not exists proposed_parts_charge numeric(10, 2) not null default 0,
  add column if not exists proposed_invoice_total numeric(10, 2) not null default 0,
  add column if not exists estimate_note text,
  add column if not exists estimate_response_note text;

alter table public.bookings
  drop constraint if exists bookings_status_chk;

alter table public.bookings
  add constraint bookings_status_chk
  check (
    status in (
      'requested',
      'confirmed',
      'assigned',
      'accepted',
      'en_route',
      'arrived',
      'otp_verified',
      'estimate_sent',
      'estimate_revision_requested',
      'estimate_approved',
      'in_progress',
      'work_completed',
      'payment_pending',
      'completed',
      'cancelled'
    )
  );

alter table public.booking_status_history
  drop constraint if exists booking_status_history_status_chk;

alter table public.booking_status_history
  add constraint booking_status_history_status_chk
  check (
    status in (
      'requested',
      'confirmed',
      'assigned',
      'accepted',
      'en_route',
      'arrived',
      'otp_verified',
      'estimate_sent',
      'estimate_revision_requested',
      'estimate_approved',
      'in_progress',
      'work_completed',
      'payment_pending',
      'completed',
      'cancelled'
    )
  );

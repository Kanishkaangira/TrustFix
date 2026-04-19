drop trigger if exists payment_attempts_set_updated_at on public.payment_attempts;
drop trigger if exists payment_refunds_set_updated_at on public.payment_refunds;

drop table if exists public.payment_events;
drop table if exists public.payment_attempts;
drop table if exists public.payment_refunds;

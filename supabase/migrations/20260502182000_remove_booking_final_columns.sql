alter table public.bookings
  drop column if exists work_started_at,
  drop column if exists work_completed_at,
  drop column if exists final_visit_charge,
  drop column if exists final_labour_charge,
  drop column if exists final_parts_charge,
  drop column if exists final_invoice_total;

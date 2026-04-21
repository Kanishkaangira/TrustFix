update public.technician_profiles
set
  status = 'active',
  updated_at = timezone('utc', now())
where status = 'pending_review';

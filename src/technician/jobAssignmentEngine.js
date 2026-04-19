import { supabase } from '../lib/supabase';
import { bucketAssignmentsByTab } from './jobDispatchAlgorithm';

export const fetchTechnicianAssignments = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { data: null, error: userError };
  }

  const userId = userData?.user?.id;

  if (!userId) {
    return { data: { Active: [], Upcoming: [], Completed: [] }, error: null };
  }

  const result = await supabase.db.select('booking_assignments', {
    columns: `
      id,
      booking_id,
      technician_id,
      status,
      offered_at,
      accepted_at,
      responded_at,
      created_at,
      updated_at,
      bookings (
        id,
        booking_number,
        status,
        payment_status,
        service_name_snapshot,
        problem_name_snapshot,
        custom_problem,
        customer_name_snapshot,
        customer_phone_snapshot,
        address_label_snapshot,
        address_snapshot,
        scheduled_date,
        scheduled_slot_label,
        visit_charge,
        platform_fee,
        estimated_total,
        work_completed_at
      )
    `,
    filters: [
      { column: 'technician_id', op: 'eq', value: userId },
      { column: 'status', op: 'in', value: ['notified', 'accepted', 'completed'] },
    ],
    order: [{ column: 'offered_at', ascending: false }],
  });

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: bucketAssignmentsByTab(Array.isArray(result.data) ? result.data : []),
    error: null,
  };
};

export const fetchTechnicianJobDetail = async (bookingId) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { data: null, error: userError };
  }

  const userId = userData?.user?.id;

  if (!userId || !bookingId) {
    return { data: null, error: { message: 'Job not found.' } };
  }

  const result = await supabase.db.select('booking_assignments', {
    columns: `
      id,
      booking_id,
      technician_id,
      status,
      offered_at,
      responded_at,
      accepted_at,
      created_at,
      updated_at,
      bookings (
        id,
        booking_number,
        status,
        payment_status,
        severity,
        service_name_snapshot,
        problem_name_snapshot,
        custom_problem,
        customer_name_snapshot,
        customer_phone_snapshot,
        address_label_snapshot,
        address_snapshot,
        scheduled_date,
        scheduled_slot_label,
        visit_charge,
        platform_fee,
        protection_selected,
        protection_fee,
        urgency_surcharge,
        estimated_total,
        technician_id,
        technician_service_id,
        created_at
      )
    `,
    filters: [
      { column: 'technician_id', op: 'eq', value: userId },
      { column: 'booking_id', op: 'eq', value: bookingId },
    ],
    order: [{ column: 'created_at', ascending: false }],
    limit: 1,
    maybeSingle: true,
  });

  if (result.error) {
    return { data: null, error: result.error };
  }

  if (!result.data?.bookings) {
    return { data: null, error: { message: 'This booking is not available for your profile.' } };
  }

  return { data: result.data, error: null };
};

export const acceptTechnicianJob = async (bookingId) => {
  return supabase.functions.invoke('accept-booking-assignment', {
    body: { bookingId },
  });
};

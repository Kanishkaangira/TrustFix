import { supabase } from '../lib/supabase';
import { bucketAssignmentsByTab } from './jobDispatchAlgorithm';

const ASSIGNMENT_BOOKING_SUMMARY_COLUMNS = `
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
`;

const ASSIGNMENT_BOOKING_DETAIL_COLUMNS = `
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
  estimate_sent_at,
  estimate_approved_at,
  estimate_rework_requested_at,
  estimate_version_no,
  estimate_note,
  estimate_response_note,
  proposed_labour_charge,
  proposed_parts_charge,
  proposed_invoice_total,
  final_labour_charge,
  final_parts_charge,
  final_invoice_total,
  technician_id,
  created_at
`;

const normalizeBookingRecord = (booking) => {
  if (Array.isArray(booking)) {
    return booking[0] || null;
  }

  return booking || null;
};

const hydrateAssignmentBookings = async (assignments = []) => {
  const normalizedAssignments = assignments.map((assignment) => ({
    ...assignment,
    bookings: normalizeBookingRecord(assignment.bookings),
  }));

  const missingBookingIds = [
    ...new Set(
      normalizedAssignments
        .filter((assignment) => !assignment.bookings && assignment.booking_id)
        .map((assignment) => assignment.booking_id),
    ),
  ];

  if (!missingBookingIds.length) {
    return normalizedAssignments;
  }

  const bookingResult = await supabase.db.select('bookings', {
    columns: ASSIGNMENT_BOOKING_SUMMARY_COLUMNS,
    filters: [{ column: 'id', op: 'in', value: missingBookingIds }],
  });

  if (bookingResult.error || !Array.isArray(bookingResult.data)) {
    return normalizedAssignments;
  }

  const bookingMap = bookingResult.data.reduce((accumulator, booking) => {
    accumulator[booking.id] = booking;
    return accumulator;
  }, {});

  return normalizedAssignments.map((assignment) => ({
    ...assignment,
    bookings: assignment.bookings || bookingMap[assignment.booking_id] || null,
  }));
};

export const fetchTechnicianAssignments = async () => {
  const result = await supabase.functions.invoke('fetch-technician-jobs');

  if (result.error) {
    return { data: null, error: result.error };
  }

  const combinedAssignments = await hydrateAssignmentBookings(
    Array.isArray(result.data?.assignments) ? result.data.assignments : [],
  );

  return {
    data: bucketAssignmentsByTab(combinedAssignments),
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
        ${ASSIGNMENT_BOOKING_DETAIL_COLUMNS}
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

  const normalizedAssignment = result.data
    ? {
        ...result.data,
        bookings: normalizeBookingRecord(result.data.bookings),
      }
    : null;

  if (normalizedAssignment?.bookings) {
    return { data: normalizedAssignment, error: null };
  }

  const bookingFallback = await supabase.db.select('bookings', {
    columns: ASSIGNMENT_BOOKING_DETAIL_COLUMNS,
    filters: [
      { column: 'id', op: 'eq', value: bookingId },
      { column: 'technician_id', op: 'eq', value: userId },
    ],
    maybeSingle: true,
  });

  if (bookingFallback.error) {
    return { data: null, error: bookingFallback.error };
  }

  if (!bookingFallback.data) {
    return { data: null, error: { message: 'This booking is not available for your profile.' } };
  }

  return {
    data: {
      id: `accepted-${bookingFallback.data.id}`,
      booking_id: bookingFallback.data.id,
      technician_id: userId,
      status: bookingFallback.data.status === 'accepted' ? 'accepted' : 'notified',
      offered_at: bookingFallback.data.created_at,
      responded_at: null,
      accepted_at: null,
      created_at: bookingFallback.data.created_at,
      updated_at: bookingFallback.data.created_at,
      bookings: bookingFallback.data,
    },
    error: null,
  };
};

export const acceptTechnicianJob = async (bookingId) => {
  return supabase.functions.invoke('accept-booking-assignment', {
    body: { bookingId },
  });
};

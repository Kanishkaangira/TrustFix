import { supabase } from '../lib/supabase';
import { bucketAssignmentsByTab } from './jobDispatchAlgorithm';

const ASSIGNMENT_COLUMNS = `
  id,
  booking_id,
  technician_id,
  status,
  offered_at,
  responded_at,
  accepted_at,
  created_at,
  updated_at
`;

const ASSIGNMENT_BOOKING_SUMMARY_COLUMNS = `
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
  estimated_total,
  updated_at
`;

const ASSIGNMENT_BOOKING_DETAIL_COLUMNS = '*';

const normalizeBookingRecord = (booking) => {
  if (Array.isArray(booking)) {
    return booking[0] || null;
  }

  return booking || null;
};

const normalizeAssignmentRecord = (assignment = {}) => ({
  ...assignment,
  bookings: normalizeBookingRecord(assignment.bookings),
});

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
  String(value || '').trim(),
);

const getAuthenticatedTechnicianId = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { userId: '', error: userError };
  }

  return { userId: userData?.user?.id || '', error: null };
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

const fetchAssignmentsViaFunction = async () => {
  const result = await supabase.functions.invoke('fetch-technician-jobs');

  if (result.error) {
    return { assignments: [], error: result.error };
  }

  const combinedAssignments = await hydrateAssignmentBookings(
    Array.isArray(result.data?.assignments) ? result.data.assignments : [],
  );

  return {
    assignments: combinedAssignments.map(normalizeAssignmentRecord),
    error: null,
  };
};

const fetchAssignmentsDirect = async (technicianId) => {
  if (!technicianId) {
    return { assignments: [], error: null };
  }

  const profileResult = await supabase.db.select('technician_profiles', {
    columns: 'id, status, is_available',
    filters: [{ column: 'id', op: 'eq', value: technicianId }],
    maybeSingle: true,
  });

  const technicianProfile = profileResult.error ? null : (profileResult.data || null);

  if (technicianProfile?.status === 'active' && technicianProfile?.is_available) {
    await supabase.db.rpc('dispatch_open_bookings_to_technician', {
      p_technician_id: technicianId,
    });
  }

  const assignmentResult = await supabase.db.select('job_assignment', {
    columns: ASSIGNMENT_COLUMNS,
    filters: [
      { column: 'technician_id', op: 'eq', value: technicianId },
      { column: 'status', op: 'in', value: ['notified', 'accepted', 'completed'] },
    ],
    order: [{ column: 'offered_at', ascending: false }],
  });

  if (assignmentResult.error) {
    return {
      assignments: [],
      error: assignmentResult.error,
    };
  }

  const combinedAssignments = await hydrateAssignmentBookings(
    Array.isArray(assignmentResult.data) ? assignmentResult.data : [],
  );

  return {
    assignments: combinedAssignments.map(normalizeAssignmentRecord),
    error: null,
  };
};

const loadTechnicianAssignments = async (technicianId) => {
  const directResult = await fetchAssignmentsDirect(technicianId);

  if (!directResult.error && directResult.assignments.length) {
    return directResult;
  }

  const functionResult = await fetchAssignmentsViaFunction();

  if (!functionResult.error) {
    return functionResult;
  }

  if (!directResult.error) {
    return directResult;
  }

  return {
    assignments: [],
    error: directResult.error,
  };
};

export const fetchTechnicianAssignments = async () => {
  const { userId, error: userError } = await getAuthenticatedTechnicianId();

  if (userError) {
    return { data: null, error: userError };
  }

  if (!userId) {
    return {
      data: bucketAssignmentsByTab([]),
      error: null,
    };
  }

  const result = await loadTechnicianAssignments(userId);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: bucketAssignmentsByTab(result.assignments),
    error: null,
  };
};

export const fetchTechnicianJobDetail = async (bookingId) => {
  const { userId, error: userError } = await getAuthenticatedTechnicianId();

  if (!userId || !bookingId) {
    return { data: null, error: userError || { message: 'Job not found.' } };
  }

  if (!isUuid(bookingId)) {
    return {
      data: null,
      error: { message: 'This job link is no longer valid. Please open it from My Jobs.' },
    };
  }

  const assignmentResult = await loadTechnicianAssignments(userId);
  const matchingAssignment = assignmentResult.assignments.find((assignment) => (
    assignment.booking_id === bookingId
    || assignment.bookings?.id === bookingId
  )) || null;

  const bookingFallback = await supabase.db.select('bookings', {
    columns: ASSIGNMENT_BOOKING_DETAIL_COLUMNS,
    filters: [{ column: 'id', op: 'eq', value: bookingId }],
    maybeSingle: true,
  });

  if (bookingFallback.error) {
    if (matchingAssignment?.bookings) {
      return { data: matchingAssignment, error: null };
    }

    return { data: null, error: bookingFallback.error };
  }

  if (!bookingFallback.data && matchingAssignment?.bookings) {
    return { data: matchingAssignment, error: null };
  }

  if (!bookingFallback.data) {
    return { data: null, error: { message: 'This booking is not available for your profile.' } };
  }

  return {
    data: {
      id: matchingAssignment?.id || `accepted-${bookingFallback.data.id}`,
      booking_id: bookingFallback.data.id,
      technician_id: userId,
      status: matchingAssignment?.status || (bookingFallback.data.technician_id === userId ? 'accepted' : 'notified'),
      offered_at: matchingAssignment?.offered_at || bookingFallback.data.created_at,
      responded_at: matchingAssignment?.responded_at || null,
      accepted_at: matchingAssignment?.accepted_at || null,
      created_at: matchingAssignment?.created_at || bookingFallback.data.created_at,
      updated_at: matchingAssignment?.updated_at || bookingFallback.data.created_at,
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


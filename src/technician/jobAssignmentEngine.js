import { supabase } from '../lib/supabase';

const formatScheduledSlot = (booking = {}) => {
  const date = booking.scheduled_date;
  const slot = String(booking.scheduled_slot_label || '').trim();

  if (date && slot) {
    return `${date} • ${slot}`;
  }

  if (date) {
    return String(date);
  }

  return slot || 'Schedule pending';
};

const getActiveStatusMeta = (bookingStatus) => {
  if (bookingStatus === 'in_progress') {
    return { label: 'In Progress', tone: 'emerald' };
  }

  if (bookingStatus === 'en_route' || bookingStatus === 'arrived' || bookingStatus === 'otp_verified') {
    return { label: 'En Route', tone: 'amber' };
  }

  return { label: 'Accepted', tone: 'sky' };
};

export const mapAssignmentToJobCard = (assignment = {}) => {
  const booking = assignment.bookings || {};
  const bookingStatus = String(booking.status || '').trim();
  const assignmentStatus = String(assignment.status || '').trim();
  const activeMeta = getActiveStatusMeta(bookingStatus);

  const bucket = assignmentStatus === 'accepted'
    ? (bookingStatus === 'completed' ? 'Completed' : 'Active')
    : assignmentStatus === 'completed'
      ? 'Completed'
      : 'Upcoming';

  return {
    id: assignment.id,
    bookingId: assignment.booking_id,
    assignmentStatus,
    bucket,
    title: String(booking.service_name_snapshot || 'Service request').trim(),
    issue: String(booking.problem_name_snapshot || booking.custom_problem || 'Problem shared by customer').trim(),
    area: String(booking.address_snapshot || 'Address pending').trim(),
    slot: formatScheduledSlot(booking),
    visitText: bucket === 'Upcoming'
      ? 'Waiting for acceptance'
      : bucket === 'Completed'
        ? 'Customer total recorded'
        : 'Accepted service',
    status: bucket === 'Upcoming'
      ? 'New'
      : bucket === 'Completed'
        ? 'Completed'
        : activeMeta.label,
    statusTone: bucket === 'Upcoming'
      ? 'sky'
      : bucket === 'Completed'
        ? 'emerald'
        : activeMeta.tone,
    type: bucket === 'Upcoming'
      ? 'New request'
      : bucket === 'Completed'
        ? 'Past service'
        : 'Accepted',
    icon: 'briefcase-outline',
    iconBg: 'sky',
    paymentDone: String(booking.payment_status || '').trim() === 'paid',
    raw: assignment,
  };
};

export const bucketAssignmentsByTab = (assignments = []) => {
  return assignments
    .map(mapAssignmentToJobCard)
    .reduce((accumulator, job) => {
      accumulator[job.bucket].push(job);
      return accumulator;
    }, {
      Active: [],
      Upcoming: [],
      Completed: [],
    });
};

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
      bookings (
        id,
        status,
        payment_status,
        service_name_snapshot,
        problem_name_snapshot,
        custom_problem,
        address_snapshot,
        scheduled_date,
        scheduled_slot_label,
        estimated_total
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

export const acceptTechnicianJob = async (bookingId) => {
  return supabase.functions.invoke('accept-booking-assignment', {
    body: { bookingId },
  });
};

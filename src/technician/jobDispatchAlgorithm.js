const formatScheduledSlot = (booking = {}) => {
  const date = booking.scheduled_date;
  const slot = String(booking.scheduled_slot_label || '').trim();

  if (date && slot) {
    return `${date} • ${slot}`;
  }

  if (date) {
    return String(date);
  }

  if (slot) {
    return slot;
  }

  return 'Schedule pending';
};

const getActiveStatusMeta = (bookingStatus) => {
  if (bookingStatus === 'estimate_revision_requested') {
    return { label: 'Estimate Again', tone: 'coral' };
  }

  if (bookingStatus === 'estimate_sent') {
    return { label: 'Waiting Approval', tone: 'amber' };
  }

  if (bookingStatus === 'estimate_approved') {
    return { label: 'Approved', tone: 'emerald' };
  }

  if (bookingStatus === 'in_progress') {
    return { label: 'In Progress', tone: 'emerald' };
  }

  if (bookingStatus === 'work_completed') {
    return { label: 'Finish OTP', tone: 'amber' };
  }

  if (['en_route', 'arrived', 'otp_verified'].includes(bookingStatus)) {
    return { label: 'En Route', tone: 'amber' };
  }

  return { label: 'Accepted', tone: 'sky' };
};

const getBucket = (assignmentStatus, bookingStatus) => {
  if (assignmentStatus === 'accepted') {
    return bookingStatus === 'completed' ? 'Completed' : 'Active';
  }

  if (assignmentStatus === 'completed') {
    return 'Completed';
  }

  return 'Upcoming';
};

const getSortValue = (assignment = {}, bucket) => {
  if (bucket === 'Upcoming') {
    return new Date(
      assignment.offered_at ||
      assignment.created_at ||
      0,
    ).getTime();
  }

  if (bucket === 'Completed') {
    return new Date(
      assignment.bookings?.work_completed_at ||
      assignment.responded_at ||
      assignment.updated_at ||
      0,
    ).getTime();
  }

  return new Date(
    assignment.accepted_at ||
    assignment.responded_at ||
    assignment.updated_at ||
    0,
  ).getTime();
};

export const mapAssignmentToJobCard = (assignment = {}) => {
  const booking = assignment.bookings || {};
  const bookingStatus = String(booking.status || '').trim();
  const assignmentStatus = String(assignment.status || '').trim();
  const bucket = getBucket(assignmentStatus, bookingStatus);
  const activeMeta = getActiveStatusMeta(bookingStatus);
  const initialFee = Number(booking.visit_charge || 0) + Number(booking.platform_fee || 0);
  const serviceLabel = String(booking.service_name_snapshot || 'Service request').trim();
  const problemLabel = String(
    booking.problem_name_snapshot ||
    booking.custom_problem ||
    'Problem shared by customer',
  ).trim();
  const addressLabel = String(booking.address_snapshot || 'Address pending').trim();
  const scheduleLabel = formatScheduledSlot(booking);

  return {
    id: assignment.id,
    bookingId: assignment.booking_id,
    bookingNumber: String(booking.booking_number || '').trim(),
    assignmentStatus,
    bucket,
    title: serviceLabel,
    issue: problemLabel,
    area: addressLabel,
    areaLabel: String(booking.address_label_snapshot || '').trim(),
    slot: scheduleLabel,
    scheduleLabel,
    serviceLabel,
    problemLabel,
    addressLabel,
    customerName: String(booking.customer_name_snapshot || 'Customer').trim(),
    customerPhone: String(booking.customer_phone_snapshot || '').trim(),
    initialFeeLabel: initialFee > 0 ? `Initial fee Rs ${initialFee}` : 'Initial fee pending',
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
    iconBg: bucket === 'Upcoming' ? 'sky' : bucket === 'Completed' ? 'emerald' : 'amber',
    paymentDone: String(booking.payment_status || '').trim() === 'paid',
    sortValue: getSortValue(assignment, bucket),
    raw: assignment,
  };
};

export const bucketAssignmentsByTab = (assignments = []) => {
  return assignments
    .map(mapAssignmentToJobCard)
    .sort((left, right) => right.sortValue - left.sortValue)
    .reduce((accumulator, job) => {
      accumulator[job.bucket].push(job);
      return accumulator;
    }, {
      Active: [],
      Upcoming: [],
      Completed: [],
    });
};

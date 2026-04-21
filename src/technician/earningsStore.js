import { supabase } from '../lib/supabase';

const PAYOUT_COLUMNS = `
  id,
  status,
  gross_amount,
  commission_amount,
  net_amount,
  requested_at,
  processed_at,
  booking_id,
  bookings (
    id,
    booking_number,
    status,
    payment_status,
    final_invoice_total,
    service_name_snapshot,
    problem_name_snapshot
  )
`;

const BOOKING_COLUMNS = `
  id,
  booking_number,
  status,
  payment_status,
  final_invoice_total,
  service_name_snapshot,
  problem_name_snapshot,
  updated_at,
  work_completed_at
`;

const formatCurrency = (value) => `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const safeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getServiceIcon = (serviceName = '') => {
  const label = String(serviceName).toLowerCase();

  if (label.includes('ac')) {
    return { icon: 'snowflake', iconBg: 'amber' };
  }
  if (label.includes('plumb')) {
    return { icon: 'pipe-leak', iconBg: 'sky' };
  }
  if (label.includes('elect')) {
    return { icon: 'flash', iconBg: 'sky' };
  }
  if (label.includes('clean')) {
    return { icon: 'broom', iconBg: 'emerald' };
  }
  if (label.includes('carpen')) {
    return { icon: 'hammer', iconBg: 'amber' };
  }
  if (label.includes('appliance')) {
    return { icon: 'tools', iconBg: 'rose' };
  }

  return { icon: 'cash-multiple', iconBg: 'emerald' };
};

const normalizeBooking = (booking) => {
  if (Array.isArray(booking)) {
    return booking[0] || null;
  }

  return booking || null;
};

const normalizePayoutRecord = (record = {}) => {
  const booking = normalizeBooking(record.bookings);
  const serviceName = String(booking?.service_name_snapshot || 'Service payout').trim();
  const problemName = String(booking?.problem_name_snapshot || 'Technician earning').trim();
  const status = String(record.status || '').trim();
  const iconConfig = getServiceIcon(serviceName);
  const settledAmount = Number(record.net_amount || 0);
  const displayAmount = settledAmount > 0
    ? settledAmount
    : Number(record.gross_amount || booking?.final_invoice_total || 0);

  return {
    id: String(record.id || '').trim(),
    bookingId: String(record.booking_id || '').trim(),
    bookingNumber: String(booking?.booking_number || '').trim(),
    serviceName,
    problemName,
    status,
    commissionAmount: Number(record.commission_amount || 0),
    displayAmount,
    eventAt: record.processed_at || record.requested_at || null,
    icon: iconConfig.icon,
    iconBg: iconConfig.iconBg,
  };
};

const normalizeBookingRecord = (record = {}) => {
  const serviceName = String(record.service_name_snapshot || 'Completed job').trim();
  const problemName = String(record.problem_name_snapshot || 'Technician job').trim();
  const iconConfig = getServiceIcon(serviceName);

  return {
    id: String(record.id || '').trim(),
    bookingNumber: String(record.booking_number || '').trim(),
    status: String(record.status || '').trim(),
    paymentStatus: String(record.payment_status || '').trim(),
    serviceName,
    problemName,
    eventAt: record.updated_at || record.work_completed_at || null,
    icon: iconConfig.icon,
    iconBg: iconConfig.iconBg,
  };
};

const isVisiblePayout = (record) => ['pending', 'processing', 'paid'].includes(String(record.status || '').trim());
const isCompletedBooking = (record) => String(record.status || '').trim() === 'completed';

const isSameLocalDate = (value, now = new Date()) => {
  const date = safeDate(value);

  if (!date) {
    return false;
  }

  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
};

const buildTransactions = (records = []) => records.map((record) => ({
  id: record.id,
  icon: record.icon,
  iconBg: record.iconBg,
  title: record.serviceName,
  subtitle: record.bookingNumber
    ? `${record.problemName} · ${record.bookingNumber}`
    : record.problemName,
  amount: String(record.status || '').trim() === 'paid'
    ? `+${formatCurrency(record.displayAmount)}`
    : formatCurrency(record.displayAmount),
  tone: String(record.status || '').trim() === 'paid' ? 'emerald' : 'amber',
}));

const buildPeriodSummary = ({
  label,
  payoutRecords = [],
  completedJobs = [],
}) => {
  const totalValue = payoutRecords.reduce((sum, record) => sum + Number(record.displayAmount || 0), 0);
  const totalCommission = payoutRecords.reduce((sum, record) => sum + Number(record.commissionAmount || 0), 0);

  return {
    label,
    totalValue: formatCurrency(totalValue),
    jobsDone: String(completedJobs.length),
    commissionValue: formatCurrency(totalCommission),
    transactions: buildTransactions(payoutRecords),
  };
};

export const fetchTechnicianEarnings = async () => {
  const [payoutResult, bookingResult] = await Promise.all([
    supabase.db.select('technician_payout_requests', {
      columns: PAYOUT_COLUMNS,
      order: [{ column: 'processed_at', ascending: false }, { column: 'requested_at', ascending: false }],
    }),
    supabase.db.select('bookings', {
      columns: BOOKING_COLUMNS,
      order: [{ column: 'updated_at', ascending: false }],
    }),
  ]);

  if (payoutResult.error) {
    return { data: null, error: payoutResult.error };
  }

  if (bookingResult.error) {
    return { data: null, error: bookingResult.error };
  }

  const normalizedPayouts = Array.isArray(payoutResult.data)
    ? payoutResult.data.map(normalizePayoutRecord).filter((record) => record.id)
    : [];
  const normalizedBookings = Array.isArray(bookingResult.data)
    ? bookingResult.data.map(normalizeBookingRecord).filter((record) => record.id)
    : [];

  const visiblePayouts = normalizedPayouts.filter(isVisiblePayout);
  const dailyPayouts = visiblePayouts.filter((record) => isSameLocalDate(record.eventAt));
  const completedBookings = normalizedBookings.filter(isCompletedBooking);
  const dailyCompletedBookings = completedBookings.filter((record) => isSameLocalDate(record.eventAt));

  const dailySummary = buildPeriodSummary({
    label: 'Today',
    payoutRecords: dailyPayouts,
    completedJobs: dailyCompletedBookings,
  });
  const totalSummary = buildPeriodSummary({
    label: 'Total technician earnings',
    payoutRecords: visiblePayouts,
    completedJobs: completedBookings,
  });
  const now = new Date();

  return {
    data: {
      monthLabel: now.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
      periods: {
        Daily: {
          ...dailySummary,
          subtitle: `${dailyCompletedBookings.length} completed job${dailyCompletedBookings.length === 1 ? '' : 's'} today`,
        },
        Total: {
          ...totalSummary,
          subtitle: `${completedBookings.length} completed job${completedBookings.length === 1 ? '' : 's'} overall`,
        },
      },
    },
    error: null,
  };
};

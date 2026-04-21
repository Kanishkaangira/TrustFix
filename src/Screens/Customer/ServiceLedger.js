import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  initializeFinalInvoicePayment,
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from '../../lib/payments/razorpay';
import { supabase } from '../../lib/supabase';
import {
  cancelBooking,
  getBookings,
  respondToBookingEstimate,
  subscribeToBookings,
  syncBookingsFromRemote,
} from '../../state/bookingStore';
import {
  fetchOwnProfileRecord,
  getProfile,
} from '../../state/profileStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const ACTIVE_STATUSES = new Set([
  'requested',
  'confirmed',
  'assigned',
  'en_route',
  'arrived',
  'otp_verified',
  'estimate_sent',
  'estimate_revision_requested',
  'estimate_approved',
  'in_progress',
  'work_completed',
]);

const LEDGER_TABS = ['Active', 'Completed'];

const HISTORY_COLUMNS = [
  'id',
  'booking_id',
  'booking_number',
  'service_name_snapshot',
  'problem_name_snapshot',
  'severity',
  'scheduled_date',
  'scheduled_slot_label',
  'estimated_total',
  'status',
  'created_at',
].join(',');

const ARRIVAL_OTP_COLUMNS = [
  'id',
  'booking_id',
  'purpose',
  'otp_code',
  'status',
  'expires_at',
  'verified_at',
  'created_at',
].join(',');

const STATUS_META = {
  requested: {
    label: 'Requested',
    dot: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    text: '#C66A00',
  },
  confirmed: {
    label: 'Confirmed',
    dot: '#2563EB',
    bg: 'rgba(37,99,235,0.12)',
    text: '#1D4ED8',
  },
  assigned: {
    label: 'Assigned',
    dot: '#7C3AED',
    bg: 'rgba(124,58,237,0.12)',
    text: '#6D28D9',
  },
  en_route: {
    label: 'On the way',
    dot: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    text: '#C2410C',
  },
  arrived: {
    label: 'Arrived',
    dot: '#0EA5E9',
    bg: 'rgba(14,165,233,0.12)',
    text: '#0369A1',
  },
  otp_verified: {
    label: 'OTP verified',
    dot: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    text: '#047857',
  },
  estimate_sent: {
    label: 'Estimate sent',
    dot: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    text: '#B45309',
  },
  estimate_revision_requested: {
    label: 'Estimate again',
    dot: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    text: '#C2410C',
  },
  estimate_approved: {
    label: 'Estimate approved',
    dot: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    text: '#047857',
  },
  in_progress: {
    label: 'In progress',
    dot: '#14B8A6',
    bg: 'rgba(20,184,166,0.12)',
    text: '#0F766E',
  },
  work_completed: {
    label: 'Finish OTP',
    dot: '#0EA5E9',
    bg: 'rgba(14,165,233,0.12)',
    text: '#0369A1',
  },
  completed: {
    label: 'Completed',
    dot: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
    text: '#15803D',
  },
  cancelled: {
    label: 'Cancelled',
    dot: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    text: '#B91C1C',
  },
  default: {
    label: 'Booked',
    dot: '#94A3B8',
    bg: 'rgba(148,163,184,0.12)',
    text: '#475569',
  },
};

const SEVERITY_META = {
  minor: {
    label: 'Minor',
    bg: 'rgba(59,130,246,0.12)',
    text: '#2563EB',
    icon: 'circle-slice-3',
  },
  moderate: {
    label: 'Moderate',
    bg: 'rgba(249,115,22,0.12)',
    text: '#EA580C',
    icon: 'circle-slice-5',
  },
  urgent: {
    label: 'Urgent',
    bg: 'rgba(239,68,68,0.12)',
    text: '#DC2626',
    icon: 'alert-circle',
  },
  default: {
    label: 'General',
    bg: 'rgba(148,163,184,0.12)',
    text: '#475569',
    icon: 'shape-outline',
  },
};

const getLedgerColors = (isDark) => ({
  isDark,
  headerStart: '#FF6B35',
  headerMid: '#FF7A42',
  headerEnd: '#FF844E',
  surface: isDark ? '#151D27' : '#FFFFFF',
  surfaceAlt: isDark ? '#101720' : '#FFF8F3',
  background: isDark ? '#0B1118' : '#FAF8F5',
  border: isDark ? 'rgba(255,255,255,0.08)' : '#F1E4DA',
  line: isDark ? 'rgba(255,255,255,0.10)' : '#F3E6DB',
  textPrimary: isDark ? '#F6F8FB' : '#1A1D24',
  textSecondary: isDark ? '#C7D0DD' : '#6B7280',
  textTertiary: isDark ? '#98A4B5' : '#9CA3AF',
  white: '#FFFFFF',
  primary: '#FF6B35',
  primarySoft: isDark ? 'rgba(255,107,53,0.18)' : '#FFF0E8',
  statShadow: '#000000',
});

const formatCurrency = (value) => (
  `\u20B9${Number(value || 0).toLocaleString('en-IN')}`
);

const formatHeroStat = (value) => {
  const amount = Number(value || 0);

  if (amount >= 1000) {
    return `\u20B9${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  }

  return formatCurrency(amount);
};

const safeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortByRecent = (items = []) => [...items].sort((a, b) => {
  const aDate = safeDate(a.scheduledDate) || safeDate(a.createdAt);
  const bDate = safeDate(b.scheduledDate) || safeDate(b.createdAt);

  return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
});

const sortHistoryByRecent = (items = []) => [...items].sort((a, b) => {
  const aDate = safeDate(a.scheduledDate) || safeDate(a.createdAt);
  const bDate = safeDate(b.scheduledDate) || safeDate(b.createdAt);

  return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
});

const formatHistoryDate = (record) => {
  const date = safeDate(record.scheduledDate) || safeDate(record.createdAt);

  if (!date) {
    return 'DATE PENDING';
  }

  return date.toLocaleDateString('en-IN', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
};

const getStatusMeta = (status) => {
  const key = String(status || '').trim();
  return STATUS_META[key] || STATUS_META.default;
};

const getSeverityMeta = (severity) => {
  const key = String(severity || '').trim();
  return SEVERITY_META[key] || SEVERITY_META.default;
};

const getServiceIcon = (serviceName = '') => {
  const label = String(serviceName).toLowerCase();

  if (label.includes('ac')) {
    return 'snowflake';
  }
  if (label.includes('plumb')) {
    return 'pipe-wrench';
  }
  if (label.includes('elect')) {
    return 'lightning-bolt';
  }
  if (label.includes('clean')) {
    return 'broom';
  }
  if (label.includes('carpen')) {
    return 'hammer';
  }
  if (label.includes('appliance')) {
    return 'tools';
  }

  return 'clipboard-text-outline';
};

const normalizeHistoryRecord = (record = {}) => ({
  id: String(record.id || '').trim(),
  bookingId: String(record.booking_id || '').trim(),
  bookingNumber: String(record.booking_number || '').trim(),
  serviceName: String(record.service_name_snapshot || '').trim(),
  problemName: String(
    record.problem_name_snapshot || 'General service'
  ).trim(),
  severity: String(record.severity || '').trim(),
  scheduledDate: record.scheduled_date || null,
  scheduledSlotLabel: String(record.scheduled_slot_label || '').trim(),
  estimatedTotal: Number(record.estimated_total || 0),
  estimatedTotalLabel: formatCurrency(record.estimated_total || 0),
  status: String(record.status || '').trim(),
  createdAt: record.created_at || null,
});

const normalizeHistoryRecords = (records = []) => (
  Array.isArray(records)
    ? records
      .filter(Boolean)
      .map(normalizeHistoryRecord)
      .filter((record) => record.id && record.bookingId)
    : []
);

const normalizeArrivalOtpRecord = (record = {}) => ({
  id: String(record.id || '').trim(),
  bookingId: String(record.booking_id || '').trim(),
  purpose: String(record.purpose || '').trim(),
  otpCode: String(record.otp_code || '').trim(),
  status: String(record.status || '').trim(),
  expiresAt: record.expires_at || null,
  verifiedAt: record.verified_at || null,
  createdAt: record.created_at || null,
});

const buildBookingOtpMap = (records = []) => (
  Array.isArray(records)
    ? records
      .filter(Boolean)
      .map(normalizeArrivalOtpRecord)
      .filter((record) => record.id && record.bookingId)
      .sort((a, b) => (safeDate(b.createdAt)?.getTime() || 0) - (safeDate(a.createdAt)?.getTime() || 0))
      .reduce((accumulator, record) => {
        if (!accumulator[record.bookingId]) {
          accumulator[record.bookingId] = {};
        }

        if (!record.purpose || accumulator[record.bookingId][record.purpose]) {
          return accumulator;
        }

        accumulator[record.bookingId][record.purpose] = record;

        return accumulator;
      }, {})
    : {}
);

const formatOtpExpiry = (value) => {
  const date = safeDate(value);

  if (!date) {
    return 'Share with technician';
  }

  return `Valid till ${date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

const getOtpCountdown = (value, nowMs = Date.now()) => {
  const date = safeDate(value);

  if (!date) {
    return '';
  }

  const remainingMs = date.getTime() - nowMs;

  if (remainingMs <= 0) {
    return 'Expired';
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `Expires in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getLatestHistoryRecords = (records = []) => {
  const seen = new Set();

  return sortHistoryByRecent(records).filter((record) => {
    if (!record.bookingId || seen.has(record.bookingId)) {
      return false;
    }

    seen.add(record.bookingId);
    return true;
  });
};

const fetchBookingHistoryRecords = async () => {
  try {
    return await supabase.db.select('booking_status_history', {
      columns: HISTORY_COLUMNS,
      order: [{ column: 'created_at', ascending: false }],
    });
  } catch (_) {
    return {
      data: [],
      error: { message: 'Could not load booking history right now.' },
    };
  }
};

const fetchBookingOtpRecords = async () => {
  try {
    return await supabase.db.select('booking_verification_otps', {
      columns: ARRIVAL_OTP_COLUMNS,
      order: [{ column: 'created_at', ascending: false }],
    });
  } catch (_) {
    return {
      data: [],
      error: { message: 'Could not load arrival verification right now.' },
    };
  }
};

const StatusChip = ({ meta, styles }) => (
  <View style={[styles.statusChip, { borderColor: meta.dot }]}>
    <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
    <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
  </View>
);

const HistoryCard = ({
  record,
  bookingDetails,
  isLast,
  nowMs,
  styles,
  onCancelPress,
  isCancelling,
  onApproveEstimate,
  onReviseEstimate,
  onPayFinalBill,
  isEstimateSubmitting,
  isFinalPaymentSubmitting,
}) => {
  const statusMeta = getStatusMeta(record.status);
  const liveBookingStatus = String(bookingDetails?.status || record.status || '').trim();
  const livePaymentStatus = String(bookingDetails?.paymentStatus || '').trim();
  const canCancel = record.status === 'requested' || record.status === 'confirmed';
  const isArchived =
    record.status === 'completed' || record.status === 'cancelled';
  const activeArrivalOtp = record.arrivalOtp?.status === 'generated' ? record.arrivalOtp : null;
  const verifiedArrivalOtp = record.arrivalOtp?.status === 'verified' ? record.arrivalOtp : null;
  const activeCompletionOtp = record.completionOtp?.status === 'generated' ? record.completionOtp : null;
  const shouldShowEstimateActions = liveBookingStatus === 'estimate_sent' && bookingDetails;
  const shouldShowEstimateRequested = liveBookingStatus === 'estimate_revision_requested' && bookingDetails;
  const shouldShowEstimateApproved = ['estimate_approved', 'in_progress', 'payment_pending', 'payment_requested'].includes(liveBookingStatus) && bookingDetails;
  const finalBillTotal = Number(
    bookingDetails?.finalInvoiceTotal
    || (
      Number(bookingDetails?.visitCharge || 0)
      + Number(bookingDetails?.platformFee || 0)
      + Number(bookingDetails?.protectionFee || 0)
      + Number(bookingDetails?.urgencySurcharge || 0)
      + Number(bookingDetails?.finalLabourCharge || 0)
      + Number(bookingDetails?.finalPartsCharge || 0)
    ),
  );
  const shouldShowFinalPayment = !!bookingDetails
    && shouldShowEstimateApproved
    && livePaymentStatus !== 'paid';
  const showUrgencySurcharge = Number(bookingDetails?.urgencySurcharge || 0) > 0;
  const otpCountdown = getOtpCountdown(activeArrivalOtp?.expiresAt, nowMs);
  const completionOtpCountdown = getOtpCountdown(activeCompletionOtp?.expiresAt, nowMs);

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            { backgroundColor: statusMeta.dot },
            isArchived && styles.archivedTimelineDot,
          ]}
        />
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>

      <View style={[styles.historyCard, isArchived && styles.archivedHistoryCard]}>
        <View style={isArchived ? styles.archivedContent : null}>
        <Text style={styles.historyDate}>{formatHistoryDate(record)}</Text>

        <View style={styles.historyTitleRow}>
          <View
            style={[
              styles.historyIconWrap,
              isArchived && styles.archivedHistoryIconWrap,
            ]}
          >
            <Icon
              name={getServiceIcon(record.serviceName)}
              size={18}
              color={statusMeta.dot}
            />
          </View>
          <View style={styles.historyTitleText}>
            <Text style={styles.historyTitle} numberOfLines={1}>
              {record.serviceName}
            </Text>
            <Text style={styles.historyProblem} numberOfLines={1}>
              {record.problemName}
            </Text>
          </View>
          <Text style={styles.historyAmount}>{record.estimatedTotalLabel}</Text>
        </View>

        <View style={styles.historyMetaRow}>
          <Text style={styles.historyMeta} numberOfLines={1}>
            {record.bookingNumber || 'Booking pending'}
          </Text>
          <Text style={styles.historyMeta} numberOfLines={1}>
            {getSeverityMeta(record.severity).label}
          </Text>
        </View>

        <View style={styles.historyChipRow}>
          <StatusChip meta={statusMeta} styles={styles} />
          {record.scheduledSlotLabel ? (
            <View style={styles.slotChip}>
              <Icon
                name="clock-time-four-outline"
                size={12}
                color="#64748B"
              />
              <Text style={styles.slotChipText}>
                {record.scheduledSlotLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {activeArrivalOtp ? (
          <View style={styles.otpPanel}>
            <View style={styles.otpPanelHeader}>
              <Text style={styles.otpPanelTitle}>Arrival OTP</Text>
              <Text style={styles.otpPanelMeta}>{formatOtpExpiry(activeArrivalOtp.expiresAt)}</Text>
            </View>
            {otpCountdown ? (
              <Text style={[
                styles.otpPanelCountdown,
                otpCountdown === 'Expired' && styles.otpPanelCountdownExpired,
              ]}>
                {otpCountdown}
              </Text>
            ) : null}
            <Text style={styles.otpPanelCode}>{activeArrivalOtp.otpCode}</Text>
            <Text style={styles.otpPanelHint}>Share this OTP with the technician after arrival.</Text>
          </View>
        ) : null}

        {!activeArrivalOtp && verifiedArrivalOtp ? (
          <View style={styles.otpVerifiedRow}>
            <Icon name="shield-check" size={14} color="#047857" />
            <Text style={styles.otpVerifiedText}>Arrival OTP verified</Text>
          </View>
        ) : null}

        {activeCompletionOtp ? (
          <View style={styles.otpPanel}>
            <View style={styles.otpPanelHeader}>
              <Text style={styles.otpPanelTitle}>Finish OTP</Text>
              <Text style={styles.otpPanelMeta}>{formatOtpExpiry(activeCompletionOtp.expiresAt)}</Text>
            </View>
            {completionOtpCountdown ? (
              <Text style={[
                styles.otpPanelCountdown,
                completionOtpCountdown === 'Expired' && styles.otpPanelCountdownExpired,
              ]}>
                {completionOtpCountdown}
              </Text>
            ) : null}
            <Text style={styles.otpPanelCode}>{activeCompletionOtp.otpCode}</Text>
            <Text style={styles.otpPanelHint}>Share this OTP with the technician to complete the job.</Text>
          </View>
        ) : null}

        {shouldShowEstimateActions ? (
          <View style={styles.estimatePanel}>
            <View style={styles.estimatePanelHeader}>
              <Text style={styles.estimatePanelTitle}>Repair Estimate</Text>
              <Text style={styles.estimatePanelVersion}>
                v{Number(bookingDetails.estimateVersionNo || 0) || 1}
              </Text>
            </View>
            <View style={styles.estimateLine}>
              <Text style={styles.estimateLineLabel}>Labour</Text>
              <Text style={styles.estimateLineValue}>{formatCurrency(bookingDetails.proposedLabourCharge)}</Text>
            </View>
            <View style={styles.estimateLine}>
              <Text style={styles.estimateLineLabel}>Parts</Text>
              <Text style={styles.estimateLineValue}>{formatCurrency(bookingDetails.proposedPartsCharge)}</Text>
            </View>
            <View style={styles.estimateLine}>
              <Text style={styles.estimateLineLabel}>Total after repair</Text>
              <Text style={styles.estimateLineValueStrong}>{formatCurrency(bookingDetails.proposedInvoiceTotal)}</Text>
            </View>
            {bookingDetails.estimateNote ? (
              <Text style={styles.estimateNote}>{bookingDetails.estimateNote}</Text>
            ) : null}

            <View style={styles.estimateActionRow}>
              <TouchableOpacity
                activeOpacity={0.86}
                style={[
                  styles.estimateSecondaryButton,
                  isEstimateSubmitting && styles.estimateButtonDisabled,
                ]}
                onPress={() => onReviseEstimate(record.bookingId)}
                disabled={isEstimateSubmitting}
              >
                <Text style={styles.estimateSecondaryButtonText}>
                  {isEstimateSubmitting ? 'Updating...' : 'Estimate Again'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.86}
                style={[
                  styles.estimatePrimaryButton,
                  isEstimateSubmitting && styles.estimateButtonDisabled,
                ]}
                onPress={() => onApproveEstimate(record.bookingId)}
                disabled={isEstimateSubmitting}
              >
                <Text style={styles.estimatePrimaryButtonText}>
                  {isEstimateSubmitting ? 'Updating...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {shouldShowEstimateRequested ? (
          <View style={styles.estimateWaitingPanel}>
            <Icon name="refresh" size={15} color="#C2410C" />
            <Text style={styles.estimateWaitingText}>
              {bookingDetails.estimateResponseNote || 'You asked the technician to share the estimate again.'}
            </Text>
          </View>
        ) : null}

        {shouldShowEstimateApproved && !shouldShowFinalPayment ? (
          <View style={styles.estimateApprovedPanel}>
            <Icon name="check-decagram" size={15} color="#047857" />
            <Text style={styles.estimateApprovedText}>
              Approved labour {formatCurrency(bookingDetails.finalLabourCharge)} and parts {formatCurrency(bookingDetails.finalPartsCharge)} are now saved.
            </Text>
          </View>
        ) : null}

        {shouldShowFinalPayment ? (
          <View style={styles.finalBillPanel}>
            <View style={styles.finalBillHeader}>
              <Text style={styles.finalBillTitle}>Final Bill</Text>
              <Text style={styles.finalBillAmount}>{formatCurrency(finalBillTotal)}</Text>
            </View>

            <View style={styles.finalBillLine}>
              <Text style={styles.finalBillLabel}>Visit charge</Text>
              <Text style={styles.finalBillValue}>{formatCurrency(bookingDetails.visitCharge)}</Text>
            </View>
            <View style={styles.finalBillLine}>
              <Text style={styles.finalBillLabel}>Platform fee</Text>
              <Text style={styles.finalBillValue}>{formatCurrency(bookingDetails.platformFee)}</Text>
            </View>
            {Number(bookingDetails.protectionFee || 0) > 0 ? (
              <View style={styles.finalBillLine}>
                <Text style={styles.finalBillLabel}>Protection</Text>
                <Text style={styles.finalBillValue}>{formatCurrency(bookingDetails.protectionFee)}</Text>
              </View>
            ) : null}
            {showUrgencySurcharge ? (
              <View style={styles.finalBillLine}>
                <Text style={styles.finalBillLabel}>Urgency surcharge</Text>
                <Text style={styles.finalBillValue}>{formatCurrency(bookingDetails.urgencySurcharge)}</Text>
              </View>
            ) : null}
            <View style={styles.finalBillLine}>
              <Text style={styles.finalBillLabel}>Labour</Text>
              <Text style={styles.finalBillValue}>{formatCurrency(bookingDetails.finalLabourCharge)}</Text>
            </View>
            <View style={styles.finalBillLine}>
              <Text style={styles.finalBillLabel}>Parts</Text>
              <Text style={styles.finalBillValue}>{formatCurrency(bookingDetails.finalPartsCharge)}</Text>
            </View>
            <View style={styles.finalBillLine}>
              <Text style={styles.finalBillLabel}>Total due</Text>
              <Text style={styles.finalBillValue}>{formatCurrency(finalBillTotal)}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.86}
              style={[
                styles.finalBillPayButton,
                isFinalPaymentSubmitting && styles.estimateButtonDisabled,
              ]}
              onPress={() => onPayFinalBill(record.bookingId)}
              disabled={isFinalPaymentSubmitting}
            >
              <Icon name="credit-card-outline" size={16} color="#FFFFFF" />
              <Text style={styles.finalBillPayButtonText}>
                {isFinalPaymentSubmitting ? 'Opening payment...' : 'Pay with Razorpay'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        </View>

        {canCancel ? (
          <View style={styles.cancelInlineRow}>
            <View style={styles.cancelInlineHint}>
              <Icon
                name="calendar-refresh-outline"
                size={14}
                color="#94A3B8"
              />
              <Text style={styles.cancelInlineHintText}>Need to cancel?</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.72}
              style={styles.cancelInlineAction}
              onPress={() => onCancelPress(record)}
              disabled={isCancelling}
            >
              <Text style={styles.cancelInlineActionText}>
                {isCancelling ? 'Cancelling...' : 'Cancel booking'}
              </Text>
              <Icon name="chevron-right" size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const EmptyLedger = ({ navigation, styles, colors }) => (
  <View style={styles.emptyCard}>
    <View style={styles.emptyIconWrap}>
      <Icon name="clipboard-clock-outline" size={28} color={colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>No service history yet</Text>
    <Text style={styles.emptySubtitle}>
      Your booked services, live status, and completed jobs will appear here.
    </Text>
    <TouchableOpacity
      activeOpacity={0.86}
      style={styles.emptyBtn}
      onPress={() => navigation.navigate('Booking')}
    >
      <Text style={styles.emptyBtnText}>Book Your First Service</Text>
    </TouchableOpacity>
  </View>
);

const ServiceLedger = ({ navigation }) => {
  const { isDark } = useAppTheme();
  const colors = useMemo(() => getLedgerColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [bookings, setBookings] = useState(() => getBookings());
  const [historyRecords, setHistoryRecords] = useState([]);
  const [otpByBooking, setOtpByBooking] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelingBookingId, setCancelingBookingId] = useState('');
  const [estimateBookingId, setEstimateBookingId] = useState('');
  const [payingBookingId, setPayingBookingId] = useState('');
  const [pendingCancelRecord, setPendingCancelRecord] = useState(null);
  const [syncError, setSyncError] = useState('');
  const [activeTab, setActiveTab] = useState('Active');
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => subscribeToBookings(setBookings), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const refreshLedger = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setIsRefreshing(true);
    }

    try {
      const [bookingsResult, historyResult, otpResult] = await Promise.all([
        syncBookingsFromRemote(),
        fetchBookingHistoryRecords(),
        fetchBookingOtpRecords(),
      ]);

      if (historyResult?.error) {
        setSyncError(
          historyResult.error.message || 'Could not refresh your booking history.',
        );
      } else {
        setHistoryRecords(
          normalizeHistoryRecords(
            Array.isArray(historyResult?.data) ? historyResult.data : [],
          ),
        );
      }

      if (bookingsResult?.error) {
        setSyncError(
          bookingsResult.error.message || 'Could not refresh your bookings.',
        );
      } else if (!historyResult?.error) {
        setSyncError('');
      }

      if (otpResult?.error) {
        setOtpByBooking({});
      } else {
        setOtpByBooking(
          buildBookingOtpMap(Array.isArray(otpResult?.data) ? otpResult.data : []),
        );
      }
    } finally {
      if (showLoader) {
        setIsRefreshing(false);
      }
    }
  }, []);

  const sortedBookings = useMemo(() => sortByRecent(bookings), [bookings]);
  const activeBookings = useMemo(
    () => sortedBookings.filter((booking) => ACTIVE_STATUSES.has(booking.status)),
    [sortedBookings],
  );
  const hasLiveOtpFlow = useMemo(
    () => activeBookings.some((booking) => (
      booking.status === 'arrived' || booking.status === 'work_completed'
    )),
    [activeBookings],
  );
  const bookingDetailsById = useMemo(
    () => sortedBookings.reduce((accumulator, booking) => {
      accumulator[booking.id] = booking;
      return accumulator;
    }, {}),
    [sortedBookings],
  );
  const latestHistoryRecords = useMemo(
    () => getLatestHistoryRecords(historyRecords).map((record) => ({
      ...record,
      arrivalOtp: otpByBooking[record.bookingId]?.arrival_verification || null,
      completionOtp: otpByBooking[record.bookingId]?.completion_verification || null,
    })),
    [otpByBooking, historyRecords],
  );
  const activeHistoryRecords = useMemo(
    () => latestHistoryRecords.filter((record) => ACTIVE_STATUSES.has(record.status)),
    [latestHistoryRecords],
  );
  const archivedHistoryRecords = useMemo(
    () => latestHistoryRecords.filter((record) => (
      record.status === 'completed' || record.status === 'cancelled'
    )),
    [latestHistoryRecords],
  );
  const visibleHistoryRecords = activeTab === 'Active'
    ? activeHistoryRecords
    : archivedHistoryRecords;

  useFocusEffect(
    useCallback(() => {
      refreshLedger(false);

      const timer = setInterval(() => {
        refreshLedger(false);
      }, hasLiveOtpFlow ? 2000 : 8000);

      return () => clearInterval(timer);
    }, [hasLiveOtpFlow, refreshLedger]),
  );

  const totalSpent = sortedBookings.reduce((sum, booking) => (
    booking.status === 'cancelled'
      ? sum
      : sum + Number(booking.estimatedTotal || 0)
  ), 0);

  const stats = [
    {
      label: 'Total Spent',
      value: formatHeroStat(totalSpent),
      accent: '#F97316',
    },
    {
      label: 'Active Jobs',
      value: String(activeBookings.length),
      accent: '#10B981',
    },
    {
      label: 'Jobs Done',
      value: String(
        archivedHistoryRecords.filter((record) => record.status === 'completed')
          .length,
      ),
      accent: '#8B5CF6',
    },
  ];

  const closeCancelModal = useCallback(() => {
    if (cancelingBookingId) {
      return;
    }

    setPendingCancelRecord(null);
  }, [cancelingBookingId]);

  const showFeedbackModal = useCallback((title, message, tone = 'brand', extras = {}) => {
    setFeedbackModal({ title, message, tone, ...extras });
  }, []);

  const closeFeedbackModal = useCallback(() => {
    setFeedbackModal(null);
  }, []);

  const handleCancelBooking = useCallback((record) => {
    setPendingCancelRecord(record);
  }, []);

  const confirmCancelBooking = useCallback(async () => {
    if (!pendingCancelRecord?.bookingId) {
      return;
    }

    setCancelingBookingId(pendingCancelRecord.bookingId);

    try {
      const result = await cancelBooking(pendingCancelRecord.bookingId);

      if (result?.error) {
        showFeedbackModal(
          'Unable to cancel',
          result.error.message || 'Please try again.',
          'warning',
        );
        return;
      }

      setPendingCancelRecord(null);
      await refreshLedger(false);
    } finally {
      setCancelingBookingId('');
    }
  }, [pendingCancelRecord, refreshLedger, showFeedbackModal]);

  const handleApproveEstimate = useCallback(async (bookingId) => {
    setEstimateBookingId(bookingId);

    try {
      const result = await respondToBookingEstimate({
        bookingId,
        action: 'approve',
      });

      if (result?.error) {
        showFeedbackModal('Could not approve estimate', result.error.message || 'Please try again.', 'warning');
        return;
      }

      showFeedbackModal('Estimate approved', 'The final bill is now ready for payment.', 'success');

      await refreshLedger(false);
    } finally {
      setEstimateBookingId('');
    }
  }, [refreshLedger, showFeedbackModal]);

  const handleReviseEstimate = useCallback(async (bookingId) => {
    setEstimateBookingId(bookingId);

    try {
      const result = await respondToBookingEstimate({
        bookingId,
        action: 'revise',
      });

      if (result?.error) {
        showFeedbackModal('Could not request revision', result.error.message || 'Please try again.', 'warning');
        return;
      }

      showFeedbackModal('Estimate updated', 'The technician has been asked to send the estimate again.', 'brand');

      await refreshLedger(false);
    } finally {
      setEstimateBookingId('');
    }
  }, [refreshLedger, showFeedbackModal]);

  const handlePayFinalBill = useCallback(async (bookingId) => {
    setPayingBookingId(bookingId);

    try {
      const paymentInitResult = await initializeFinalInvoicePayment({ bookingId });

      if (paymentInitResult?.error || !paymentInitResult?.data?.paymentOrder) {
        showFeedbackModal(
          'Payment unavailable',
          paymentInitResult?.error?.message || 'Final bill payment could not be started right now.',
          'warning',
        );
        return;
      }

      const storedProfile = getProfile();
      const profileResult = await fetchOwnProfileRecord();
      const customer = {
        fullName: profileResult.data?.full_name || storedProfile.name || '',
        email: profileResult.data?.email || storedProfile.email || '',
        phone: profileResult.data?.phone || storedProfile.phone || '',
      };

      let checkoutResponse;

      try {
        checkoutResponse = await openRazorpayCheckout({
          order: paymentInitResult.data.paymentOrder,
          customer,
          description: `TrustFix final bill payment`,
        });
      } catch (checkoutError) {
        showFeedbackModal(
          'Payment pending',
          String(
            checkoutError?.description ||
            checkoutError?.error?.description ||
            'The final bill payment was not completed.',
          ).trim(),
          'warning',
        );
        return;
      }

      const verificationResult = await verifyRazorpayPayment({
        paymentOrderId: paymentInitResult.data.paymentOrder.id,
        razorpayOrderId: checkoutResponse?.razorpay_order_id || paymentInitResult.data.paymentOrder.provider_order_id,
        razorpayPaymentId: checkoutResponse?.razorpay_payment_id,
        razorpaySignature: checkoutResponse?.razorpay_signature,
      });

      if (verificationResult?.error) {
        showFeedbackModal(
          'Verification pending',
          verificationResult.error.message || 'The payment was received but could not be verified yet.',
          'warning',
        );
        return;
      }

      await refreshLedger(false);
      showFeedbackModal(
        'Payment complete',
        'The final bill was paid successfully. Ask the technician to open the finish OTP step, then share the code shown in your Home Ledger.',
        'success',
      );
    } finally {
      setPayingBookingId('');
    }
  }, [refreshLedger, showFeedbackModal]);

  const feedbackToneMeta = {
    brand: {
      icon: 'information-outline',
      iconColor: colors.primary,
      iconBg: colors.primarySoft,
    },
    success: {
      icon: 'check-decagram',
      iconColor: '#047857',
      iconBg: 'rgba(16,185,129,0.12)',
    },
    warning: {
      icon: 'alert-outline',
      iconColor: '#C2410C',
      iconBg: 'rgba(249,115,22,0.12)',
    },
  }[feedbackModal?.tone || 'brand'];

  return (
    <ScreenWrapper
      topColor={colors.headerStart}
      bottomColor={colors.background}
      statusBarStyle="light-content"
    >
      <LinearGradient
        colors={[colors.headerStart, colors.headerMid, colors.headerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerBlobLarge} />
        <View style={styles.headerBlobSmall} />

        <Text style={styles.headerTitle}>Home Ledger</Text>
        <Text style={styles.headerSubtitle}>
          Track active bookings and your full repair history with TrustFix.
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => refreshLedger(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        )}
      >
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.accent }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {sortedBookings.length === 0 && !visibleHistoryRecords.length ? (
          <EmptyLedger navigation={navigation} styles={styles} colors={colors} />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Service Records</Text>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Booking')}
              >
                <Text style={styles.sectionLink}>Book new +</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.subSectionMetaWrap}>
              <Text style={styles.sectionMeta}>
                {visibleHistoryRecords.length} record
                {visibleHistoryRecords.length === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.tabsShell}>
              <View style={styles.tabsRow}>
                {LEDGER_TABS.map((tab) => {
                  const isActive = tab === activeTab;
                  const tabCount = tab === 'Active'
                    ? activeHistoryRecords.length
                    : archivedHistoryRecords.length;

                  return (
                    <TouchableOpacity
                      key={tab}
                      activeOpacity={0.88}
                      style={[styles.tabButton, isActive && styles.tabButtonActive]}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                        {tab}
                      </Text>
                      <View style={[styles.tabCountPill, isActive && styles.tabCountPillActive]}>
                        <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                          {tabCount}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {syncError ? (
              <View style={styles.syncErrorCard}>
                <Icon name="wifi-alert" size={16} color="#F97316" />
                <Text style={styles.syncErrorText}>{syncError}</Text>
              </View>
            ) : null}

            {visibleHistoryRecords.length ? (
              <View style={styles.timelineWrap}>
                <View style={styles.recordGroup}>
                  <Text style={styles.groupHeading}>
                    {activeTab === 'Active' ? 'Requested & Active' : 'Completed & Cancelled'}
                  </Text>
                  {visibleHistoryRecords.map((record, index) => (
                    <HistoryCard
                      key={record.id}
                      record={record}
                      bookingDetails={bookingDetailsById[record.bookingId] || null}
                      isLast={index === visibleHistoryRecords.length - 1}
                      nowMs={nowMs}
                      styles={styles}
                      onCancelPress={handleCancelBooking}
                      isCancelling={cancelingBookingId === record.bookingId}
                      onApproveEstimate={handleApproveEstimate}
                      onReviseEstimate={handleReviseEstimate}
                      onPayFinalBill={handlePayFinalBill}
                      isEstimateSubmitting={estimateBookingId === record.bookingId}
                      isFinalPaymentSubmitting={payingBookingId === record.bookingId}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyTitle}>
                  {activeTab === 'Active' ? 'No active services yet' : 'No completed services yet'}
                </Text>
                <Text style={styles.historyEmptySubtitle}>
                  {activeTab === 'Active'
                    ? 'As soon as your booking starts moving, the live service record will show here.'
                    : 'Completed or cancelled services will move here automatically.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={!!feedbackModal}
        animationType="fade"
        onRequestClose={closeFeedbackModal}
      >
        <View style={styles.confirmOverlay}>
          <Pressable style={styles.confirmBackdrop} onPress={closeFeedbackModal} />
          <View style={styles.feedbackDialog}>
            <View style={[styles.feedbackIconWrap, { backgroundColor: feedbackToneMeta?.iconBg }]}>
              <Icon
                name={feedbackToneMeta?.icon || 'information-outline'}
                size={24}
                color={feedbackToneMeta?.iconColor || colors.primary}
              />
            </View>
            <Text style={styles.feedbackTitle}>{feedbackModal?.title || 'Notice'}</Text>
            <Text style={styles.feedbackText}>{feedbackModal?.message || ''}</Text>
            {feedbackModal?.otpCode ? (
              <View style={styles.feedbackOtpCard}>
                <Text style={styles.feedbackOtpLabel}>Finish OTP</Text>
                <Text style={styles.feedbackOtpCode}>{feedbackModal.otpCode}</Text>
                <Text style={styles.feedbackOtpMeta}>
                  {formatOtpExpiry(feedbackModal?.otpExpiresAt, 'Share this OTP with the technician.')}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.feedbackButton}
              onPress={closeFeedbackModal}
            >
              <Text style={styles.feedbackButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={!!pendingCancelRecord}
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <View style={styles.confirmOverlay}>
          <Pressable style={styles.confirmBackdrop} onPress={closeCancelModal} />
          <View style={styles.confirmDialog}>
            <LinearGradient
              colors={['#FFF7F2', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.confirmAccent}
            >
              <View style={styles.confirmHeaderRow}>
                <View style={styles.confirmIconWrap}>
                  <Icon name="close-circle-outline" size={24} color="#DC2626" />
                </View>
                <View style={styles.confirmHeaderTextWrap}>
                  <Text style={styles.confirmTitle}>Cancel Booking?</Text>
                  <Text style={styles.confirmServiceName} numberOfLines={1}>
                    {pendingCancelRecord?.serviceName || 'Service request'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.confirmKeepBtn}
                onPress={closeCancelModal}
                disabled={!!cancelingBookingId}
              >
                <Text style={styles.confirmKeepText}>Keep Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.confirmCancelBtn}
                onPress={confirmCancelBooking}
                disabled={!!cancelingBookingId}
              >
                <Text style={styles.confirmCancelText}>
                  {cancelingBookingId ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default ServiceLedger;

const createStyles = (colors) => StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 56,
    overflow: 'hidden',
    position: 'relative',
  },
  headerBlobLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -92,
    right: -78,
    backgroundColor: 'rgba(255,170,130,0.14)',
  },
  headerBlobSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    top: 20,
    left: -70,
    backgroundColor: 'rgba(255,150,110,0.10)',
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.86)',
    maxWidth: '88%',
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  bodyContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: colors.statShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: colors.isDark ? 0.2 : 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  syncErrorCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncErrorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  subSectionMetaWrap: {
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  tabsShell: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    shadowColor: colors.statShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: colors.isDark ? 0.18 : 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  tabCountPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  tabCountPillActive: {
    backgroundColor: colors.primary,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
  },
  tabCountTextActive: {
    color: colors.white,
  },
  timelineWrap: {
    paddingHorizontal: 16,
  },
  recordGroup: {
    marginBottom: 10,
  },
  groupHeading: {
    marginLeft: 32,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 18,
  },
  archivedTimelineDot: {
    opacity: 0.45,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.line,
    marginTop: 4,
  },
  historyCard: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: colors.statShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: colors.isDark ? 0.18 : 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  archivedHistoryCard: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.line,
  },
  archivedContent: {
    opacity: 0.6,
  },
  historyDate: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginBottom: 10,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginRight: 10,
  },
  archivedHistoryIconWrap: {
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  historyTitleText: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  historyProblem: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  historyAmount: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  historyMeta: {
    flex: 1,
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  historyChipRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  otpPanel: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  otpPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpPanelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  otpPanelMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  otpPanelCountdown: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  otpPanelCountdownExpired: {
    color: '#DC2626',
  },
  otpPanelCode: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    color: colors.primary,
  },
  otpPanelHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  otpVerifiedRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpVerifiedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  estimatePanel: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  estimatePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  estimatePanelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  estimatePanelVersion: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  estimateLine: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  estimateLineLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  estimateLineValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  estimateLineValueStrong: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800',
  },
  estimateNote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  estimateActionRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  estimateSecondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  estimateSecondaryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  estimatePrimaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  estimatePrimaryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  estimateButtonDisabled: {
    opacity: 0.6,
  },
  estimateWaitingPanel: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(249,115,22,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.18)',
  },
  estimateWaitingText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#9A3412',
    fontWeight: '700',
  },
  estimateApprovedPanel: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
  },
  estimateApprovedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#047857',
    fontWeight: '700',
  },
  finalBillPanel: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  finalBillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  finalBillTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  finalBillAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  finalBillLine: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  finalBillLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  finalBillValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  finalBillPayButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  finalBillPayButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  cancelInlineRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelInlineHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelInlineHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  cancelInlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cancelInlineActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  historyEmpty: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  historyEmptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  historyEmptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 26,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  confirmBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  feedbackDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: colors.statShadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: colors.isDark ? 0.28 : 0.12,
    shadowRadius: 24,
    elevation: 14,
  },
  feedbackIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  feedbackTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  feedbackText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackOtpCard: {
    width: '100%',
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  feedbackOtpLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  feedbackOtpCode: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 8,
    color: colors.primary,
  },
  feedbackOtpMeta: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackButton: {
    marginTop: 18,
    minWidth: 132,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.statShadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: colors.isDark ? 0.28 : 0.12,
    shadowRadius: 24,
    elevation: 14,
  },
  confirmAccent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.10)',
    marginRight: 14,
  },
  confirmHeaderTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  confirmServiceName: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  confirmActions: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10,
  },
  confirmKeepBtn: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmKeepText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  confirmCancelBtn: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

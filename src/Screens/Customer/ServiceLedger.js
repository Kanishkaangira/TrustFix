import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import {
  cancelBooking,
  getBookings,
  subscribeToBookings,
  syncBookingsFromRemote,
} from '../../state/bookingStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const ACTIVE_STATUSES = new Set([
  'requested',
  'confirmed',
  'assigned',
  'en_route',
  'in_progress',
]);

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
  in_progress: {
    label: 'In progress',
    dot: '#14B8A6',
    bg: 'rgba(20,184,166,0.12)',
    text: '#0F766E',
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

const StatusChip = ({ meta, styles }) => (
  <View style={[styles.statusChip, { borderColor: meta.dot }]}>
    <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
    <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
  </View>
);

const HistoryCard = ({ record, isLast, styles, onCancelPress, isCancelling }) => {
  const statusMeta = getStatusMeta(record.status);
  const canCancel = record.status === 'requested';
  const isArchived =
    record.status === 'completed' || record.status === 'cancelled';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelingBookingId, setCancelingBookingId] = useState('');
  const [pendingCancelRecord, setPendingCancelRecord] = useState(null);
  const [syncError, setSyncError] = useState('');

  useEffect(() => subscribeToBookings(setBookings), []);

  const refreshLedger = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setIsRefreshing(true);
    }

    try {
      const [bookingsResult, historyResult] = await Promise.all([
        syncBookingsFromRemote(),
        fetchBookingHistoryRecords(),
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
    } finally {
      if (showLoader) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshLedger(false);
    }, [refreshLedger]),
  );

  const sortedBookings = useMemo(() => sortByRecent(bookings), [bookings]);
  const activeBookings = useMemo(
    () => sortedBookings.filter((booking) => ACTIVE_STATUSES.has(booking.status)),
    [sortedBookings],
  );
  const latestHistoryRecords = useMemo(
    () => getLatestHistoryRecords(historyRecords),
    [historyRecords],
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
  const visibleHistoryRecords = latestHistoryRecords;

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
        visibleHistoryRecords.filter((record) => record.status === 'completed')
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
        Alert.alert(
          'Unable to cancel',
          result.error.message || 'Please try again.',
        );
        return;
      }

      setPendingCancelRecord(null);
      await refreshLedger(false);
    } finally {
      setCancelingBookingId('');
    }
  }, [pendingCancelRecord, refreshLedger]);

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

            {syncError ? (
              <View style={styles.syncErrorCard}>
                <Icon name="wifi-alert" size={16} color="#F97316" />
                <Text style={styles.syncErrorText}>{syncError}</Text>
              </View>
            ) : null}

            {visibleHistoryRecords.length ? (
              <View style={styles.timelineWrap}>
                {activeHistoryRecords.length ? (
                  <View style={styles.recordGroup}>
                    <Text style={styles.groupHeading}>Requested & Active</Text>
                    {activeHistoryRecords.map((record, index) => (
                      <HistoryCard
                        key={record.id}
                        record={record}
                        isLast={index === activeHistoryRecords.length - 1}
                        styles={styles}
                        onCancelPress={handleCancelBooking}
                        isCancelling={cancelingBookingId === record.bookingId}
                      />
                    ))}
                  </View>
                ) : null}

                {archivedHistoryRecords.length ? (
                  <View style={styles.recordGroup}>
                    <Text style={styles.groupHeading}>Completed & Cancelled</Text>
                    {archivedHistoryRecords.map((record, index) => (
                      <HistoryCard
                        key={record.id}
                        record={record}
                        isLast={index === archivedHistoryRecords.length - 1}
                        styles={styles}
                        onCancelPress={handleCancelBooking}
                        isCancelling={cancelingBookingId === record.bookingId}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyTitle}>No history records yet</Text>
                <Text style={styles.historyEmptySubtitle}>
                  As soon as your booking status is created or updated, the service
                  record will show here.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

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

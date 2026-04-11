import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../Components/ScreenWrapper';
import {
  getBookings,
  subscribeToBookings,
} from '../state/bookingStore';
import { useAppTheme } from '../theme/ThemeProvider';

const ACTIVE_STATUSES = new Set([
  'requested',
  'confirmed',
  'assigned',
  'en_route',
  'in_progress',
]);

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

const getLedgerColors = (isDark) => ({
  isDark,
  headerStart: '#FF6B35',
  headerMid: '#FF8A4C',
  headerEnd: isDark ? '#1A2430' : '#FFF1E8',
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

const formatTimelineDate = (booking) => {
  const date = safeDate(booking.scheduledDate) || safeDate(booking.createdAt);

  if (!date) {
    return 'Date pending';
  }

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
};

const formatCurrentDate = (booking) => {
  const date = safeDate(booking.scheduledDate) || safeDate(booking.createdAt);

  if (!date) {
    return 'We are assigning the best available technician.';
  }

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const getStatusMeta = (status) => {
  const key = String(status || '').trim();
  return STATUS_META[key] || STATUS_META.default;
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

const StatusChip = ({ meta, styles }) => (
  <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
    <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
    <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
  </View>
);

const CurrentBookingCard = ({ booking, styles, colors }) => {
  const statusMeta = getStatusMeta(booking.status);

  return (
    <View style={styles.currentCard}>
      <View style={styles.currentCardTop}>
        <View style={styles.currentIconWrap}>
          <Icon
            name={getServiceIcon(booking.serviceName)}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.currentContent}>
          <View style={styles.currentTitleRow}>
            <Text style={styles.currentTitle} numberOfLines={1}>
              {booking.serviceName}
            </Text>
            <StatusChip meta={statusMeta} styles={styles} />
          </View>
          <Text style={styles.currentProblem} numberOfLines={2}>
            {booking.problemName}
          </Text>
          <Text style={styles.currentMeta}>
            {formatCurrentDate(booking)}
            {booking.scheduledSlotLabel ? ` • ${booking.scheduledSlotLabel}` : ''}
          </Text>
          <Text style={styles.currentAddress} numberOfLines={2}>
            {booking.addressLabel
              ? `${booking.addressLabel} • ${booking.address}`
              : booking.address || 'Address will be shared soon'}
          </Text>
        </View>
      </View>

      <View style={styles.currentFooter}>
        <View>
          <Text style={styles.footerLabel}>Booking ID</Text>
          <Text style={styles.footerValue}>{booking.bookingNumber || 'Pending'}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View>
          <Text style={styles.footerLabel}>Estimate</Text>
          <Text style={styles.footerValue}>{booking.estimatedTotalLabel}</Text>
        </View>
      </View>
    </View>
  );
};

const HistoryCard = ({ booking, isLast, styles }) => {
  const statusMeta = getStatusMeta(booking.status);

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            { backgroundColor: statusMeta.dot },
          ]}
        />
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.historyDate}>{formatTimelineDate(booking)}</Text>
        <View style={styles.historyTitleRow}>
          <View style={styles.historyIconWrap}>
            <Icon
              name={getServiceIcon(booking.serviceName)}
              size={18}
              color={statusMeta.dot}
            />
          </View>
          <View style={styles.historyTitleText}>
            <Text style={styles.historyTitle} numberOfLines={1}>
              {booking.serviceName}
            </Text>
            <Text style={styles.historyProblem} numberOfLines={1}>
              {booking.problemName}
            </Text>
          </View>
          <Text style={styles.historyAmount}>{booking.estimatedTotalLabel}</Text>
        </View>

        <View style={styles.historyMetaRow}>
          <Text style={styles.historyMeta} numberOfLines={1}>
            {booking.bookingNumber || 'Booking pending'}
          </Text>
          <Text style={styles.historyMeta} numberOfLines={1}>
            {booking.addressLabel || 'Service address'}
          </Text>
        </View>

        <View style={styles.historyChipRow}>
          <StatusChip meta={statusMeta} styles={styles} />
          {booking.scheduledSlotLabel ? (
            <View style={styles.slotChip}>
              <Icon name="clock-time-four-outline" size={12} color="#64748B" />
              <Text style={styles.slotChipText}>{booking.scheduledSlotLabel}</Text>
            </View>
          ) : null}
        </View>
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

  useEffect(() => subscribeToBookings(setBookings), []);

  const sortedBookings = useMemo(() => sortByRecent(bookings), [bookings]);
  const activeBookings = useMemo(
    () => sortedBookings.filter((booking) => ACTIVE_STATUSES.has(booking.status)),
    [sortedBookings],
  );
  const pastBookings = useMemo(
    () => sortedBookings.filter((booking) => !ACTIVE_STATUSES.has(booking.status)),
    [sortedBookings],
  );

  const totalSpent = sortedBookings.reduce((sum, booking) => (
    booking.status === 'cancelled'
      ? sum
      : sum + Number(booking.estimatedTotal || 0)
  ), 0);

  const stats = [
    { label: 'Total Spent', value: formatHeroStat(totalSpent), accent: '#F97316' },
    { label: 'Active Jobs', value: String(activeBookings.length), accent: '#10B981' },
    {
      label: 'Jobs Done',
      value: String(sortedBookings.filter((booking) => booking.status === 'completed').length),
      accent: '#8B5CF6',
    },
  ];

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

        <Text style={styles.headerTitle}>Service Ledger</Text>
        <Text style={styles.headerSubtitle}>
          Current service, repair history and every job you booked with TrustFix.
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
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

        {sortedBookings.length === 0 ? (
          <EmptyLedger navigation={navigation} styles={styles} colors={colors} />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Service</Text>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Booking')}
              >
                <Text style={styles.sectionLink}>Book new +</Text>
              </TouchableOpacity>
            </View>

            {activeBookings.length ? (
              <View style={styles.currentSection}>
                {activeBookings.map((booking) => (
                  <CurrentBookingCard
                    key={booking.id}
                    booking={booking}
                    styles={styles}
                    colors={colors}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noActiveCard}>
                <View style={styles.noActiveIconWrap}>
                  <Icon name="calendar-check-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.noActiveText}>
                  <Text style={styles.noActiveTitle}>No active service right now</Text>
                  <Text style={styles.noActiveSubtitle}>
                    Your next live booking will appear here with status updates.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Booking History</Text>
              <Text style={styles.sectionMeta}>
                {pastBookings.length} record{pastBookings.length === 1 ? '' : 's'}
              </Text>
            </View>

            {pastBookings.length ? (
              <View style={styles.timelineWrap}>
                {pastBookings.map((booking, index) => (
                  <HistoryCard
                    key={booking.id}
                    booking={booking}
                    isLast={index === pastBookings.length - 1}
                    styles={styles}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyTitle}>No past bookings yet</Text>
                <Text style={styles.historyEmptySubtitle}>
                  Completed and cancelled jobs will show here once you start booking services.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerBlobSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    top: 20,
    left: -70,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
  currentSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  currentCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: colors.statShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: colors.isDark ? 0.22 : 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  currentCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginRight: 12,
  },
  currentContent: {
    flex: 1,
    minWidth: 0,
  },
  currentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  currentTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  currentProblem: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  currentMeta: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  currentAddress: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  currentFooter: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textTertiary,
  },
  footerValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  footerDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.line,
    marginHorizontal: 18,
  },
  noActiveCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noActiveIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginRight: 12,
  },
  noActiveText: {
    flex: 1,
  },
  noActiveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  noActiveSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  timelineWrap: {
    paddingHorizontal: 16,
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
});

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { useTechScreenTheme } from '../../technician/theme';
import { TechCard } from '../../technician/components/TechUi';

const formatCurrency = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const resolveAlertPayload = (routeParams = {}) => {
  const assignment = routeParams.assignment || null;
  const booking = assignment?.bookings || routeParams.booking || routeParams.job || null;
  const bookingId = String(
    routeParams.jobId ||
    routeParams.bookingId ||
    assignment?.booking_id ||
    booking?.id ||
    '',
  ).trim();

  return {
    bookingId,
    countdown: String(routeParams.countdown || 'LIVE').trim() || 'LIVE',
    title: String(booking?.service_name_snapshot || routeParams.title || 'New nearby job').trim(),
    issue: String(
      booking?.problem_name_snapshot ||
      booking?.custom_problem ||
      routeParams.issue ||
      'Customer shared a new service request.'
    ).trim(),
    bookingType: String(booking?.severity || routeParams.bookingType || 'priority').trim(),
    area: String(booking?.address_label_snapshot || routeParams.area || 'Nearby service area').trim(),
    address: String(booking?.address_snapshot || routeParams.address || 'Address will appear after you open the job.').trim(),
    visitCharge: Number(booking?.visit_charge || routeParams.visitCharge || 0),
    timeSlot: String(
      booking?.scheduled_slot_label ||
      routeParams.timeSlot ||
      routeParams.scheduledSlot ||
      'Schedule pending'
    ).trim(),
    bookingNumber: String(booking?.booking_number || routeParams.bookingNumber || '').trim(),
  };
};

export default function TechnicianJobAlertScreen({ navigation, route }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const alert = resolveAlertPayload(route?.params);
  const hasLiveJob = Boolean(alert.bookingId);

  const openUpcomingJobs = () => {
    navigation.navigate('TechnicianTabs', {
      screen: 'TechnicianJobs',
      params: { initialTab: 'Upcoming' },
    });
  };

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.timerWrap}>
              <Text style={styles.timerText}>{alert.countdown}</Text>
            </View>

            <Text style={styles.title}>{hasLiveJob ? 'New Job Available!' : 'Open New Jobs'}</Text>
            <Text style={styles.subtitle}>
              {hasLiveJob
                ? 'Review the live booking details before accepting.'
                : 'This alert screen now opens only live technician jobs.'}
            </Text>

            <TechCard style={styles.jobCard}>
              <View style={styles.jobHead}>
                <View style={styles.jobIconWrap}>
                  <Icon name="briefcase-outline" size={28} color={TECH_COLORS.coral} />
                </View>
                <View style={styles.jobHeadCopy}>
                  <Text style={styles.jobTitle}>{alert.title}</Text>
                  <Text style={styles.jobLabel}>
                    {alert.bookingType || 'Priority'} booking
                    {alert.bookingNumber ? ` | ${alert.bookingNumber}` : ''}
                  </Text>
                </View>
              </View>

              <Text style={styles.issueText}>{alert.issue}</Text>

              <View style={styles.grid}>
                {[
                  ['Area', alert.area],
                  ['Visit charge', alert.visitCharge > 0 ? formatCurrency(alert.visitCharge) : 'Pending'],
                  ['Time Slot', alert.timeSlot || 'Schedule pending'],
                ].map(([label, value]) => (
                  <View key={label} style={styles.gridCell}>
                    <Text style={styles.gridLabel}>{label}</Text>
                    <Text
                      style={[
                        styles.gridValue,
                        label === 'Visit charge' && styles.gridValueSuccess,
                      ]}
                    >
                      {value}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.addressCard}>
                <Icon name="map-marker-outline" size={18} color={TECH_COLORS.emerald} />
                <View style={styles.addressCopy}>
                  <Text style={styles.addressLabel}>Customer address</Text>
                  <Text style={styles.addressText}>{alert.address}</Text>
                </View>
              </View>
            </TechCard>

            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.declineButton}
                onPress={() => {
                  if (hasLiveJob) {
                    navigation.goBack();
                    return;
                  }

                  openUpcomingJobs();
                }}
              >
                <Text style={styles.declineText}>{hasLiveJob ? 'Close' : 'View Queue'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.acceptButton}
                onPress={() => {
                  if (hasLiveJob) {
                    navigation.replace('TechnicianJobDetail', { jobId: alert.bookingId });
                    return;
                  }

                  openUpcomingJobs();
                }}
              >
                <Text style={styles.acceptText}>{hasLiveJob ? 'Open Job' : 'Open My Jobs'}</Text>
                <Icon name="arrow-right" size={18} color={TECH_COLORS.bg} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const createStyles = ({
  colors: TECH_COLORS,
  radius: TECH_RADIUS,
}) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TECH_COLORS.bg,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: TECH_COLORS.bgElevated,
    borderTopWidth: 1,
    borderTopColor: TECH_COLORS.border,
  },
  timerWrap: {
    alignSelf: 'center',
    minWidth: 56,
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.coral,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: TECH_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 18,
  },
  jobCard: {
    padding: 18,
  },
  jobHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.coralTint,
    borderWidth: 1,
    borderColor: TECH_COLORS.coralBorder,
    marginRight: 12,
  },
  jobHeadCopy: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  jobLabel: {
    marginTop: 2,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  issueText: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.bg,
  },
  addressCopy: {
    flex: 1,
    paddingLeft: 10,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  addressText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: TECH_COLORS.text,
  },
  gridCell: {
    width: '48%',
    borderRadius: 12,
    padding: 10,
    backgroundColor: TECH_COLORS.bg,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: TECH_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  gridValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  gridValueSuccess: {
    color: TECH_COLORS.emerald,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: TECH_RADIUS.lg,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '700',
    color: TECH_COLORS.rose,
  },
  acceptButton: {
    flex: 2,
    minHeight: 48,
    borderRadius: TECH_RADIUS.lg,
    backgroundColor: TECH_COLORS.emerald,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.bg,
  },
});

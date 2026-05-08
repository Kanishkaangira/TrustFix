import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { fetchTechnicianJobDetail } from '../../technician/jobAssignmentEngine';
import {
  useTechScreenTheme,
} from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechRow,
  TechScreenHeader,
} from '../../technician/components/TechUi';

const formatCurrency = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const formatSeverityLabel = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return 'Not set';
  }

  if (normalized === 'moderate') {
    return 'Urgency';
  }

  if (normalized === 'urgent') {
    return 'Urgent';
  }

  return 'Minor';
};

const formatSchedule = (booking = {}) => {
  const date = String(booking.scheduled_date || '').trim();
  const slot = String(booking.scheduled_slot_label || '').trim();

  if (date && slot) {
    return `${date} | ${slot}`;
  }

  return date || slot || 'Schedule pending';
};

const formatProblem = (booking = {}) => (
  String(
    booking.problem_name_snapshot ||
    booking.custom_problem ||
    'Problem details not shared yet.',
  ).trim()
);

const formatStatusTone = (assignmentStatus, bookingStatus) => {
  if (assignmentStatus === 'notified') {
    return { label: 'New Request', tone: 'sky' };
  }

  if (bookingStatus === 'completed') {
    return { label: 'Completed', tone: 'emerald' };
  }

  if ([
    'accepted',
    'en_route',
    'arrived',
    'otp_verified',
    'estimate_sent',
    'estimate_revision_requested',
    'estimate_approved',
    'in_progress',
  ].includes(bookingStatus)) {
    return { label: 'Accepted', tone: 'emerald' };
  }

  return { label: 'Assigned', tone: 'amber' };
};

const getCustomerInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CU';
};

const getDetailCtaConfig = (assignmentStatus, bookingStatus) => {
  if ([
    'otp_verified',
    'estimate_sent',
    'estimate_revision_requested',
    'estimate_approved',
    'in_progress',
    'work_completed',
  ].includes(bookingStatus)) {
    return {
      label: 'Open Job Progress',
      route: 'TechnicianJobInProgress',
    };
  }

  if (bookingStatus === 'arrived') {
    return {
      label: 'Open OTP',
      route: 'TechnicianSafetyOtp',
    };
  }

  return {
    label: bookingStatus === 'en_route' ? 'Open Route' : 'Start Job',
    route: 'TechnicianEnRoute',
  };
};

export default function TechnicianJobDetailScreen({ navigation, route }) {
  const bookingId = route?.params?.jobId;
  const {
    colors: TECH_COLORS,
    gradients: TECH_GRADIENTS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [jobRecord, setJobRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadJob = async () => {
      setIsLoading(true);
      setErrorMessage('');

      const result = await fetchTechnicianJobDetail(bookingId);

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setJobRecord(null);
        setErrorMessage(result.error.message || 'Could not load this booking right now.');
      } else {
        setJobRecord(result.data);
      }

      setIsLoading(false);
    };

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const assignment = jobRecord || {};
  const booking = assignment.bookings || {};
  const statusMeta = formatStatusTone(assignment.status, booking.status);
  const customerName = String(booking.customer_name_snapshot || 'Customer').trim();
  const customerPhone = String(booking.customer_phone_snapshot || '').trim();
  const customerInitials = getCustomerInitials(customerName);
  const problemLabel = formatProblem(booking);
  const scheduleLabel = formatSchedule(booking);
  const severityLabel = formatSeverityLabel(booking.severity);
  const serviceName = String(booking.service_name_snapshot || 'Service request').trim();
  const ctaConfig = getDetailCtaConfig(assignment.status, String(booking.status || '').trim());

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader
          title="Job Detail"
          onBackPress={() => navigation.goBack()}
          right={<TechBadge label={statusMeta.label} tone={statusMeta.tone} />}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <TechCard style={styles.stateCard}>
              <ActivityIndicator color={TECH_COLORS.coral} />
              <Text style={styles.stateTitle}>Loading booking details</Text>
              <Text style={styles.stateText}>
                Pulling the latest customer request from TrustFix.
              </Text>
            </TechCard>
          ) : null}

          {!isLoading && errorMessage ? (
            <TechCard style={styles.stateCard}>
              <Icon name="alert-circle-outline" size={28} color={TECH_COLORS.rose} />
              <Text style={styles.stateTitle}>Could not load job</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
            </TechCard>
          ) : null}

          {!isLoading && !errorMessage ? (
            <>
              <LinearGradient
                colors={TECH_GRADIENTS.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.serviceBanner}
              >
                <Text style={styles.serviceTitle}>{serviceName}</Text>
                <Text style={styles.serviceSubtitle}>{problemLabel}</Text>

                <View style={styles.cutCard}>
                  <Text style={styles.cutValue}>{severityLabel}</Text>
                  <Text style={styles.cutLabel}>PROBLEM TYPE</Text>
                </View>

                <View style={styles.bannerMeta}>
                  <Text style={styles.bannerMetaText}>{booking.booking_number || 'Booking pending'}</Text>
                  <Text style={styles.bannerMetaDot}>|</Text>
                  <Text style={styles.bannerMetaText}>{scheduleLabel}</Text>
                </View>
              </LinearGradient>

              <View style={styles.sectionWrap}>
                <Text style={styles.eyebrow}>Customer</Text>
                <TechCard style={styles.sectionCard}>
                  <View style={styles.customerTop}>
                    <View style={styles.customerAvatar}>
                      <Text style={styles.customerInitial}>{customerInitials}</Text>
                    </View>

                    <View style={styles.customerCopy}>
                      <Text style={styles.customerName}>{customerName}</Text>
                      <Text style={styles.customerHint}>
                        {customerPhone || 'Customer phone not available'}
                      </Text>
                    </View>

                    {customerPhone ? (
                      <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.callButton}
                        onPress={() => Linking.openURL(`tel:${customerPhone.replace(/\s+/g, '')}`)}
                      >
                        <Icon name="phone-outline" size={18} color={TECH_COLORS.emerald} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.addressRow}>
                    <Icon name="map-marker-outline" size={16} color={TECH_COLORS.textSecondary} />
                    <View style={styles.addressCopy}>
                      <Text style={styles.addressText}>
                        {booking.address_label_snapshot
                          ? `${booking.address_label_snapshot} - ${booking.address_snapshot || 'Address pending'}`
                          : booking.address_snapshot || 'Address pending'}
                      </Text>
                      <Text style={styles.addressHint}>
                        Customer location saved for this visit.
                      </Text>
                    </View>
                  </View>
                </TechCard>
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.eyebrow}>Booking Details</Text>
                <TechCard style={styles.infoCard}>
                  <TechRow label="Booking number" value={booking.booking_number || '-'} />
                  <View style={styles.divider} />
                  <TechRow label="Service" value={serviceName} />
                  <View style={styles.divider} />
                  <TechRow label="Problem type" value={severityLabel} />
                  <View style={styles.divider} />
                  <TechRow label="Problem" value={problemLabel} />
                  <View style={styles.divider} />
                  <TechRow label="Scheduled slot" value={scheduleLabel} />
                  <View style={styles.divider} />
                  <TechRow label="Visit charge" value={formatCurrency(booking.visit_charge)} />
                  <View style={styles.divider} />
                  <TechRow label="Platform fee" value={formatCurrency(booking.platform_fee)} />
                  <View style={styles.divider} />
                  <TechRow
                    label="Protection"
                    value={booking.protection_selected ? formatCurrency(booking.protection_fee) : 'Not selected'}
                  />
                  <View style={styles.divider} />
                  <TechRow label="Initial total" value={formatCurrency(booking.estimated_total)} tone="emerald" />
                </TechCard>
              </View>

              <TechCard style={styles.ctaCard}>
                <TechGradientButton
                  label={ctaConfig.label}
                  variant="emerald"
                  style={styles.ctaButton}
                  onPress={() => {
                    navigation.navigate(ctaConfig.route, { jobId: bookingId });
                  }}
                />
              </TechCard>
            </>
          ) : null}
        </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  stateCard: {
    marginTop: 12,
    padding: 20,
    alignItems: 'center',
  },
  stateTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  stateText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: TECH_COLORS.textSecondary,
    textAlign: 'center',
  },
  serviceBanner: {
    borderRadius: TECH_RADIUS.xl,
    padding: 18,
    overflow: 'hidden',
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  serviceSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
    paddingRight: 110,
  },
  cutCard: {
    position: 'absolute',
    right: 16,
    top: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  cutValue: {
    fontSize: 18,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  cutLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.72)',
  },
  bannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 6,
  },
  bannerMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
  },
  bannerMetaDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.58)',
  },
  sectionWrap: {
    marginTop: 16,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  sectionCard: {
    padding: 16,
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: TECH_COLORS.coralTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: TECH_COLORS.coral,
  },
  customerCopy: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  customerHint: {
    marginTop: 2,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
    backgroundColor: TECH_COLORS.emeraldTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: TECH_COLORS.border,
  },
  addressCopy: {
    flex: 1,
    paddingLeft: 8,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  addressHint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: TECH_COLORS.textMuted,
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  ctaCard: {
    marginTop: 18,
    padding: 16,
  },
  ctaButton: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
});

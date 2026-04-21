import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { fetchTechnicianJobDetail } from '../../../technician/jobAssignmentEngine';
import { markTechnicianArrived, markTechnicianEnRoute } from '../../../technician/jobProgressEngine';
import { useTechScreenTheme } from '../../../technician/theme';

const formatSchedule = (booking = {}) => {
  const date = String(booking.scheduled_date || '').trim();
  const slot = String(booking.scheduled_slot_label || '').trim();

  if (date && slot) {
    return `${date} • ${slot}`;
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

export default function EnRouteScreen({ navigation, route }) {
  const bookingId = route?.params?.jobId;
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [jobRecord, setJobRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const ensureEnRoute = async () => {
      if (!bookingId || !jobRecord?.bookings) {
        return;
      }

      if (!['accepted', 'assigned'].includes(String(jobRecord.bookings.status || '').trim())) {
        return;
      }

      setIsUpdatingStatus(true);
      const result = await markTechnicianEnRoute(bookingId);

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setErrorMessage(result.error.message || 'Could not update route status right now.');
      } else if (result.data?.status) {
        setJobRecord((prev) => (
          prev
            ? {
                ...prev,
                bookings: {
                  ...prev.bookings,
                  status: result.data.status,
                },
              }
            : prev
        ));
      }

      setIsUpdatingStatus(false);
    };

    ensureEnRoute();

    return () => {
      isMounted = false;
    };
  }, [bookingId, jobRecord]);

  useEffect(() => {
    const currentStatus = String(jobRecord?.bookings?.status || '').trim();

    if (currentStatus === 'arrived') {
      navigation.replace('TechnicianSafetyOtp', {
        jobId: bookingId,
        estimateDraft: route?.params?.estimateDraft,
      });
      return;
    }

    if ([
      'otp_verified',
      'estimate_sent',
      'estimate_revision_requested',
      'estimate_approved',
      'in_progress',
      'work_completed',
    ].includes(currentStatus)) {
      navigation.replace('TechnicianJobInProgress', {
        jobId: bookingId,
        estimateDraft: route?.params?.estimateDraft,
      });
    }
  }, [bookingId, jobRecord?.bookings?.status, navigation, route?.params?.estimateDraft]);

  const booking = jobRecord?.bookings || {};
  const customerName = String(booking.customer_name_snapshot || 'Customer').trim();
  const customerPhone = String(booking.customer_phone_snapshot || '').trim();
  const serviceName = String(booking.service_name_snapshot || 'Service request').trim();
  const problemLabel = formatProblem(booking);
  const addressLabel = booking.address_label_snapshot
    ? `${booking.address_label_snapshot} • ${booking.address_snapshot || 'Address pending'}`
    : booking.address_snapshot || 'Address pending';

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.map}>
          <View style={[styles.roadH, styles.roadTop32]} />
          <View style={[styles.roadH, styles.roadTop52]} />
          <View style={[styles.roadH, styles.mainRoadH, styles.roadTop68]} />
          <View style={[styles.roadV, styles.roadLeft24]} />
          <View style={[styles.roadV, styles.mainRoadV, styles.roadLeft56]} />
          <View style={[styles.roadV, styles.roadLeft76]} />

          <View style={[styles.block, styles.blockOne]} />
          <View style={[styles.block, styles.blockTwo]} />
          <View style={[styles.block, styles.blockThree]} />
          <View style={[styles.block, styles.blockFour]} />
          <View style={styles.routeDots} />

          <View style={styles.topFloatWrap}>
            <View style={styles.topFloat}>
              <View style={styles.topFloatIcon}>
                <Icon name="hammer-wrench" size={20} color={TECH_COLORS.white} />
              </View>

              <View style={styles.topFloatCopy}>
                <Text style={styles.topFloatTitle}>{serviceName}</Text>
                <Text style={styles.topFloatText}>
                  {customerName} • {problemLabel}
                </Text>
              </View>

              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            </View>
          </View>

          <View style={styles.techMarker}>
            <Icon name="hammer-wrench" size={22} color={TECH_COLORS.white} />
          </View>
          <View style={styles.homeMarker}>
            <Icon name="home" size={18} color={TECH_COLORS.white} />
          </View>

          <View style={styles.bottomSheet}>
            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={TECH_COLORS.emerald} />
                <Text style={styles.stateText}>Loading route details</Text>
              </View>
            ) : null}

            {!isLoading && errorMessage ? (
              <View style={styles.stateCard}>
                <Icon name="alert-circle-outline" size={24} color={TECH_COLORS.rose} />
                <Text style={styles.stateText}>{errorMessage}</Text>
              </View>
            ) : null}

            {!isLoading && !errorMessage ? (
              <>
                <View style={styles.bottomTopRow}>
                  <View>
                    <Text style={styles.etaNumber}>{formatSchedule(booking)}</Text>
                    <Text style={styles.etaText}>Scheduled arrival</Text>
                  </View>
                </View>

                <View style={styles.customerCard}>
                  <View style={styles.customerCardCopy}>
                    <Text style={styles.customerCardTitle}>{customerName}</Text>
                    <Text style={styles.customerCardText}>
                      {customerPhone || 'Customer phone not available'}
                    </Text>
                  </View>
                  <Icon name="account-circle-outline" size={22} color={TECH_COLORS.emerald} />
                </View>

                <View style={styles.locationCard}>
                  <Text style={styles.locationTitle}>{addressLabel}</Text>
                  <Text style={styles.locationText}>
                    Booking {booking.booking_number || '-'}
                  </Text>
                </View>

                <View style={styles.bottomActions}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.callButton}
                    disabled={!customerPhone}
                    onPress={() => Linking.openURL(`tel:${customerPhone.replace(/\s+/g, '')}`)}
                  >
                    <Text style={styles.callText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.arrivedButton}
                    disabled={isUpdatingStatus}
                    onPress={async () => {
                      setIsUpdatingStatus(true);
                      const result = await markTechnicianArrived(bookingId);
                      setIsUpdatingStatus(false);

                      if (result.error) {
                        setErrorMessage(result.error.message || 'Could not mark arrival right now.');
                        return;
                      }

                      navigation.replace('TechnicianSafetyOtp', {
                        jobId: bookingId,
                        estimateDraft: route?.params?.estimateDraft,
                        otpExpiresAt: result.data?.expiresAt || null,
                      });
                    }}
                  >
                    <Text style={styles.arrivedText}>
                      {isUpdatingStatus ? 'Updating...' : "I've Arrived"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
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
  map: {
    flex: 1,
    backgroundColor: TECH_COLORS.bgElevated,
    overflow: 'hidden',
  },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: TECH_COLORS.cardAlt,
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: TECH_COLORS.cardAlt,
  },
  mainRoadH: {
    height: 8,
    backgroundColor: 'rgba(255,107,53,0.10)',
  },
  mainRoadV: {
    width: 8,
    backgroundColor: 'rgba(255,107,53,0.10)',
  },
  roadTop32: {
    top: '32%',
  },
  roadTop52: {
    top: '52%',
  },
  roadTop68: {
    top: '68%',
  },
  roadLeft24: {
    left: '24%',
  },
  roadLeft56: {
    left: '56%',
  },
  roadLeft76: {
    left: '76%',
  },
  block: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
  },
  blockOne: {
    top: '36%',
    left: '28%',
    width: 84,
    height: 64,
  },
  blockTwo: {
    top: '58%',
    left: '60%',
    width: 64,
    height: 72,
  },
  blockThree: {
    top: '40%',
    left: '60%',
    width: 98,
    height: 56,
  },
  blockFour: {
    top: '58%',
    left: '14%',
    width: 76,
    height: 68,
  },
  routeDots: {
    position: 'absolute',
    width: 170,
    top: '60%',
    left: '30%',
    borderTopWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,217,160,0.42)',
    transform: [{ rotate: '-24deg' }],
  },
  topFloatWrap: {
    position: 'absolute',
    top: 52,
    left: 14,
    right: 14,
  },
  topFloat: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(22,27,38,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  topFloatIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topFloatCopy: {
    flex: 1,
  },
  topFloatTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  topFloatText: {
    marginTop: 2,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: TECH_RADIUS.pill,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  techMarker: {
    position: 'absolute',
    bottom: '35%',
    left: '24%',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.emerald,
    borderWidth: 3,
    borderColor: TECH_COLORS.white,
  },
  homeMarker: {
    position: 'absolute',
    top: '37%',
    left: '58%',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.coral,
    borderWidth: 3,
    borderColor: TECH_COLORS.white,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: 'rgba(22,27,38,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  etaNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  etaText: {
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.20)',
    marginBottom: 14,
  },
  customerCardCopy: {
    flex: 1,
    marginRight: 10,
  },
  customerCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  customerCardText: {
    marginTop: 4,
    fontSize: 12,
    color: TECH_COLORS.emerald,
  },
  locationCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    marginBottom: 14,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  locationText: {
    marginTop: 4,
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  arrivedButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedText: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.bg,
  },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
    color: TECH_COLORS.textSecondary,
  },
});

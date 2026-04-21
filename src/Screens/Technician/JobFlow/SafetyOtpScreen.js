import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { fetchTechnicianJobDetail } from '../../../technician/jobAssignmentEngine';
import {
  generateTechnicianCompletionOtp,
  markTechnicianArrived,
  verifyTechnicianCompletionOtp,
  verifyTechnicianArrivalOtp,
} from '../../../technician/jobProgressEngine';
import { useTechScreenTheme } from '../../../technician/theme';
import {
  TechCard,
  TechGradientButton,
} from '../../../technician/components/TechUi';

const OTP_LENGTH = 4;
const shouldOfferOtpRegeneration = (message) => /fresh (arrival|completion) otp|expired|no active (arrival|completion) otp|too many incorrect/i.test(String(message || ''));

const getOtpPurposeMeta = (purpose) => {
  if (purpose === 'completion_verification') {
    return {
      title: 'Finish Safety OTP',
      subtitle: 'Enter the customer OTP to close the job after final payment.',
      loadingText: 'Loading finish verification',
      helperFallback: 'Ask the customer to open TrustFix and share the latest finish OTP.',
      eyebrow: 'Enter final handoff OTP',
      verifyButton: 'Verify and Complete Job',
      regenerateButton: 'Generate fresh Finish OTP',
    };
  }

  return {
    title: 'Safety Verification',
    subtitle: 'Enter the customer OTP to start the inspection.',
    loadingText: 'Loading arrival verification',
    helperFallback: 'Ask the customer to open TrustFix and share the latest arrival OTP.',
    eyebrow: 'Enter customer OTP',
    verifyButton: 'Verify and Start Inspection',
    regenerateButton: 'Generate fresh OTP',
  };
};

const formatExpiryText = (value, fallbackText) => {
  if (!value) {
    return fallbackText;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallbackText;
  }

  return `OTP expires at ${date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })}.`;
};

const getOtpCountdown = (value) => {
  if (!value) {
    return '';
  }

  const expiryTime = new Date(value).getTime();

  if (Number.isNaN(expiryTime)) {
    return '';
  }

  const remainingMs = expiryTime - Date.now();

  if (remainingMs <= 0) {
    return 'Expired';
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `Expires in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatProblem = (booking = {}) => (
  String(
    booking.problem_name_snapshot ||
    booking.custom_problem ||
    'Problem details not shared yet.',
  ).trim()
);

const getCustomerInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CU';
};

export default function SafetyOtpScreen({ navigation, route }) {
  const bookingId = route?.params?.jobId;
  const estimateDraft = route?.params?.estimateDraft;
  const otpExpiresAt = route?.params?.otpExpiresAt || null;
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [jobRecord, setJobRecord] = useState(null);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshingOtp, setIsRefreshingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [canRegenerateOtp, setCanRegenerateOtp] = useState(false);
  const [currentExpiresAt, setCurrentExpiresAt] = useState(otpExpiresAt);
  const [otpCountdown, setOtpCountdown] = useState(() => getOtpCountdown(otpExpiresAt));
  const otpInputRef = useRef(null);
  const booking = jobRecord?.bookings || {};
  const bookingStatus = String(booking.status || '').trim();
  const routePurpose = String(route?.params?.purpose || '').trim();
  const isCompletionStage = String(booking.payment_status || '').trim() === 'paid'
    && [
      'estimate_approved',
      'in_progress',
      'payment_pending',
      'payment_requested',
      'work_completed',
      'completed',
    ].includes(bookingStatus);
  const otpPurpose = isCompletionStage
    ? 'completion_verification'
    : (routePurpose === 'completion_verification' ? 'completion_verification' : 'arrival_verification');
  const purposeMeta = getOtpPurposeMeta(otpPurpose);

  const loadJob = useCallback(async (shouldShowSpinner = true) => {
    if (shouldShowSpinner) {
      setIsLoading(true);
    }

    setErrorMessage('');

    const result = await fetchTechnicianJobDetail(bookingId);

    if (result.error) {
      setJobRecord(null);
      setErrorMessage(result.error.message || 'Could not load this booking right now.');
    } else {
      setJobRecord(result.data);
    }

    if (shouldShowSpinner) {
      setIsLoading(false);
    }

    return result;
  }, [bookingId]);

  useEffect(() => {
    let isMounted = true;

    const hydrateJob = async () => {
      await loadJob(true);

      if (!isMounted) {
        return;
      }
    };

    hydrateJob();

    return () => {
      isMounted = false;
    };
  }, [loadJob]);

  useEffect(() => {
    const currentStatus = String(jobRecord?.bookings?.status || '').trim();

    if (otpPurpose === 'completion_verification' && currentStatus === 'completed') {
      navigation.replace('TechnicianTabs', { screen: 'TechnicianJobs' });
      return;
    }

    if (otpPurpose === 'arrival_verification' && [
      'otp_verified',
      'estimate_sent',
      'estimate_revision_requested',
      'estimate_approved',
      'in_progress',
      'work_completed',
      'completed',
    ].includes(currentStatus)) {
      navigation.replace('TechnicianJobInProgress', {
        jobId: bookingId,
        estimateDraft,
      });
    }
  }, [bookingId, estimateDraft, jobRecord?.bookings?.status, navigation, otpPurpose]);

  useEffect(() => {
    const initialCountdown = getOtpCountdown(currentExpiresAt);
    setOtpCountdown(initialCountdown);

    if (initialCountdown === 'Expired') {
      setCanRegenerateOtp(true);
    }

    if (!currentExpiresAt) {
      return undefined;
    }

    const timer = setInterval(() => {
      const nextCountdown = getOtpCountdown(currentExpiresAt);
      setOtpCountdown(nextCountdown);

      if (nextCountdown === 'Expired') {
        setCanRegenerateOtp(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentExpiresAt]);

  useEffect(() => {
    setOtp('');
    setErrorMessage('');
    setCanRegenerateOtp(false);
    setCurrentExpiresAt(otpExpiresAt || null);
  }, [bookingId, otpExpiresAt, otpPurpose]);

  const handleOtpChange = (value) => {
    setOtp(String(value || '').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));

    if (errorMessage) {
      setErrorMessage('');
    }

    if (canRegenerateOtp && otpCountdown !== 'Expired') {
      setCanRegenerateOtp(false);
    }
  };

  const customerName = String(booking.customer_name_snapshot || 'Customer').trim();
  const customerInitials = getCustomerInitials(customerName);
  const customerMeta = `${String(booking.service_name_snapshot || 'Service request').trim()} • ${formatProblem(booking)}`;

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.emerald}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#10D9A0', '#0AB984']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroTitle}>{purposeMeta.title}</Text>
            <Text style={styles.heroSubtitle}>{purposeMeta.subtitle}</Text>
          </LinearGradient>

          {isLoading ? (
            <TechCard style={styles.stateCard}>
              <ActivityIndicator color={TECH_COLORS.emerald} />
              <Text style={styles.stateText}>{purposeMeta.loadingText}</Text>
            </TechCard>
          ) : (
            <>
              <TechCard style={styles.arrivalCard}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>{customerInitials}</Text>
                </View>

                <View style={styles.arrivalCopy}>
                  <Text style={styles.customerName}>{customerName}</Text>
                  <Text style={styles.customerMeta}>{customerMeta}</Text>
                </View>
              </TechCard>

              <TechCard style={styles.otpCard}>
                <Text style={styles.otpEyebrow}>{purposeMeta.eyebrow}</Text>
                <Text style={styles.otpInfo}>{formatExpiryText(currentExpiresAt, purposeMeta.helperFallback)}</Text>
                {otpCountdown ? (
                  <Text style={[
                    styles.otpCountdown,
                    otpCountdown === 'Expired' && styles.otpCountdownExpired,
                  ]}>
                    {otpCountdown}
                  </Text>
                ) : null}

                <Pressable style={styles.otpInputWrap} onPress={() => otpInputRef.current?.focus()}>
                  <View style={styles.otpBoxes}>
                    {[0, 1, 2, 3].map((index) => {
                      const digit = otp[index] || '';
                      const isActive = otp.length === index || (otp.length === OTP_LENGTH && index === OTP_LENGTH - 1);

                      return (
                        <View
                          key={`otp-${index}`}
                          style={[
                            styles.otpBox,
                            isActive && styles.otpBoxActive,
                            digit && styles.otpBoxFilled,
                          ]}
                        >
                          <Text style={styles.otpDigit}>{digit}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <TextInput
                    ref={otpInputRef}
                    value={otp}
                    onChangeText={handleOtpChange}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={OTP_LENGTH}
                    autoFocus={false}
                    caretHidden
                    contextMenuHidden
                    style={styles.hiddenOtpInput}
                  />
                </Pressable>

                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {canRegenerateOtp ? (
                  <Pressable
                    onPress={async () => {
                      if (isRefreshingOtp) {
                        return;
                      }

                      setIsRefreshingOtp(true);
                      setErrorMessage('');

                      const latestJobResult = await loadJob(false);

                      if (latestJobResult.error) {
                        setIsRefreshingOtp(false);
                        return;
                      }

                      const result = otpPurpose === 'completion_verification'
                        ? await generateTechnicianCompletionOtp(bookingId, {
                            forceRegenerate: true,
                          })
                        : await markTechnicianArrived(bookingId, {
                            forceRegenerate: true,
                            purpose: otpPurpose,
                          });

                      setIsRefreshingOtp(false);

                      if (result.error || !result.data?.success) {
                        setErrorMessage(
                          result.error?.message ||
                          result.data?.message ||
                          'Could not generate a fresh OTP right now.',
                        );
                        return;
                      }

                      setOtp('');
                      setCanRegenerateOtp(false);
                      setCurrentExpiresAt(result.data?.expiresAt || null);
                      otpInputRef.current?.focus();
                    }}
                    style={styles.regenerateButton}
                  >
                    <View style={styles.regenerateButtonIconWrap}>
                      <Text style={styles.regenerateButtonIcon}>↻</Text>
                    </View>
                    <Text style={styles.regenerateButtonTitle}>
                      {isRefreshingOtp ? 'Generating new OTP...' : purposeMeta.regenerateButton}
                    </Text>
                    <Text style={styles.regenerateButtonArrow}>›</Text>
                  </Pressable>
                ) : null}
              </TechCard>

              <TechGradientButton
                label={isVerifying ? 'Verifying...' : purposeMeta.verifyButton}
                variant="emerald"
                style={styles.verifyButton}
                onPress={async () => {
                  if (otp.length !== OTP_LENGTH || isVerifying) {
                    return;
                  }

                  setIsVerifying(true);
                  setErrorMessage('');

                  const latestJobResult = await loadJob(false);

                  if (latestJobResult.error) {
                    setIsVerifying(false);
                    return;
                  }

                  const result = otpPurpose === 'completion_verification'
                    ? await verifyTechnicianCompletionOtp({
                        bookingId,
                        otpCode: otp,
                      })
                    : await verifyTechnicianArrivalOtp({
                        bookingId,
                        otpCode: otp,
                        purpose: otpPurpose,
                      });

                  setIsVerifying(false);

                  if (result.error || !result.data?.success) {
                    const nextMessage =
                      result.error?.message ||
                      result.data?.message ||
                      'OTP could not be verified right now.';
                    setOtp('');
                    setCanRegenerateOtp(shouldOfferOtpRegeneration(nextMessage));
                    setErrorMessage(nextMessage);
                    return;
                  }

                  if (otpPurpose === 'completion_verification') {
                    navigation.replace('TechnicianTabs', { screen: 'TechnicianJobs' });
                    return;
                  }

                  navigation.replace('TechnicianJobInProgress', {
                    jobId: bookingId,
                    estimateDraft,
                  });
                }}
              />
            </>
          )}
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
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 28,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.82)',
  },
  stateCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: TECH_COLORS.textSecondary,
  },
  arrivalCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  arrivalCopy: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  customerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  otpCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 18,
  },
  otpEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
    marginBottom: 10,
  },
  otpInfo: {
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
    marginBottom: 6,
  },
  otpCountdown: {
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  otpCountdownExpired: {
    color: TECH_COLORS.rose,
  },
  otpInputWrap: {
    position: 'relative',
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1.5,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: TECH_COLORS.emerald,
  },
  otpBoxFilled: {
    backgroundColor: TECH_COLORS.emeraldTint,
    borderColor: TECH_COLORS.emerald,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  hiddenOtpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  errorBox: {
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: TECH_COLORS.roseTint,
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.22)',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.rose,
    fontWeight: '700',
  },
  regenerateButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: TECH_COLORS.coralTint,
    borderWidth: 1,
    borderColor: TECH_COLORS.coralBorder,
  },
  regenerateButtonIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.white,
    marginRight: 12,
  },
  regenerateButtonIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.coral,
  },
  regenerateButtonTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  regenerateButtonArrow: {
    fontSize: 24,
    lineHeight: 24,
    color: TECH_COLORS.coral,
    marginLeft: 10,
  },
  verifyButton: {
    marginHorizontal: 20,
  },
});

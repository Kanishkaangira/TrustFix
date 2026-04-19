// src/Screens/Customer/Booking.js
// Main booking flow controller — steps 1 to 5
// Changes:
//   • Back button — frosted/blur background circle
//   • Service pill — improved: icon initial box + colored border + check dot
//   • CTA in SelectProblem renamed "Next Step" and hides when keyboard open

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import SelectService  from './BookingFlow/SelectService';
import SelectProblem  from './BookingFlow/SelectProblem';
import SelectSeverity from './BookingFlow/SelectSeverity';
import SelectSlot     from './BookingFlow/SelectSlot';
import PriceSummary   from './BookingFlow/PriceSummary';
import ScreenWrapper  from '../../Components/ScreenWrapper';

import { FONT, SPACING, getThemeColors } from '../../theme';
import {
  getDefaultAddress,
  subscribeToAddresses,
} from '../../state/addressStore';
import {
  createBooking,
  syncBookingsFromRemote,
} from '../../state/bookingStore';
import {
  fetchOwnProfileRecord,
  getProfile,
} from '../../state/profileStore';
import {
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from '../../lib/payments/razorpay';
import { useAppTheme } from '../../theme/ThemeProvider';

// ─── Step constants ────────────────────────────────────────────
const STEPS = {
  SELECT_SERVICE:  1,
  SELECT_PROBLEM:  2,
  SELECT_SEVERITY: 3,
  SELECT_SLOT:     4,
  PRICE_SUMMARY:   5,
};

const STEP_CONFIG = [
  { step: 1, label: 'Service'  },
  { step: 2, label: 'Problem'  },
  { step: 3, label: 'Urgency'  },
  { step: 4, label: 'Schedule' },
  { step: 5, label: 'Review'   },
];

const FALLBACK_ADDRESS = {
  label: 'Home',
  address: '42, Green Park, New Delhi',
};
const PROFILE_BRAND_ORANGE = '#FF6B2B';
const BOOKING_MODAL_INITIAL_STATE = {
  visible: false,
  title: '',
  message: '',
  tone: 'brand',
  ctaLabel: 'OK',
  onClose: null,
};


// ─── Main controller ───────────────────────────────────────────
export default function Bookings({ route, navigation }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const preService = route?.params?.service || null;
  const serviceTrigger = route?.params?.serviceTrigger || null;
  const returnedAddress = route?.params?.selectedAddress || null;
  const addressTrigger = route?.params?.addressTrigger || null;
  const returnStep = route?.params?.returnStep || null;

  const [step,          setStep]          = useState(preService ? STEPS.SELECT_PROBLEM : STEPS.SELECT_SERVICE);
  const [service,       setService]       = useState(preService);
  const [problem,       setProblem]       = useState(null);
  const [customProblem, setCustomProblem] = useState('');
  const [severity,      setSeverity]      = useState(null);
  const [date,          setDate]          = useState(null);
  const [slot,          setSlot]          = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(() => getDefaultAddress() || FALLBACK_ADDRESS);
  const [bookingAddress, setBookingAddress] = useState(() => getDefaultAddress() || FALLBACK_ADDRESS);
  const [hasCustomAddress, setHasCustomAddress] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingModal, setBookingModal] = useState(BOOKING_MODAL_INITIAL_STATE);
  const currentAddress = bookingAddress || defaultAddress || FALLBACK_ADDRESS;

  const showBookingModal = useCallback((nextModal) => {
    setBookingModal({
      ...BOOKING_MODAL_INITIAL_STATE,
      ...nextModal,
      visible: true,
    });
  }, []);

  const handleCloseBookingModal = useCallback(() => {
    const onClose = bookingModal.onClose;
    setBookingModal(BOOKING_MODAL_INITIAL_STATE);

    if (typeof onClose === 'function') {
      onClose();
    }
  }, [bookingModal.onClose]);

  // Tell navigator what step we are on
  useEffect(() => {
    navigation.setParams({ currentStep: step });
  }, [step, navigation]);

  useEffect(() => subscribeToAddresses((nextAddresses) => {
    const nextDefaultAddress = nextAddresses.find((item) => item.isDefault) || nextAddresses[0] || FALLBACK_ADDRESS;
    setDefaultAddress(nextDefaultAddress);
  }), []);

  useEffect(() => {
    if (!hasCustomAddress) {
      setBookingAddress(defaultAddress || FALLBACK_ADDRESS);
    }
  }, [defaultAddress, hasCustomAddress]);

  useEffect(() => {
    if (preService) {
      setService(preService);
      setProblem(null);
      setCustomProblem('');
      setSeverity(null);
      setDate(null);
      setSlot(null);
      setStep(STEPS.SELECT_PROBLEM);
      navigation.setParams({ service: undefined, serviceTrigger: undefined });
      return;
    }

    if (returnedAddress) {
      setBookingAddress(returnedAddress);
      setHasCustomAddress(true);
    }

    const targetReturnStep = (
      returnStep === STEPS.SELECT_SLOT || returnStep === STEPS.PRICE_SUMMARY
    )
      ? returnStep
      : null;

    if (targetReturnStep || addressTrigger) {
      if (!returnedAddress) {
        setBookingAddress(defaultAddress || FALLBACK_ADDRESS);
        setHasCustomAddress(false);
      }

      setStep(targetReturnStep || STEPS.SELECT_SLOT);
      navigation.setParams({
        selectedAddress: undefined,
        returnStep: undefined,
        addressTrigger: undefined,
      });
    }
  }, [preService, serviceTrigger, returnedAddress, returnStep, addressTrigger, navigation, defaultAddress]);

  useEffect(() => {
    if (step === STEPS.SELECT_SERVICE) {
      setHasCustomAddress(false);
    }
  }, [step]);

  // ── Back navigation ────────────────────────────────────────
  const goBack = useCallback(() => {
    if (step === STEPS.SELECT_PROBLEM && service) {
      setService(null);
      setProblem(null);
      setCustomProblem('');
      setSeverity(null);
      setDate(null);
      setSlot(null);
      setStep(STEPS.SELECT_SERVICE);
      return;
    }

    const isFirstStep = step === STEPS.SELECT_SERVICE;

    if (isFirstStep) {
      navigation.goBack();
      return;
    }

    setStep(prev => {
      if (prev === STEPS.PRICE_SUMMARY && severity !== 'minor') {
        return STEPS.SELECT_SEVERITY;
      }
      return prev - 1;
    });
  }, [navigation, service, severity, step]);

  useFocusEffect(
    useCallback(() => {
      const handleHardwareBack = () => {
        if (step === STEPS.SELECT_SERVICE) {
          return false;
        }

        goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);

      return () => {
        subscription.remove();
      };
    }, [goBack, step])
  );

  // ── Step handlers ──────────────────────────────────────────
  const handleServiceSelect = (selected) => {
    setService(selected);
    setProblem(null);
    setCustomProblem('');
    setSeverity(null);
    setDate(null);
    setSlot(null);
    setStep(STEPS.SELECT_PROBLEM);
  };

  const handleProblemNext = (selectedProblem, customText) => {
    setProblem(selectedProblem);
    setCustomProblem(customText);
    setStep(STEPS.SELECT_SEVERITY);
  };

  const handleSeverityNext = (selectedSeverity) => {
    setSeverity(selectedSeverity);
    setStep(selectedSeverity === 'minor' ? STEPS.SELECT_SLOT : STEPS.PRICE_SUMMARY);
  };

  const handleSlotNext = (selectedDate, selectedSlot) => {
    setDate(selectedDate);
    setSlot(selectedSlot);
    setStep(STEPS.PRICE_SUMMARY);
  };

  const resetFlow = useCallback(() => {
    setService(null);
    setProblem(null);
    setCustomProblem('');
    setSeverity(null);
    setDate(null);
    setSlot(null);
    setHasCustomAddress(false);
    setBookingAddress(defaultAddress || FALLBACK_ADDRESS);
    setStep(STEPS.SELECT_SERVICE);
  }, [defaultAddress]);

  const handleConfirmBooking = useCallback(async ({ protectionSelected }) => {
    if (isSubmittingBooking) {
      return;
    }

    if (!currentAddress?.id) {
      Alert.alert(
        'Add an address first',
        'Please save a service address before confirming the booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Address',
            onPress: () => navigation.navigate('Profile', {
              openScreen: 'addresses',
              returnToBooking: true,
              returnStep: STEPS.PRICE_SUMMARY,
            }),
          },
        ],
      );
      return;
    }

    try {
      setIsSubmittingBooking(true);

      const result = await createBooking({
        service,
        problem,
        customProblem,
        severity,
        date,
        slot,
        address: currentAddress,
        protectionSelected,
      });

      if (result.error) {
        Alert.alert('Could not place booking', result.error.message);
        return;
      }

      if (result.paymentSetupError || !result.paymentOrder) {
        resetFlow();
        const paymentStartMessage = String(
          result.paymentSetupError?.message || 'Payment could not be started right now.',
        ).trim();
        showBookingModal({
          title: 'Payment not started',
          message: `Your booking was not created because the initial payment could not be started. ${paymentStartMessage}`,
          tone: 'warning',
          onClose: () => navigation.navigate('Home'),
        });
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
          order: result.paymentOrder,
          customer,
          description: `TrustFix ${service?.label || service?.shortLabel || 'booking'} payment`,
        });
      } catch (checkoutError) {
        resetFlow();

        const checkoutMessage = String(
          checkoutError?.description || checkoutError?.error?.description || 'Payment was not completed.',
        ).trim();

        showBookingModal({
          title: 'Payment pending',
          message: `Your booking was not created because the initial payment is still pending. ${checkoutMessage}`,
          tone: 'warning',
          onClose: () => navigation.navigate('Home'),
        });
        return;
      }

      const verificationResult = await verifyRazorpayPayment({
        paymentOrderId: result.paymentOrder.id,
        razorpayOrderId: checkoutResponse?.razorpay_order_id || result.paymentOrder.provider_order_id,
        razorpayPaymentId: checkoutResponse?.razorpay_payment_id,
        razorpaySignature: checkoutResponse?.razorpay_signature,
      });

      if (verificationResult.error) {
        await syncBookingsFromRemote();
        resetFlow();
        showBookingModal({
          title: 'Payment verification pending',
          message: 'Payment verification could not be completed yet, so the booking has not been created.',
          tone: 'warning',
          onClose: () => navigation.navigate('Home'),
        });
        return;
      }

      const createdBooking = verificationResult.data?.booking || null;
      await syncBookingsFromRemote();
      resetFlow();
      showBookingModal({
        title: 'Booking confirmed',
        message: createdBooking?.bookingNumber
          ? `Booking ${createdBooking.bookingNumber} has been placed and the initial payment was completed successfully.`
          : 'Your booking has been placed and the initial payment was completed successfully.',
        tone: 'success',
        onClose: () => navigation.navigate('Home'),
      });
    } catch (_) {
      showBookingModal({
        title: 'Network issue',
        message: 'Please try placing the booking again.',
        tone: 'warning',
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  }, [
    currentAddress,
    customProblem,
    date,
    isSubmittingBooking,
    navigation,
    problem,
    resetFlow,
    service,
    severity,
    showBookingModal,
    slot,
  ]);

  // ── Step renderer ──────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case STEPS.SELECT_SERVICE:
        return <SelectService onSelect={handleServiceSelect} />;

      case STEPS.SELECT_PROBLEM:
        return (
          <SelectProblem
            service={service}
            onNext={handleProblemNext}
          />
        );

      case STEPS.SELECT_SEVERITY:
        return (
          <SelectSeverity
            service={service}
            problem={customProblem || problem?.label || ''}
            onNext={handleSeverityNext}
          />
        );

      case STEPS.SELECT_SLOT:
        return (
          <SelectSlot
            onNext={handleSlotNext}
            navigation={navigation}
            selectedAddress={currentAddress}
          />
        );

      case STEPS.PRICE_SUMMARY:
        return (
          <PriceSummary
            service={service}
            problem={problem}
            customProblem={customProblem}
            severity={severity}
            date={date}
            slot={slot}
            address={currentAddress}
            navigation={navigation}
            isSubmitting={isSubmittingBooking}
            onConfirm={handleConfirmBooking}
          />
        );

      default:
        return null;
    }
  };

  const progressStep = step;
  const showHeader   = step !== STEPS.SELECT_SERVICE;
  const isStartingStep = step === STEPS.SELECT_SERVICE;
  const wrapperTopColor = isStartingStep ? PROFILE_BRAND_ORANGE : colors.surface;
  const statusBarStyle = isStartingStep ? 'light-content' : (isDark ? 'light-content' : 'dark-content');

  return (
    <ScreenWrapper
      topColor={wrapperTopColor}
      bottomColor={colors.background}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={[styles.safe, isStartingStep && styles.safeStarting]}>

      {/* ════════════════════════════════════════════════════════
           TOP BLOCK — header row + step dots + fill bar
           Shown on steps 2 → 5 only. One unified container
           so there is zero gap between rows.
          ════════════════════════════════════════════════════════ */}
      {showHeader && (
        <View style={styles.topBlock}>


          {/* ── Row 1: back · service pill · spacer ── */}
          <View style={styles.headerRow}>

            {/* BACK BUTTON — frosted circle */}
            <TouchableOpacity
              onPress={goBack}
              style={styles.backBtnHit}
              activeOpacity={0.65}
            >
              <Icon
                name="chevron-left"
                size={28}
                color={service?.accentColor || colors.primary}
              />
            </TouchableOpacity>

            {/* SERVICE PILL — icon initial + name + check dot */}
            <View style={styles.serviceSummary}>
              <View style={styles.serviceSummaryText}>
                <Text
                  style={[
                    styles.serviceSummaryName,
                    { color: service?.accentColor || colors.primary },
                  ]}
                  numberOfLines={1}
                >
                  {service?.shortLabel || service?.label || 'Book a Service'}
                </Text>
              </View>

            </View>

            {/* Mirror spacer — keeps pill centered */}
            <View style={styles.inlineBrandWrap}>
              <Text style={styles.inlineBrandText}>
                <Text style={styles.inlineBrandTrust}>Trust</Text>
                <Text style={styles.inlineBrandFix}>Fix</Text>
              </Text>
            </View>
          </View>

          {/* ── Row 2: step dots ── */}
          <View style={styles.progressWrapper}>
            <View style={styles.trackLine} />

            {STEP_CONFIG.map(({ step: s, label }) => {
              const isDone   = s < progressStep;
              const isActive = s === progressStep;
              return (
                <View key={s} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      isDone   && styles.stepDotDone,
                      isActive && styles.stepDotActive,
                    ]}
                  >
                    {isDone   && <View style={styles.stepDotInner} />}
                    {isActive && <View style={styles.stepDotActiveInner} />}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isDone   && styles.stepLabelDone,
                      isActive && styles.stepLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── Row 3: animated fill bar ── */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((progressStep - 1) / 4) * 100}%` },
              ]}
            />
          </View>

        </View>
      )}

      {/* Screen content */}
      <View style={styles.content}>{renderStep()}</View>

      <Modal
        transparent
        visible={bookingModal.visible}
        animationType="fade"
        onRequestClose={handleCloseBookingModal}
      >
        <View style={styles.bookingModalOverlay}>
          <Pressable style={styles.bookingModalBackdrop} onPress={handleCloseBookingModal} />

          <View
            style={[
              styles.bookingModalCard,
              bookingModal.tone === 'success'
                ? styles.bookingModalCardSuccess
                : bookingModal.tone === 'warning'
                  ? styles.bookingModalCardWarning
                  : styles.bookingModalCardBrand,
            ]}
          >
            <View
              style={[
                styles.bookingModalAccent,
                bookingModal.tone === 'success'
                  ? styles.bookingModalAccentSuccess
                  : bookingModal.tone === 'warning'
                    ? styles.bookingModalAccentWarning
                    : styles.bookingModalAccentBrand,
              ]}
            />

            <View
              style={[
                styles.bookingModalIconWrap,
                bookingModal.tone === 'success'
                  ? styles.bookingModalIconWrapSuccess
                  : bookingModal.tone === 'warning'
                    ? styles.bookingModalIconWrapWarning
                    : styles.bookingModalIconWrapBrand,
              ]}
            >
              <Icon
                name={
                  bookingModal.tone === 'success'
                    ? 'check-decagram-outline'
                    : bookingModal.tone === 'warning'
                      ? 'alert-circle-outline'
                      : 'calendar-check-outline'
                }
                size={24}
                color={
                  bookingModal.tone === 'success'
                    ? colors.success
                    : bookingModal.tone === 'warning'
                      ? '#B45309'
                      : PROFILE_BRAND_ORANGE
                }
              />
            </View>

            <Text style={styles.bookingModalTitle}>{bookingModal.title}</Text>
            <Text style={styles.bookingModalMessage}>{bookingModal.message}</Text>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.bookingModalButton}
              onPress={handleCloseBookingModal}
            >
              <Text style={styles.bookingModalButtonText}>{bookingModal.ctaLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      </SafeAreaView>
    </ScreenWrapper>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const createStyles = (colors) => StyleSheet.create({

  safe: {
    flex:            1,
    backgroundColor: colors.surface,
  },
  safeStarting: {
    backgroundColor: PROFILE_BRAND_ORANGE,
  },

  // One unified white card — header + dots + bar, no internal gaps
  topBlock: {
    backgroundColor: colors.surfaceMuted,
    shadowColor:     colors.black,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   colors.background === '#0D1218' ? 0.24 : 0.07,
    shadowRadius:    6,
    elevation:       4,
  },

  // ── Row 1 ────────────────────────────────────────────────────
  headerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop:        16,
    paddingBottom:     12,
    minHeight:         44,
  },

  // Hit area (large) — circle is visually smaller inside
  backBtnHit: {
    width:          32,
    height:         32,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // ── Service pill ─────────────────────────────────────────────
  servicePill: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.surface,
    paddingLeft:     6,
    paddingRight:    10,
    paddingVertical: 6,
    borderRadius:    18,
    borderWidth:     1.5,
    marginHorizontal: 12,
    minWidth:        0,
    shadowColor:     colors.black,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.05,
    shadowRadius:    8,
    elevation:       2,
  },

  serviceIconShell: {
    width:          52,
    height:         52,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  pillIconCircle: {
    width:          36,
    height:         36,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  pillTextWrap: {
    flex:            1,
    minWidth:        0,
    paddingHorizontal: 12,
  },
  pillEyebrow: {
    fontSize:      10,
    fontWeight:    FONT.bold,
    color:         colors.inkMuted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom:  3,
  },

  // Service name text
  pillName: {
    fontSize:      15,
    fontWeight:    FONT.black,
    color:         colors.ink,
    letterSpacing: -0.2,
    flexShrink:    1,
  },

  // Small ring with filled center — "locked in" indicator
  pillCheckRing: {
    width:          28,
    height:         28,
    borderRadius:   14,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  serviceSummary: {
    flex:            1,
    justifyContent:  'center',
    marginLeft:      8,
    marginRight:     12,
    minHeight:       32,
    minWidth:        0,
  },
  serviceSummaryText: {
    flex:         1,
    justifyContent: 'center',
    minWidth:     0,
    paddingRight: 8,
    minHeight:    32,
  },
  serviceSummaryName: {
    fontSize:      17,
    fontWeight:    FONT.black,
    letterSpacing: -0.3,
    lineHeight:    22,
    includeFontPadding: false,
  },

  inlineBrandWrap: {
    minWidth:       78,
    minHeight:      32,
    alignItems:     'flex-end',
    justifyContent: 'center',
    marginLeft:     4,
  },
  inlineBrandText: {
    fontSize:      20,
    fontWeight:    '800',
    letterSpacing: -0.5,
    lineHeight:    22,
    textAlign:     'right',
    includeFontPadding: false,
  },
  inlineBrandTrust: {
    color: colors.ink,
  },
  inlineBrandFix: {
    color: colors.primary,
  },

  // ── Step dots ────────────────────────────────────────────────
  progressWrapper: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    justifyContent:    'space-between',
    paddingHorizontal: 24,
    paddingTop:        6,
    paddingBottom:     10,
    position:          'relative',
  },

  trackLine: {
    position:        'absolute',
    top:             15,
    left:            48,
    right:           48,
    height:          1,
    backgroundColor: colors.border,
  },

  stepItem: {
    alignItems: 'center',
    width:       48,
  },

  stepDot: {
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: colors.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    5,
  },
  stepDotDone: {
    backgroundColor: colors.primary,
  },
  stepDotActive: {
    backgroundColor: colors.surface,
    borderWidth:     2,
    borderColor:     colors.primary,
  },
  stepDotInner: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: colors.surface,
  },
  stepDotActiveInner: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: colors.primary,
  },

  stepLabel: {
    fontSize:      10,
    fontWeight:    FONT.medium,
    color:         colors.inkMuted,
    letterSpacing: 0.2,
    textAlign:     'center',
  },
  stepLabelActive: {
    color:      colors.primary,
    fontWeight: FONT.bold,
  },
  stepLabelDone: {
    color: colors.primary,
  },

  // ── Fill bar ─────────────────────────────────────────────────
  progressBar: {
    height:          2,
    backgroundColor: colors.border,
  },
  progressFill: {
    height:          2,
    backgroundColor: colors.primary,
  },

  bookingModalOverlay: {
    flex:              1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 24,
  },
  bookingModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  bookingModalCard: {
    width:             '100%',
    maxWidth:          360,
    paddingHorizontal: 22,
    paddingTop:        30,
    paddingBottom:     18,
    borderRadius:      28,
    backgroundColor:   colors.card,
    borderWidth:       1,
    borderColor:       colors.border,
    alignItems:        'center',
    shadowColor:       '#000000',
    shadowOpacity:     0.2,
    shadowRadius:      20,
    shadowOffset:      { width: 0, height: 10 },
    elevation:         8,
  },
  bookingModalCardBrand: {
    backgroundColor: '#FFF4EE',
    borderColor:     '#F6C3A7',
  },
  bookingModalCardSuccess: {
    backgroundColor: '#F1FBF6',
    borderColor:     '#B7E4C7',
  },
  bookingModalCardWarning: {
    backgroundColor: '#FFF7E8',
    borderColor:     '#F3D08B',
  },
  bookingModalAccent: {
    position:         'absolute',
    top:              0,
    left:             0,
    right:            0,
    height:           8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  bookingModalAccentBrand: {
    backgroundColor: PROFILE_BRAND_ORANGE,
  },
  bookingModalAccentSuccess: {
    backgroundColor: colors.success,
  },
  bookingModalAccentWarning: {
    backgroundColor: '#D97706',
  },
  bookingModalIconWrap: {
    width:          56,
    height:         56,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   14,
  },
  bookingModalIconWrapBrand: {
    backgroundColor: '#FFF0E8',
  },
  bookingModalIconWrapSuccess: {
    backgroundColor: colors.successLight,
  },
  bookingModalIconWrapWarning: {
    backgroundColor: '#FEF3C7',
  },
  bookingModalTitle: {
    fontFamily: FONT.bold,
    fontSize:   28,
    lineHeight: 34,
    color:      colors.ink,
    textAlign:  'center',
  },
  bookingModalMessage: {
    marginTop:  10,
    fontFamily: FONT.regular,
    fontSize:   16,
    lineHeight: 24,
    color:      colors.inkMuted,
    textAlign:  'center',
  },
  bookingModalButton: {
    marginTop:       22,
    minWidth:        140,
    height:          50,
    paddingHorizontal: 22,
    borderRadius:    16,
    backgroundColor: PROFILE_BRAND_ORANGE,
    alignItems:      'center',
    justifyContent:  'center',
  },
  bookingModalButtonText: {
    fontFamily: FONT.bold,
    fontSize:   16,
    color:      '#FFFFFF',
  },

  // ── Content ──────────────────────────────────────────────────
  content: {
    flex:            1,
    backgroundColor: colors.background,
  },

});

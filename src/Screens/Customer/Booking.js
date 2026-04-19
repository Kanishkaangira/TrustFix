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
import { createBooking } from '../../state/bookingStore';
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
  const currentAddress = bookingAddress || defaultAddress || FALLBACK_ADDRESS;

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

      const createdBooking = result.data;
      resetFlow();
      navigation.navigate('Home');

      Alert.alert(
        'Booking placed',
        createdBooking?.bookingNumber
          ? `Your booking ${createdBooking.bookingNumber} has been created successfully.`
          : 'Your booking has been created successfully.',
      );
    } catch (_) {
      Alert.alert('Network error', 'Please try placing the booking again.');
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

  // ── Content ──────────────────────────────────────────────────
  content: {
    flex:            1,
    backgroundColor: colors.background,
  },

});

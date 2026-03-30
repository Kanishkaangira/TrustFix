// src/Screens/Bookings.js
// Main booking flow controller — steps 1 to 5
// Changes:
//   • Back button — frosted/blur background circle
//   • Service pill — improved: icon initial box + colored border + check dot
//   • CTA in SelectProblem renamed "Next Step" and hides when keyboard open

import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import SelectService  from './BookingFlow/SelectService';
import SelectProblem  from './BookingFlow/SelectProblem';
import SelectSeverity from './BookingFlow/SelectSeverity';
import SelectSlot     from './BookingFlow/SelectSlot';
import PriceSummary   from './BookingFlow/PriceSummary';
import ScreenWrapper  from '../Components/ScreenWrapper';

import { COLORS, FONT, SPACING } from '../theme';
import {
  getDefaultAddress,
  subscribeToAddresses,
} from '../store/addressStore';

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

// ─── Main controller ───────────────────────────────────────────
export default function Bookings({ route, navigation }) {
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

    if (returnStep === STEPS.SELECT_SLOT || addressTrigger) {
      if (!returnedAddress) {
        setBookingAddress(defaultAddress || FALLBACK_ADDRESS);
        setHasCustomAddress(false);
      }

      setStep(STEPS.SELECT_SLOT);
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
            onConfirm={() =>
              navigation.navigate('Payment', {
                service, problem, customProblem, severity, date, slot, address: currentAddress,
              })
            }
          />
        );

      default:
        return null;
    }
  };

  const progressStep = step;
  const showHeader   = step !== STEPS.SELECT_SERVICE;
  const topColor = step === STEPS.SELECT_SERVICE ? '#FF6B3D' : COLORS.surface;
  const statusBarStyle = step === STEPS.SELECT_SERVICE ? 'light-content' : 'dark-content';

  return (
    <ScreenWrapper
      topColor={topColor}
      bottomColor={COLORS.background}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: topColor }]}>

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
              <View style={styles.backBtnCircle}>
                <View style={styles.chevron} />
              </View>
            </TouchableOpacity>

            {/* SERVICE PILL — icon initial + name + check dot */}
            <View
              style={[
                styles.servicePill,
                {
                  backgroundColor: service?.lightColor  || COLORS.primaryLight,
                  borderColor:     service?.accentColor || COLORS.primary,
                },
              ]}
            >
              {/* Colored circle with service initial */}
              <View
                style={[
                  styles.pillIconCircle,
                  { backgroundColor: service?.accentColor || COLORS.primary },
                ]}
              >
                <Text style={styles.pillInitial}>
                  {service?.label?.charAt(0) || 'S'}
                </Text>
              </View>

              {/* Service short name */}
              <Text
                style={[
                  styles.pillName,
                  { color: service?.accentColor || COLORS.primary },
                ]}
                numberOfLines={1}
              >
                {service?.shortLabel || 'Book a Service'}
              </Text>

              {/* Locked-in indicator dot */}
              <View
                style={[
                  styles.pillCheckRing,
                  { borderColor: service?.accentColor || COLORS.primary },
                ]}
              >
                <View
                  style={[
                    styles.pillCheckFill,
                    { backgroundColor: service?.accentColor || COLORS.primary },
                  ]}
                />
              </View>
            </View>

            {/* Mirror spacer — keeps pill centered */}
            <View style={styles.spacer} />
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
const styles = StyleSheet.create({

  safe: {
    flex:            1,
    backgroundColor: COLORS.surface,
  },

  // One unified white card — header + dots + bar, no internal gaps
  topBlock: {
    backgroundColor: COLORS.surface,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
    elevation:       4,
  },

  // ── Row 1 ────────────────────────────────────────────────────
  headerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop:        12,
    paddingBottom:     10,
  },

  // Hit area (large) — circle is visually smaller inside
  backBtnHit: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Frosted blur circle
  backBtnCircle: {
    width:           38,
    height:          38,
    borderRadius:    19,
    // Frosted glass effect — semi-transparent tinted bg + soft border
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(118,118,128,0.12)'   // iOS material
      : 'rgba(0,0,0,0.07)',        // Android equivalent
    borderWidth:     1,
    borderColor:     Platform.OS === 'ios'
      ? 'rgba(118,118,128,0.18)'
      : 'rgba(0,0,0,0.09)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  chevron: {
    width:             8,
    height:            8,
    borderLeftWidth:   2,
    borderBottomWidth: 2,
    borderColor:       COLORS.ink,
    transform:         [{ rotate: '45deg' }],
    marginLeft:        3,
  },

  // ── Service pill ─────────────────────────────────────────────
  servicePill: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            7,
    paddingLeft:    4,     // icon circle sits at left edge
    paddingRight:   10,
    paddingVertical: 4,
    borderRadius:   100,
    borderWidth:    1.5,
    maxWidth:       210,
  },

  // Colored circle showing service initial letter
  pillIconCircle: {
    width:          26,
    height:         26,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  pillInitial: {
    fontSize:   11,
    fontWeight: FONT.black,
    color:      '#FFFFFF',
  },

  // Service name text
  pillName: {
    fontSize:      13,
    fontWeight:    FONT.bold,
    letterSpacing: 0.1,
    flexShrink:    1,
  },

  // Small ring with filled center — "locked in" indicator
  pillCheckRing: {
    width:          14,
    height:         14,
    borderRadius:   7,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  pillCheckFill: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },

  // Mirror of backBtnHit to keep pill centered
  spacer: {
    width:  40,
    height: 40,
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
    backgroundColor: COLORS.border,
  },

  stepItem: {
    alignItems: 'center',
    width:       48,
  },

  stepDot: {
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    5,
  },
  stepDotDone: {
    backgroundColor: COLORS.primary,
  },
  stepDotActive: {
    backgroundColor: COLORS.surface,
    borderWidth:     2,
    borderColor:     COLORS.primary,
  },
  stepDotInner: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: COLORS.surface,
  },
  stepDotActiveInner: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: COLORS.primary,
  },

  stepLabel: {
    fontSize:      10,
    fontWeight:    FONT.medium,
    color:         COLORS.inkMuted,
    letterSpacing: 0.2,
    textAlign:     'center',
  },
  stepLabelActive: {
    color:      COLORS.primary,
    fontWeight: FONT.bold,
  },
  stepLabelDone: {
    color: COLORS.primary,
  },

  // ── Fill bar ─────────────────────────────────────────────────
  progressBar: {
    height:          2,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height:          2,
    backgroundColor: COLORS.primary,
  },

  // ── Content ──────────────────────────────────────────────────
  content: {
    flex:            1,
    backgroundColor: COLORS.background,
  },

});

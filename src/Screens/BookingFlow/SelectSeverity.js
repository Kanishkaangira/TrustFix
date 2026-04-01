// src/Screens/BookingFlow/SelectSeverity.js
// Step 3 - urgency selection

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FONT, RADIUS, SHADOW, SPACING, getThemeColors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeProvider';

const PROFILE_BRAND_ORANGE = '#FF6B2B';

const SEVERITY_OPTIONS = [
  {
    id: 'minor',
    label: 'Minor',
    sublabel: 'Visit in 2-3 days',
    description: 'Best for non-critical issues.',
    dotColor: '#1A7A4A',
    bgColor: '#EBF7F1',
    borderColor: '#C5E1A5',
    accentColor: '#2E7D32',
    badge: 'Value',
    badgeColor: '#1A7A4A',
    helper: 'Choose slot next',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    sublabel: 'Within 24 hours',
    description: 'Fast support with auto-assignment.',
    dotColor: '#FF9800',
    bgColor: '#FFF8E1',
    borderColor: '#FFE082',
    accentColor: '#E65100',
    badge: 'Popular',
    badgeColor: '#FF9800',
    helper: 'Nearest tech auto-assigned',
  },
  {
    id: 'urgent',
    label: 'Urgent',
    sublabel: '15-20 min dispatch',
    description: 'Emergency help for risky issues.',
    dotColor: '#C0392B',
    bgColor: '#FDECEA',
    borderColor: '#EF9A9A',
    accentColor: '#C62828',
    badge: 'Emergency',
    badgeColor: '#C0392B',
    helper: 'Emergency dispatch starts now',
  },
];

const getButtonLabel = (selected) => {
  if (selected === 'minor') {
    return 'Next - Pick Slot';
  }

  if (selected === 'moderate') {
    return 'Next - See Pricing';
  }

  if (selected === 'urgent') {
    return 'Next - Confirm';
  }

  return 'Select urgency';
};

export default function SelectSeverity({ service, problem, onNext }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState(null);

  const canProceed = selected !== null;
  const serviceSoft = service?.lightColor || colors.primaryLight;
  const serviceLabel = service?.shortLabel || service?.label || '';
  const problemLabel = typeof problem === 'string' ? problem.trim() : '';

  const handleSelect = (option) => {
    setSelected(option.id);
  };

  const handleNext = () => {
    if (!canProceed) {
      return;
    }

    onNext(selected);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>How urgent is this?</Text>
        <Text style={styles.headingSubtitle}>
          This sets response time and pricing.
        </Text>

        {(serviceLabel || problemLabel) ? (
          <View style={styles.contextRow}>
            {serviceLabel ? (
              <View style={[styles.servicePill, { backgroundColor: serviceSoft }]}>
                <Icon
                  name={service?.icon || 'tools'}
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={styles.servicePillText}
                  numberOfLines={1}
                >
                  {serviceLabel}
                </Text>
              </View>
            ) : null}

            {problemLabel ? (
              <View style={styles.problemPill}>
                <Text style={styles.problemPillText} numberOfLines={1}>
                  {problemLabel}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {SEVERITY_OPTIONS.map((option) => {
        const isSelected = selected === option.id;

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.card,
              { borderColor: isSelected ? option.dotColor : colors.border },
              isSelected && { backgroundColor: option.bgColor },
            ]}
            onPress={() => handleSelect(option)}
            activeOpacity={0.88}
          >
            <View style={[styles.badge, { backgroundColor: option.badgeColor }]}>
              <Text style={styles.badgeText}>{option.badge}</Text>
            </View>

            <View style={styles.cardTop}>
              <View style={[styles.dot, { backgroundColor: option.dotColor }]} />

              <View style={styles.cardTopText}>
                <Text
                  style={[
                    styles.cardLabel,
                    isSelected && { color: option.accentColor },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.cardSublabel}>{option.sublabel}</Text>
              </View>

              <View
                style={[
                  styles.radio,
                  { borderColor: isSelected ? option.dotColor : colors.inkMuted },
                ]}
              >
                {isSelected ? (
                  <View
                    style={[styles.radioFill, { backgroundColor: option.dotColor }]}
                  />
                ) : null}
              </View>
            </View>

            <Text style={styles.cardDescription}>{option.description}</Text>

            {isSelected ? (
              <View style={[styles.slaStrip, { borderColor: option.borderColor }]}>
                <Text style={[styles.slaText, { color: option.accentColor }]}>
                  {option.helper}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>You can change this before payment.</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.nextBtn,
          canProceed ? styles.nextBtnEnabled : styles.nextBtnDisabled,
          !canProceed && styles.nextBtnDisabled,
        ]}
        onPress={handleNext}
        activeOpacity={0.9}
        disabled={!canProceed}
      >
        <Text style={styles.nextBtnText}>{getButtonLabel(selected)}</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  heading: {
    paddingTop: 20,
    paddingBottom: SPACING.md,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: FONT.black,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  headingSubtitle: {
    fontSize: 14,
    color: colors.inkSecondary,
    marginTop: 4,
  },

  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  servicePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  servicePillText: {
    fontSize: 12,
    fontWeight: FONT.bold,
    marginLeft: 6,
    maxWidth: 150,
    color: colors.primary,
  },
  problemPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryMid,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
    maxWidth: '100%',
  },
  problemPillText: {
    fontSize: 12,
    color: colors.inkSecondary,
    fontWeight: FONT.medium,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.md,
    marginBottom: 12,
    position: 'relative',
    ...SHADOW.card,
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: FONT.bold,
    letterSpacing: 0.5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  cardTopText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: colors.ink,
  },
  cardSublabel: {
    fontSize: 13,
    color: colors.inkSecondary,
    marginTop: 2,
    fontWeight: FONT.medium,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },
  slaStrip: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  slaText: {
    fontSize: 13,
    fontWeight: FONT.semibold,
  },

  infoBox: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMid,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: FONT.medium,
    lineHeight: 17,
  },

  nextBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  nextBtnEnabled: {
    backgroundColor: PROFILE_BRAND_ORANGE,
    shadowColor: PROFILE_BRAND_ORANGE,
    shadowOpacity: 0.35,
    elevation: 6,
  },
  nextBtnDisabled: {
    backgroundColor: colors.inkMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: FONT.bold,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 32,
  },
});

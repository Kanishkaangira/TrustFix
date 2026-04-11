import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  getProblemsForService,
  subscribeToServiceCatalog,
} from '../../state/serviceStore';
import { FONT, RADIUS, SHADOW, SPACING, getThemeColors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeProvider';

const PROFILE_BRAND_ORANGE = '#FF6B2B';

const PROBLEM_ICON_MAP = {
  not_cooling: 'thermometer',
  water_leaking: 'water',
  noisy_unit: 'volume-high',
  wont_start: 'power',
  poor_airflow: 'weather-windy',
  gas_refill: 'snowflake',
  no_power: 'power-plug',
  short_circuit: 'flash',
  fan_not_working: 'fan',
  switch_sparking: 'alert',
  flickering: 'lightbulb',
  wiring_issue: 'tools',
  pipe_leakage: 'pipe-wrench',
  blocked_drain: 'shower',
  no_water: 'water',
  tap_dripping: 'faucet',
  toilet_issue: 'toilet',
  water_heater: 'fire',
  washing_machine: 'washing-machine',
  fridge: 'fridge',
  microwave: 'microwave',
  geyser: 'fire',
  tv: 'television',
  chimney: 'home',
  door_repair: 'door',
  furniture_fix: 'sofa',
  window_repair: 'window-open',
  cabinet_install: 'archive',
  lock_repair: 'lock',
  custom_work: 'hammer',
  full_home: 'home',
  kitchen: 'silverware-fork-knife',
  bathroom: 'shower',
  sofa: 'sofa',
  carpet: 'shape',
  post_construct: 'hammer',
};

const SEVERITY_META = {
  urgent: {
    label: 'Urgent',
    chip: 'Priority visit',
    tone: '#B45309',
    bg: '#FEF3C7',
  },
  moderate: {
    label: 'Moderate',
    chip: 'Same-day ready',
    tone: '#2563EB',
    bg: '#DBEAFE',
  },
  minor: {
    label: 'Minor',
    chip: 'Quick fix',
    tone: '#0F766E',
    bg: '#CCFBF1',
  },
};

const getProblemIconName = (problem) => (
  problem?.iconName || PROBLEM_ICON_MAP[problem?.id] || 'tools'
);

const getSeverityMeta = (severity, colors) => (
  SEVERITY_META[severity] || {
    label: 'Moderate',
    chip: 'Standard service',
    tone: colors.inkSecondary,
    bg: colors.surfaceMuted,
  }
);

export default function SelectProblem({ service, onNext }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [customText, setCustomText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [problems, setProblems] = useState(() => getProblemsForService(service?.id));
  const serviceAccent = service?.accentColor || colors.primary;
  const serviceSoft = service?.lightColor || colors.primaryLight;
  const serviceLabel = service?.label || 'Home Service';
  const finalProblem = selectedProblem;
  const finalCustom = customText.trim();
  const canProceed = selectedProblem !== null || finalCustom.length > 0;
  const helperText = customText.length > 10
    ? 'AI will review this note and help match the best fix.'
    : 'Tip: mention leaks, sounds, smells, or when the issue started.';

  useEffect(() => {
    setProblems(getProblemsForService(service?.id));
  }, [service?.id]);

  useEffect(() => subscribeToServiceCatalog(() => {
    setProblems(getProblemsForService(service?.id));
  }), [service?.id]);

  const handleChipPress = (problem) => {
    setSelectedProblem((prev) => (prev?.id === problem.id ? null : problem));
    setCustomText('');
  };

  const handleCustomChange = (text) => {
    setCustomText(text);
    if (text.length > 0) {
      setSelectedProblem(null);
    }
  };

  const handleNext = () => {
    if (!canProceed) {
      return;
    }

    onNext(finalProblem, finalCustom);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <View style={[styles.heroOrbPrimary, { backgroundColor: serviceSoft }]} />
            <View style={[styles.heroOrbSecondary, { backgroundColor: serviceSoft }]} />

            <Text style={styles.heroTitle}>Choose the problem</Text>
            <Text style={styles.heroSubtitle}>
              Pick the closest issue so we can prepare the right technician, tools,
              and urgency flow before the visit.
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{problems.length}</Text>
                <Text style={styles.heroStatLabel}>guided options</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>30 sec</Text>
                <Text style={styles.heroStatLabel}>to finish</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>AI</Text>
                <Text style={styles.heroStatLabel}>note assist</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionLabel}>COMMON ISSUES</Text>
            <Text style={styles.sectionTitle}>What should we prepare for?</Text>
          </View>
          <View style={[styles.sectionCount, { backgroundColor: serviceSoft }]}>
            <Text style={[styles.sectionCountText, { color: serviceAccent }]}>
              {problems.length}
            </Text>
          </View>
        </View>

        <View style={styles.problemList}>
          {problems.length > 0 ? (
            problems.map((item) => {
              const isSelected = selectedProblem?.id === item.id;
              const severityMeta = getSeverityMeta(item.defaultSeverity, colors);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.problemCard,
                    isSelected && {
                      borderColor: serviceAccent,
                      shadowColor: serviceAccent,
                      shadowOpacity: 0.1,
                    },
                  ]}
                  onPress={() => handleChipPress(item)}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.problemAccentBar,
                      { backgroundColor: isSelected ? serviceAccent : serviceSoft },
                    ]}
                  />

                  <View style={styles.problemRow}>
                    <View
                      style={[
                        styles.problemIconWrap,
                        { backgroundColor: isSelected ? serviceSoft : colors.surfaceMuted },
                      ]}
                    >
                      <Icon
                        name={getProblemIconName(item)}
                        size={22}
                        color={serviceAccent}
                      />
                    </View>

                    <View style={styles.problemCopy}>
                      <View style={styles.problemTitleRow}>
                        <Text
                          style={[
                            styles.problemTitle,
                            isSelected && { color: serviceAccent },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>

                        {severityMeta.label ? (
                          <View
                            style={[
                              styles.problemTag,
                              { backgroundColor: isSelected ? serviceSoft : colors.backgroundAlt },
                            ]}
                          >
                            <Text
                              style={[
                                styles.problemTagText,
                                { color: isSelected ? serviceAccent : colors.inkSecondary },
                              ]}
                            >
                              {severityMeta.label}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.selectorRing,
                        isSelected && {
                          borderColor: serviceAccent,
                          backgroundColor: serviceAccent,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <Icon name="check" size={12} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.problemFooter}>
                    <View
                      style={[
                        styles.severityChip,
                        { backgroundColor: severityMeta.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityChipText,
                          { color: severityMeta.tone },
                        ]}
                      >
                        {severityMeta.chip}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.problemFooterText,
                        isSelected
                          ? { color: serviceAccent, fontWeight: FONT.bold }
                          : styles.problemFooterTextMuted,
                      ]}
                    >
                      {isSelected ? 'Selected' : 'Tap to choose'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No quick picks yet</Text>
              <Text style={styles.emptyText}>
                Describe the issue below and we will still guide you to the next step.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.customSection}>
          <Text style={styles.sectionLabel}>DESCRIBE IT YOURSELF</Text>
          <Text style={styles.customTitle}>Need to explain it in your own words?</Text>
          <Text style={styles.customSubtitle}>
            Add a short note if needed.
          </Text>

          <View
            style={[
              styles.inputCard,
              (isInputFocused || customText.length > 0) && {
                borderColor: serviceAccent,
                shadowColor: serviceAccent,
                shadowOpacity: 0.08,
              },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder={`Tell us more about the ${serviceLabel.toLowerCase()} issue...`}
              placeholderTextColor={colors.inkMuted}
              value={customText}
              onChangeText={handleCustomChange}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              multiline
              maxLength={200}
              returnKeyType="done"
              textAlignVertical="top"
            />

            <View style={styles.inputFooter}>
              <Text style={styles.inputHint}>{helperText}</Text>
              <Text style={styles.charCount}>{customText.length}/200</Text>
            </View>
          </View>
        </View>

        {customText.length > 10 ? (
          <View style={styles.aiCard}>
            <View style={styles.aiIconWrap}>
              <Icon name="robot-outline" size={16} color={colors.success} />
            </View>
            <View style={styles.aiCopy}>
              <Text style={styles.aiTitle}>AI assist is ready</Text>
              <Text style={styles.aiText}>
                We will use your note to suggest the right fix in the next steps.
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.9}
          disabled={!canProceed}
        >
          <Text style={styles.nextBtnText}>Continue to urgency</Text>
          <Icon
            name="arrow-right"
            size={18}
            color="#FFFFFF"
            style={styles.nextBtnIcon}
          />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: 14,
    paddingBottom: 28,
  },
  heroWrap: {
    marginBottom: 18,
    borderRadius: 26,
    ...SHADOW.elevated,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  heroOrbPrimary: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -48,
    right: -34,
    opacity: 0.7,
  },
  heroOrbSecondary: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    bottom: -24,
    right: 42,
    opacity: 0.55,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: colors.ink,
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkSecondary,
    marginTop: 10,
    marginBottom: 18,
    maxWidth: '90%',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: FONT.black,
    color: colors.ink,
    marginBottom: 3,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: FONT.medium,
    color: colors.inkMuted,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: colors.inkMuted,
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: FONT.black,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sectionCount: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: {
    fontSize: 16,
    fontWeight: FONT.black,
  },
  problemList: {
    marginBottom: 22,
  },
  problemCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 12,
    ...SHADOW.card,
  },
  problemAccentBar: {
    width: 42,
    height: 4,
    borderRadius: RADIUS.full,
    marginBottom: 12,
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  problemIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  problemCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  problemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  problemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: FONT.bold,
    color: colors.ink,
    marginRight: 8,
  },
  problemTag: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  problemTagText: {
    fontSize: 10,
    fontWeight: FONT.bold,
  },
  selectorRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  problemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  severityChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  severityChipText: {
    fontSize: 10,
    fontWeight: FONT.bold,
  },
  problemFooterText: {
    fontSize: 11,
  },
  problemFooterTextMuted: {
    color: colors.inkMuted,
    fontWeight: FONT.medium,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: colors.ink,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkSecondary,
  },
  customSection: {
    marginBottom: 14,
  },
  customTitle: {
    fontSize: 22,
    fontWeight: FONT.black,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  customSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSecondary,
    marginTop: 6,
    marginBottom: 12,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    minHeight: 154,
    ...SHADOW.card,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
    minHeight: 92,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inputHint: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
    paddingRight: 10,
  },
  charCount: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: FONT.medium,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.isDark ? colors.success : '#D7EEE1',
    marginBottom: 16,
  },
  aiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  aiCopy: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: FONT.bold,
    color: colors.success,
    marginBottom: 2,
  },
  aiText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.success,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PROFILE_BRAND_ORANGE,
    borderRadius: 18,
    paddingVertical: 17,
    marginTop: 2,
    ...SHADOW.cta,
    shadowColor: PROFILE_BRAND_ORANGE,
  },
  nextBtnDisabled: {
    backgroundColor: colors.inkMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: FONT.bold,
    letterSpacing: 0.2,
  },
  nextBtnIcon: {
    marginLeft: 8,
  },
});

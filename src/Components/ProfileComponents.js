import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme/ThemeProvider';

export const getProfileColors = (isDark = false) => ({
  brand: '#FF6B2B',
  brandSoft: isDark ? '#231B18' : '#FFF0E8',
  brandMid: isDark ? 'rgba(255,122,69,0.28)' : 'rgba(255,107,43,0.15)',
  bg: isDark ? '#0B1016' : '#F7F8FA',
  bgAlt: isDark ? '#111821' : '#F3F4F8',
  surface: isDark ? '#141B23' : '#FFFFFF',
  surfaceSoft: isDark ? '#1A2430' : '#FBFCFE',
  surfaceRaised: isDark ? '#1F2A36' : '#FFFFFF',
  ink: isDark ? '#F5F7FB' : '#111318',
  inkMid: isDark ? '#D7DEE8' : '#3D3D3D',
  muted: isDark ? '#93A1B4' : '#8A8FA8',
  border: isDark ? '#243140' : '#ECEEF2',
  divider: isDark ? '#1C2733' : '#F0F1F5',
  green: isDark ? '#39C37A' : '#1A7A4A',
  greenSoft: isDark ? '#173526' : '#EBF7F1',
  blue: isDark ? '#5BA4E6' : '#1D6FA4',
  blueSoft: isDark ? '#162B3C' : '#EBF4FA',
  red: isDark ? '#FF7A7A' : '#C0392B',
  redSoft: isDark ? '#391F24' : '#FDECEA',
  yellow: isDark ? '#F4A340' : '#B45309',
  yellowSoft: isDark ? '#362914' : '#FEF3C7',
  headerAccent: isDark ? '#111821' : '#FF6B2B',
  headerAccentSoft: isDark ? '#182231' : '#FF8653',
  headerPill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.16)',
  glow: isDark ? 'rgba(255,122,69,0.18)' : 'rgba(255,107,43,0.18)',
  white: '#FFFFFF',
  shadow: isDark ? '#000000' : '#111318',
  isDark,
});

export const PC = getProfileColors(false);

export const useProfileColors = () => {
  const { isDark } = useAppTheme();
  return useMemo(() => getProfileColors(isDark), [isDark]);
};

export const StatusChip = ({ label, variant = 'brand' }) => {
  const colors = useProfileColors();
  const styles = useMemo(() => createChipStyles(colors), [colors]);
  const map = {
    brand: { bg: colors.brandSoft, color: colors.brand },
    green: { bg: colors.greenSoft, color: colors.green },
    blue: { bg: colors.blueSoft, color: colors.blue },
    red: { bg: colors.redSoft, color: colors.red },
    yellow: { bg: colors.yellowSoft, color: colors.yellow },
  };
  const resolved = map[variant] || map.brand;

  return (
    <View style={[styles.wrap, { backgroundColor: resolved.bg }]}>
      <Text style={[styles.text, { color: resolved.color }]}>{label}</Text>
    </View>
  );
};

export const SectionLabel = ({ title }) => {
  const colors = useProfileColors();
  const styles = useMemo(() => createSectionLabelStyles(colors), [colors]);
  return <Text style={styles.text}>{title}</Text>;
};

export const SettingRow = ({
  iconBg,
  IconComponent,
  title,
  subtitle,
  rightChip,
  rightChipVariant,
  rightValue,
  showChevron = true,
  onPress,
  showToggle = false,
  toggleValue,
  onToggle,
  danger = false,
}) => {
  const colors = useProfileColors();
  const styles = useMemo(() => createSettingRowStyles(colors), [colors]);
  const resolvedIconBg = iconBg || colors.brandSoft;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.iconBox, { backgroundColor: resolvedIconBg }]}>
        {IconComponent ? (
          <IconComponent />
        ) : (
          <View style={styles.iconFallback} />
        )}
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.title, danger && { color: colors.red }]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>
        {rightChip ? (
          <StatusChip label={rightChip} variant={rightChipVariant || 'brand'} />
        ) : null}
        {rightValue ? <Text style={styles.rightVal}>{rightValue}</Text> : null}
        {showToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.border}
          />
        ) : showChevron ? (
          <View style={styles.chevronWrap}>
            <View style={styles.chevron} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export const RowDivider = () => {
  const colors = useProfileColors();
  const styles = useMemo(() => createDividerStyles(colors), [colors]);
  return <View style={styles.line} />;
};

export const SettingsCard = ({ children, style }) => {
  const colors = useProfileColors();
  const styles = useMemo(() => createSettingsCardStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
};

export const SubScreenShell = ({
  title,
  onBack,
  rightAction,
  accentHeader = false,
  titleNearBack = false,
  titleLarge = false,
  children,
}) => {
  const colors = useProfileColors();
  const styles = useMemo(() => createShellStyles(colors), [colors]);

  return (
    <SafeAreaView
      style={[
        styles.safe,
        accentHeader && { backgroundColor: colors.headerAccent },
      ]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          accentHeader && styles.headerAccent,
          titleNearBack && styles.headerStart,
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, accentHeader && styles.backBtnAccent]}
          activeOpacity={0.6}
        >
          <View
            style={[styles.chevronLeft, accentHeader && styles.chevronWhite]}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            accentHeader && styles.titleWhite,
            titleNearBack && styles.titleNearBack,
            titleLarge && styles.titleLarge,
          ]}
        >
          {title}
        </Text>

        <View style={styles.rightSlot}>{rightAction || null}</View>
      </View>

      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
};

const createChipStyles = () =>
  StyleSheet.create({
    wrap: {
      borderRadius: 100,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    text: {
      fontSize: 11,
      fontWeight: '700',
    },
  });

const createSectionLabelStyles = colors =>
  StyleSheet.create({
    text: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: colors.muted,
      marginTop: 24,
      marginBottom: 10,
      marginHorizontal: 16,
    },
  });

const createSettingRowStyles = colors =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    iconFallback: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    textBlock: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
      lineHeight: 20,
    },
    subtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 16,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginLeft: 8,
    },
    rightVal: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    chevronWrap: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: {
      width: 7,
      height: 7,
      borderTopWidth: 1.5,
      borderRightWidth: 1.5,
      borderColor: colors.muted,
      transform: [{ rotate: '45deg' }],
    },
  });

const createDividerStyles = colors =>
  StyleSheet.create({
    line: {
      height: 1,
      backgroundColor: colors.divider,
      marginLeft: 70,
    },
  });

const createSettingsCardStyles = colors =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: colors.isDark ? 0.24 : 0.05,
      shadowRadius: 14,
      elevation: 3,
    },
  });

const createShellStyles = colors =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerAccent: {
      backgroundColor: colors.headerAccent,
      borderBottomColor: colors.isDark ? colors.border : 'transparent',
    },
    headerStart: {
      justifyContent: 'flex-start',
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    backBtnAccent: {
      backgroundColor: colors.headerPill,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'transparent',
    },
    chevronLeft: {
      width: 9,
      height: 9,
      borderLeftWidth: 2,
      borderBottomWidth: 2,
      borderColor: colors.ink,
      transform: [{ rotate: '45deg' }],
      marginLeft: 4,
    },
    chevronWhite: {
      borderColor: colors.white,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
      letterSpacing: 0.1,
    },
    titleNearBack: {
      marginLeft: 8,
      flex: 1,
      textAlign: 'left',
    },
    titleLarge: {
      fontSize: 20,
    },
    titleWhite: {
      color: colors.white,
    },
    rightSlot: {
      width: 96,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      backgroundColor: colors.bg,
    },
  });

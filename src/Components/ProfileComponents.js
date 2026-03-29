// src/Components/ProfileComponents.js
// Shared design tokens + reusable UI components for all ProfileFlow screens
// Import path from ProfileFlow screens: ../../Components/ProfileComponents

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Color tokens ─────────────────────────────────────────────────────────────
export const PC = {
  brand:      '#FF6B2B',
  brandSoft:  '#FFF0E8',
  brandMid:   'rgba(255,107,43,0.15)',
  bg:         '#F7F8FA',
  surface:    '#FFFFFF',
  ink:        '#111318',
  inkMid:     '#3D3D3D',
  muted:      '#8A8FA8',
  border:     '#ECEEF2',
  divider:    '#F0F1F5',
  green:      '#1A7A4A',
  greenSoft:  '#EBF7F1',
  blue:       '#1D6FA4',
  blueSoft:   '#EBF4FA',
  red:        '#C0392B',
  redSoft:    '#FDECEA',
  yellow:     '#B45309',
  yellowSoft: '#FEF3C7',
  white:      '#FFFFFF',
};

// ─── Status chip ──────────────────────────────────────────────────────────────
export const StatusChip = ({ label, variant = 'brand' }) => {
  const MAP = {
    brand:  { bg: PC.brandSoft,  color: PC.brand  },
    green:  { bg: PC.greenSoft,  color: PC.green  },
    blue:   { bg: PC.blueSoft,   color: PC.blue   },
    red:    { bg: PC.redSoft,    color: PC.red    },
    yellow: { bg: PC.yellowSoft, color: PC.yellow },
  };
  const v = MAP[variant] || MAP.brand;
  return (
    <View style={[chip.wrap, { backgroundColor: v.bg }]}>
      <Text style={[chip.text, { color: v.color }]}>{label}</Text>
    </View>
  );
};
const chip = StyleSheet.create({
  wrap: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── Section label ────────────────────────────────────────────────────────────
export const SectionLabel = ({ title }) => (
  <Text style={sl.text}>{title}</Text>
);
const sl = StyleSheet.create({
  text: {
    fontSize:         10,
    fontWeight:       '800',
    letterSpacing:    1.4,
    color:            PC.muted,
    marginTop:        24,
    marginBottom:     10,
    marginHorizontal: 16,
  },
});

// ─── Setting row ──────────────────────────────────────────────────────────────
export const SettingRow = ({
  iconBg = PC.brandSoft,
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
}) => (
  <TouchableOpacity style={sr.row} onPress={onPress} activeOpacity={0.72}>
    {/* Icon box */}
    <View style={[sr.iconBox, { backgroundColor: iconBg }]}>
      {IconComponent
        ? <IconComponent />
        : <View style={sr.iconFallback} />}
    </View>

    {/* Text */}
    <View style={sr.textBlock}>
      <Text style={[sr.title, danger && { color: PC.red }]}>{title}</Text>
      {subtitle ? <Text style={sr.subtitle}>{subtitle}</Text> : null}
    </View>

    {/* Right */}
    <View style={sr.right}>
      {rightChip  && <StatusChip label={rightChip} variant={rightChipVariant || 'brand'} />}
      {rightValue && <Text style={sr.rightVal}>{rightValue}</Text>}
      {showToggle
        ? <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: PC.border, true: PC.brand }}
            thumbColor={PC.white}
            ios_backgroundColor={PC.border}
          />
        : showChevron
          ? <View style={sr.chevronWrap}><View style={sr.chevron} /></View>
          : null}
    </View>
  </TouchableOpacity>
);

const sr = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  iconBox: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    14,
  },
  iconFallback: {
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: PC.border,
  },
  textBlock: { flex: 1 },
  title: {
    fontSize:   14,
    fontWeight: '600',
    color:      PC.ink,
    lineHeight: 20,
  },
  subtitle: {
    fontSize:  12,
    color:     PC.muted,
    marginTop:  2,
    lineHeight: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            6,
    marginLeft:     8,
  },
  rightVal: {
    fontSize:   12,
    color:      PC.muted,
    fontWeight: '600',
  },
  chevronWrap: {
    width:  20,
    height: 20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  chevron: {
    width:             7,
    height:            7,
    borderTopWidth:    1.5,
    borderRightWidth:  1.5,
    borderColor:       PC.muted,
    transform:         [{ rotate: '45deg' }],
  },
});

// ─── Row divider ──────────────────────────────────────────────────────────────
export const RowDivider = () => <View style={rd.line} />;
const rd = StyleSheet.create({
  line: {
    height:          1,
    backgroundColor: PC.divider,
    marginLeft:      70,
  },
});

// ─── Settings card ────────────────────────────────────────────────────────────
export const SettingsCard = ({ children, style }) => (
  <View style={[sc.card, style]}>{children}</View>
);
const sc = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor:  PC.surface,
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      PC.border,
    overflow:         'hidden',
    shadowColor:      '#111318',
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.05,
    shadowRadius:     8,
    elevation:        2,
  },
});

// ─── Sub-screen shell ─────────────────────────────────────────────────────────
// Wraps every sub-screen with a consistent header + safe area
export const SubScreenShell = ({
  title,
  onBack,
  rightAction,
  accentHeader = false,
  titleNearBack = false,
  titleLarge = false,
  children,
}) => (
  <SafeAreaView
    style={[shell.safe, accentHeader && { backgroundColor: PC.brand }]}
    edges={['top']}
  >
    {/* Header */}
    <View style={[shell.header, accentHeader && shell.headerAccent, titleNearBack && shell.headerStart]}>
      <TouchableOpacity onPress={onBack} style={shell.backBtn} activeOpacity={0.6}>
        <View style={[shell.chevronLeft, accentHeader && shell.chevronWhite]} />
      </TouchableOpacity>

      <Text
        style={[
          shell.title,
          accentHeader && shell.titleWhite,
          titleNearBack && shell.titleNearBack,
          titleLarge && shell.titleLarge,
        ]}
      >
        {title}
      </Text>

      <View style={shell.rightSlot}>
        {rightAction || null}
      </View>
    </View>

    {/* Content */}
    <View style={shell.body}>{children}</View>
  </SafeAreaView>
);

const shell = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: PC.surface,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    backgroundColor:   PC.surface,
    borderBottomWidth: 1,
    borderBottomColor: PC.border,
  },
  headerAccent: {
    backgroundColor:   PC.brand,
    borderBottomColor: 'transparent',
  },
  headerStart: {
    justifyContent: 'flex-start',
  },
  backBtn: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  chevronLeft: {
    width:             9,
    height:            9,
    borderLeftWidth:   2,
    borderBottomWidth: 2,
    borderColor:       PC.ink,
    transform:         [{ rotate: '45deg' }],
    marginLeft:        4,
  },
  chevronWhite: {
    borderColor: PC.white,
  },
  title: {
    fontSize:      16,
    fontWeight:    '700',
    color:         PC.ink,
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
    color: PC.white,
  },
  rightSlot: {
    width:          96,
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  body: {
    flex:            1,
    backgroundColor: PC.bg,
  },
});

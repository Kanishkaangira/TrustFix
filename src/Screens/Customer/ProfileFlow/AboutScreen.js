import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  SectionLabel,
  SettingRow,
  RowDivider,
  SettingsCard,
  SubScreenShell,
  useProfileColors,
} from '../../../Components/ProfileComponents';

const { width } = Dimensions.get('window');

const STATS = [
  { num: '50K+', label: 'Customers' },
  { num: '1200+', label: 'Technicians' },
  { num: '28', label: 'Cities' },
];

const VALUES = [
  { label: 'Verified Pros', desc: 'Background-checked technicians' },
  { label: 'Fast Response', desc: '2-hour slots, same day' },
  { label: 'Transparent', desc: 'Upfront pricing, no surprises' },
  { label: 'Trust First', desc: 'Money-back guarantee' },
];

const LEGAL = ['Terms of Service', 'Privacy Policy', 'Rate Us on Play Store'];

export default function AboutScreen({ onBack }) {
  const colors = useProfileColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="About TrustFix"
        onBack={onBack}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.hero}>
            <Text style={styles.logoText}>
              Trust<Text style={styles.logoTextAccent}>Fix</Text>
            </Text>
            <Text style={styles.tagline}>Your Home, In Safe Hands.</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v2.1.0</Text>
            </View>
          </View>

          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              TrustFix connects homeowners with verified, skilled technicians
              for appliance repair and home maintenance, making every service
              transparent, fast, and trustworthy.
            </Text>
          </View>

          <View style={styles.statsRow}>
            {STATS.map(stat => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statNum}>{stat.num}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <SectionLabel title="WHAT WE STAND FOR" />
          <View style={styles.valuesGrid}>
            {VALUES.map(value => (
              <View key={value.label} style={styles.valueCard}>
                <View style={styles.valueDot} />
                <Text style={styles.valueLabel}>{value.label}</Text>
                <Text style={styles.valueDesc}>{value.desc}</Text>
              </View>
            ))}
          </View>

          <SectionLabel title="LEGAL" />
          <SettingsCard>
            {LEGAL.map((item, index) => (
              <View key={item}>
                <SettingRow title={item} onPress={() => {}} />
                {index < LEGAL.length - 1 ? <RowDivider /> : null}
              </View>
            ))}
          </SettingsCard>

          <Text style={styles.footer}>
            Made in India | Copyright 2026 TrustFix Pvt. Ltd.
          </Text>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    hero: {
      backgroundColor: colors.headerAccent,
      paddingVertical: 34,
      alignItems: 'center',
    },
    logoText: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: -1,
    },
    logoTextAccent: {
      color: colors.isDark ? '#FF9D74' : 'rgba(255,255,255,0.72)',
    },
    tagline: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 6,
    },
    versionBadge: {
      marginTop: 12,
      backgroundColor: colors.headerPill,
      borderRadius: 100,
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'transparent',
    },
    versionText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '700',
    },
    missionCard: {
      marginHorizontal: 16,
      marginTop: -20,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.isDark ? colors.border : colors.brandMid,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: colors.isDark ? 0.28 : 0.08,
      shadowRadius: 18,
      elevation: 4,
      zIndex: 5,
    },
    missionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 8,
    },
    missionText: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      gap: 10,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.brandSoft,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.isDark ? colors.border : colors.brandMid,
    },
    statNum: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.brand,
    },
    statLabel: {
      fontSize: 10,
      color: colors.muted,
      fontWeight: '600',
      marginTop: 2,
    },
    valuesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: 16,
      gap: 10,
    },
    valueCard: {
      width: (width - 16 * 2 - 10) / 2,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    valueDot: {
      width: 24,
      height: 24,
      borderRadius: 7,
      backgroundColor: colors.brandSoft,
      marginBottom: 10,
    },
    valueLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 3,
    },
    valueDesc: {
      fontSize: 11,
      color: colors.muted,
      lineHeight: 15,
    },
    footer: {
      textAlign: 'center',
      fontSize: 11,
      color: colors.muted,
      paddingTop: 24,
      paddingBottom: 8,
    },
  });

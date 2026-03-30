import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  PC,
  SectionLabel,
  SettingRow,
  RowDivider,
  SettingsCard,
  SubScreenShell,
} from '../../Components/ProfileComponents';

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

const LEGAL = [
  'Terms of Service',
  'Privacy Policy',
  'Rate Us on Play Store',
];

export default function AboutScreen({ onBack }) {
  return (
    <ScreenWrapper topColor={PC.brand} bottomColor={PC.bg} statusBarStyle="light-content">
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
              Trust<Text style={{ opacity: 0.6 }}>Fix</Text>
            </Text>
            <Text style={styles.tagline}>Your Home, In Safe Hands.</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v2.1.0</Text>
            </View>
          </View>

          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              TrustFix connects homeowners with verified, skilled technicians for appliance repair and home maintenance, making every service transparent, fast, and trustworthy.
            </Text>
          </View>

          <View style={styles.statsRow}>
            {STATS.map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <SectionLabel title="WHAT WE STAND FOR" />
          <View style={styles.valuesGrid}>
            {VALUES.map(v => (
              <View key={v.label} style={styles.valueCard}>
                <View style={styles.valueDot} />
                <Text style={styles.valueLabel}>{v.label}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            ))}
          </View>

          <SectionLabel title="LEGAL" />
          <SettingsCard>
            {LEGAL.map((l, i) => (
              <View key={l}>
                <SettingRow title={l} onPress={() => {}} />
                {i < LEGAL.length - 1 && <RowDivider />}
              </View>
            ))}
          </SettingsCard>

          <Text style={styles.footer}>
            Made in India · © 2026 TrustFix Pvt. Ltd.
          </Text>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: PC.brand,
    paddingVertical: 32,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: PC.white,
    letterSpacing: -1,
  },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  versionBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  versionText: { color: PC.white, fontSize: 12, fontWeight: '700' },

  missionCard: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: PC.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.12)',
    shadowColor: PC.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    zIndex: 5,
  },
  missionTitle: { fontSize: 15, fontWeight: '700', color: PC.ink, marginBottom: 8 },
  missionText: { fontSize: 13, color: PC.muted, lineHeight: 20 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: PC.brandSoft,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.12)',
  },
  statNum: { fontSize: 20, fontWeight: '800', color: PC.brand },
  statLabel: { fontSize: 10, color: PC.muted, fontWeight: '600', marginTop: 2 },

  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 10,
  },
  valueCard: {
    width: (width - 16 * 2 - 10) / 2,
    backgroundColor: PC.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PC.border,
  },
  valueDot: { width: 24, height: 24, borderRadius: 7, backgroundColor: PC.brandSoft, marginBottom: 10 },
  valueLabel: { fontSize: 13, fontWeight: '700', color: PC.ink, marginBottom: 3 },
  valueDesc: { fontSize: 11, color: PC.muted, lineHeight: 15 },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: PC.muted,
    paddingTop: 24,
    paddingBottom: 8,
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { PC, SubScreenShell } from '../../Components/ProfileComponents';

const PLATFORMS = ['WhatsApp', 'Facebook', 'Telegram', 'SMS'];

export default function ShareScreen({ onBack }) {
  return (
    <ScreenWrapper topColor={PC.brand} bottomColor={PC.bg} statusBarStyle="light-content">
      <SubScreenShell
        title="Share TrustFix"
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
            <View style={styles.heroIconBox}>
              <View style={styles.upArrow} />
              <View style={styles.upLine} />
            </View>
            <Text style={styles.heroTitle}>Invite Friends & Earn</Text>
            <Text style={styles.heroSub}>
              Get ₹150 TrustFix Credits for every friend who books their first service
            </Text>
          </View>

          <View style={styles.refCard}>
            <Text style={styles.refLabel}>YOUR REFERRAL CODE</Text>
            <View style={styles.refRow}>
              <View style={styles.refCodeBox}>
                <Text style={styles.refCode}>RAHUL150</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} activeOpacity={0.8}>
                <Text style={styles.copyText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rewardRow}>
              <View style={styles.rewardDot} />
              <Text style={styles.rewardText}>
                You've earned ₹450 from 3 referrals so far
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>SHARE VIA</Text>
          <View style={styles.platformsRow}>
            {PLATFORMS.map(p => (
              <TouchableOpacity key={p} style={styles.platformBtn} activeOpacity={0.8}>
                <View style={styles.platformIcon} />
                <Text style={styles.platformName}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.linkCard}>
            <Text style={styles.linkText} numberOfLines={1}>
              https://trustfix.in/ref/RAHUL150
            </Text>
            <TouchableOpacity style={styles.linkCopyBtn} activeOpacity={0.8}>
              <Text style={styles.linkCopyText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: PC.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: PC.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  upArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: PC.white,
  },
  upLine: {
    width: 3,
    height: 14,
    backgroundColor: PC.white,
    borderRadius: 2,
    marginTop: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PC.ink,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: PC.muted,
    lineHeight: 19,
    textAlign: 'center',
  },

  refCard: {
    marginHorizontal: 16,
    backgroundColor: PC.brand,
    borderRadius: 20,
    padding: 20,
    shadowColor: PC.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  refCodeBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
  },
  refCode: {
    fontSize: 18,
    fontWeight: '800',
    color: PC.white,
    letterSpacing: 3,
  },
  copyBtn: {
    backgroundColor: PC.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  copyText: { color: PC.brand, fontWeight: '700', fontSize: 13 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rewardDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  rewardText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PC.muted,
    letterSpacing: 1.4,
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  platformsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  platformBtn: {
    flex: 1,
    backgroundColor: PC.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PC.border,
  },
  platformIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PC.brandSoft,
    marginBottom: 6,
  },
  platformName: { fontSize: 10, fontWeight: '700', color: PC.muted },

  linkCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: PC.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PC.border,
    gap: 10,
  },
  linkText: { flex: 1, fontSize: 12, color: PC.muted, fontFamily: 'monospace' },
  linkCopyBtn: { backgroundColor: PC.brandSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  linkCopyText: { color: PC.brand, fontWeight: '700', fontSize: 12 },
});

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  SubScreenShell,
  useProfileColors,
} from '../../../Components/ProfileComponents';

const PLATFORMS = ['WhatsApp', 'Facebook', 'Telegram', 'SMS'];

export default function ShareScreen({ onBack }) {
  const colors = useProfileColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
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
            <Text style={styles.heroTitle}>Invite Friends and Earn</Text>
            <Text style={styles.heroSub}>
              Get INR 150 TrustFix credits for every friend who books their
              first service.
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
                You've earned INR 450 from 3 referrals so far.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>SHARE VIA</Text>
          <View style={styles.platformsRow}>
            {PLATFORMS.map(platform => (
              <TouchableOpacity
                key={platform}
                style={styles.platformBtn}
                activeOpacity={0.8}
              >
                <View style={styles.platformIcon} />
                <Text style={styles.platformName}>{platform}</Text>
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

const createStyles = colors =>
  StyleSheet.create({
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
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: colors.brand,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: colors.isDark ? 0.34 : 0.3,
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
      borderBottomColor: colors.white,
    },
    upLine: {
      width: 3,
      height: 14,
      backgroundColor: colors.white,
      borderRadius: 2,
      marginTop: 2,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.ink,
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    heroSub: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 19,
      textAlign: 'center',
    },
    refCard: {
      marginHorizontal: 16,
      backgroundColor: colors.headerAccent,
      borderRadius: 20,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.isDark ? 0.28 : 0.18,
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
      backgroundColor: colors.headerPill,
      borderWidth: 1.5,
      borderColor: colors.isDark
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255,255,255,0.35)',
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 12,
    },
    refCode: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: 3,
    },
    copyBtn: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    copyText: {
      color: colors.brand,
      fontWeight: '700',
      fontSize: 13,
    },
    rewardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rewardDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
    rewardText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.muted,
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
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    platformIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.brandSoft,
      marginBottom: 6,
    },
    platformName: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.muted,
    },
    linkCard: {
      marginHorizontal: 16,
      marginTop: 14,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    linkText: {
      flex: 1,
      fontSize: 12,
      color: colors.muted,
      fontFamily: 'monospace',
    },
    linkCopyBtn: {
      backgroundColor: colors.brandSoft,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    linkCopyText: {
      color: colors.brand,
      fontWeight: '700',
      fontSize: 12,
    },
  });

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { jobDetail, safetyOtp } from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechCard,
  TechGradientButton,
} from '../../technician/components/TechUi';

export default function TechnicianSafetyOtpScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.emerald}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#10D9A0', '#0AB984']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroIcon}>🔒</Text>
            <Text style={styles.heroTitle}>Safety Verification</Text>
            <Text style={styles.heroSubtitle}>
              Ask customer for their OTP to confirm arrival
            </Text>
          </LinearGradient>

          <TechCard style={styles.arrivalCard}>
            <LinearGradient
              colors={['#FF6B35', '#FF9262']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.customerAvatar}
            >
              <Text style={styles.customerAvatarText}>{jobDetail.initials}</Text>
            </LinearGradient>

            <View style={styles.arrivalCopy}>
              <Text style={styles.customerName}>{jobDetail.customer}</Text>
              <Text style={styles.customerMeta}>
                {jobDetail.service} · B-42, Karol Bagh
              </Text>
            </View>
          </TechCard>

          <TechCard style={styles.otpCard}>
            <Text style={styles.otpInfo}>
              Customer&apos;s app shows a 4-digit OTP. Enter it below to confirm you&apos;re
              at the right location.
            </Text>
            <Text style={styles.otpEyebrow}>Enter OTP from customer</Text>

            <View style={styles.otpRow}>
              {safetyOtp.code.map((digit, index) => (
                <View
                  key={`safety-${index}`}
                  style={[
                    styles.otpBox,
                    !!digit && styles.otpBoxFilled,
                    !digit && styles.otpBoxCurrent,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit || ''}</Text>
                </View>
              ))}
            </View>
          </TechCard>

          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              OTP must match. This prevents fake arrival marking and protects both you and
              the customer.
            </Text>
          </View>

          <TechGradientButton
            label="Verify and Start Job"
            variant="emerald"
            onPress={() => navigation.navigate('TechnicianJobInProgress')}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const createStyles = ({
  colors: TECH_COLORS,
  radius: TECH_RADIUS,
}) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TECH_COLORS.bg,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 26,
  },
  heroIcon: {
    fontSize: 46,
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.82)',
  },
  arrivalCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  arrivalCopy: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  customerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  otpCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
  },
  otpInfo: {
    fontSize: 13,
    lineHeight: 20,
    color: TECH_COLORS.textSecondary,
    marginBottom: 14,
  },
  otpEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
    marginBottom: 10,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBox: {
    width: 54,
    height: 62,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 2,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: TECH_COLORS.emerald,
    backgroundColor: TECH_COLORS.emeraldTint,
  },
  otpBoxCurrent: {
    borderColor: TECH_COLORS.coral,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.20)',
    backgroundColor: TECH_COLORS.amberTint,
  },
  warningIcon: {
    marginRight: 10,
    fontSize: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.amber,
  },
});

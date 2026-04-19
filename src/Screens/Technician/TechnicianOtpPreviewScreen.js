import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { safetyOtp } from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechScreenHeader,
} from '../../technician/components/TechUi';

export default function TechnicianOtpPreviewScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bgElevated}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader
          title="Verify OTP"
          subtitle="Preview screen"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Code sent to</Text>
          <Text style={styles.phone}>+91 98765 43210</Text>
          <Text style={styles.subtle}>Valid for 5 minutes</Text>

          <View style={styles.otpRow}>
            {safetyOtp.code.map((digit, index) => (
              <View
                key={`otp-preview-${index}`}
                style={[
                  styles.otpBox,
                  !!digit && styles.otpBoxFilled,
                  !digit && styles.otpBoxActive,
                ]}
              >
                <Text style={[styles.otpDigit, !digit && styles.placeholder]}>
                  {digit || '-'}
                </Text>
              </View>
            ))}
          </View>

          <TechGradientButton
            label="Skip Auth and Open Home"
            onPress={() => navigation.replace('TechnicianTabs')}
            style={styles.primaryAction}
          />

          <Text style={styles.resendText}>
            Didn&apos;t receive? <Text style={styles.linkText}>Resend in 42s</Text>
          </Text>

          <TechCard style={styles.checkCard}>
            <Text style={styles.checkEyebrow}>After login, we check</Text>
            <View style={styles.checkList}>
              {[
                'Your technician profile in DB',
                'Verification and subscription status',
                'Route to technician dashboard',
              ].map((item) => (
                <View key={item} style={styles.checkRow}>
                  <Icon name="check-circle" size={16} color={TECH_COLORS.emerald} />
                  <Text style={styles.checkText}>{item}</Text>
                </View>
              ))}
            </View>
          </TechCard>

          <View style={styles.previewStrip}>
            <TechBadge label="UI only" tone="emerald" />
            <Text style={styles.previewText}>
              This screen is static right now and intentionally does not verify anything.
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  label: {
    fontSize: 15,
    color: TECH_COLORS.textSecondary,
  },
  phone: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.text,
    letterSpacing: -0.5,
  },
  subtle: {
    marginTop: 6,
    fontSize: 12,
    color: TECH_COLORS.textMuted,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1.5,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: TECH_COLORS.coral,
    backgroundColor: TECH_COLORS.coralTint,
  },
  otpBoxActive: {
    borderColor: TECH_COLORS.coral,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  placeholder: {
    color: TECH_COLORS.textMuted,
  },
  primaryAction: {
    marginTop: 20,
  },
  resendText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    color: TECH_COLORS.textMuted,
  },
  linkText: {
    color: TECH_COLORS.coral,
    fontWeight: '700',
  },
  checkCard: {
    marginTop: 22,
    padding: 16,
  },
  checkEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
    marginBottom: 12,
  },
  checkList: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkText: {
    marginLeft: 10,
    fontSize: 13,
    color: TECH_COLORS.textSecondary,
  },
  previewStrip: {
    marginTop: 18,
    padding: 14,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.cardAlt,
  },
  previewText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
});

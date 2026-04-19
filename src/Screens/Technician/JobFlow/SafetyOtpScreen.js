import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { createEstimateDraft, getTechnicianJobFlow } from '../../../technician/jobFlowData';
import { useTechScreenTheme } from '../../../technician/theme';
import {
  TechCard,
  TechGradientButton,
} from '../../../technician/components/TechUi';

export default function SafetyOtpScreen({ navigation, route }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const job = getTechnicianJobFlow(route?.params?.jobId);
  const estimateDraft = route?.params?.estimateDraft || createEstimateDraft(job);
  const [otp, setOtp] = React.useState('');
  const otpInputRef = React.useRef(null);

  const handleOtpChange = (value) => {
    setOtp(String(value || '').replace(/[^0-9]/g, '').slice(0, 4));
  };

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
            <Text style={styles.heroTitle}>Safety Verification</Text>
            <Text style={styles.heroSubtitle}>Enter the customer OTP to start the job.</Text>
          </LinearGradient>

          <TechCard style={styles.arrivalCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{job.customer.initials}</Text>
            </View>

            <View style={styles.arrivalCopy}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <Text style={styles.customerMeta}>{job.service} · {job.location.area}</Text>
            </View>
          </TechCard>

          <TechCard style={styles.otpCard}>
            <Text style={styles.otpEyebrow}>Enter customer OTP</Text>
            <Pressable style={styles.otpBoxes} onPress={() => otpInputRef.current?.focus()}>
              {[0, 1, 2, 3].map((index) => {
                const digit = otp[index] || '';
                const isActive = otp.length === index || (otp.length === 4 && index === 3);

                return (
                  <View
                    key={`otp-${index}`}
                    style={[styles.otpBox, isActive && styles.otpBoxActive]}
                  >
                    <Text style={styles.otpDigit}>{digit}</Text>
                  </View>
                );
              })}
            </Pressable>
            <TextInput
              ref={otpInputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.hiddenOtpInput}
            />
          </TechCard>

          <TechGradientButton
            label="Verify and Start Inspection"
            variant="emerald"
            style={styles.verifyButton}
            onPress={() =>
              navigation.navigate('TechnicianJobInProgress', {
                jobId: job.id,
                estimateDraft,
              })
            }
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
    paddingTop: 50,
    paddingBottom: 28,
  },
  heroTitle: {
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
    backgroundColor: TECH_COLORS.coral,
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
    marginBottom: 16,
    padding: 18,
  },
  otpEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
    marginBottom: 10,
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1.5,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: TECH_COLORS.emerald,
    backgroundColor: TECH_COLORS.emeraldTint,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  verifyButton: {
    marginHorizontal: 20,
  },
});

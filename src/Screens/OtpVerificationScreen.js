import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../Components/ScreenWrapper';
import {
  OTP_LENGTH,
  formatDisplayPhone,
} from '../lib/phone';
import { supabase } from '../lib/supabase';
import { getThemeColors } from '../theme';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  completePhoneAuth,
  getAuthState,
  setPendingPhone,
} from '../state/authStore';
import { syncAuthenticatedAppData } from '../state/appDataBootstrap';
import {
  fetchOwnProfileRecord,
  hasStoredFullName,
} from '../state/profileStore';

const RESEND_COOLDOWN = 28;

export default function OtpVerificationScreen({ navigation, route }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const screenBackground = isDark ? '#151B24' : '#F7F2EC';
  const styles = useMemo(
    () => createStyles(colors, isDark, screenBackground),
    [colors, isDark, screenBackground],
  );
  const inputRef = useRef(null);
  const routePhone = route?.params?.phone;
  const fallbackPhone = getAuthState().pendingPhone || getAuthState().userPhone;
  const phone = String(routePhone || fallbackPhone || '').trim();
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const displayPhone = formatDisplayPhone(phone) || phone;

  useEffect(() => {
    if (!phone) {
      navigation.replace('Login');
      return;
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 220);

    return () => clearTimeout(focusTimer);
  }, [navigation, phone]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH || isVerifying) {
      Alert.alert('Enter complete OTP', `Please enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    try {
      setIsVerifying(true);

      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        Alert.alert('OTP verification failed', error.message);
        return;
      }

      const verifiedPhone = data?.user?.phone || phone;
      const profileResult = await fetchOwnProfileRecord();

      if (profileResult.error) {
        Alert.alert('Profile check failed', profileResult.error.message);
        return;
      }

      if (!hasStoredFullName(profileResult.data)) {
        completePhoneAuth(verifiedPhone);
        navigation.reset({
          index: 0,
          routes: [{ name: 'NameSetup' }],
        });
        return;
      }

      completePhoneAuth(verifiedPhone);
      await syncAuthenticatedAppData();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (_) {
      Alert.alert('Network error', 'Please try verifying again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || isResending) {
      return;
    }

    try {
      setIsResending(true);

      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        Alert.alert('Could not resend OTP', error.message);
        return;
      }

      setPendingPhone(phone);
      setOtp('');
      setResendSeconds(RESEND_COOLDOWN);
      inputRef.current?.focus();
    } catch (_) {
      Alert.alert('Network error', 'Please try resending the OTP again.');
    } finally {
      setIsResending(false);
    }
  };

  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otp[index] || '');

  return (
    <ScreenWrapper
      topColor="#FF5C22"
      bottomColor={screenBackground}
      statusBarStyle="light-content"
    >
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <LinearGradient
              colors={['#FF5C22', '#FF8442', '#FFA53C']}
              start={{ x: 0.02, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroOrbRight} />
              <View style={styles.heroOrbLeft} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Verify OTP</Text>
                <Text style={styles.heroSubtitle}>Sent to {displayPhone}</Text>
              </View>
            </LinearGradient>

            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Enter 6-digit code</Text>
              <Text style={styles.sectionSubtitle}>Valid for 5 minutes</Text>

              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.otpRow}
              >
                {otpDigits.map((digit, index) => {
                  const isFilled = !!digit;
                  const isActive = index === otp.length && otp.length < OTP_LENGTH;

                  return (
                    <View
                      key={`otp-${index}`}
                      style={[
                        styles.otpBox,
                        isFilled && styles.otpBoxFilled,
                        isActive && styles.otpBoxActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.otpDigit,
                          !digit && styles.otpPlaceholder,
                        ]}
                      >
                        {digit || '-'}
                      </Text>
                    </View>
                  );
                })}
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(value) => setOtp(String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH))}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={OTP_LENGTH}
                style={styles.hiddenInput}
                autoFocus
              />

              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.ctaWrap,
                  (otp.length !== OTP_LENGTH || isVerifying) && styles.ctaWrapDisabled,
                ]}
                onPress={handleVerify}
                disabled={otp.length !== OTP_LENGTH || isVerifying}
              >
                <LinearGradient
                  colors={
                    otp.length === OTP_LENGTH && !isVerifying
                      ? ['#FF5C22', '#FFAF3E']
                      : ['#F4B59C', '#F2CF9E']
                  }
                  start={{ x: 0, y: 0.2 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Verify & Continue</Text>
                      <Icon name="arrow-right" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn&apos;t receive?</Text>
                <TouchableOpacity
                  activeOpacity={resendSeconds > 0 ? 1 : 0.82}
                  onPress={handleResend}
                  disabled={resendSeconds > 0}
                >
                  <Text
                    style={[
                      styles.resendAction,
                      resendSeconds > 0 && styles.resendActionMuted,
                    ]}
                  >
                    {isResending
                      ? ' Resending...'
                      : resendSeconds > 0
                      ? ` Resend in ${resendSeconds}s`
                      : ' Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.noteCard}>
                <View style={styles.noteIconWrap}>
                  <Icon name="lock-outline" size={18} color="#FF6E31" />
                </View>
                <Text style={styles.noteText}>
                  Your number is never shared with technicians. Used only for account security.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const createStyles = (colors, isDark, screenBackground) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: screenBackground,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    minHeight: 176,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  heroCopy: {
    zIndex: 1,
  },
  heroOrbRight: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    right: -18,
    top: -28,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroOrbLeft: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    left: -30,
    bottom: -20,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: screenBackground,
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.3,
    borderColor: isDark ? colors.border : '#E8DED4',
    backgroundColor: isDark ? colors.surface : '#FAF7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#FF6E31',
    backgroundColor: isDark ? 'rgba(255,122,69,0.12)' : '#FFF2E8',
  },
  otpBoxActive: {
    borderColor: '#FF6E31',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  otpPlaceholder: {
    color: colors.ink,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  ctaWrap: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF7A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaWrapDisabled: {
    opacity: 0.76,
  },
  cta: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  resendLabel: {
    fontSize: 13,
    color: colors.inkSecondary,
  },
  resendAction: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF6E31',
  },
  resendActionMuted: {
    color: '#FF6E31',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#F0D5C2',
    backgroundColor: isDark ? colors.surface : '#F9F0E9',
  },
  noteIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(255,122,69,0.12)' : '#FFF2E8',
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSecondary,
    fontWeight: '500',
  },
});

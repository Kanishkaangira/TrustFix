import React, { useMemo, useState } from 'react';
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
import { getThemeColors } from '../theme';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  INDIA_COUNTRY_CODE,
  PHONE_DIGITS_LENGTH,
  formatPhoneDigits,
  getPhoneDigits,
  toE164Phone,
} from '../lib/phone';
import { supabase } from '../lib/supabase';
import { getAuthState, setPendingPhone } from '../state/authStore';

export default function AuthPhoneScreen({ navigation }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const screenBackground = isDark ? '#151B24' : '#F7F2EC';
  const styles = useMemo(
    () => createStyles(colors, isDark, screenBackground),
    [colors, isDark, screenBackground],
  );
  const authState = getAuthState();
  const seededPhone = authState.pendingPhone || authState.userPhone;
  const [phoneDigits, setPhoneDigits] = useState(() => getPhoneDigits(seededPhone));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formattedPhone = formatPhoneDigits(phoneDigits);
  const canContinue = phoneDigits.length === PHONE_DIGITS_LENGTH && !isSubmitting;

  const handleGetOtp = async () => {
    if (!canContinue) {
      Alert.alert(
        'Enter valid mobile number',
        'Please enter your 10-digit phone number to continue.',
      );
      return;
    }

    const fullPhone = toE164Phone(phoneDigits);

    try {
      setIsSubmitting(true);

      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        Alert.alert('Could not send OTP', error.message);
        return;
      }

      setPendingPhone(fullPhone);
      navigation.navigate('OtpVerification', { phone: fullPhone });
    } catch (_) {
      Alert.alert('Network error', 'Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialPress = (provider) => {
    Alert.alert(`${provider} sign-in`, 'This button is ready for your Supabase social auth later.');
  };

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
                <Text style={styles.brandMark}>
                  <Text style={styles.brandTrust}>Trust</Text>
                  <Text style={styles.brandFix}>Fix</Text>
                </Text>
                <Text style={styles.heroTagline}>India&apos;s trust-first home service</Text>
              </View>
            </LinearGradient>

            <View style={styles.content}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Enter your number to continue</Text>

              <View style={styles.phoneField}>
                <View style={styles.phoneMeta}>
                  <Text style={styles.countryShort}>IN</Text>
                  <Text style={styles.countryCode}>{INDIA_COUNTRY_CODE}</Text>
                </View>

                <TextInput
                  value={formattedPhone}
                  onChangeText={(value) => setPhoneDigits(getPhoneDigits(value))}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="phone-pad"
                  maxLength={11}
                  style={styles.phoneInput}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.ctaWrap, !canContinue && styles.ctaWrapDisabled]}
                onPress={handleGetOtp}
                disabled={!canContinue}
              >
                <LinearGradient
                  colors={canContinue ? ['#FF5C22', '#FFAF3E'] : ['#F4B59C', '#F2CF9E']}
                  start={{ x: 0, y: 0.2 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Get OTP</Text>
                      <Icon name="arrow-right" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.socialButton}
                onPress={() => handleSocialPress('Google')}
              >
                <View style={[styles.socialIconWrap, styles.googleDot]}>
                  <Icon name="google" size={15} color="#3B82F6" />
                </View>
                <Text style={styles.socialText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.socialButton}
                onPress={() => handleSocialPress('Apple')}
              >
                <View style={[styles.socialIconWrap, styles.appleDot]}>
                  <Icon name="apple" size={15} color={colors.ink} />
                </View>
                <Text style={styles.socialText}>Continue with Apple</Text>
              </TouchableOpacity>

              <Text style={styles.legalText}>
                By continuing you agree to our <Text style={styles.legalLink}>Terms &amp; Privacy</Text>
              </Text>
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
    minHeight: 228,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  heroCopy: {
    zIndex: 1,
  },
  heroOrbRight: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -16,
    top: -22,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroOrbLeft: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    left: -30,
    bottom: -18,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  brandMark: {
    fontSize: 30,
    letterSpacing: -1,
  },
  brandTrust: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandFix: {
    fontWeight: '800',
    color: '#FFF3EC',
  },
  heroTagline: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: screenBackground,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  phoneField: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FF6E31',
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    paddingHorizontal: 12,
  },
  phoneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: isDark ? colors.border : '#EEE4DA',
  },
  countryShort: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.inkSecondary,
    marginRight: 10,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    fontWeight: '600',
    paddingVertical: 0,
  },
  ctaWrap: {
    marginTop: 16,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: isDark ? colors.border : '#EEE4DA',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: colors.inkMuted,
  },
  socialButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#EDE4DA',
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  socialIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleDot: {
    backgroundColor: '#EEF4FF',
  },
  appleDot: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  legalText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkMuted,
  },
  legalLink: {
    color: '#FF6E31',
    fontWeight: '700',
  },
});

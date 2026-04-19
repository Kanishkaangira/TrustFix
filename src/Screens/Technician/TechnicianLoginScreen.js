import React, { useState } from 'react';
import {
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

import ScreenWrapper from '../../Components/ScreenWrapper';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechGradientButton,
  TechOutlineButton,
} from '../../technician/components/TechUi';

export default function TechnicianLoginScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    gradients: TECH_GRADIENTS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [phone, setPhone] = useState('98765 43210');

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bgElevated}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={TECH_GRADIENTS.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroOrbRight} />
            <View style={styles.heroOrbLeft} />

            <View style={styles.heroBadge}>
              <Icon name="hammer-wrench" size={14} color={TECH_COLORS.white} />
              <Text style={styles.heroBadgeText}>Technician Preview</Text>
            </View>

            <Text style={styles.heroEyebrow}>Welcome to</Text>
            <Text style={styles.heroTitle}>TrustFix Pro</Text>
            <Text style={styles.heroSubtitle}>Your technician command center</Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.title}>Enter your mobile</Text>
            <Text style={styles.subtitle}>
              This is a UI preview. No auth is connected yet.
            </Text>

            <View style={styles.phoneField}>
              <View style={styles.countryMeta}>
                <Text style={styles.countryShort}>IND</Text>
                <Text style={styles.countryCode}>+91</Text>
              </View>

              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="98765 43210"
                placeholderTextColor={TECH_COLORS.textMuted}
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Icon name="shield-check-outline" size={16} color={TECH_COLORS.emerald} />
              </View>
              <Text style={styles.infoText}>
                The login button below skips authentication and opens the technician home so
                you can review the design flow quickly.
              </Text>
            </View>

            <TechGradientButton
              label="Continue to Technician Home"
              onPress={() => navigation.replace('TechnicianMain')}
              style={styles.primaryAction}
            />

            <TechOutlineButton
              label="Preview OTP Screen"
              icon="gesture-tap-button"
              onPress={() => navigation.navigate('TechnicianMain', { screen: 'TechnicianOtpPreview' })}
              style={styles.secondaryAction}
            />

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.portalButton}
              onPress={() => navigation.replace('Login')}
            >
              <View style={styles.portalIcon}>
                <Icon name="account-outline" size={18} color={TECH_COLORS.coral} />
              </View>
              <View style={styles.portalCopy}>
                <Text style={styles.portalTitle}>Back to customer side</Text>
                <Text style={styles.portalText}>
                  Return to the existing customer authentication flow
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={TECH_COLORS.textMuted} />
            </TouchableOpacity>
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
  contentContainer: {
    flexGrow: 1,
  },
  hero: {
    minHeight: 244,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroOrbRight: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    top: -74,
    right: -36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroOrbLeft: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: 63,
    bottom: -40,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TECH_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    marginBottom: 18,
  },
  heroBadgeText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: TECH_COLORS.white,
    textTransform: 'uppercase',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: '800',
    color: TECH_COLORS.white,
    letterSpacing: -1,
  },
  heroSubtitle: {
    marginTop: 5,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: TECH_COLORS.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: TECH_COLORS.textSecondary,
  },
  phoneField: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 14,
    borderRadius: TECH_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: TECH_COLORS.coralBorder,
    backgroundColor: TECH_COLORS.card,
  },
  countryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: TECH_COLORS.border,
  },
  countryShort: {
    marginRight: 10,
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: TECH_COLORS.text,
    paddingVertical: 0,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.18)',
    backgroundColor: TECH_COLORS.emeraldTint,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,14,19,0.24)',
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#7CF2CC',
    fontWeight: '500',
  },
  primaryAction: {
    marginTop: 20,
  },
  secondaryAction: {
    marginTop: 12,
  },
  portalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: TECH_RADIUS.lg,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.cardAlt,
  },
  portalIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.coralTint,
    marginRight: 12,
  },
  portalCopy: {
    flex: 1,
    paddingRight: 10,
  },
  portalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  portalText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: TECH_COLORS.textSecondary,
  },
});

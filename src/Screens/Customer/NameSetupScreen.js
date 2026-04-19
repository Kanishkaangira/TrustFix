import React, { useEffect, useMemo, useState } from 'react';
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

import ScreenWrapper from '../../Components/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import { getThemeColors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  completePhoneAuth,
  getAuthState,
  setAuthPortal,
} from '../../state/authStore';
import { syncAuthenticatedAppData } from '../../state/appDataBootstrap';
import {
  fetchOwnProfileRecord,
  getProfile,
  hasStoredFullName,
  updateProfile,
} from '../../state/profileStore';

export default function NameSetupScreen({ navigation, route }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const screenBackground = isDark ? '#151B24' : '#F7F2EC';
  const styles = useMemo(
    () => createStyles(colors, isDark, screenBackground),
    [colors, isDark, screenBackground],
  );
  const seededProfile = getProfile();
  const authState = getAuthState();
  const appRole = route?.params?.appRole || authState.currentPortal || 'customer';
  const initialName = seededProfile?.name && seededProfile.name !== 'TrustFix User'
    ? seededProfile.name
    : '';
  const [fullName, setFullName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedName = String(fullName || '').trim();

  useEffect(() => {
    let isMounted = true;

    if (appRole === 'technician') {
      supabase.auth.getUser().then(({ data, error }) => {
        const authUserId = data?.user?.id;

        if (!isMounted || error || !authUserId) {
          return;
        }

        supabase.db.select('technician_profiles', {
          filters: [{ column: 'id', op: 'eq', value: authUserId }],
          maybeSingle: true,
        }).then((technicianResult) => {
          if (!isMounted || technicianResult.error) {
            return;
          }

          const hasTechnicianName = String(
            technicianResult.data?.display_name || '',
          ).trim().length > 0;

          if (technicianResult.data && hasTechnicianName) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'TechnicianMain' }],
            });
          }
        });
      });
      return () => {
        isMounted = false;
      };
    }

    fetchOwnProfileRecord().then((result) => {
      if (!isMounted || result.error) {
        return;
      }

      if (!hasStoredFullName(result.data)) {
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    });

    return () => {
      isMounted = false;
    };
  }, [appRole, navigation]);

  const handleContinue = async () => {
    if (trimmedName.length < 2 || isSubmitting) {
      Alert.alert('Enter your name', 'Please enter your full name to continue.');
      return;
    }

    try {
      setIsSubmitting(true);

      const currentAuthState = getAuthState();
      const resolvedPhone = currentAuthState.userPhone || currentAuthState.pendingPhone || '';
      setAuthPortal(appRole);

      if (appRole === 'technician') {
        const { data: authUserData, error: authUserError } = await supabase.auth.getUser();

        if (authUserError) {
          Alert.alert('Could not save technician profile', authUserError.message);
          return;
        }

        const authUser = authUserData?.user || null;

        if (!authUser) {
          Alert.alert('Session expired', 'Please sign in again to continue.');
          return;
        }

        const technicianProfileResult = await supabase.db.upsert(
          'technician_profiles',
          {
            id: authUser.id,
            display_name: trimmedName,
            phone: authUser.phone || resolvedPhone || null,
            email: authUser.email || null,
          },
          {
            onConflict: 'id',
          },
        );

        if (technicianProfileResult.error) {
          Alert.alert('Could not save technician profile', technicianProfileResult.error.message);
          return;
        }
      } else {
        const saveResult = await updateProfile({ name: trimmedName });

        if (saveResult.error) {
          Alert.alert('Could not save name', saveResult.error.message);
          return;
        }
      }

      completePhoneAuth(resolvedPhone);
      await syncAuthenticatedAppData();

      navigation.reset({
        index: 0,
        routes: [{
          name: appRole === 'technician' ? 'TechnicianMain' : 'Main',
        }],
      });
    } catch (_) {
      Alert.alert('Network error', 'Please try saving your name again.');
    } finally {
      setIsSubmitting(false);
    }
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
                <Text style={styles.heroTitle}>One quick step</Text>
                <Text style={styles.heroSubtitle}>Tell us your name. We only ask this once.</Text>
              </View>
            </LinearGradient>

            <View style={styles.content}>
              <Text style={styles.title}>What should we call you?</Text>
              <Text style={styles.subtitle}>
                Your name will be saved to your {appRole === 'technician' ? 'technician' : 'TrustFix'} profile.
              </Text>

              <View style={styles.nameField}>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.inkMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  style={styles.nameInput}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.ctaWrap, (trimmedName.length < 2 || isSubmitting) && styles.ctaWrapDisabled]}
                onPress={handleContinue}
                disabled={trimmedName.length < 2 || isSubmitting}
              >
                <LinearGradient
                  colors={
                    trimmedName.length >= 2 && !isSubmitting
                      ? ['#FF5C22', '#FFAF3E']
                      : ['#F4B59C', '#F2CF9E']
                  }
                  start={{ x: 0, y: 0.2 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Continue</Text>
                      <Icon name="arrow-right" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
    minHeight: 196,
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
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  nameField: {
    minHeight: 54,
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: isDark ? colors.border : '#EDE4DA',
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    paddingHorizontal: 14,
  },
  nameInput: {
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
});

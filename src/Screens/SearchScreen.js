import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  NativeModules,
  Platform,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../Components/ScreenWrapper';
import { FONT, SHADOW, SPACING, getThemeColors } from '../theme';
import { useAppTheme } from '../theme/ThemeProvider';

const SERVICES = [
  {
    id: 'ac',
    name: 'AC Repair',
    subtitle: 'Cooling, service, gas refill',
    icon: 'snowflake',
    iconColor: '#2563EB',
    lightColor: '#DBEAFE',
    startingAt: 'Rs349',
    bookingService: {
      id: 'ac',
      label: 'AC Repair',
      shortLabel: 'AC Repair',
      icon: 'snowflake',
      accentColor: '#2563EB',
      iconColor: '#2563EB',
      lightColor: '#DBEAFE',
      startingAt: 'Rs349',
    },
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    subtitle: 'Leakage, taps, pipelines',
    icon: 'pipe-wrench',
    iconColor: '#16A34A',
    lightColor: '#DCFCE7',
    startingAt: 'Rs199',
    bookingService: {
      id: 'plumbing',
      label: 'Plumbing',
      shortLabel: 'Plumbing',
      icon: 'pipe-wrench',
      accentColor: '#16A34A',
      iconColor: '#16A34A',
      lightColor: '#DCFCE7',
      startingAt: 'Rs199',
    },
  },
  {
    id: 'electrician',
    name: 'Electrical',
    subtitle: 'Wiring, switchboards, faults',
    icon: 'lightning-bolt',
    iconColor: '#D97706',
    lightColor: '#FEF3C7',
    startingAt: 'Rs249',
    bookingService: {
      id: 'electrician',
      label: 'Electrical',
      shortLabel: 'Electrician',
      icon: 'lightning-bolt',
      accentColor: '#D97706',
      iconColor: '#D97706',
      lightColor: '#FEF3C7',
      startingAt: 'Rs249',
    },
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    subtitle: 'Doors, furniture, fittings',
    icon: 'view-grid',
    iconColor: '#7C3AED',
    lightColor: '#EDE9FE',
    startingAt: 'Rs299',
    bookingService: {
      id: 'carpentry',
      label: 'Carpentry',
      shortLabel: 'Carpentry',
      icon: 'view-grid',
      accentColor: '#7C3AED',
      iconColor: '#7C3AED',
      lightColor: '#EDE9FE',
      startingAt: 'Rs299',
    },
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    subtitle: 'Home deep cleaning and upkeep',
    icon: 'broom',
    iconColor: '#E11D48',
    lightColor: '#FFE4E6',
    startingAt: 'Rs399',
    bookingService: {
      id: 'cleaning',
      label: 'Cleaning',
      shortLabel: 'Deep Cleaning',
      icon: 'broom',
      accentColor: '#E11D48',
      iconColor: '#E11D48',
      lightColor: '#FFE4E6',
      startingAt: 'Rs399',
    },
  },
];

const RECENT_SEARCHES = ['AC Repair', 'Plumbing', 'Cleaning'];
const POPULAR_SEARCHES = ['Electrician', 'Gas refill', 'Water leakage', 'Carpentry'];
const HAS_VOICE_NATIVE_MODULE = !!NativeModules.Voice;

export default function SearchScreen({ navigation, route }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const autoListenTrigger = route?.params?.autoListenTrigger ?? null;
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showListeningFocus, setShowListeningFocus] = useState(false);
  const [voiceToast, setVoiceToast] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (!HAS_VOICE_NATIVE_MODULE) {
      return undefined;
    }

    Voice.onSpeechStart = () => {
      setIsListening(true);
      setShowListeningFocus(true);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      setShowListeningFocus(false);
    };

    Voice.onSpeechResults = (event) => {
      const spokenText = event?.value?.[0]?.trim();
      if (spokenText) {
        setQuery(spokenText);
      }
      setIsListening(false);
      setShowListeningFocus(false);
    };

    Voice.onSpeechPartialResults = (event) => {
      const partialText = event?.value?.[0]?.trim();
      if (partialText) {
        setQuery(partialText);
        setShowListeningFocus(false);
      }
    };

    Voice.onSpeechError = () => {
      setIsListening(false);
      setShowListeningFocus(false);
      showVoiceToast('Could not hear clearly. Try again.');
    };

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      Voice.destroy()
        .catch(() => {})
        .finally(() => {
          if (HAS_VOICE_NATIVE_MODULE) {
            Voice.removeAllListeners();
          }
        });
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isListening && !showListeningFocus) {
        return;
      }

      event.preventDefault();
      void stopVoiceSearch('cancel');
    });

    return unsubscribe;
  }, [navigation, isListening, showListeningFocus]);

  useEffect(() => {
    if (!autoListenTrigger) {
      return undefined;
    }

    const timer = setTimeout(() => {
      void handleMicPress();
      navigation.setParams({ autoListenTrigger: undefined });
    }, 220);

    return () => clearTimeout(timer);
  }, [autoListenTrigger, navigation]);

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return SERVICES;
    }

    return SERVICES.filter((service) => {
      const haystack = `${service.name} ${service.subtitle}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query]);

  const openBookingForService = (service) => {
    navigation.navigate('Main', {
      screen: 'Booking',
      params: {
        service: service.bookingService,
        serviceTrigger: Date.now(),
      },
    });
  };

  const applySearchChip = (value) => setQuery(value);

  const hideVoiceToast = () => {
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setVoiceToast(null);
      }
    });
  };

  const showVoiceToast = (message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setVoiceToast(message);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      hideVoiceToast();
    }, 2400);
  };

  const stopVoiceSearch = async (mode = 'stop') => {
    setIsListening(false);
    setShowListeningFocus(false);

    if (!HAS_VOICE_NATIVE_MODULE) {
      return;
    }

    try {
      if (mode === 'cancel') {
        await Voice.cancel();
        return;
      }

      await Voice.stop();
    } catch (_) {}
  };

  const handleSearchFieldFocus = () => {
    if (!isListening) {
      return;
    }

    void stopVoiceSearch('cancel');
  };

  const handleMicPress = async () => {
    try {
      if (!HAS_VOICE_NATIVE_MODULE) {
        Alert.alert(
          'Voice search not ready',
          'Voice search needs a full app rebuild after installing the library. Close the app and run the Android build again.',
        );
        return;
      }

      if (isListening) {
        await stopVoiceSearch();
        return;
      }

      Keyboard.dismiss();

      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        Alert.alert('Voice search unavailable', 'Speech recognition is not available on this device.');
        return;
      }

      if (Platform.OS === 'android') {
        const services = await Voice.getSpeechRecognitionServices();
        if (!services?.length) {
          Alert.alert(
            'Speech service missing',
            'No speech recognition service was found on this device. Please enable Google voice typing or install a speech service.',
          );
          return;
        }
      }

      await Voice.cancel().catch(() => {});
      await Voice.start('en-IN', {
        REQUEST_PERMISSIONS_AUTO: true,
      });
    } catch (_) {
      setIsListening(false);
      setShowListeningFocus(false);
      showVoiceToast('Unable to start voice search right now.');
    }
  };

  return (
    <ScreenWrapper
      topColor={colors.surface}
      bottomColor={colors.background}
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Icon name="chevron-left" size={26} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={colors.inkMuted} />
            <TextInput
              autoFocus={!autoListenTrigger}
              value={query}
              onChangeText={setQuery}
              onFocus={handleSearchFieldFocus}
              placeholder="Search service type..."
              placeholderTextColor={colors.inkMuted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
                <Icon name="close-circle" size={18} color={colors.inkMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.micBtn, showListeningFocus && styles.micBtnActive]}
            activeOpacity={0.8}
            onPress={handleMicPress}
          >
            <Icon
              name={showListeningFocus ? 'microphone' : 'microphone-outline'}
              size={18}
              color={showListeningFocus ? colors.surface : colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bodyWrap}>
          <ScrollView
            style={[styles.body, showListeningFocus && styles.bodyListening]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!query ? (
              <>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <View style={styles.chipRow}>
                  {RECENT_SEARCHES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.chip}
                      onPress={() => applySearchChip(item)}
                      activeOpacity={0.8}
                    >
                      <Icon name="history" size={14} color={colors.primary} />
                      <Text style={styles.chipText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, styles.sectionGap]}>Popular Services</Text>
                <View style={styles.chipRow}>
                  {POPULAR_SEARCHES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, styles.popularChip]}
                      onPress={() => applySearchChip(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={[styles.sectionTitle, query ? undefined : styles.sectionGap]}>
              {query ? 'Results' : 'All Services'}
            </Text>

            {filteredServices.length ? (
              filteredServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.resultCard}
                  onPress={() => openBookingForService(service)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.resultIconWrap, { backgroundColor: service.lightColor }]}>
                    <Icon name={service.icon} size={24} color={service.iconColor} />
                  </View>

                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle}>{service.name}</Text>
                    <Text style={styles.resultSubtitle}>{service.subtitle}</Text>
                    <Text style={styles.resultPrice}>from {service.startingAt}</Text>
                  </View>

                  <View style={styles.resultArrow}>
                    <Icon name="chevron-right" size={22} color={colors.inkMuted} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Icon name="magnify-close" size={34} color={colors.inkMuted} />
                <Text style={styles.emptyTitle}>No services found</Text>
                <Text style={styles.emptyText}>Try AC Repair, Plumbing, Cleaning or Electrical.</Text>
              </View>
            )}
          </ScrollView>

          {showListeningFocus ? <View style={styles.listeningOverlay} pointerEvents="none" /> : null}
        </View>

        {voiceToast ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.voiceToast,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.voiceToastIconWrap}>
              <Icon name="microphone-off" size={18} color={colors.primary} />
            </View>
            <View style={styles.voiceToastTextWrap}>
              <Text style={styles.voiceToastTitle}>Voice search</Text>
              <Text style={styles.voiceToastMessage}>{voiceToast}</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: colors.background,
  },
  searchBar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primaryMid,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 10,
  },
  bodyWrap: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyListening: {
    opacity: 0.78,
  },
  listeningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.isDark ? 'rgba(8,10,14,0.45)' : 'rgba(255,255,255,0.38)',
  },
  voiceToast: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.isDark ? 'rgba(20,26,34,0.98)' : 'rgba(24,26,32,0.96)',
    borderWidth: 1,
    borderColor: colors.isDark ? colors.border : 'rgba(255,255,255,0.08)',
    ...SHADOW.card,
  },
  voiceToastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.isDark ? colors.surfaceMuted : 'rgba(255,255,255,0.08)',
    marginRight: 12,
  },
  voiceToastTextWrap: {
    flex: 1,
  },
  voiceToastTitle: {
    fontSize: 12,
    color: '#F7F7FA',
    fontWeight: FONT.bold,
    marginBottom: 2,
  },
  voiceToastMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: FONT.bold,
    color: colors.ink,
    marginBottom: 12,
  },
  sectionGap: {
    marginTop: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  popularChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMid,
  },
  chipText: {
    fontSize: 13,
    color: colors.inkSecondary,
    fontWeight: FONT.semibold,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.card,
  },
  resultIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: colors.ink,
  },
  resultSubtitle: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 3,
  },
  resultPrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: FONT.semibold,
    marginTop: 7,
  },
  resultArrow: {
    marginLeft: 10,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: FONT.bold,
    color: colors.ink,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
});

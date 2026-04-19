import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { getThemeColors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  clearAuthenticatedState,
  completePhoneAuth,
} from '../../state/authStore';
import {
  resetAuthenticatedAppData,
  syncAuthenticatedAppData,
} from '../../state/appDataBootstrap';
import { supabase } from '../../lib/supabase';
import {
  fetchOwnProfileRecord,
  hasStoredFullName,
} from '../../state/profileStore';

const { width, height } = Dimensions.get('window');

function WrenchView() {
  return (
    <View style={wrenchStyles.wrap}>
      <View style={wrenchStyles.handle} />
      <View style={wrenchStyles.jawTop} />
      <View style={wrenchStyles.jawBot} />
    </View>
  );
}

const wrenchStyles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  handle: {
    position: 'absolute',
    width: 10,
    height: 30,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    top: 7,
    left: 17,
  },
  jawTop: {
    position: 'absolute',
    width: 24,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    top: 7,
    left: 10,
  },
  jawBot: {
    position: 'absolute',
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.78)',
    top: 18,
    left: 10,
  },
});

const createPalette = (colors, isDark) => ({
  coral: '#FF6B35',
  coralDeep: isDark ? '#E55B2A' : '#E8531A',
  coralMid: '#FF7A45',
  coralLight: '#FF9262',
  bg: colors.background,
  textDark: colors.ink,
  textMuted: colors.inkMuted,
  grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(150,130,110,0.12)',
  glow: isDark ? 'rgba(255,122,69,0.24)' : 'rgba(255,107,53,0.20)',
  shadow: isDark ? 'rgba(255,107,53,0.28)' : 'rgba(232,83,26,0.25)',
});

export default function FlashScreen({ navigation }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const palette = useMemo(() => createPalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.18)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(22)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    let isMounted = true;

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.30, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, tension: 58, friction: 6, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.timing(tagOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(pillOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(pillY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    Promise.all([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(resolve, 2800)),
    ]).then(async ([sessionResult]) => {
      if (!isMounted) {
        return;
      }

      const sessionPhone = sessionResult?.data?.session?.user?.phone || '';
      let nextRoute;

      if (sessionPhone) {
        completePhoneAuth(sessionPhone);
        await syncAuthenticatedAppData();

        const profileResult = await fetchOwnProfileRecord();
        const requiresNameSetup = !profileResult.error && !hasStoredFullName(profileResult.data);

        nextRoute = requiresNameSetup ? 'NameSetup' : 'Main';
      } else {
        clearAuthenticatedState();
        await resetAuthenticatedAppData();
        nextRoute = 'Onboarding';
      }

      navigation.replace(nextRoute);
    });

    return () => {
      isMounted = false;
    };
  }, [
    glowOpacity,
    glowPulse,
    iconOpacity,
    iconScale,
    navigation,
    pillOpacity,
    pillY,
    tagOpacity,
    textOpacity,
    textY,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={palette.bg} />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: Math.ceil(height / 40) }).map((_, index) => (
          <View key={`h${index}`} style={[styles.gridH, { top: index * 40 }]} />
        ))}
        {Array.from({ length: Math.ceil(width / 40) }).map((_, index) => (
          <View key={`v${index}`} style={[styles.gridV, { left: index * 40 }]} />
        ))}
      </View>

      <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]}>
        <Animated.View style={[styles.glowCore, { opacity: glowPulse }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.iconWrap,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[palette.coralLight, palette.coral, palette.coralDeep]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.iconGrad}
        >
          <WrenchView />
        </LinearGradient>
        <View style={styles.iconShadow} />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
        <Text style={styles.appName}>
          <Text style={styles.trust}>Trust</Text>
          <Text style={styles.fix}>Fix</Text>
        </Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        India's Trust-First{'\n'}Home Service Platform
      </Animated.Text>

      <Animated.View
        style={[
          styles.pillWrap,
          {
            opacity: pillOpacity,
            transform: [{ translateY: pillY }],
          },
        ]}
      >
        <View style={styles.pill} />
      </Animated.View>
    </View>
  );
}

const createStyles = (palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: palette.grid,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: palette.grid,
  },
  glowRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCore: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: palette.glow,
  },
  iconWrap: {
    marginBottom: 30,
    alignItems: 'center',
  },
  iconGrad: {
    width: 100,
    height: 100,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.coralDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 14,
  },
  iconShadow: {
    position: 'absolute',
    bottom: -10,
    width: 72,
    height: 14,
    borderRadius: 36,
    backgroundColor: palette.shadow,
  },
  appName: {
    fontSize: 44,
    letterSpacing: -1.5,
    marginBottom: 10,
    includeFontPadding: false,
  },
  trust: {
    fontWeight: '800',
    color: palette.textDark,
  },
  fix: {
    fontWeight: '800',
    color: palette.coral,
  },
  tagline: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '500',
  },
  pillWrap: {
    position: 'absolute',
    bottom: 36,
  },
  pill: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.coral,
    opacity: 0.7,
  },
});

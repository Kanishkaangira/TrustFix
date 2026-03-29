// ════════════════════════════════════════════════════════════════
//  TrustFix — Flash Screen
//  NO react-native-svg dependency — pure RN Views + LinearGradient
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const C = {
  coral:     '#FF6B35',
  coralDeep: '#E8531A',
  coralMid:  '#FF7A45',
  coralLight:'#FF9262',
  bgLight:   '#FFF8F5',
  textDark:  '#1A1A2E',
  textMuted: '#9CA3AF',
  white:     '#FFFFFF',
};

// ── Wrench drawn with plain Views ─────────────────────────────
const WrenchView = () => (
  <View style={w.wrap}>
    {/* Handle (vertical bar) */}
    <View style={w.handle} />
    {/* Top jaw */}
    <View style={w.jawTop} />
    {/* Bottom jaw */}
    <View style={w.jawBot} />
  </View>
);

const WRENCH_ROTATE = '-30deg';

const w = StyleSheet.create({
  wrap: {
    width: 44, height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: WRENCH_ROTATE }],
  },
  handle: {
    position: 'absolute',
    width: 10, height: 30,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    top: 7, left: 17,
  },
  jawTop: {
    position: 'absolute',
    width: 24, height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    top: 7, left: 10,
  },
  jawBot: {
    position: 'absolute',
    width: 18, height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.78)',
    top: 18, left: 10,
  },
});

// ════════════════════════════════════════════════════════════════
const FlashScreen = ({ navigation }) => {
  const iconScale   = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse   = useRef(new Animated.Value(0.18)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(22)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillY       = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Glow breathes forever
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.30, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    // Entrance sequence
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
        Animated.timing(textY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.timing(tagOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(pillOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(pillY,       { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => navigation.replace('Onboarding'), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgLight} />

      {/* Grid background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 22 }).map((_, i) => (
          <View key={`h${i}`} style={[s.gridH, { top: i * 40 }]} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`v${i}`} style={[s.gridV, { left: i * 40 }]} />
        ))}
      </View>

      {/* Glow ring */}
      <Animated.View style={[s.glowRing, { opacity: glowOpacity }]}>
        <Animated.View style={[s.glowCore, { opacity: glowPulse }]} />
      </Animated.View>

      {/* App Icon */}
      <Animated.View style={[s.iconWrap, {
        opacity: iconOpacity,
        transform: [{ scale: iconScale }],
      }]}>
        <LinearGradient
          colors={[C.coralLight, C.coral, C.coralDeep]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={s.iconGrad}
        >
          <WrenchView />
        </LinearGradient>
        <View style={s.iconShadow} />
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
        <Text style={s.appName}>
          <Text style={s.trust}>Trust</Text>
          <Text style={s.fix}>Fix</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[s.tagline, { opacity: tagOpacity }]}>
        India's Trust-First{'\n'}Home Service Platform
      </Animated.Text>

      {/* Bottom pill */}
      <Animated.View style={[s.pillWrap, {
        opacity: pillOpacity,
        transform: [{ translateY: pillY }],
      }]}>
        <View style={s.pill} />
      </Animated.View>
    </View>
  );
};

export default FlashScreen;

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: C.bgLight,
    alignItems: 'center', justifyContent: 'center',
  },
  gridH: {
    position: 'absolute', left: 0, right: 0,
    height: 0.5, backgroundColor: 'rgba(150,130,110,0.12)',
  },
  gridV: {
    position: 'absolute', top: 0, bottom: 0,
    width: 0.5, backgroundColor: 'rgba(150,130,110,0.12)',
  },
  glowRing: {
    position: 'absolute',
    width: 240, height: 240, borderRadius: 120,
    alignItems: 'center', justifyContent: 'center',
  },
  glowCore: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,107,53,0.20)',
  },
  iconWrap: {
    marginBottom: 30, alignItems: 'center',
  },
  iconGrad: {
    width: 100, height: 100, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.coralDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.40, shadowRadius: 22, elevation: 14,
  },
  iconShadow: {
    position: 'absolute', bottom: -10,
    width: 72, height: 14, borderRadius: 36,
    backgroundColor: 'rgba(232,83,26,0.25)',
  },
  appName: {
    fontSize: 44, letterSpacing: -1.5,
    marginBottom: 10, includeFontPadding: false,
  },
  trust: { fontWeight: '800', color: C.textDark },
  fix:   { fontWeight: '800', color: C.coral },
  tagline: {
    fontSize: 15, color: C.textMuted,
    textAlign: 'center', lineHeight: 23, fontWeight: '500',
  },
  pillWrap: { position: 'absolute', bottom: 36 },
  pill: {
    width: 48, height: 4, borderRadius: 2,
    backgroundColor: C.coral, opacity: 0.7,
  },
});
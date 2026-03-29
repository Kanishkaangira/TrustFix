// ════════════════════════════════════════════════════════════════
//  TrustFix — Onboarding Screen
//  NO react-native-svg — icons built with View + Text (emoji)
//  Each icon floats up/down with Animated.loop
// ════════════════════════════════════════════════════════════════

import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Animated, Dimensions, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const C = {
  coral:     '#FF6B35',
  coralDeep: '#E8531A',
  coralLight:'#FF9262',
  textDark:  '#1A1A2E',
  textGray:  '#6B7280',
  white:     '#FFFFFF',
};

// ════════════════════════════════════════════════════════════════
//  ICON COMPONENTS — pure View shapes, no SVG
// ════════════════════════════════════════════════════════════════

// Slide 1 — Money bundle
const MoneyIcon = () => (
  <View style={ic.moneyWrap}>
    {/* Back bill */}
    <View style={[ic.bill, ic.billBack2]} />
    <View style={[ic.bill, ic.billBack1]} />
    {/* Main bill */}
    <View style={ic.bill}>
      {/* Oval ring */}
      <View style={ic.billOval}>
        <Text style={ic.rupee}>₹</Text>
      </View>
      {/* Corner squares */}
      <View style={[ic.corner, { top: 8, left: 8 }]} />
      <View style={[ic.corner, { top: 8, right: 8 }]} />
    </View>
    {/* Rubber band */}
    <View style={ic.band} />
    {/* Price tag */}
    <View style={ic.tag}>
      <View style={ic.tagHole} />
      <Text style={ic.tagText}>₹0</Text>
    </View>
  </View>
);

// Slide 2 — AI Robot
const RobotIcon = () => (
  <View style={ic.robotWrap}>
    {/* Antenna */}
    <View style={ic.antenna} />
    <View style={ic.antennaDot} />
    {/* Head */}
    <View style={ic.head}>
      {/* Eyes row */}
      <View style={ic.eyesRow}>
        <View style={ic.eye}>
          <View style={ic.pupil} />
          <View style={ic.gleam} />
        </View>
        <View style={ic.eye}>
          <View style={ic.pupil} />
          <View style={ic.gleam} />
        </View>
      </View>
      {/* Mouth grill */}
      <View style={ic.grillRow}>
        {[0,1,2,3,4].map(i => <View key={i} style={ic.grillBar} />)}
      </View>
    </View>
    {/* Ears */}
    <View style={[ic.ear, { left: -10 }]} />
    <View style={[ic.ear, { right: -10 }]} />
    {/* Body */}
    <View style={ic.body}>
      <View style={ic.chestLight} />
    </View>
  </View>
);

// Slide 3 — Shield
const ShieldIcon = () => (
  <View style={ic.shieldWrap}>
    {/* Shadow */}
    <View style={ic.shieldShadow} />
    {/* Shield shape approximated with a rounded rect + bottom clip */}
    <LinearGradient
      colors={['#34D399', '#059669']}
      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={ic.shield}
    >
      {/* Shine */}
      <View style={ic.shineOverlay} />
      {/* Checkmark via two rotated views */}
      <View style={ic.checkWrap}>
        <View style={ic.checkShort} />
        <View style={ic.checkLong} />
      </View>
    </LinearGradient>
  </View>
);

// Slide 4 — Star
const StarIcon = () => (
  <View style={ic.starWrap}>
    {/* Render a large emoji star with glow shadow */}
    <View style={ic.starGlow} />
    <Text style={ic.starEmoji}>⭐</Text>
    {/* Sparkle dots */}
    <View style={[ic.sparkle, { top: 0, left: 10 }]} />
    <View style={[ic.sparkle, { top: 5, right: 8 }]} />
    <View style={[ic.sparkle, { bottom: 10, left: 4 }]} />
    {/* Sparkle lines */}
    <View style={[ic.sparkleLine, ic.sparkleLineV, { top: -8, left: 22 }]} />
    <View style={[ic.sparkleLine, ic.sparkleLineH, { top: 6, left: 8 }]} />
    <View style={[ic.sparkleLine, ic.sparkleLineV, { top: -6, right: 20 }]} />
    <View style={[ic.sparkleLine, ic.sparkleLineH, { top: 8, right: 6 }]} />
  </View>
);

// ── Icon styles ────────────────────────────────────────────────
const ic = StyleSheet.create({
  // Money
  moneyWrap: {
    width: 110, height: 100,
    alignItems: 'center', justifyContent: 'center',
  },
  bill: {
    position: 'absolute',
    width: 90, height: 58, borderRadius: 8,
    backgroundColor: '#81C784',
    borderWidth: 1.5, borderColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center',
    top: 14,
  },
  billBack1: {
    backgroundColor: '#66BB6A',
    transform: [{ rotate: '3deg' }],
    top: 10, opacity: 0.7,
  },
  billBack2: {
    backgroundColor: '#4CAF50',
    transform: [{ rotate: '6deg' }],
    top: 6, opacity: 0.5,
  },
  billOval: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center',
  },
  rupee: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
  corner: {
    position: 'absolute',
    width: 16, height: 10,
    borderRadius: 2, backgroundColor: '#4CAF50', opacity: 0.4,
  },
  band: {
    position: 'absolute',
    width: 90, height: 7, borderRadius: 3.5,
    backgroundColor: '#EF9A9A', opacity: 0.85,
    top: 36,
  },
  tag: {
    position: 'absolute',
    top: 0, right: 6,
    width: 32, height: 22, borderRadius: 5,
    backgroundColor: C.coral,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '15deg' }],
  },
  tagHole: {
    position: 'absolute',
    top: -5, width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#FFF8F5',
    borderWidth: 1.5, borderColor: '#FFD580',
  },
  tagText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Robot
  robotWrap: {
    width: 100, height: 120,
    alignItems: 'center',
  },
  antenna: {
    width: 3, height: 16, borderRadius: 1.5,
    backgroundColor: '#A78BFA', marginBottom: 0,
  },
  antennaDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#7C3AED',
    marginBottom: 2,
  },
  head: {
    width: 74, height: 52, borderRadius: 12,
    backgroundColor: '#8B5CF6',
    borderWidth: 1.5, borderColor: '#6D28D9',
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 4,
  },
  eyesRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  eye: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  pupil: {
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: '#7C3AED',
  },
  gleam: {
    position: 'absolute', top: 3, right: 3,
    width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff',
  },
  grillRow: {
    flexDirection: 'row', gap: 3,
    backgroundColor: '#6D28D9', borderRadius: 3,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  grillBar: {
    width: 2, height: 5, borderRadius: 1,
    backgroundColor: '#fff', opacity: 0.5,
  },
  ear: {
    position: 'absolute',
    width: 11, height: 22, borderRadius: 5.5,
    backgroundColor: '#7C3AED',
    top: 44,
  },
  body: {
    width: 58, height: 30, borderRadius: 10,
    backgroundColor: '#7C3AED',
    marginTop: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  chestLight: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#DDD6FE', opacity: 0.6,
  },

  // Shield
  shieldWrap: {
    width: 110, height: 110,
    alignItems: 'center', justifyContent: 'center',
  },
  shieldShadow: {
    position: 'absolute',
    width: 78, height: 88, borderRadius: 14,
    backgroundColor: '#059669', opacity: 0.2,
    top: 10, left: 16,
  },
  shield: {
    width: 78, height: 88, borderRadius: 14,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0, left: 0, width: 36, height: 88,
    backgroundColor: '#fff', opacity: 0.08,
    borderTopLeftRadius: 14, borderBottomLeftRadius: 40,
  },
  checkWrap: {
    width: 44, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  checkShort: {
    position: 'absolute',
    width: 16, height: 5, borderRadius: 2.5,
    backgroundColor: '#fff',
    bottom: 6, left: 6,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    width: 30, height: 5, borderRadius: 2.5,
    backgroundColor: '#fff',
    bottom: 10, right: 2,
    transform: [{ rotate: '-50deg' }],
  },

  // Star
  starWrap: {
    width: 110, height: 110,
    alignItems: 'center', justifyContent: 'center',
  },
  starGlow: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(251,191,36,0.2)',
  },
  starEmoji: {
    fontSize: 80,
    textShadowColor: 'rgba(217,119,6,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  sparkle: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FDE68A', opacity: 0.8,
  },
  sparkleLine: {
    position: 'absolute',
    backgroundColor: '#FDE68A', borderRadius: 2, opacity: 0.65,
  },
  sparkleLineV: { width: 2, height: 16 },
  sparkleLineH: { width: 16, height: 2 },
});

// ════════════════════════════════════════════════════════════════
//  SLIDE DATA
// ════════════════════════════════════════════════════════════════
const SLIDES = [
  {
    id: '1', index: '01 / 04', bgColor: '#FEF3ED',
    headline: 'No More', highlight: 'Hidden Prices',
    body: 'Every rupee — visit, parts, labour — locked in before you confirm. Zero surprises on your bill.',
    dotActive: 0, Icon: MoneyIcon,
    floatDuration: 3800, floatDelay: 0,
  },
  {
    id: '2', index: '02 / 04', bgColor: '#F0EEFF',
    headline: 'AI Diagnoses', highlight: 'Before You Book',
    body: 'Upload a photo or video. Our AI detects the fault, estimates repair cost, and rates urgency in seconds.',
    dotActive: 1, Icon: RobotIcon,
    floatDuration: 3200, floatDelay: 0,
  },
  {
    id: '3', index: '03 / 04', bgColor: '#EDFDF8',
    headline: 'Built-in', highlight: 'Family Safety',
    body: 'OTP to start, live selfie ID, and one-tap family location sharing. Every visit, every time.',
    dotActive: 2, Icon: ShieldIcon,
    floatDuration: 2900, floatDelay: 400,
  },
  {
    id: '4', index: '04 / 04', bgColor: '#FEFCE8',
    headline: 'Real Trust,', highlight: 'Not Fake Stars',
    body: 'Scientific Trust Scores built from punctuality, job completion, complaints & customer loyalty.',
    dotActive: 3, Icon: StarIcon,
    floatDuration: 3500, floatDelay: 200,
    isLast: true,
  },
];

// ── Floating wrapper ──────────────────────────────────────────
const FloatingIcon = ({ duration, delay, children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ════════════════════════════════════════════════════════════════
const OnboardingScreen = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef(null);

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(p => p + 1);
    } else {
      navigation.replace('Main');
    }
  };

  const renderSlide = ({ item }) => {
    const { Icon, bgColor, index, headline, highlight, body, dotActive, floatDuration, floatDelay, isLast } = item;
    return (
      <View style={[styles.slide, { width }]}>

        {/* Coloured top area */}
        <View style={[styles.slideTop, { backgroundColor: bgColor }]}>
          <FloatingIcon duration={floatDuration} delay={floatDelay}>
            <Icon />
          </FloatingIcon>
        </View>

        {/* White bottom */}
        <View style={styles.slideBottom}>
          <Text style={styles.idx}>{index}</Text>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.highlight}>{highlight}</Text>
          <Text style={styles.body}>{body}</Text>

          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === dotActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Button */}
          <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
            <LinearGradient
              colors={[C.coral, C.coralLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>
                {isLast ? 'Get Started →' : 'Next →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isLast && (
            <TouchableOpacity
              onPress={() => navigation.replace('Main')}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={renderSlide}
      />
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide:     { flex: 1 },

  slideTop: {
    height: height * 0.44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  slideBottom: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 20,
  },

  idx: {
    fontSize: 11, fontWeight: '700', color: C.coral,
    letterSpacing: 1.5, marginBottom: 10,
  },
  headline: {
    fontSize: 30, fontWeight: '800', color: C.textDark,
    letterSpacing: -0.6, lineHeight: 36,
  },
  highlight: {
    fontSize: 30, fontWeight: '800', color: C.coral,
    letterSpacing: -0.6, lineHeight: 36, marginBottom: 12,
  },
  body: {
    fontSize: 14, color: C.textGray,
    lineHeight: 22, fontWeight: '400', flex: 1,
  },

  dots:        { flexDirection: 'row', gap: 6, marginBottom: 22 },
  dot:         { height: 4, borderRadius: 2 },
  dotActive:   { width: 28, backgroundColor: C.coral },
  dotInactive: { width: 8,  backgroundColor: '#E5E7EB' },

  btn: {
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 12,
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnText: {
    fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3,
  },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14, color: C.textGray, fontWeight: '600' },
});
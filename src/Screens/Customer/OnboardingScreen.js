import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import { getThemeColors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { markOnboardingComplete } from '../../state/authStore';

const { width, height } = Dimensions.get('window');

const getSlides = (isDark) => ([
  {
    id: '1',
    index: '01 / 04',
    topBg: isDark ? '#2B221C' : '#FEF3ED',
    accent: '#FF6B35',
    icon: 'cash-multiple',
    headline: 'No More',
    highlight: 'Hidden Prices',
    body: 'Every rupee - visit, parts, labour - locked in before you confirm. Zero surprises on your bill.',
  },
  {
    id: '2',
    index: '02 / 04',
    topBg: isDark ? '#211F33' : '#F0EEFF',
    accent: '#7C3AED',
    icon: 'robot-outline',
    headline: 'AI Diagnoses',
    highlight: 'Before You Book',
    body: 'Upload a photo or video. Our AI detects the fault, estimates repair cost, and rates urgency in seconds.',
  },
  {
    id: '3',
    index: '03 / 04',
    topBg: isDark ? '#182722' : '#EDFDF8',
    accent: '#059669',
    icon: 'shield-check-outline',
    headline: 'Built-in',
    highlight: 'Family Safety',
    body: 'OTP to start, live selfie ID, and one-tap family location sharing. Every visit, every time.',
  },
  {
    id: '4',
    index: '04 / 04',
    topBg: isDark ? '#2A2617' : '#FEFCE8',
    accent: '#D97706',
    icon: 'star-four-points-outline',
    headline: 'Real Trust,',
    highlight: 'Not Fake Stars',
    body: 'Scientific Trust Scores built from punctuality, job completion, complaints and customer loyalty.',
    isLast: true,
  },
]);

function FloatingIcon({ duration, delay, children }) {
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
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const slides = useMemo(() => getSlides(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef(null);

  const finishOnboarding = () => {
    markOnboardingComplete();
    navigation.replace('Login');
  };

  const goNext = () => {
    if (activeIndex < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex((current) => current + 1);
    } else {
      finishOnboarding();
    }
  };

  const renderSlide = ({ item, index }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.slideTop, { backgroundColor: item.topBg }]}>
        <FloatingIcon duration={3200 + index * 200} delay={index * 140}>
          <View style={[styles.iconShell, { backgroundColor: item.accent }]}>
            <View style={styles.iconShellInner}>
              <Icon name={item.icon} size={54} color="#FFFFFF" />
            </View>
          </View>
        </FloatingIcon>
      </View>

      <View style={styles.slideBottom}>
        <Text style={[styles.idx, { color: item.accent }]}>{item.index}</Text>
        <Text style={styles.headline}>{item.headline}</Text>
        <Text style={[styles.highlight, { color: item.accent }]}>{item.highlight}</Text>
        <Text style={styles.body}>{item.body}</Text>

        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                dotIndex === activeIndex
                  ? [styles.dotActive, { backgroundColor: slide.accent }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
          <LinearGradient
            colors={['#FF6B35', '#FF9262']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>
              {item.isLast ? 'Get Started ->' : 'Next ->'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {!item.isLast ? (
          <TouchableOpacity
            onPress={finishOnboarding}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={renderSlide}
      />
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  slide: {
    flex: 1,
  },
  slideTop: {
    height: height * 0.44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShell: {
    width: 128,
    height: 128,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: isDark ? 0.38 : 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  iconShellInner: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideBottom: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 20,
  },
  idx: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  highlight: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: colors.inkSecondary,
    lineHeight: 22,
    fontWeight: '400',
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 22,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 28,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.border,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: colors.inkSecondary,
    fontWeight: '600',
  },
});

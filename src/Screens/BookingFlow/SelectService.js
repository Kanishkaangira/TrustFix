// src/Screens/BookingFlow/SelectService.js
// Step 1 — Service selection
// Hero header matches Home screen orange brand color
// Stats strip floats inside hero, body is light gray

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FONT, RADIUS, SPACING } from '../../theme';

const { width } = Dimensions.get('window');

// ─── Layout ──────────────────────────────────────────────────
const H_PAD   = 16;
const COL_GAP = 12;
const CARD_W  = (width - H_PAD * 2 - COL_GAP) / 2;
const CARD_H  = CARD_W * 1.22;
const HERO_ORANGE = '#FF6B35';

// ─── Bottom nav clearance ─────────────────────────────────────
const TAB_BAR_H = Platform.OS === 'ios' ? 84 : 72;

// ─── Service data ─────────────────────────────────────────────
const SERVICES = [
  {
    id:          'ac',
    label:       'AC Repair',
    shortLabel:  'AC Repair',
    icon:        'snowflake',
    accentColor: '#2563EB',
    iconColor:   '#2563EB',
    lightColor:  '#DBEAFE',
    startingAt:  '₹349',
  },
  {
    id:          'plumbing',
    label:       'Plumbing',
    shortLabel:  'Plumbing',
    icon:        'pipe-wrench',
    accentColor: '#16A34A',
    iconColor:   '#16A34A',
    lightColor:  '#DCFCE7',
    startingAt:  '₹199',
  },
  {
    id:          'electrician',
    label:       'Electrical',
    shortLabel:  'Electrician',
    icon:        'lightning-bolt',
    accentColor: '#D97706',
    iconColor:   '#D97706',
    lightColor:  '#FEF3C7',
    startingAt:  '₹249',
  },
  {
    id:          'carpentry',
    label:       'Carpentry',
    shortLabel:  'Carpentry',
    icon:        'view-grid',
    accentColor: '#7C3AED',
    iconColor:   '#7C3AED',
    lightColor:  '#EDE9FE',
    startingAt:  '₹299',
  },
  {
    id:          'cleaning',
    label:       'Cleaning',
    shortLabel:  'Deep Cleaning',
    icon:        'broom',
    accentColor: '#E11D48',
    iconColor:   '#E11D48',
    lightColor:  '#FFE4E6',
    startingAt:  '₹399',
  },
  {
    id:          'appliance',
    label:       'Appliances',
    shortLabel:  'Appliance Repair',
    icon:        'washing-machine',
    accentColor: '#0D9488',
    iconColor:   '#0D9488',
    lightColor:  '#CCFBF1',
    startingAt:  '₹299',
  },
];

// ─── Animated service card ────────────────────────────────────
function ServiceCard({ service, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue:        0.95,
      useNativeDriver: true,
      speed:           60,
      bounciness:      4,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue:        1,
      useNativeDriver: true,
      speed:           60,
      bounciness:      4,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: CARD_W }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.card,
          isSelected && {
            borderColor: service.accentColor,
            borderWidth: 2.5,
          },
        ]}
      >
        {/* Top accent bar */}
        <View style={[styles.topBar, { backgroundColor: service.accentColor }]} />

        <View style={styles.cardInner}>
          {/* Vivid icon box */}
          <View style={[styles.iconBox, { backgroundColor: service.lightColor }]}>
            <Icon name={service.icon} size={32} color={service.iconColor} />
          </View>

          {/* Label */}
          <Text
            style={[
              styles.cardLabel,
              isSelected && { color: service.accentColor },
            ]}
            numberOfLines={1}
          >
            {service.label}
          </Text>

          {/* Starting price */}
          <Text style={styles.cardPrice}>from {service.startingAt}</Text>

          {/* Check circle — bottom right */}
          <View
            style={[
              styles.checkCircle,
              isSelected
                ? { backgroundColor: service.accentColor, borderColor: service.accentColor }
                : { borderColor: '#D1D5DB' },
            ]}
          >
            {isSelected && (
              <Icon name="check" size={11} color="#fff" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────
export default function SelectService({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleTap = (service) => {
    setSelected(service.id);
    setTimeout(() => onSelect(service), 180);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HERO_ORANGE} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        bounces={false}
      >

        {/* ══ ORANGE HERO HEADER ══ */}
        <View style={styles.hero}>

          {/* Step pill — white on orange */}
          <View style={styles.stepPill}>
            <View style={styles.stepPillDot} />
            <Text style={styles.stepPillText}>STEP 1 OF 5</Text>
          </View>

          {/* Kicker label */}
          <Text style={styles.heroKicker}>HOME SERVICES</Text>

          {/* Big title */}
          <Text style={styles.heroTitle}>Book your{'\n'}repair today</Text>

          {/* Subtitle */}
          <Text style={styles.heroSub}>
            Trusted technicians at your doorstep —{'\n'}pick a category below to get started
          </Text>

          {/* Stats strip inside hero — floats on orange */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>50K+</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>4.8 ★</Text>
              <Text style={styles.statLabel}>Avg rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>28 min</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </View>

        </View>

        {/* ══ BODY ══ */}
        <View style={styles.body}>

          {/* Section label */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>CHOOSE A SERVICE</Text>
            <View style={styles.sectionLine} />
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {SERVICES.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isSelected={selected === svc.id}
                onPress={() => handleTap(svc)}
              />
            ))}
          </View>

          {/* Trust strip */}
          <View style={styles.trustStrip}>
            {[
              { icon: 'shield-check',  color: '#16A34A', bg: '#DCFCE7', label: 'Verified Pros'  },
              { icon: 'tag-outline',   color: '#2563EB', bg: '#DBEAFE', label: 'Fair Pricing'   },
              { icon: 'star-circle',   color: '#D97706', bg: '#FEF3C7', label: '4.8★ Rated'     },
            ].map((t, i, arr) => (
              <React.Fragment key={t.label}>
                <View style={styles.trustItem}>
                  <View style={[styles.trustIconBox, { backgroundColor: t.bg }]}>
                    <Icon name={t.icon} size={15} color={t.color} />
                  </View>
                  <Text style={styles.trustText}>{t.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.trustDivider} />}
              </React.Fragment>
            ))}
          </View>

        </View>

        <View style={{ height: TAB_BAR_H }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex:            1,
    backgroundColor: '#F3F4F6',
  },

  scroll: {
    flexGrow: 1,
  },

  // ── Orange Hero ──────────────────────────────────────────────
  hero: {
    backgroundColor:   HERO_ORANGE,
    paddingHorizontal: H_PAD,
    paddingTop:        SPACING.md,
    paddingBottom:     SPACING.xl,
  },

  // Step pill — white translucent on orange
  stepPill: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.28)',
    borderRadius:      RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical:    5,
    marginBottom:      14,
    gap:                6,
  },
  stepPillDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: '#FFFFFF',
  },
  stepPillText: {
    fontSize:      10,
    fontWeight:    FONT.black,
    color:         '#FFFFFF',
    letterSpacing: 1.1,
  },

  // Kicker text above title
  heroKicker: {
    fontSize:      10,
    fontWeight:    FONT.black,
    color:         'rgba(255,255,255,0.60)',
    letterSpacing: 1.3,
    marginBottom:  5,
  },

  // Big heading
  heroTitle: {
    fontSize:      30,
    fontWeight:    FONT.black,
    color:         '#FFFFFF',
    letterSpacing: -0.7,
    lineHeight:    36,
    marginBottom:   8,
  },

  // Subtitle
  heroSub: {
    fontSize:      13,
    color:         'rgba(255,255,255,0.70)',
    lineHeight:    20,
    fontWeight:    FONT.regular,
    marginBottom:  20,
  },

  // Stats strip — white card floating inside orange hero
  statsRow: {
    flexDirection:     'row',
    backgroundColor:   '#FFFFFF',
    borderRadius:      RADIUS.md,
    paddingVertical:   12,
    paddingHorizontal: 4,
    alignItems:        'center',
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.10,
    shadowRadius:      8,
    elevation:         4,
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
    gap:         3,
  },
  statNum: {
    fontSize:      15,
    fontWeight:    FONT.black,
    color:         '#0F172A',
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize:   10,
    color:      '#94A3B8',
    fontWeight: FONT.medium,
  },
  statDivider: {
    width:           1,
    height:          28,
    backgroundColor: '#E2E8F0',
  },

  // ── Body ─────────────────────────────────────────────────────
  body: {
    backgroundColor:   '#F3F4F6',
    paddingHorizontal: H_PAD,
    paddingTop:        18,
    paddingBottom:     SPACING.md,
  },

  // Section header row
  sectionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             10,
    marginBottom:   14,
  },
  sectionLabel: {
    fontSize:      10,
    fontWeight:    FONT.black,
    color:         '#94A3B8',
    letterSpacing: 1.4,
  },
  sectionLine: {
    flex:            1,
    height:          1,
    backgroundColor: '#E2E8F0',
  },

  // ── Card grid ────────────────────────────────────────────────
  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:             COL_GAP,
    marginBottom:   14,
  },

  // Individual service card
  card: {
    width:           CARD_W,
    height:          CARD_H,
    backgroundColor: '#FFFFFF',
    borderRadius:    RADIUS.lg,
    borderWidth:     1.5,
    borderColor:     '#E5E7EB',
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       2,
  },
  topBar: {
    height: 5,
    width:  '100%',
  },
  cardInner: {
    flex:    1,
    padding: 14,
  },
  iconBox: {
    width:          58,
    height:         58,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   10,
  },
  cardLabel: {
    fontSize:      16,
    fontWeight:    FONT.bold,
    color:         '#111827',
    marginBottom:   3,
    letterSpacing:  0.1,
  },
  cardPrice: {
    fontSize:   12,
    color:      '#9CA3AF',
    fontWeight: FONT.medium,
  },
  checkCircle: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'absolute',
    bottom:         12,
    right:          12,
  },

  // ── Trust strip ───────────────────────────────────────────────
  trustStrip: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   13,
    paddingHorizontal: 10,
    backgroundColor:   '#FFFFFF',
    borderRadius:      RADIUS.lg,
    borderWidth:       1,
    borderColor:       '#E5E7EB',
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.04,
    shadowRadius:      4,
    elevation:         1,
  },
  trustItem: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             6,
    flex:            1,
    justifyContent: 'center',
  },
  trustIconBox: {
    width:          26,
    height:         26,
    borderRadius:   7,
    alignItems:     'center',
    justifyContent: 'center',
  },
  trustText: {
    fontSize:   10.5,
    fontWeight: FONT.semibold,
    color:      '#4B5563',
  },
  trustDivider: {
    width:           1,
    height:          24,
    backgroundColor: '#E2E8F0',
  },
});

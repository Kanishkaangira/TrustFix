import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import BookingOrangeHero from '../../Components/BookingOrangeHero';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../theme';

const { width } = Dimensions.get('window');

const H_PAD = 16;
const COL_GAP = 12;
const CARD_W = (width - H_PAD * 2 - COL_GAP) / 2;
const CARD_H = CARD_W * 1.34;
const HERO_ORANGE = '#FF6B2B';
const TAB_BAR_H = Platform.OS === 'ios' ? 84 : 72;

const HERO_STATS = [
  { value: '50K+', label: 'Customers' },
  { value: '4.8/5', label: 'Avg rating' },
  { value: '28 min', label: 'Response' },
];

const SERVICES = [
  {
    id: 'ac',
    label: 'AC Repair',
    shortLabel: 'AC Repair',
    helper: 'Cooling, noise, gas refill',
    tag: 'Popular',
    icon: 'snowflake',
    accentColor: '#2563EB',
    iconColor: '#2563EB',
    lightColor: '#DBEAFE',
    startingAt: '\u20B9349',
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    shortLabel: 'Plumbing',
    helper: 'Leaks, taps, blocked drains',
    tag: 'Fast fix',
    icon: 'pipe-wrench',
    accentColor: '#16A34A',
    iconColor: '#16A34A',
    lightColor: '#DCFCE7',
    startingAt: '\u20B9199',
  },
  {
    id: 'electrician',
    label: 'Electrical',
    shortLabel: 'Electrician',
    helper: 'Wiring, switches, no power',
    tag: 'Safe care',
    icon: 'lightning-bolt',
    accentColor: '#D97706',
    iconColor: '#D97706',
    lightColor: '#FEF3C7',
    startingAt: '\u20B9249',
  },
  {
    id: 'carpentry',
    label: 'Carpentry',
    shortLabel: 'Carpentry',
    helper: 'Doors, locks, cabinets',
    tag: 'Custom',
    icon: 'view-grid',
    accentColor: '#7C3AED',
    iconColor: '#7C3AED',
    lightColor: '#EDE9FE',
    startingAt: '\u20B9299',
  },
  {
    id: 'cleaning',
    label: 'Cleaning',
    shortLabel: 'Deep Cleaning',
    helper: 'Kitchen, sofa, full home',
    tag: 'Deep clean',
    icon: 'broom',
    accentColor: '#E11D48',
    iconColor: '#E11D48',
    lightColor: '#FFE4E6',
    startingAt: '\u20B9399',
  },
  {
    id: 'appliance',
    label: 'Appliances',
    shortLabel: 'Appliance Repair',
    helper: 'Washer, fridge, microwave',
    tag: 'Expert',
    icon: 'washing-machine',
    accentColor: '#0D9488',
    iconColor: '#0D9488',
    lightColor: '#CCFBF1',
    startingAt: '\u20B9299',
  },
];

const BOOKING_PERKS = [
  {
    icon: 'shield-check',
    color: '#16A34A',
    bg: '#DCFCE7',
    title: 'Verified professionals',
    text: 'Every technician is screened and service-rated before assignments.',
  },
  {
    icon: 'tag-outline',
    color: '#2563EB',
    bg: '#DBEAFE',
    title: 'Transparent pricing',
    text: 'You see a clear starting price before moving to the next booking step.',
  },
  {
    icon: 'star-circle',
    color: '#D97706',
    bg: '#FEF3C7',
    title: 'Trusted response quality',
    text: 'Top categories are tuned for quick arrival windows and strong customer ratings.',
  },
];

function ServiceCard({ service, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
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
            shadowColor: service.accentColor,
            shadowOpacity: 0.14,
            elevation: 6,
          },
        ]}
      >
        <View style={[styles.cardTint, { backgroundColor: service.lightColor }]} />

        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <View style={[styles.iconBox, { backgroundColor: service.lightColor }]}>
              <Icon name={service.icon} size={30} color={service.iconColor} />
            </View>

            <View style={[styles.cardTag, { backgroundColor: service.lightColor }]}>
              <Text style={[styles.cardTagText, { color: service.accentColor }]}>
                {service.tag}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.cardLabel,
              isSelected && { color: service.accentColor },
            ]}
            numberOfLines={1}
          >
            {service.label}
          </Text>

          <Text style={styles.cardHelper} numberOfLines={2}>
            {service.helper}
          </Text>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardPriceLabel}>Starts at</Text>
              <Text
                style={[
                  styles.cardPrice,
                  isSelected && { color: service.accentColor },
                ]}
              >
                {service.startingAt}
              </Text>
            </View>

            <View
              style={[
                styles.cardAction,
                isSelected
                  ? { backgroundColor: service.accentColor, borderColor: service.accentColor }
                  : { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
              ]}
            >
              <Icon
                name={isSelected ? 'check' : 'arrow-right'}
                size={12}
                color={isSelected ? '#FFFFFF' : service.accentColor}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SelectService({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleTap = (service) => {
    setSelected(service.id);
    setTimeout(() => onSelect?.(service), 180);
  };

  return (
    <View style={styles.container}>
      <BookingOrangeHero
        eyebrow="HOME SERVICES"
        title={"Book your\nrepair today"}
        subtitle={"Trusted technicians at your doorstep.\nPick a category below to get started"}
        stats={HERO_STATS}
      />

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.body}>
          <View style={styles.bodyHandle} />

          <View style={styles.sectionIntro}>
            <Text style={styles.sectionEyebrow}>CHOOSE A SERVICE</Text>
            <Text style={styles.sectionTitle}>What do you need help with?</Text>
            <Text style={styles.sectionSubtitle}>
              Pick a category and we will match the right technician, tools,
              and next booking step.
            </Text>
          </View>

          <View style={styles.grid}>
            {SERVICES.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selected === service.id}
                onPress={() => handleTap(service)}
              />
            ))}
          </View>

          <View style={styles.assuranceCard}>
            <Text style={styles.assuranceEyebrow}>BOOK WITH CONFIDENCE</Text>

            {BOOKING_PERKS.map((perk, index) => (
              <View
                key={perk.title}
                style={[
                  styles.assuranceItem,
                  index < BOOKING_PERKS.length - 1 && styles.assuranceItemBorder,
                ]}
              >
                <View style={[styles.assuranceIconWrap, { backgroundColor: perk.bg }]}>
                  <Icon name={perk.icon} size={18} color={perk.color} />
                </View>

                <View style={styles.assuranceCopy}>
                  <Text style={styles.assuranceItemTitle}>{perk.title}</Text>
                  <Text style={styles.assuranceText}>{perk.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  bodyScroll: {
    flex: 1,
    backgroundColor: '#FCFBF8',
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  bodyScrollContent: {
    flexGrow: 1,
    paddingBottom: TAB_BAR_H + SPACING.sm,
  },
  body: {
    backgroundColor: '#FCFBF8',
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: SPACING.lg,
  },
  bodyHandle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: '#D7DDE5',
    marginBottom: 16,
  },

  sectionIntro: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: FONT.black,
    color: HERO_ORANGE,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: FONT.black,
    color: COLORS.ink,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.inkSecondary,
    marginTop: 8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COL_GAP,
    marginBottom: 18,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E7EAF0',
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardTint: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    top: -34,
    right: -30,
    opacity: 0.55,
  },
  cardInner: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTag: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: FONT.bold,
    letterSpacing: 0.3,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: COLORS.ink,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  cardHelper: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.inkSecondary,
    minHeight: 36,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPriceLabel: {
    fontSize: 10,
    color: COLORS.inkMuted,
    fontWeight: FONT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  cardPrice: {
    fontSize: 18,
    color: COLORS.ink,
    fontWeight: FONT.black,
    letterSpacing: -0.3,
  },
  cardAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  assuranceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    ...SHADOW.card,
  },
  assuranceEyebrow: {
    fontSize: 10,
    fontWeight: FONT.black,
    color: '#9A5A3F',
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  assuranceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
  },
  assuranceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assuranceCopy: {
    flex: 1,
  },
  assuranceItemTitle: {
    fontSize: 14,
    fontWeight: FONT.bold,
    color: COLORS.ink,
    marginBottom: 4,
  },
  assuranceText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.inkSecondary,
  },
});

// ════════════════════════════════════════════════════════════════
//  TrustFix — Home Screen
//  Design: Orange gradient header (coral) + Cream white body
//  Matches the app screenshot UI exactly
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenWrapper from '../Components/ScreenWrapper';
import {
  getDefaultAddress,
  subscribeToAddresses,
} from '../state/addressStore';
import {
  getProfile,
  subscribeToProfile,
} from '../state/profileStore';
import { useAppTheme } from '../theme/ThemeProvider';

// ─── Screen width used for responsive card sizing ─────────────
// ════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
//  All colors in one place — change here to retheme the screen
// ════════════════════════════════════════════════════════════════
const getHomeColors = (isDark) => ({
  headerTop: '#FF6B35',
  coral: '#FF6B35',
  coralDeep: isDark ? '#7A3215' : '#E8531A',
  coralLight: isDark ? '#FF875B' : '#FF9262',
  coralPale: isDark ? '#2B1D18' : '#FFF0EB',
  bgBody: isDark ? '#0B1118' : '#FAF9F6',
  bgCard: isDark ? '#161D26' : '#FFFFFF',
  bgInput: isDark ? '#1A2230' : '#FFFFFF',
  textPrimary: isDark ? '#F5F7FB' : '#1A1A2E',
  textSecondary: isDark ? '#C2CBD8' : '#6B7280',
  textTertiary: isDark ? '#8F9AAD' : '#9CA3AF',
  skyBg: isDark ? '#1A2942' : '#EFF6FF',
  skyIcon: '#3B82F6',
  greenBg: isDark ? '#173526' : '#F0FDF4',
  greenIcon: '#22C55E',
  amberBg: isDark ? '#362914' : '#FFFBEB',
  amberIcon: '#F59E0B',
  violetBg: isDark ? '#2B2341' : '#F5F3FF',
  violetIcon: '#8B5CF6',
  roseBg: isDark ? '#3B2128' : '#FFF1F2',
  roseIcon: '#F43F5E',
  tealBg: isDark ? '#193633' : '#F0FDFA',
  tealIcon: '#14B8A6',
  badgeSuccessBg: isDark ? '#163427' : '#F0FDF4',
  badgeInfoBg: isDark ? '#18283C' : '#EFF6FF',
  badgeWarningBg: isDark ? '#352912' : '#FFFBEB',
  emergencyStart: isDark ? '#F05F2D' : '#F05B28',
  emergencyMid: '#FF6B35',
  emergencyEnd: isDark ? '#FF8357' : '#FF855C',
  headerFade: isDark ? '#D86A41' : '#FFD5C2',
  headerTail: isDark ? '#0B1118' : '#FAF9F6',
  glassFill: isDark ? 'rgba(10,14,20,0.28)' : 'rgba(255,255,255,0.15)',
  glassFillStrong: isDark ? 'rgba(10,14,20,0.38)' : 'rgba(255,255,255,0.2)',
  glassBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.2)',
  glassBorderStrong: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.3)',
  glowSoft: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
  glowAccent: isDark ? 'rgba(255,122,69,0.16)' : 'rgba(211,96,45,0.26)',
  white: '#FFFFFF',
  border: isDark ? '#273241' : '#F3F4F6',
  borderStrong: isDark ? '#324152' : '#E5E7EB',
  shadow: '#000000',
  isDark,
});

// ════════════════════════════════════════════════════════════════
//  STATIC DATA — all the items rendered on screen
// ════════════════════════════════════════════════════════════════

// 5 services + 1 "More" card = 2 rows of 3
const getServices = (C) => [
  { id: '1', icon: 'snowflake',          name: 'AC Repair',  price: '₹349', iconColor: C.skyIcon,    bg: C.skyBg,    bookingService: { id: 'ac', label: 'AC Repair', shortLabel: 'AC Repair', icon: 'snowflake', accentColor: '#2563EB', iconColor: '#2563EB', lightColor: '#DBEAFE', startingAt: '₹349' } },
  { id: '2', icon: 'pipe-wrench',        name: 'Plumbing',   price: '₹199', iconColor: C.greenIcon,  bg: C.greenBg,  bookingService: { id: 'plumbing', label: 'Plumbing', shortLabel: 'Plumbing', icon: 'pipe-wrench', accentColor: '#16A34A', iconColor: '#16A34A', lightColor: '#DCFCE7', startingAt: '₹199' } },
  { id: '3', icon: 'lightning-bolt',     name: 'Electrical', price: '₹249', iconColor: C.amberIcon,  bg: C.amberBg,  bookingService: { id: 'electrician', label: 'Electrical', shortLabel: 'Electrician', icon: 'lightning-bolt', accentColor: '#D97706', iconColor: '#D97706', lightColor: '#FEF3C7', startingAt: '₹249' } },
  { id: '4', icon: 'view-grid',          name: 'Carpentry',  price: '₹299', iconColor: C.violetIcon, bg: C.violetBg, bookingService: { id: 'carpentry', label: 'Carpentry', shortLabel: 'Carpentry', icon: 'view-grid', accentColor: '#7C3AED', iconColor: '#7C3AED', lightColor: '#EDE9FE', startingAt: '₹299' } },
  { id: '5', icon: 'broom',              name: 'Cleaning',   price: '₹399', iconColor: C.roseIcon,   bg: C.roseBg,   bookingService: { id: 'cleaning', label: 'Cleaning', shortLabel: 'Deep Cleaning', icon: 'broom', accentColor: '#E11D48', iconColor: '#E11D48', lightColor: '#FFE4E6', startingAt: '₹399' } },
];

// 4 trust badges shown in horizontal scroll strip
const getBadges = (C) => [
  { icon: 'shield-check-outline', label: 'Verified Pros',    color: '#22C55E', bg: C.badgeSuccessBg },
  { icon: 'currency-inr',         label: '₹0 Visit Charge',  color: C.coral,   bg: C.coralPale },
  { icon: 'map-marker-check',     label: 'Live Tracking',    color: '#3B82F6', bg: C.badgeInfoBg },
  { icon: 'star-circle-outline',  label: '4.8★ Rated',       color: '#F59E0B', bg: C.badgeWarningBg },
];


// ════════════════════════════════════════════════════════════════
//  HOME SCREEN COMPONENT
// ════════════════════════════════════════════════════════════════
const FALLBACK_ADDRESS = {
  label: 'Home',
  address: 'Select your default address',
};

const COLLAPSED_ADDRESS_CHAR_LIMIT = 19;

const getCollapsedAddressPreview = (address) => {
  const cleanAddress = String(address || '').trim();
  if (cleanAddress.length <= COLLAPSED_ADDRESS_CHAR_LIMIT) {
    return cleanAddress;
  }

  return `${cleanAddress.slice(0, COLLAPSED_ADDRESS_CHAR_LIMIT).trimEnd()}...`;
};

const getProfileInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'RS';
};

const AddressDropdownIcon = ({ expanded = false, disabled = false, styles }) => (
  <View
    style={[
      styles.locationToggleIcon,
      expanded && styles.locationToggleIconExpanded,
      disabled && styles.locationToggleIconDisabled,
    ]}
  >
    <View style={[styles.locationToggleStroke, styles.locationToggleStrokeLeft]} />
    <View style={[styles.locationToggleStroke, styles.locationToggleStrokeRight]} />
  </View>
);

const Home = ({ navigation }) => {
  const { isDark } = useAppTheme();
  const C = useMemo(() => getHomeColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(C), [C]);
  const services = useMemo(() => getServices(C), [C]);
  const badges = useMemo(() => getBadges(C), [C]);
  const [defaultAddress, setDefaultAddress] = useState(() => getDefaultAddress() || FALLBACK_ADDRESS);
  const [profile, setProfile] = useState(() => getProfile());
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const addressText = defaultAddress?.address || FALLBACK_ADDRESS.address;
  const isAddressLong = addressText.length > COLLAPSED_ADDRESS_CHAR_LIMIT;
  const collapsedAddressText = isAddressLong
    ? getCollapsedAddressPreview(addressText)
    : addressText;
  const displayName = profile?.name || 'Rahul Sharma';
  const displayInitials = getProfileInitials(displayName);

  useEffect(() => subscribeToAddresses((nextAddresses) => {
    const nextDefaultAddress = nextAddresses.find((item) => item.isDefault) || nextAddresses[0] || FALLBACK_ADDRESS;
    setDefaultAddress(nextDefaultAddress);
  }), []);
  useEffect(() => subscribeToProfile(setProfile), []);

  useEffect(() => {
    setIsAddressExpanded(false);
  }, [addressText]);

  const openSearch = () => {
    navigation.getParent()?.navigate('Search');
  };

  const openVoiceSearch = () => {
    navigation.getParent()?.navigate('Search', {
      autoListenTrigger: Date.now(),
    });
  };

  const openBookingProblemStep = (service) => {
    navigation.navigate('Booking', {
      service,
      serviceTrigger: Date.now(),
    });
  };

  const toggleAddressExpansion = () => {
    if (!isAddressLong) {
      return;
    }

    setIsAddressExpanded((prev) => !prev);
  };

  return (
    <ScreenWrapper
      topColor={C.headerTop}
      bottomColor={C.bgBody}
      statusBarStyle="light-content"
    >

        <LinearGradient
          colors={[C.headerTop, C.emergencyMid, C.emergencyEnd, C.headerFade, C.headerTail]}
          locations={[0, 0.25, 0.55, 0.78, 1]}
          style={styles.headerGradient}
        >
          <View style={[styles.blob, styles.blobLarge]} />
          <View style={[styles.blob, styles.blobMedium]} />
          <View style={[styles.blobDark, styles.blobAccent]} />

        {/* ── Top bar: TrustFix pill + bell + avatar ── */}
        <View style={styles.topRow}>
          {/* App name pill — left side */}
          <View style={styles.appNamePill}>
            <Text style={styles.appNameText}>
              <Text style={styles.appNameTrust}>Trust</Text>
              <Text style={styles.appNameFix}>Fix</Text>
            </Text>
          </View>
          {/* Icons — right side */}
          <View style={styles.topIcons}>
            {/* Bell with notification dot */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Profile', { openScreen: 'notifications' })}
            >
              <Icon name="bell-outline" size={20} color={C.white} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            {/* Avatar circle */}
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => navigation.navigate('Profile', { openScreen: 'main' })}
            >
              <Text style={styles.avatarText}>{displayInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tappable location row ── */}
        <View style={[styles.locationRow, isAddressExpanded && styles.locationRowExpanded]}>
          <Icon
            name="map-marker"
            size={14}
            color="rgba(255,255,255,0.9)"
            style={styles.locationMarker}
          />
          <View style={[styles.locationTextWrap, isAddressExpanded && styles.locationTextWrapExpanded]}>
            <Text
              style={[styles.locationText, isAddressExpanded && styles.locationTextExpanded]}
              numberOfLines={isAddressExpanded ? undefined : 1}
            >
              {isAddressExpanded ? addressText : collapsedAddressText}
            </Text>
            <TouchableOpacity
              style={[
                styles.locationToggleBtn,
                !isAddressLong && styles.locationToggleBtnDisabled,
                isAddressExpanded && styles.locationToggleBtnExpanded,
              ]}
              activeOpacity={isAddressLong ? 0.8 : 1}
              onPress={toggleAddressExpansion}
              disabled={!isAddressLong}
            >
              <AddressDropdownIcon
                expanded={isAddressExpanded}
                disabled={!isAddressLong}
                styles={styles}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Greeting + BIG name + tagline ── */}
        <View style={styles.greetBlock}>
          {/* Small greeting */}
          <Text style={styles.greetText}>Good morning 👋</Text>
          {/* BIG user name — main visual focus */}
          <Text style={styles.userName}>{displayName}</Text>
          {/* Friendly tagline */}
          <Text style={styles.userTagline}>What needs fixing today?</Text>
        </View>

        {/* ── Mini stats strip ── */}
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>50K+</Text>
            <Text style={styles.headerStatLabel}>Customers</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>4.8 ★</Text>
            <Text style={styles.headerStatLabel}>Rating</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>28 min</Text>
            <Text style={styles.headerStatLabel}>Avg. Response</Text>
          </View>
        </View>

        {/* ── Search bar — white card floating in gradient ── */}
        <View style={styles.searchBar}>
          <TouchableOpacity
            style={styles.searchTapArea}
            activeOpacity={0.9}
            onPress={openSearch}
          >
            <Icon name="magnify" size={20} color={C.textTertiary} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search AC repair, plumber...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.micBtn}
            activeOpacity={0.85}
            onPress={openVoiceSearch}
          >
            <Icon name="microphone-outline" size={18} color={C.coral} />
          </TouchableOpacity>
        </View>

      </LinearGradient>
      {/* ── END HEADER ── */}


      {/* ════════════════════════════════════════════════════════
           SECTION 2 — SCROLLABLE CREAM BODY
           All content below the header lives inside this scroll.
          ════════════════════════════════════════════════════════ */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* EMERGENCY BANNER */}
        <LinearGradient
          colors={[C.emergencyStart, C.emergencyMid, C.emergencyEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emergencyBanner}
        >
          <View style={styles.emergencyTag}>
            <Text style={styles.emergencyTagText}>⚡ EMERGENCY</Text>
          </View>
          <Text style={styles.emergencyTitle}>30-Min Rapid{'\n'}Response</Text>
          <Text style={styles.emergencySub}>12 technicians near you right now</Text>
          <TouchableOpacity style={styles.emergencyBtn}>
            <Text style={styles.emergencyBtnText}>Activate Now →</Text>
          </TouchableOpacity>
          <Text style={styles.emergencyEmoji}>🔧</Text>
        </LinearGradient>

        {/* SERVICES GRID */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Booking')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesGrid}>
            {services.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                style={styles.svcCard}
                activeOpacity={0.8}
                onPress={() => openBookingProblemStep(svc.bookingService)}
              >
                <View style={[styles.svcIconWrap, { backgroundColor: svc.bg }]}>
                  <Icon name={svc.icon} size={28} color={svc.iconColor} />
                </View>
                <Text style={styles.svcName}>{svc.name}</Text>
                <Text style={styles.svcPrice}>from {svc.price}</Text>
              </TouchableOpacity>
            ))}
            {/* More card */}
            <TouchableOpacity
              style={[styles.svcCard, styles.moreCard]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Booking')}
            >
              <View style={[styles.svcIconWrap, styles.moreIconWrap]}>
                <Icon name="plus" size={28} color={C.coral} />
              </View>
              <Text style={[styles.svcName, { color: C.coral }]}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROMO BANNER */}
        <View style={styles.promoBanner}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoEyebrow}>MOST POPULAR</Text>
            <Text style={styles.promoTitle}>Book AC Service</Text>
            <Text style={styles.promoSub}>Summer special — ₹0 visit charge</Text>
            <TouchableOpacity style={styles.promoBtn}>
              <LinearGradient
                colors={[C.coral, C.coralLight]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.promoBtnGrad}
              >
                <Text style={styles.promoBtnText}>Book Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.promoEmoji}>❄️</Text>
        </View>

        {/* TRUST BADGES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgesScroll}
          contentContainerStyle={styles.badgesContent}
        >
          {badges.map((b, i) => (
            <View key={i} style={styles.badge}>
              <View style={[styles.badgeIcon, { backgroundColor: b.bg }]}>
                <Icon name={b.icon} size={18} color={b.color} />
              </View>
              <Text style={styles.badgeLabel}>{b.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomSpacer} />
      </ScrollView>

    </ScreenWrapper>
  );
};

export default Home;


// ════════════════════════════════════════════════════════════════
//  STYLES
//  Ordered top-to-bottom matching the JSX layout above
// ════════════════════════════════════════════════════════════════
const createStyles = (C) => StyleSheet.create({

  // ── HEADER ──────────────────────────────────────────────────
  headerGradient: {
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.glowSoft,
  },
  blobDark: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.glowAccent,
  },
  blobLarge: {
    width: 380,
    height: 380,
    top: -156,
    right: -110,
  },
  blobMedium: {
    width: 220,
    height: 220,
    top: 80,
    right: 130,
  },
  blobAccent: {
    width: 190,
    height: 190,
    top: 108,
    left: -110,
  },

  // Top bar: app pill (left) + bell + avatar (right)
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 12,
  },
  appNamePill: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 100,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  appNameText: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  appNameTrust: {
    color: '#111318',
  },
  appNameFix: {
    color: C.white,
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Rounded square button for the bell icon
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: C.glassFillStrong,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Small red dot on top-right of bell
  notifDot: {
    position: 'absolute',
    top: 8, right: 8,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: '#FB7185',   // rose = alert
    borderWidth: 1.5,
    borderColor: C.coral,
  },
  // Avatar circle — rounded square with initials
  avatarCircle: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: C.glassFillStrong,
    borderWidth: 2,
    borderColor: C.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.5,
  },

  // Location row — tappable, sits just below top bar
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  locationRowExpanded: {
    alignItems: 'flex-start',
  },
  locationMarker: {
    marginRight: 6,
    marginTop: 1,
  },
  locationTextWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextWrapExpanded: {
    alignItems: 'flex-start',
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    flexShrink: 1,
  },
  locationTextExpanded: {
    lineHeight: 18,
  },
  locationToggleBtn: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },
  locationToggleBtnExpanded: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  locationToggleBtnDisabled: {
    opacity: 0.55,
  },
  locationToggleIcon: {
    width: 12,
    height: 12,
    position: 'relative',
    overflow: 'visible',
  },
  locationToggleIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  locationToggleIconDisabled: {
    opacity: 0.7,
  },
  locationToggleStroke: {
    position: 'absolute',
    top: 4,
    width: 7.5,
    height: 1.6,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  locationToggleStrokeLeft: {
    left: 0.4,
    transform: [{ rotate: '45deg' }],
  },
  locationToggleStrokeRight: {
    right: 0.4,
    transform: [{ rotate: '-45deg' }],
  },

  // Greeting block — the BIG name section
  greetBlock: {
    marginBottom: 24,
  },
  greetText: {
    fontSize: 15,                 // slightly larger greeting
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 6,
  },
  userName: {
    fontSize: 36,                 // BIG — main visual focus of header
    fontWeight: '800',
    color: C.white,
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 6,
  },
  userTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },

  // Mini stats strip — 3 numbers inside a frosted pill
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.glassFill,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.3,
  },
  headerStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Search bar — white card inside the gradient
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgInput,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.borderStrong,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: C.isDark ? 0.08 : 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { marginRight: 8 },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: C.textTertiary,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.isDark ? 'rgba(255,107,53,0.18)' : C.coralPale,
    borderWidth: C.isDark ? 1 : 0,
    borderColor: C.isDark ? 'rgba(255,255,255,0.06)' : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },


  // ── SCROLL BODY ─────────────────────────────────────────────
  scrollBody: {
    flex: 1,
    backgroundColor: C.bgBody,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },


  // ── EMERGENCY BANNER ────────────────────────────────────────
  emergencyBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',          // clips the decorative emoji
    borderWidth: 1,
    borderColor: C.isDark ? 'rgba(255,255,255,0.08)' : 'transparent',
    shadowColor: C.coralLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: C.isDark ? 0.12 : 0.18,
    shadowRadius: 12,
    elevation: 2,
  },
  emergencyTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emergencyTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 1.5,
  },
  emergencyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 6,
  },
  emergencySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 18,
  },
  emergencyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  emergencyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.coralDeep,
  },
  emergencyEmoji: {
    position: 'absolute',        // sits in background bottom-right
    right: 16,
    bottom: 12,
    fontSize: 72,
    opacity: 0.2,                // watermark effect
  },


  // ── SERVICES ────────────────────────────────────────────────
  servicesSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontWeight: '700', color: C.coral },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  svcCard: {
    width: '31%',
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: C.isDark ? 0.18 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  // "More" card — soft coral tint background
  moreCard: { backgroundColor: C.coralPale },
  svcIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  // "More" icon bg — slightly deeper coral tint
  moreIconWrap: { backgroundColor: C.isDark ? 'rgba(255,107,53,0.22)' : 'rgba(255,107,53,0.15)' },
  svcName: { fontSize: 12, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 3 },
  svcPrice: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },


  // ── PROMO BANNER ────────────────────────────────────────────
  promoBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: C.isDark ? 0.16 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  promoLeft: { flex: 1 },
  promoEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: C.coral,
    letterSpacing: 2,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 14,
  },
  promoBtn: { alignSelf: 'flex-start' },
  promoBtnGrad: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 100,
  },
  promoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
  promoEmoji: {
    fontSize: 52,
    marginLeft: 12,
  },


  // ── TRUST BADGES ────────────────────────────────────────────
  badgesScroll: { marginBottom: 24 },
  badgesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSecondary,
  },
  bottomSpacer: {
    height: 24,
  },

});

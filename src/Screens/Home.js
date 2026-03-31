// ════════════════════════════════════════════════════════════════
//  TrustFix — Home Screen
//  Design: Orange gradient header (coral) + Cream white body
//  Matches the app screenshot UI exactly
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenWrapper from '../Components/ScreenWrapper';
import {
  getDefaultAddress,
  subscribeToAddresses,
} from '../store/addressStore';

// ─── Screen width used for responsive card sizing ─────────────
const { width } = Dimensions.get('window');

// ════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
//  All colors in one place — change here to retheme the screen
// ════════════════════════════════════════════════════════════════
const C = {
  // Brand — Coral / Orange (header gradient + CTAs)
  coral:        '#FF6B35',
  coralDeep:    '#E8531A',
  coralLight:   '#FF9262',
  coralPale:    '#FFF0EB',   // very light tint for tags / bg accents

  // Body backgrounds — light cream theme
  bgBody:       '#FAF9F6',   // cream white — main scroll background
  bgCard:       '#FFFFFF',   // white cards
  bgInput:      '#FFFFFF',   // search bar

  // Text hierarchy
  textPrimary:  '#1A1A2E',   // near-black — headings & names
  textSecondary:'#6B7280',   // mid grey  — descriptions
  textTertiary: '#9CA3AF',   // light grey — prices, meta, placeholders

  // Service icon colors (each service gets its own tint pair)
  skyBg:        '#EFF6FF',   skyIcon:    '#3B82F6',   // AC — blue
  greenBg:      '#F0FDF4',   greenIcon:  '#22C55E',   // Plumbing — green
  amberBg:      '#FFFBEB',   amberIcon:  '#F59E0B',   // Electrical — amber
  violetBg:     '#F5F3FF',   violetIcon: '#8B5CF6',   // Carpenter — violet
  roseBg:       '#FFF1F2',   roseIcon:   '#F43F5E',   // Painting — rose
  tealBg:       '#F0FDFA',   tealIcon:   '#14B8A6',   // Cleaning — teal

  // Misc
  white:        '#FFFFFF',
  border:       '#F3F4F6',
};

// ════════════════════════════════════════════════════════════════
//  STATIC DATA — all the items rendered on screen
// ════════════════════════════════════════════════════════════════

// 5 services + 1 "More" card = 2 rows of 3
const SERVICES = [
  { id: '1', icon: 'snowflake',          name: 'AC Repair',  price: '₹349', iconColor: C.skyIcon,    bg: C.skyBg,    bookingService: { id: 'ac', label: 'AC Repair', shortLabel: 'AC Repair', icon: 'snowflake', accentColor: '#2563EB', iconColor: '#2563EB', lightColor: '#DBEAFE', startingAt: '₹349' } },
  { id: '2', icon: 'pipe-wrench',        name: 'Plumbing',   price: '₹199', iconColor: C.greenIcon,  bg: C.greenBg,  bookingService: { id: 'plumbing', label: 'Plumbing', shortLabel: 'Plumbing', icon: 'pipe-wrench', accentColor: '#16A34A', iconColor: '#16A34A', lightColor: '#DCFCE7', startingAt: '₹199' } },
  { id: '3', icon: 'lightning-bolt',     name: 'Electrical', price: '₹249', iconColor: C.amberIcon,  bg: C.amberBg,  bookingService: { id: 'electrician', label: 'Electrical', shortLabel: 'Electrician', icon: 'lightning-bolt', accentColor: '#D97706', iconColor: '#D97706', lightColor: '#FEF3C7', startingAt: '₹249' } },
  { id: '4', icon: 'view-grid',          name: 'Carpentry',  price: '₹299', iconColor: C.violetIcon, bg: C.violetBg, bookingService: { id: 'carpentry', label: 'Carpentry', shortLabel: 'Carpentry', icon: 'view-grid', accentColor: '#7C3AED', iconColor: '#7C3AED', lightColor: '#EDE9FE', startingAt: '₹299' } },
  { id: '5', icon: 'broom',              name: 'Cleaning',   price: '₹399', iconColor: C.roseIcon,   bg: C.roseBg,   bookingService: { id: 'cleaning', label: 'Cleaning', shortLabel: 'Deep Cleaning', icon: 'broom', accentColor: '#E11D48', iconColor: '#E11D48', lightColor: '#FFE4E6', startingAt: '₹399' } },
];

// 4 trust badges shown in horizontal scroll strip
const BADGES = [
  { icon: 'shield-check-outline', label: 'Verified Pros',    color: '#22C55E', bg: '#F0FDF4' },
  { icon: 'currency-inr',         label: '₹0 Visit Charge',  color: C.coral,   bg: C.coralPale },
  { icon: 'map-marker-check',     label: 'Live Tracking',    color: '#3B82F6', bg: '#EFF6FF' },
  { icon: 'star-circle-outline',  label: '4.8★ Rated',       color: '#F59E0B', bg: '#FFFBEB' },
];


// ════════════════════════════════════════════════════════════════
//  HOME SCREEN COMPONENT
// ════════════════════════════════════════════════════════════════
const FALLBACK_ADDRESS = {
  label: 'Home',
  address: 'Select your default address',
};

const AddressDropdownIcon = ({ expanded = false, disabled = false }) => (
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
  const [defaultAddress, setDefaultAddress] = useState(() => getDefaultAddress() || FALLBACK_ADDRESS);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isAddressLong, setIsAddressLong] = useState(false);
  const addressText = defaultAddress?.address || FALLBACK_ADDRESS.address;

  useEffect(() => subscribeToAddresses((nextAddresses) => {
    const nextDefaultAddress = nextAddresses.find((item) => item.isDefault) || nextAddresses[0] || FALLBACK_ADDRESS;
    setDefaultAddress(nextDefaultAddress);
  }), []);

  useEffect(() => {
    setIsAddressExpanded(false);
    setIsAddressLong(false);
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
      topColor={C.coralDeep}
      bottomColor={C.bgBody}
      statusBarStyle="light-content"
    >

        <LinearGradient
          colors={[C.coralDeep, C.coral, C.coralLight, '#FFD5C2', C.bgBody]}
        locations={[0, 0.25, 0.55, 0.78, 1]}
        style={styles.headerGradient}
      >

        {/* ── Top bar: TrustFix pill + bell + avatar ── */}
        <View style={styles.topRow}>
          {/* App name pill — left side */}
          <View style={styles.appNamePill}>
            <Text style={styles.appNameText}>TrustFix</Text>
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
              <Text style={styles.avatarText}>KA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tappable location row ── */}
        <View style={[styles.locationRow, isAddressExpanded && styles.locationRowExpanded]}>
          <Icon name="map-marker" size={14} color="rgba(255,255,255,0.9)" />
          <View style={styles.locationTextWrap}>
            <Text
              style={styles.locationTextMeasure}
              onTextLayout={({ nativeEvent }) => {
                const nextIsLong = nativeEvent.lines.length > 1;
                setIsAddressLong((prev) => (prev === nextIsLong ? prev : nextIsLong));
              }}
            >
              {addressText}
            </Text>
            <Text
              style={[styles.locationText, isAddressExpanded && styles.locationTextExpanded]}
              numberOfLines={isAddressExpanded ? undefined : 1}
            >
              {addressText}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.locationToggleBtn,
              !isAddressLong && styles.locationToggleBtnDisabled,
            ]}
            activeOpacity={isAddressLong ? 0.8 : 1}
            onPress={toggleAddressExpansion}
            disabled={!isAddressLong}
          >
            <AddressDropdownIcon
              expanded={isAddressExpanded}
              disabled={!isAddressLong}
            />
          </TouchableOpacity>
        </View>

        {/* ── Greeting + BIG name + tagline ── */}
        <View style={styles.greetBlock}>
          {/* Small greeting */}
          <Text style={styles.greetText}>Good morning 👋</Text>
          {/* BIG user name — main visual focus */}
          <Text style={styles.userName}>Kanishka Angira</Text>
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
          colors={[C.coralDeep, C.coral, C.coralLight]}
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
            {SERVICES.map((svc) => (
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
          {BADGES.map((b, i) => (
            <View key={i} style={styles.badge}>
              <View style={[styles.badgeIcon, { backgroundColor: b.bg }]}>
                <Icon name={b.icon} size={18} color={b.color} />
              </View>
              <Text style={styles.badgeLabel}>{b.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 24 }} />
      </ScrollView>

    </ScreenWrapper>
  );
};

export default Home;


// ════════════════════════════════════════════════════════════════
//  STYLES
//  Ordered top-to-bottom matching the JSX layout above
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({

  // ── HEADER ──────────────────────────────────────────────────
  headerGradient: {
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
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
    gap: 4,
    marginBottom: 22,
  },
  locationRowExpanded: {
    alignItems: 'flex-start',
  },
  locationTextWrap: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginHorizontal: 2,
  },
  locationTextExpanded: {
    lineHeight: 18,
  },
  locationTextMeasure: {
    position: 'absolute',
    left: 2,
    right: 2,
    opacity: 0,
    zIndex: -1,
    fontSize: 13,
    fontWeight: '600',
  },
  locationToggleBtn: {
    width: 28,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    marginTop: 1,
  },
  locationToggleBtnDisabled: {
    opacity: 0.5,
  },
  locationToggleIcon: {
    width: 20,
    height: 12,
    position: 'relative',
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
    width: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  locationToggleStrokeLeft: {
    left: 0,
    transform: [{ rotate: '45deg' }],
  },
  locationToggleStrokeRight: {
    right: 0,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
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
    backgroundColor: C.coralPale,
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
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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
  moreIconWrap: { backgroundColor: 'rgba(255,107,53,0.15)' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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

});

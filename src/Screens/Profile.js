import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Switch,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── BRAND TOKENS ─────────────────────────────────────────────
const COLORS = {
  brand: '#FF6B2B',
  brandDeep: '#E8520F',
  brandSoft: '#FFF0E8',
  brandGlass: 'rgba(255,107,43,0.08)',
  bg: '#FFF8F4',
  surface: '#FFFFFF',
  text: '#1A0F00',
  textMid: '#5C3D20',
  muted: '#A0856A',
  divider: 'rgba(255,107,43,0.07)',
  green: '#00B87A',
  greenSoft: 'rgba(0,184,122,0.1)',
  blue: '#3D6EFF',
  blueSoft: 'rgba(61,110,255,0.1)',
  red: '#FF3B5C',
  redSoft: 'rgba(255,59,92,0.1)',
  yellow: '#F59E0B',
  yellowSoft: 'rgba(245,158,11,0.1)',
  white: '#FFFFFF',
};

// ─── HELPERS ──────────────────────────────────────────────────
const Chip = ({ label, variant = 'brand', style }) => {
  const variants = {
    brand: { bg: COLORS.brandSoft, color: COLORS.brand },
    green: { bg: COLORS.greenSoft, color: COLORS.green },
    blue: { bg: COLORS.blueSoft, color: COLORS.blue },
    red: { bg: COLORS.redSoft, color: COLORS.red },
    yellow: { bg: COLORS.yellowSoft, color: COLORS.yellow },
  };
  const v = variants[variant] || variants.brand;
  return (
    <View style={[{ backgroundColor: v.bg, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 }, style]}>
      <Text style={{ color: v.color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
};

const SectionTitle = ({ title }) => (
  <Text style={styles.groupTitle}>{title}</Text>
);

const SettingRow = ({
  icon, iconBg = COLORS.brandSoft,
  title, subtitle,
  rightChip, rightChipVariant, rightValue,
  showChevron = true, onPress,
  showToggle = false, toggleValue, onToggle,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.settingIconWrap, { backgroundColor: iconBg }]}>
      <Text style={styles.settingIconText}>{icon}</Text>
    </View>
    <View style={styles.settingText}>
      <Text style={[styles.settingName, danger && { color: COLORS.red }]}>{title}</Text>
      {subtitle ? <Text style={styles.settingSub}>{subtitle}</Text> : null}
    </View>
    <View style={styles.settingRight}>
      {rightChip ? <Chip label={rightChip} variant={rightChipVariant || 'brand'} /> : null}
      {rightValue ? <Text style={styles.settingValue}>{rightValue}</Text> : null}
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#DDD4CC', true: COLORS.brand }}
          thumbColor={COLORS.white}
          ios_backgroundColor="#DDD4CC"
        />
      ) : showChevron ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

const Divider = () => <View style={styles.rowDivider} />;

// ─── SUB-SCREENS ──────────────────────────────────────────────

// ── Notifications Settings ──
const NotificationsScreen = ({ onBack }) => {
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [promos, setPromos] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [whatsapp, setWhatsapp] = useState(true);
  const [sms, setSms] = useState(false);

  return (
    <View style={styles.subScreenContainer}>
      <View style={styles.innerHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.innerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle title="Push Notifications" />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="📅" title="Booking Updates"
            subtitle="Confirmations, technician arrival"
            showToggle toggleValue={bookingUpdates} onToggle={setBookingUpdates}
          />
          <Divider />
          <SettingRow
            icon="🎁" title="Offers & Promotions"
            subtitle="Deals, cashbacks, new services"
            showToggle toggleValue={promos} onToggle={setPromos}
          />
          <Divider />
          <SettingRow
            icon="⏰" title="Service Reminders"
            subtitle="Annual checkups, warranties"
            showToggle toggleValue={reminders} onToggle={setReminders}
          />
        </View>

        <SectionTitle title="Channels" />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="💬" iconBg="#E8F5E9" title="WhatsApp Alerts"
            subtitle="Service updates on WhatsApp"
            showToggle toggleValue={whatsapp} onToggle={setWhatsapp}
          />
          <Divider />
          <SettingRow
            icon="📱" iconBg={COLORS.blueSoft} title="SMS Notifications"
            subtitle="OTPs and critical alerts"
            showToggle toggleValue={sms} onToggle={setSms}
          />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Saved Addresses ──
const AddressesScreen = ({ onBack }) => {
  const addresses = [
    { label: 'Home', address: 'B-12, Sector 62, Noida, UP 201309', icon: '🏠', active: true },
    { label: 'Office', address: '14th Floor, Cyber Hub, Gurugram, HR', icon: '🏢', active: false },
    { label: "Mom's Place", address: 'C-4, Lajpat Nagar II, New Delhi', icon: '❤️', active: false },
  ];
  return (
    <View style={styles.subScreenContainer}>
      <View style={styles.innerHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.innerTitle}>Saved Addresses</Text>
        <TouchableOpacity>
          <Text style={{ color: COLORS.brand, fontWeight: '700', fontSize: 14 }}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.settingsCard, { marginTop: 12 }]}>
          {addresses.map((a, i) => (
            <View key={a.label}>
              <TouchableOpacity style={styles.addressRow} activeOpacity={0.7}>
                <View style={[styles.settingIconWrap, { backgroundColor: a.active ? COLORS.brandSoft : '#F5F5F5' }]}>
                  <Text style={styles.settingIconText}>{a.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.settingName}>{a.label}</Text>
                    {a.active && <Chip label="Default" variant="brand" />}
                  </View>
                  <Text style={styles.settingSub} numberOfLines={1}>{a.address}</Text>
                </View>
                <TouchableOpacity>
                  <Text style={{ color: COLORS.muted, fontSize: 20 }}>…</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              {i < addresses.length - 1 && <Divider />}
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Payment Methods ──
const PaymentScreen = ({ onBack }) => {
  const methods = [
    { icon: '🏦', name: 'HDFC Bank UPI', sub: 'rahul@hdfcbank', type: 'UPI', active: true },
    { icon: '💳', name: 'Visa ending 4521', sub: 'Expires 09/27', type: 'Card', active: false },
    { icon: '📱', name: 'Paytm Wallet', sub: '₹420 available', type: 'Wallet', active: false },
  ];
  return (
    <View style={styles.subScreenContainer}>
      <View style={styles.innerHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.innerTitle}>Payment Methods</Text>
        <TouchableOpacity>
          <Text style={{ color: COLORS.brand, fontWeight: '700', fontSize: 14 }}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.settingsCard, { marginTop: 12 }]}>
          {methods.map((m, i) => (
            <View key={m.name}>
              <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                <View style={[styles.settingIconWrap, { backgroundColor: COLORS.brandSoft }]}>
                  <Text style={styles.settingIconText}>{m.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingName}>{m.name}</Text>
                  <Text style={styles.settingSub}>{m.sub}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {m.active && <Chip label="Default" variant="green" />}
                  <Chip label={m.type} variant="brand" />
                </View>
              </TouchableOpacity>
              {i < methods.length - 1 && <Divider />}
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Help & Support ──
const HelpScreen = ({ onBack }) => {
  const quickHelp = [
    { icon: '📋', name: 'Track Booking', sub: 'Live technician tracking' },
    { icon: '💰', name: 'Refund Status', sub: 'Check pending refunds' },
    { icon: '🔧', name: 'Reschedule', sub: 'Change date or time' },
    { icon: '⭐', name: 'Rate Service', sub: 'Share feedback' },
  ];
  const contacts = [
    { icon: '💬', iconBg: COLORS.greenSoft, name: 'Live Chat', sub: 'Avg reply in 2 mins', badge: 'Online', badgeVariant: 'green' },
    { icon: '📞', iconBg: COLORS.blueSoft, name: 'Call Us', sub: '1800-123-TRUST (Free)', badge: 'Available', badgeVariant: 'blue' },
    { icon: '📧', iconBg: COLORS.brandSoft, name: 'Email Support', sub: 'support@trustfix.in', badge: '24h reply', badgeVariant: 'yellow' },
    { icon: '🎫', iconBg: '#F3E8FF', name: 'Raise a Ticket', sub: 'Track issue resolution', badge: null },
  ];
  return (
    <View style={styles.subScreenContainer}>
      <View style={[styles.innerHeader, { backgroundColor: COLORS.brand }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: COLORS.white }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.innerTitle, { color: COLORS.white }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={styles.groupTitle}>Quick Help</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {quickHelp.map(q => (
              <TouchableOpacity key={q.name} style={styles.quickCard} activeOpacity={0.75}>
                <Text style={{ fontSize: 26, marginBottom: 6 }}>{q.icon}</Text>
                <Text style={styles.settingName}>{q.name}</Text>
                <Text style={[styles.settingSub, { fontSize: 10 }]}>{q.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={styles.groupTitle}>Contact Us</Text>
          <View style={styles.settingsCard}>
            {contacts.map((c, i) => (
              <View key={c.name}>
                <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                  <View style={[styles.settingIconWrap, { backgroundColor: c.iconBg }]}>
                    <Text style={styles.settingIconText}>{c.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingName}>{c.name}</Text>
                    <Text style={styles.settingSub}>{c.sub}</Text>
                  </View>
                  {c.badge && <Chip label={c.badge} variant={c.badgeVariant} style={{ marginRight: 6 }} />}
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                {i < contacts.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── About TrustFix ──
const AboutScreen = ({ onBack }) => {
  const values = [
    { icon: '🛡️', name: 'Verified Pros', desc: 'Background-checked technicians' },
    { icon: '⚡', name: 'Fast Response', desc: '2hr slots, same day' },
    { icon: '💯', name: 'Transparent', desc: 'Upfront pricing, no surprises' },
    { icon: '🤝', name: 'Trust First', desc: 'Money-back guarantee' },
  ];
  const stats = [
    { num: '50K+', label: 'Customers' },
    { num: '1200+', label: 'Technicians' },
    { num: '28', label: 'Cities' },
  ];
  const legal = [
    { label: 'Terms of Service', icon: '📄' },
    { label: 'Privacy Policy', icon: '🔒' },
    { label: 'Rate Us on Play Store', icon: '⭐' },
    { label: 'Open Source Licenses', icon: '📦' },
  ];
  return (
    <View style={styles.subScreenContainer}>
      <View style={[styles.innerHeader, { backgroundColor: COLORS.brand }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: COLORS.white }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.innerTitle, { color: COLORS.white }]}>About TrustFix</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo Hero */}
        <View style={styles.aboutHero}>
          <Text style={styles.aboutLogo}>Trust<Text style={{ opacity: 0.6 }}>Fix</Text></Text>
          <Text style={styles.aboutTagline}>Your Home, In Safe Hands.</Text>
          <View style={styles.aboutVersionBadge}>
            <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '700' }}>v2.1.0</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            TrustFix connects homeowners with verified, skilled technicians for appliance repair and home maintenance — making every service transparent, fast, and genuinely trustworthy.
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 }}>
          {stats.map(s => (
            <View key={s.label} style={styles.statAbout}>
              <Text style={styles.statAboutNum}>{s.num}</Text>
              <Text style={styles.statAboutLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Values */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={styles.groupTitle}>What We Stand For</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {values.map(v => (
              <View key={v.name} style={[styles.quickCard, { width: (width - 52) / 2 }]}>
                <Text style={{ fontSize: 26, marginBottom: 6 }}>{v.icon}</Text>
                <Text style={styles.settingName}>{v.name}</Text>
                <Text style={[styles.settingSub, { fontSize: 10 }]}>{v.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={styles.groupTitle}>Legal</Text>
          <View style={styles.settingsCard}>
            {legal.map((l, i) => (
              <View key={l.label}>
                <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                  <View style={[styles.settingIconWrap, { backgroundColor: COLORS.brandSoft }]}>
                    <Text style={styles.settingIconText}>{l.icon}</Text>
                  </View>
                  <Text style={[styles.settingName, { flex: 1 }]}>{l.label}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                {i < legal.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footerNote}>Made with ❤️ in India · © 2026 TrustFix Pvt. Ltd.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Share App ──
const ShareScreen = ({ onBack }) => {
  const platforms = [
    { icon: '💚', name: 'WhatsApp' },
    { icon: '📘', name: 'Facebook' },
    { icon: '✈️', name: 'Telegram' },
    { icon: '📩', name: 'SMS' },
  ];
  return (
    <View style={styles.subScreenContainer}>
      <View style={styles.innerHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.innerTitle}>Share TrustFix</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Share hero */}
        <View style={styles.shareHero}>
          <View style={styles.shareBigIcon}>
            <Text style={{ fontSize: 40 }}>📤</Text>
          </View>
          <Text style={styles.shareTitle}>Invite Friends & Earn</Text>
          <Text style={styles.shareSub}>Get ₹150 TrustFix Credits for every friend who books their first service</Text>
        </View>

        {/* Referral code */}
        <View style={styles.referralCard}>
          <Text style={styles.refLabel}>YOUR REFERRAL CODE</Text>
          <View style={styles.refCodeRow}>
            <View style={styles.refCodeBox}>
              <Text style={styles.refCodeText}>RAHUL150</Text>
            </View>
            <TouchableOpacity style={styles.refCopyBtn}>
              <Text style={{ color: COLORS.brand, fontWeight: '700', fontSize: 13 }}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.refReward}>🎉 You've earned ₹450 so far from 3 referrals</Text>
        </View>

        {/* Share platforms */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={styles.groupTitle}>Share Via</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {platforms.map(p => (
              <TouchableOpacity key={p.name} style={styles.platformBtn} activeOpacity={0.75}>
                <Text style={{ fontSize: 28, marginBottom: 4 }}>{p.icon}</Text>
                <Text style={styles.platformName}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Share link */}
        <View style={styles.shareLinkCard}>
          <Text style={styles.shareLinkText} numberOfLines={1}>https://trustfix.in/ref/RAHUL150</Text>
          <TouchableOpacity style={styles.shareLinkBtn}>
            <Text style={{ color: COLORS.brand, fontWeight: '700', fontSize: 12 }}>Copy Link</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Subscription Plan ──
const SubscriptionScreen = ({ onBack }) => {
  const plans = [
    {
      name: 'Basic',
      sub: 'For occasional users',
      price: 'Free',
      priceSub: '/ always',
      features: ['Standard booking', 'AI Diagnosis (3/month)'],
      disabledFeatures: ['Free visit charges'],
      current: false,
    },
    {
      name: 'HomeCare Pro ⭐',
      sub: 'Best for regular users',
      price: '₹199',
      priceSub: '/mo',
      features: ['Free visit charges', 'Priority booking', 'Unlimited AI Diagnosis', '1 free video consult/month'],
      disabledFeatures: [],
      current: true,
    },
    {
      name: 'Annual AMC',
      sub: 'Best value — save ₹389',
      price: '₹1,999',
      priceSub: '/yr',
      strikePrice: '₹2,388',
      features: ['All Pro features', 'Quarterly home checkup', 'Dedicated account manager'],
      disabledFeatures: [],
      current: false,
    },
  ];

  return (
    <View style={styles.subScreenContainer}>
      <View style={styles.innerHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.innerTitle}>My Plan</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current plan hero */}
        <View style={styles.subCurrentCard}>
          <Text style={styles.subCurrentLabel}>CURRENT PLAN</Text>
          <Text style={styles.subCurrentName}>HomeCare Pro ⭐</Text>
          <Text style={styles.subCurrentExp}>Renews April 11, 2026 · Auto-renew ON</Text>
          <Text style={styles.subCurrentPrice}>₹199 <Text style={{ fontSize: 14, opacity: 0.7 }}>/ month</Text></Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {['Free visits', 'Priority booking', 'Unlimited AI'].map(p => (
              <View key={p} style={styles.subPerk}>
                <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '600' }}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.groupTitle, { marginTop: 20 }]}>Upgrade Options</Text>

        {plans.map(plan => (
          <View key={plan.name} style={[styles.upgradeCard, plan.current && styles.upgradeCardBest]}>
            {plan.current && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Chip label="Current Plan" variant="brand" />
                <Chip label="Active ✓" variant="green" />
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeCardName}>{plan.name}</Text>
                <Text style={styles.settingSub}>{plan.sub}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.upgradeCardPrice}>{plan.price} <Text style={styles.upgradePriceSub}>{plan.priceSub}</Text></Text>
                {plan.strikePrice && <Text style={styles.strikePrice}>{plan.strikePrice}</Text>}
              </View>
            </View>
            {plan.features.map(f => (
              <View key={f} style={styles.upgradeFeat}>
                <Text style={{ color: COLORS.green, fontSize: 13, marginRight: 8 }}>✓</Text>
                <Text style={styles.featText}>{f}</Text>
              </View>
            ))}
            {plan.disabledFeatures.map(f => (
              <View key={f} style={styles.upgradeFeat}>
                <Text style={{ color: COLORS.muted, fontSize: 13, marginRight: 8 }}>✕</Text>
                <Text style={[styles.featText, { color: COLORS.muted }]}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.upgradeBtn, plan.current ? styles.upgradeBtnDisabled : styles.upgradeBtnPrimary]}
              disabled={plan.current}
              activeOpacity={0.8}
            >
              <Text style={[{ fontWeight: '700', fontSize: 14 }, plan.current ? { color: COLORS.muted } : { color: COLORS.white }]}>
                {plan.current ? 'Currently Active' : plan.name === 'Basic' ? 'Downgrade to Basic' : `Upgrade to ${plan.name.split(' ')[0]} AMC →`}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── MAIN PROFILE SCREEN ──────────────────────────────────────
const ProfileScreen = () => {
  const [activeScreen, setActiveScreen] = useState('profile');
  const [darkMode, setDarkMode] = useState(true);

  const navigate = (screen) => setActiveScreen(screen);
  const goBack = () => setActiveScreen('profile');

  // Render sub-screens
  if (activeScreen === 'notifications') return <NotificationsScreen onBack={goBack} />;
  if (activeScreen === 'addresses') return <AddressesScreen onBack={goBack} />;
  if (activeScreen === 'payment') return <PaymentScreen onBack={goBack} />;
  if (activeScreen === 'help') return <HelpScreen onBack={goBack} />;
  if (activeScreen === 'about') return <AboutScreen onBack={goBack} />;
  if (activeScreen === 'share') return <ShareScreen onBack={goBack} />;
  if (activeScreen === 'subscription') return <SubscriptionScreen onBack={goBack} />;

  // ── Main Profile ──
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brand} />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>

        {/* ── HERO ── */}
        <View style={styles.heroContainer}>
          <View style={styles.heroBg} />
          {/* Decorative blobs */}
          <View style={[styles.heroBlob, { width: 200, height: 200, top: -60, right: -40 }]} />
          <View style={[styles.heroBlob, { width: 120, height: 120, bottom: -30, left: 30 }]} />

          <View style={styles.heroContent}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <Text style={styles.avatarInitials}>RS</Text>
              </View>
              <View style={styles.avatarStatus} />
              <TouchableOpacity style={styles.avatarEdit}>
                <Text style={{ fontSize: 10 }}>✏️</Text>
              </TouchableOpacity>
            </View>

            {/* User info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Rahul Sharma</Text>
              <Text style={styles.profilePhone}>+91 98765 43210</Text>
              <View style={styles.locationChip}>
                <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '600' }}>📍 New Delhi</Text>
              </View>
            </View>

            {/* Trust score */}
            <View style={styles.trustBox}>
              <Text style={styles.trustNum}>9.2</Text>
              <Text style={styles.trustLabel}>TRUST{'\n'}SCORE</Text>
            </View>
          </View>
        </View>

        {/* ── STATS STRIP ── */}
        <View style={styles.statsStrip}>
          {[
            { val: '12', key: 'Services' },
            { val: '₹18k', key: 'Total Spent' },
            { val: '3', key: 'Warranties' },
          ].map((s, i) => (
            <View key={s.key} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statKey}>{s.key}</Text>
            </View>
          ))}
        </View>

        {/* ── PLAN STRIP ── */}
        <TouchableOpacity style={styles.planStrip} onPress={() => navigate('subscription')} activeOpacity={0.8}>
          <Text style={{ fontSize: 28 }}>⭐</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.planName}>HomeCare Pro</Text>
            <Text style={styles.planExp}>Active · Renews Apr 11, 2026</Text>
          </View>
          <Chip label="Manage" variant="brand" />
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* ── SETTINGS GROUPS ── */}
        <View style={{ paddingBottom: 100 }}>

          {/* Account */}
          <SectionTitle title="Account" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🏠" iconBg={COLORS.brandSoft}
              title="Saved Addresses" subtitle="Home, Office + 1 more"
              rightValue="3" onPress={() => navigate('addresses')}
            />
            <Divider />
            <SettingRow
              icon="💳" iconBg={COLORS.brandSoft}
              title="Payment Methods" subtitle="UPI, Card on file"
              onPress={() => navigate('payment')}
            />
          </View>

          {/* Preferences */}
          <SectionTitle title="Preferences" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🎨" iconBg="#EEF2FF"
              title="Appearance Mode" subtitle="Dark, Light or System"
              rightValue="Dark" onPress={() => {}}
            />
            <Divider />
            <SettingRow
              icon="🔔" iconBg="#F0FDF6"
              title="Notification Preferences" subtitle="Booking, promos, reminders"
              onPress={() => navigate('notifications')}
            />
            <Divider />
            <SettingRow
              icon="⭐" iconBg="#FFF8E6"
              title="Subscription Plan" subtitle="HomeCare Pro · Active"
              rightChip="Pro" rightChipVariant="brand"
              onPress={() => navigate('subscription')}
            />
          </View>

          {/* Support */}
          <SectionTitle title="Support" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="💬" iconBg="#EFF6FF"
              title="Need Help?" subtitle="Chat, call or raise a ticket"
              rightChip="Online" rightChipVariant="green"
              onPress={() => navigate('help')}
            />
            <Divider />
            <SettingRow
              icon="📤" iconBg={COLORS.brandSoft}
              title="Share TrustFix" subtitle="Refer & earn ₹150 per friend"
              onPress={() => navigate('share')}
            />
            <Divider />
            <SettingRow
              icon="🔧" iconBg={COLORS.brandSoft}
              title="About TrustFix" subtitle="Mission, version & legal"
              rightValue="v2.1" onPress={() => navigate('about')}
            />
          </View>

          {/* Danger Zone */}
          <SectionTitle title="Account Actions" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🚪" iconBg={COLORS.redSoft}
              title="Logout" subtitle="Sign out from this device"
              danger onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => {} },
              ])}
            />
            <Divider />
            <SettingRow
              icon="🗑️" iconBg={COLORS.redSoft}
              title="Delete Account" subtitle="Permanently delete your data"
              danger onPress={() => Alert.alert('Delete Account', 'This action is irreversible.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {} },
              ])}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.brand,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Hero ──
  heroContainer: {
    paddingBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.brand,
    // In RN, gradient requires expo-linear-gradient:
    // background: linear-gradient(145deg, #FF6B2B 0%, #FF8C55 45%, #FFB380 100%)
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 4,
  },
  avatarWrap: { position: 'relative' },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  avatarStatus: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00D97E',
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  avatarEdit: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
    paddingLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 24,
  },
  profilePhone: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
  },
  locationChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  trustBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  trustNum: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 26,
  },
  trustLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Stats ──
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.divider,
  },
  statCell: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statCellBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.divider,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statKey: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Plan strip ──
  planStrip: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#FFF0E8',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  planExp: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  // ── Settings ──
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginTop: 24,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  settingsCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.divider,
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingIconText: { fontSize: 18 },
  settingText: { flex: 1 },
  settingName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: COLORS.muted,
    lineHeight: 22,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginLeft: 68,
  },

  // ── Sub-screen shell ──
  subScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  innerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 28,
    color: COLORS.text,
    lineHeight: 32,
  },
  innerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  // ── Address row ──
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 14,
  },

  // ── Quick card (2-col grid) ──
  quickCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    maxWidth: (width - 52) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  // ── About ──
  aboutHero: {
    backgroundColor: COLORS.brand,
    paddingVertical: 40,
    alignItems: 'center',
  },
  aboutLogo: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -1,
  },
  aboutTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  aboutVersionBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  missionCard: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.1)',
    zIndex: 5,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  missionText: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
  },
  statAbout: {
    flex: 1,
    backgroundColor: COLORS.brandSoft,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.12)',
  },
  statAboutNum: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.brand,
  },
  statAboutLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    paddingTop: 24,
    paddingBottom: 8,
  },

  // ── Share ──
  shareHero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: 'center',
  },
  shareBigIcon: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  shareSub: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'center',
  },
  referralCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.brand,
    padding: 20,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  refLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  refCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refCodeBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
  },
  refCodeText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 3,
  },
  refCopyBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  refReward: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 10,
  },
  platformBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  platformName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
  },
  shareLinkCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  shareLinkText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'monospace',
  },
  shareLinkBtn: {
    backgroundColor: COLORS.brandSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  // ── Subscription ──
  subCurrentCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: COLORS.brand,
    padding: 20,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  subCurrentLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  subCurrentName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },
  subCurrentExp: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  subCurrentPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
  },
  subPerk: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  upgradeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,107,43,0.08)',
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  upgradeCardBest: {
    borderColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.12,
  },
  upgradeCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  upgradeCardPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.brand,
  },
  upgradePriceSub: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '400',
  },
  strikePrice: {
    fontSize: 10,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
  upgradeFeat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featText: {
    fontSize: 12,
    color: COLORS.textMid,
    flex: 1,
  },
  upgradeBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  upgradeBtnPrimary: {
    backgroundColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeBtnDisabled: {
    backgroundColor: COLORS.brandSoft,
  },
});

export default ProfileScreen;
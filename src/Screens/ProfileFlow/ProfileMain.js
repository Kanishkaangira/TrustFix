import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  SectionLabel,
  SettingRow,
  RowDivider,
  SettingsCard,
  useProfileColors,
} from '../../Components/ProfileComponents';
import { useAppTheme } from '../../theme/ThemeProvider';

const DEFAULT_PROFILE = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@gmail.com',
  plan: 'HomeCare Pro',
  planMeta: 'Active | Renews Apr 11, 2026',
};

const createIconStyles = colors =>
  StyleSheet.create({
    pencilBody: {
      width: 10,
      height: 14,
      borderWidth: 1.5,
      borderRadius: 2,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    pencilTip: {
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 5,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    pencilLine: {
      width: 8,
      height: 1.5,
      borderRadius: 1,
      marginTop: 2,
    },
    bellBody: {
      width: 16,
      height: 14,
      borderWidth: 2,
      borderRadius: 8,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    bellDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginTop: 1,
    },
    card: {
      width: 20,
      height: 14,
      borderWidth: 2,
      borderRadius: 3,
    },
    cardStripe: {
      height: 3,
      width: '100%',
      marginTop: 2,
    },
    pinCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
    },
    pinTail: {
      width: 2,
      height: 6,
      borderRadius: 1,
    },
    starWrap: {
      width: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    starPoint: {
      position: 'absolute',
      width: 2,
      height: 8,
      borderRadius: 1,
      top: 1,
      backgroundColor: colors.brand,
    },
    bubble: {
      width: 18,
      height: 13,
      borderWidth: 2,
      borderRadius: 6,
    },
    bubbleTail: {
      width: 0,
      height: 0,
      borderTopWidth: 5,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
      marginLeft: 3,
    },
    shareCircle: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 2,
    },
    shareLine: {
      width: 14,
      height: 2,
      borderRadius: 1,
      marginTop: 3,
    },
    infoCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoDot: {
      width: 3,
      height: 8,
      borderRadius: 1.5,
    },
    logoutRect: {
      width: 14,
      height: 16,
      borderWidth: 2,
      borderRadius: 3,
    },
    logoutArrow: {
      width: 8,
      height: 8,
      borderTopWidth: 2,
      borderRightWidth: 2,
      transform: [{ rotate: '45deg' }],
      marginLeft: -3,
    },
    trashLid: {
      width: 18,
      height: 2.5,
      borderRadius: 1,
    },
    trashBody: {
      width: 14,
      height: 14,
      borderWidth: 2,
      borderRadius: 2,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      marginTop: 1,
    },
    appearRect: {
      width: 18,
      height: 14,
      borderWidth: 2,
      borderRadius: 3,
    },
    appearInner: {
      width: 8,
      height: 6,
      borderRadius: 2,
      margin: 2,
    },
  });

const IconEdit = ({ colors, gi }) => (
  <View
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
    }}
  >
    <View style={[gi.pencilBody, { borderColor: colors.brand }]} />
    <View style={[gi.pencilTip, { borderTopColor: colors.brand }]} />
    <View style={[gi.pencilLine, { backgroundColor: colors.brand }]} />
  </View>
);

const IconBell = ({ colors, gi }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.bellBody, { borderColor: colors.green }]} />
    <View style={[gi.bellDot, { backgroundColor: colors.green }]} />
  </View>
);

const IconCard = ({ colors, gi }) => (
  <View style={[gi.card, { borderColor: colors.blue }]}>
    <View style={[gi.cardStripe, { backgroundColor: colors.blue }]} />
  </View>
);

const IconLocation = ({ colors, gi }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.pinCircle, { borderColor: colors.brand }]} />
    <View style={[gi.pinTail, { backgroundColor: colors.brand }]} />
  </View>
);

const IconStar = ({ gi }) => (
  <View style={gi.starWrap}>
    {[0, 72, 144, 216, 288].map(rotation => (
      <View
        key={rotation}
        style={[gi.starPoint, { transform: [{ rotate: `${rotation}deg` }] }]}
      />
    ))}
  </View>
);

const IconChat = ({ colors, gi }) => (
  <View>
    <View style={[gi.bubble, { borderColor: colors.blue }]} />
    <View style={[gi.bubbleTail, { borderTopColor: colors.blue }]} />
  </View>
);

const IconShare = ({ colors, gi }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.shareCircle, { borderColor: colors.brand }]} />
    <View style={[gi.shareLine, { backgroundColor: colors.brand }]} />
  </View>
);

const IconInfo = ({ colors, gi }) => (
  <View style={[gi.infoCircle, { borderColor: colors.muted }]}>
    <View style={[gi.infoDot, { backgroundColor: colors.muted }]} />
  </View>
);

const IconLogout = ({ colors, gi }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={[gi.logoutRect, { borderColor: colors.red }]} />
    <View style={[gi.logoutArrow, { borderColor: colors.red }]} />
  </View>
);

const IconDelete = ({ colors, gi }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.trashLid, { backgroundColor: colors.red }]} />
    <View style={[gi.trashBody, { borderColor: colors.red }]} />
  </View>
);

const IconAppear = ({ colors, gi }) => (
  <View style={[gi.appearRect, { borderColor: colors.muted }]}>
    <View style={[gi.appearInner, { backgroundColor: colors.muted }]} />
  </View>
);

export default function ProfileMain({ onNavigate, profile = DEFAULT_PROFILE }) {
  const colors = useProfileColors();
  const { mode } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const gi = useMemo(() => createIconStyles(colors), [colors]);
  const appearanceLabel = mode === 'dark' ? 'Dark' : 'Light';
  const scrollBottomPadding = bottom + 96;

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.hero}>
          <View
            style={[
              styles.blob,
              { width: 380, height: 380, top: -156, right: -110 },
            ]}
          />
          <View
            style={[
              styles.blob,
              { width: 220, height: 220, top: 80, right: 130 },
            ]}
          />
          <View
            style={[
              styles.blobDark,
              { width: 190, height: 190, top: 108, left: -110 },
            ]}
          />

          <View style={styles.heroHeader}>
            <Text style={styles.heroBrand}>
              <Text style={styles.heroBrandTrust}>Trust</Text>
              <Text style={styles.heroBrandFix}>Fix</Text>
            </Text>

            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Personal Hub</Text>
            </View>
          </View>

          <View style={styles.heroRow}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => onNavigate('editProfile')}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>

              <View style={styles.onlineDot} />

              <View style={styles.editBtn}>
                <View style={styles.editBtnLine} />
                <View style={styles.editBtnLineShort} />
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{profile.name}</Text>
              <Text style={styles.heroPhone}>{profile.phone}</Text>
              <Text style={styles.heroEmail} numberOfLines={1}>
                {profile.email}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPadding },
          ]}
        >
          <View style={styles.statsStrip}>
            {[
              { val: '12', label: 'Services' },
              { val: 'INR 18k', label: 'Total Spent' },
              { val: '3', label: 'Warranties' },
            ].map((stat, index) => (
              <View
                key={stat.label}
                style={[styles.statCell, index < 2 && styles.statCellBorder]}
              >
                <Text style={styles.statVal}>{stat.val}</Text>
                <Text style={styles.statKey}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.planStrip}
            onPress={() => onNavigate('subscription')}
            activeOpacity={0.85}
          >
            <View style={styles.planIconBox}>
              <View style={styles.planIconDot} />
            </View>

            <View style={styles.planContent}>
              <Text style={styles.planEyebrow}>MEMBERSHIP</Text>
              <Text style={styles.planName}>{profile.plan}</Text>
              <Text style={styles.planExp}>{profile.planMeta}</Text>
            </View>

            <View style={styles.planAction}>
              <Text style={styles.planActionText}>Manage</Text>
              <View style={styles.planChevron} />
            </View>
          </TouchableOpacity>

          <SectionLabel title="ACCOUNT" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.brandSoft}
              IconComponent={() => <IconEdit colors={colors} gi={gi} />}
              title="Edit Profile"
              subtitle="Name, email, city, pincode"
              onPress={() => onNavigate('editProfile')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              IconComponent={() => <IconLocation colors={colors} gi={gi} />}
              title="Saved Addresses"
              subtitle="Home, Office + 1 more"
              rightValue="3"
              onPress={() => onNavigate('addresses')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.blueSoft}
              IconComponent={() => <IconCard colors={colors} gi={gi} />}
              title="Payment Methods"
              subtitle="UPI, Card on file"
              onPress={() => onNavigate('payment')}
            />
          </SettingsCard>

          <SectionLabel title="PREFERENCES" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.isDark ? colors.surfaceSoft : '#F0F0F5'}
              IconComponent={() => <IconAppear colors={colors} gi={gi} />}
              title="Appearance"
              subtitle="Choose light or dark mode"
              rightValue={appearanceLabel}
              onPress={() => onNavigate('appearance')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.greenSoft}
              IconComponent={() => <IconBell colors={colors} gi={gi} />}
              title="Notifications"
              subtitle="Booking updates, promos, reminders"
              onPress={() => onNavigate('notifications')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              IconComponent={() => <IconStar gi={gi} />}
              title="Subscription Plan"
              subtitle="HomeCare Pro | Active"
              rightChip="Pro"
              rightChipVariant="brand"
              onPress={() => onNavigate('subscription')}
            />
          </SettingsCard>

          <SectionLabel title="SUPPORT" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.blueSoft}
              IconComponent={() => <IconChat colors={colors} gi={gi} />}
              title="Help & Support"
              subtitle="Chat, call or raise a ticket"
              rightChip="Online"
              rightChipVariant="green"
              onPress={() => onNavigate('help')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              IconComponent={() => <IconShare colors={colors} gi={gi} />}
              title="Share TrustFix"
              subtitle="Refer and earn INR 150 per friend"
              onPress={() => onNavigate('share')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.isDark ? colors.surfaceSoft : '#F3F4F6'}
              IconComponent={() => <IconInfo colors={colors} gi={gi} />}
              title="About TrustFix"
              subtitle="Mission, version and legal"
              rightValue="v2.1"
              onPress={() => onNavigate('about')}
            />
          </SettingsCard>

          <SectionLabel title="ACCOUNT ACTIONS" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.redSoft}
              IconComponent={() => <IconLogout colors={colors} gi={gi} />}
              title="Logout"
              subtitle="Sign out from this device"
              danger
              onPress={() =>
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: () => {} },
                ])
              }
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.redSoft}
              IconComponent={() => <IconDelete colors={colors} gi={gi} />}
              title="Delete Account"
              subtitle="Permanently delete all your data"
              danger
              onPress={() =>
                Alert.alert('Delete Account', 'This action is irreversible.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => {} },
                ])
              }
            />
          </SettingsCard>
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.headerAccent,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.bg,
      marginTop: colors.isDark ? -18 : -22,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    scrollContent: {
      paddingTop: 42,
    },
    hero: {
      backgroundColor: colors.headerAccent,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: colors.isDark ? 58 : 54,
      minHeight: 286,
      overflow: 'hidden',
      position: 'relative',
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: colors.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.08)',
    },
    blobDark: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: colors.glow,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroBrand: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    heroBrandTrust: {
      color: colors.isDark ? colors.white : '#111318',
    },
    heroBrandFix: {
      color: colors.isDark ? '#FF9D74' : colors.white,
    },
    heroPill: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.headerPill,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'transparent',
    },
    heroPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.86)',
      letterSpacing: 0.3,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      paddingVertical: 18,
      paddingHorizontal: 16,
      paddingRight: 16,
      borderRadius: 24,
      backgroundColor: colors.headerPill,
      borderWidth: 1,
      borderColor: colors.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.16)',
    },
    avatarWrap: {
      width: 88,
      height: 88,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    avatar: {
      width: 74,
      height: 74,
      borderRadius: 24,
      backgroundColor: colors.isDark
        ? 'rgba(255,122,69,0.14)'
        : 'rgba(255,255,255,0.28)',
      borderWidth: 2,
      borderColor: colors.isDark
        ? 'rgba(255,157,116,0.24)'
        : 'rgba(255,255,255,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: 0.3,
    },
    onlineDot: {
      position: 'absolute',
      right: 3,
      bottom: 6,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#2ED67B',
      borderWidth: 2,
      borderColor: colors.headerAccent,
    },
    editBtn: {
      position: 'absolute',
      top: 4,
      right: -2,
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: colors.isDark ? colors.surfaceRaised : colors.white,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.isDark ? colors.border : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.isDark ? colors.shadow : '#7B3917',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: colors.isDark ? 0.28 : 0.16,
      shadowRadius: 10,
      elevation: 4,
    },
    editBtnLine: {
      width: 10,
      height: 2.5,
      borderRadius: 2,
      backgroundColor: colors.brand,
    },
    editBtnLineShort: {
      width: 10,
      height: 2.5,
      borderRadius: 2,
      backgroundColor: colors.brand,
      marginTop: 3,
    },
    heroInfo: {
      flex: 1,
      paddingLeft: 18,
      paddingRight: 10,
    },
    heroName: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: -0.6,
    },
    heroPhone: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.80)',
      fontWeight: '600',
      marginTop: 7,
    },
    heroEmail: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.64)',
      marginTop: 4,
    },
    statsStrip: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: -34,
      backgroundColor: colors.isDark ? colors.surfaceRaised : colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.isDark ? 0.28 : 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    statCell: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    statCellBorder: {
      borderRightWidth: 1,
      borderRightColor: colors.divider,
    },
    statVal: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.ink,
      letterSpacing: -0.3,
    },
    statKey: {
      fontSize: 10,
      color: colors.muted,
      fontWeight: '700',
      marginTop: 4,
      letterSpacing: 0.1,
    },
    planStrip: {
      marginHorizontal: 16,
      marginTop: 14,
      backgroundColor: colors.isDark ? colors.surface : colors.brandSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.isDark ? colors.border : colors.brandMid,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: colors.isDark ? 0.18 : 0.04,
      shadowRadius: 14,
      elevation: 2,
    },
    planIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.isDark ? colors.brandSoft : colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.brand,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.isDark ? 0.28 : 0.16,
      shadowRadius: 16,
      elevation: 4,
    },
    planIconDot: {
      width: 11,
      height: 11,
      borderRadius: 5.5,
      backgroundColor: colors.white,
    },
    planContent: {
      flex: 1,
      marginLeft: 10,
    },
    planEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.muted,
      letterSpacing: 1.1,
      marginBottom: 4,
    },
    planName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.ink,
      letterSpacing: -0.4,
    },
    planExp: {
      fontSize: 11,
      color: colors.inkMid,
      marginTop: 3,
      fontWeight: '500',
    },
    planAction: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    planActionText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.brand,
    },
    planChevron: {
      width: 7,
      height: 7,
      borderTopWidth: 1.6,
      borderRightWidth: 1.6,
      borderColor: colors.brand,
      transform: [{ rotate: '45deg' }],
      marginLeft: 8,
    },
  });

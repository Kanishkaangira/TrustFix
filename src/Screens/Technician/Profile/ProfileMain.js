import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  RowDivider,
  SectionLabel,
  SettingRow,
  SettingsCard,
  useProfileColors,
} from '../../../Components/ProfileComponents';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { earningsSummary } from '../../../technician/mockData';
import {
  getTechnicianAddresses,
  getTechnicianProfile,
  subscribeToTechnicianAddresses,
  subscribeToTechnicianProfile,
} from '../../../technician/profileStore';

const TechnicianIcon = ({ name, color }) => (
  <Icon name={name} size={18} color={color} />
);

export default function ProfileMain({ navigation }) {
  const colors = useProfileColors();
  const { mode } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState(() => getTechnicianProfile());
  const [addresses, setAddresses] = useState(() => getTechnicianAddresses());
  const appearanceLabel = mode === 'dark' ? 'Dark' : 'Light';
  const scrollBottomPadding = bottom + 96;
  const emailLabel = profile.email || 'Add your work email address';
  const savedAddressCount = addresses.length;
  const savedAddressSubtitle = savedAddressCount === 0
    ? 'No saved service addresses yet'
    : savedAddressCount === 1
      ? addresses[0].label
      : `${addresses[0].label} + ${savedAddressCount - 1} more`;
  const stats = [
    { val: profile.jobsDone, label: 'Jobs Done' },
    { val: profile.rating, label: 'Rating' },
    { val: earningsSummary.total, label: 'This Month' },
  ];

  useEffect(() => subscribeToTechnicianProfile(setProfile), []);
  useEffect(() => subscribeToTechnicianAddresses(setAddresses), []);

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  const openProfileRoute = (routeName) => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate(routeName);
      return;
    }

    navigation.navigate(routeName);
  };

  const handleSignOut = () => {
    let rootNavigation = navigation;

    while (rootNavigation.getParent?.()) {
      rootNavigation = rootNavigation.getParent();
    }

    rootNavigation.reset({
      index: 0,
      routes: [{ name: 'TechnicianLogin' }],
    });
  };

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.hero}>
          <View style={styles.blob} />
          <View style={styles.blobAlt} />
          <View style={styles.blobGlow} />

          <View style={styles.heroHeader}>
            <Text style={styles.heroBrand}>
              <Text style={styles.heroBrandTrust}>Trust</Text>
              <Text style={styles.heroBrandFix}>Fix Pro</Text>
            </Text>

            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Technician Hub</Text>
            </View>
          </View>

          <View style={styles.heroRow}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => openProfileRoute('TechnicianProfileEdit')}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>

              <View style={styles.onlineDot} />

              <View style={styles.editBtn}>
                <Icon name="pencil" size={14} color={colors.brand} />
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{profile.name}</Text>
              <Text style={styles.heroPhone}>{profile.phone}</Text>
              <Text style={styles.heroEmail} numberOfLines={1}>
                {emailLabel}
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
            {stats.map((stat, index) => (
              <View
                key={stat.label}
                style={[styles.statCell, index < stats.length - 1 && styles.statCellBorder]}
              >
                <Text style={styles.statVal}>{stat.val}</Text>
                <Text style={styles.statKey}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.planStrip}
            onPress={() => openProfileRoute('TechnicianSubscription')}
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
              IconComponent={() => <TechnicianIcon name="account-edit-outline" color={colors.brand} />}
              title="Edit Profile"
              subtitle="Name, email, city, service area"
              onPress={() => openProfileRoute('TechnicianProfileEdit')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              IconComponent={() => <TechnicianIcon name="map-marker-outline" color={colors.brand} />}
              title="Service Addresses"
              subtitle={savedAddressSubtitle}
              rightValue={savedAddressCount ? String(savedAddressCount) : undefined}
              onPress={() => openProfileRoute('TechnicianProfileAddresses')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.blueSoft}
              IconComponent={() => <TechnicianIcon name="bank-outline" color={colors.blue} />}
              title="Payout Methods"
              subtitle="UPI, bank and wallet payouts"
              onPress={() => openProfileRoute('TechnicianProfilePayment')}
            />
          </SettingsCard>

          <SectionLabel title="PREFERENCES" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.isDark ? colors.surfaceSoft : '#F0F0F5'}
              IconComponent={() => <TechnicianIcon name="theme-light-dark" color={colors.muted} />}
              title="Appearance"
              subtitle="Choose light or dark mode"
              rightValue={appearanceLabel}
              onPress={() => openProfileRoute('TechnicianAppearance')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.greenSoft}
              IconComponent={() => <TechnicianIcon name="bell-outline" color={colors.green} />}
              title="Notifications"
              subtitle="Jobs, payouts and renewals"
              onPress={() => openProfileRoute('TechnicianProfileNotifications')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              IconComponent={() => <TechnicianIcon name="star-four-points-outline" color={colors.brand} />}
              title="Subscription Plan"
              subtitle={profile.planMeta}
              rightChip={profile.plan}
              rightChipVariant="brand"
              onPress={() => openProfileRoute('TechnicianSubscription')}
            />
          </SettingsCard>

          <SectionLabel title="SUPPORT" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.blueSoft}
              IconComponent={() => <TechnicianIcon name="headset" color={colors.blue} />}
              title="Help & Support"
              subtitle="Talk to partner care or raise a ticket"
              rightChip="Online"
              rightChipVariant="green"
              onPress={() => openProfileRoute('TechnicianProfileHelp')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              IconComponent={() => <TechnicianIcon name="share-variant-outline" color={colors.brand} />}
              title="Share Technician App"
              subtitle="Invite other pros to join TrustFix"
              onPress={() => openProfileRoute('TechnicianProfileShare')}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.isDark ? colors.surfaceSoft : '#F3F4F6'}
              IconComponent={() => <TechnicianIcon name="information-outline" color={colors.muted} />}
              title="About TrustFix Pro"
              subtitle="Mission, version and partner policies"
              rightValue="v1.0"
              onPress={() => openProfileRoute('TechnicianProfileAbout')}
            />
          </SettingsCard>

          <SectionLabel title="ACCOUNT ACTIONS" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.redSoft}
              IconComponent={() => <TechnicianIcon name="logout" color={colors.red} />}
              title="Logout"
              subtitle="Exit technician preview mode"
              danger
              onPress={() =>
                Alert.alert('Logout', 'Do you want to return to the technician login screen?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: handleSignOut },
                ])
              }
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.redSoft}
              IconComponent={() => <TechnicianIcon name="trash-can-outline" color={colors.red} />}
              title="Delete Account"
              subtitle="Request permanent partner account deletion"
              danger
              onPress={() =>
                Alert.alert(
                  'Delete Account',
                  'This is only a preview screen right now. No technician account will be deleted.',
                  [{ text: 'OK' }],
                )
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
      width: 380,
      height: 380,
      borderRadius: 999,
      top: -156,
      right: -110,
      backgroundColor: colors.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.08)',
    },
    blobAlt: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 999,
      top: 80,
      right: 130,
      backgroundColor: colors.isDark
        ? 'rgba(255,255,255,0.03)'
        : 'rgba(255,255,255,0.08)',
    },
    blobGlow: {
      position: 'absolute',
      width: 190,
      height: 190,
      borderRadius: 999,
      top: 108,
      left: -110,
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

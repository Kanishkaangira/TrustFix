import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  dashboardStats,
  technicianJobs,
} from '../../technician/mockData';
import {
  getTechnicianProfile,
  subscribeToTechnicianProfile,
  syncTechnicianProfileFromRemote,
  updateTechnicianAvailability,
} from '../../technician/profileStore';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechMetricCard,
  TechSection,
} from '../../technician/components/TechUi';

export default function TechnicianHomeScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    getTone: getTechTone,
    isDark,
    styles,
  } = useTechScreenTheme(createStyles);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [profile, setProfile] = useState(() => getTechnicianProfile());

  useEffect(() => {
    syncTechnicianProfileFromRemote();
    return subscribeToTechnicianProfile(setProfile);
  }, []);

  const isOnline = Boolean(profile.isAvailable);

  const handleNavigate = routeName => {
    navigation.navigate(routeName);
  };

  const openProfileRoute = routeName => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate(routeName);
      return;
    }

    navigation.navigate(routeName);
  };

  const nameParts = String(profile.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const initials = nameParts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'TP';
  const displayName = profile.name || 'TrustFix Pro';
  const locationLabel = profile.serviceArea || profile.city || 'Delhi NCR';
  const headerGradient = isDark
    ? [TECH_COLORS.coral, '#FF8357', '#D86A41', TECH_COLORS.bg]
    : ['#FF6B35', '#FF6B35', '#FF855C', '#FFD5C2', TECH_COLORS.bg];
  const headerLocations = isDark
    ? [0, 0.38, 0.72, 1]
    : [0, 0.25, 0.55, 0.78, 1];
  const heroStats = [
    { key: 'jobs', value: profile.jobsDone, label: 'Jobs Done' },
    { key: 'rating', value: profile.rating, label: 'Rating' },
    { key: 'platform', value: profile.onPlatform, label: 'On Platform' },
  ];

  return (
    <ScreenWrapper
      topColor={headerGradient[0]}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle="light-content"
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={headerGradient}
            locations={headerLocations}
            style={styles.headerGradient}
          >
            <View style={[styles.blob, styles.blobLarge]} />
            <View style={[styles.blob, styles.blobMedium]} />
            <View style={[styles.blobDark, styles.blobAccent]} />

            <View style={styles.topRow}>
              <View style={styles.appNamePill}>
                <Text style={styles.appNameText}>
                  <Text style={styles.appNameTrust}>Trust</Text>
                  <Text style={styles.appNameFix}>Fix</Text>
                </Text>
              </View>

              <View style={styles.topIcons}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.iconBtn}
                  onPress={() => openProfileRoute('TechnicianProfileNotifications')}
                >
                  <Icon name="bell-outline" size={20} color={TECH_COLORS.white} />
                  <View style={styles.notifDot} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.avatarCircle}
                  onPress={() => navigation.navigate('TechnicianProfile')}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.locationRow}
              onPress={() => navigation.navigate('TechnicianProfile')}
            >
              <Icon
                name="map-marker"
                size={14}
                color="rgba(255,255,255,0.9)"
                style={styles.locationMarker}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationLabel}
              </Text>
              <Icon
                name="chevron-down"
                size={16}
                color="rgba(255,255,255,0.88)"
              />
            </TouchableOpacity>

            <View style={styles.greetBlock}>
              <Text style={styles.greetText}>Good morning</Text>
              <Text style={styles.userName} numberOfLines={2}>
                {displayName}
              </Text>
              <Text style={styles.userTagline}>
                Ready to take the next job today?
              </Text>

              <View style={styles.heroPillsRow}>
                <View
                  style={[
                    styles.statusPill,
                    isOnline ? styles.statusPillActive : styles.statusPillPaused,
                  ]}
                >
                  <View
                    style={[
                      styles.statusPillDot,
                      isOnline
                        ? styles.statusPillDotActive
                        : styles.statusPillDotPaused,
                    ]}
                  />
                  <Text style={styles.statusPillText}>
                    {isOnline ? 'Online' : 'Paused'}
                  </Text>
                </View>

                <View style={styles.planPill}>
                  <Text style={styles.planPillText}>{profile.plan}</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerStats}>
              {heroStats.map((item, index) => (
                <View key={item.key} style={styles.headerStatWrap}>
                  <View style={styles.headerStat}>
                    <Text style={styles.headerStatNum}>{item.value}</Text>
                    <Text style={styles.headerStatLabel}>{item.label}</Text>
                  </View>
                  {index < heroStats.length - 1 ? (
                    <View style={styles.headerStatDivider} />
                  ) : null}
                </View>
              ))}
            </View>
          </LinearGradient>

          <TechCard style={styles.availabilityCard}>
            <View style={styles.availabilityCopy}>
              <Text style={styles.availabilityTitle}>Availability</Text>
              <Text style={styles.availabilityText}>
                Stay online to receive new technician jobs nearby
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={async (nextValue) => {
                if (isUpdatingAvailability) {
                  return;
                }

                setIsUpdatingAvailability(true);
                await updateTechnicianAvailability(nextValue);
                setIsUpdatingAvailability(false);
              }}
              trackColor={{ false: TECH_COLORS.float, true: TECH_COLORS.emerald }}
              thumbColor={TECH_COLORS.white}
              disabled={isUpdatingAvailability}
            />
          </TechCard>

          <View style={styles.metricGrid}>
            <TechMetricCard
              label="Today's Earnings"
              value={dashboardStats.today}
              subtitle={dashboardStats.todayJobs}
              tone="amber"
              style={styles.metricCard}
            />
            <TechMetricCard
              label="This Month"
              value={dashboardStats.month}
              subtitle={dashboardStats.monthJobs}
              tone="emerald"
              style={styles.metricCard}
            />
          </View>

          <TechGradientButton
            label="Open New Job Alert Demo"
            onPress={() => handleNavigate('TechnicianJobAlert')}
            variant="emerald"
            icon="bell-ring-outline"
            style={styles.alertButton}
          />

          <View style={styles.sectionWrap}>
            <TechSection title="Today's Jobs" action="2 Active" />
          </View>

          {technicianJobs.map((job, index) => {
            const tone = getTechTone(job.iconBg);

            return (
              <TechCard key={job.id} style={styles.jobCard}>
                <View style={styles.jobTopRow}>
                  <View
                    style={[
                      styles.jobIconWrap,
                      { backgroundColor: tone.bg, borderColor: tone.border },
                    ]}
                  >
                    <Icon name={job.icon} size={20} color={tone.text} />
                  </View>

                  <View style={styles.jobCopyCard}>
                    <View style={styles.jobTitleRow}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <TechBadge
                        label={job.status}
                        tone={job.statusTone === 'amber' ? 'amber' : 'emerald'}
                      />
                    </View>
                    <Text style={styles.jobSub}>
                      {job.issue} - {job.area}
                    </Text>
                    <View style={styles.jobMeta}>
                      <Text style={styles.slotText}>{job.slot}</Text>
                      <Text style={styles.dotSep}>-</Text>
                      <Text style={styles.metaText}>{job.visitText}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.jobActions}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.secondaryJobButton}
                    onPress={() =>
                      navigation.navigate(
                        index === 0
                          ? 'TechnicianJobInProgress'
                          : 'TechnicianEnRoute',
                        { jobId: job.id },
                      )
                    }
                  >
                    <Text style={styles.secondaryJobText}>
                      {index === 0 ? 'Open Live Job' : 'Open Route'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.primaryJobButton}
                    onPress={() => navigation.navigate('TechnicianJobDetail', { jobId: job.id })}
                  >
                    <Text style={styles.primaryJobText}>View Job</Text>
                    <Icon
                      name="arrow-right"
                      size={16}
                      color={TECH_COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
              </TechCard>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const createStyles = ({
  colors: TECH_COLORS,
  radius: TECH_RADIUS,
  shadows: TECH_SHADOWS,
  isDark,
}) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: TECH_COLORS.bg,
    },
    scrollBody: {
      flex: 1,
      backgroundColor: TECH_COLORS.bg,
    },
    content: {
      paddingBottom: 120,
    },
    headerGradient: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 34,
      overflow: 'hidden',
      position: 'relative',
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(255,255,255,0.08)',
    },
    blobDark: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: isDark
        ? 'rgba(255,122,69,0.16)'
        : 'rgba(211,96,45,0.24)',
    },
    blobLarge: {
      width: 340,
      height: 340,
      top: -150,
      right: -110,
    },
    blobMedium: {
      width: 210,
      height: 210,
      top: 84,
      right: 122,
    },
    blobAccent: {
      width: 170,
      height: 170,
      top: 120,
      left: -96,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    appNamePill: {
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    appNameText: {
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    appNameTrust: {
      color: isDark ? TECH_COLORS.white : '#111318',
    },
    appNameFix: {
      color: TECH_COLORS.white,
    },
    topIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark
        ? 'rgba(10,14,20,0.28)'
        : 'rgba(255,255,255,0.20)',
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(255,255,255,0.20)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#FB7185',
      borderWidth: 1.5,
      borderColor: '#FF6B35',
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark
        ? 'rgba(10,14,20,0.38)'
        : 'rgba(255,255,255,0.20)',
      borderWidth: 2,
      borderColor: isDark
        ? 'rgba(255,255,255,0.16)'
        : 'rgba(255,255,255,0.30)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 14,
      fontWeight: '800',
      color: TECH_COLORS.white,
      letterSpacing: 0.5,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      maxWidth: '92%',
    },
    locationMarker: {
      marginRight: 6,
      marginTop: 1,
    },
    locationText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
      flexShrink: 1,
      marginRight: 2,
    },
    greetBlock: {
      marginBottom: 22,
      maxWidth: '86%',
    },
    greetText: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.85)',
      fontWeight: '600',
      marginBottom: 6,
    },
    userName: {
      fontSize: 36,
      fontWeight: '800',
      color: TECH_COLORS.white,
      letterSpacing: -1,
      lineHeight: 42,
      marginBottom: 6,
    },
    userTagline: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.75)',
      fontWeight: '500',
    },
    heroPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: TECH_RADIUS.pill,
      borderWidth: 1,
    },
    statusPillActive: {
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderColor: 'rgba(255,255,255,0.22)',
    },
    statusPillPaused: {
      backgroundColor: 'rgba(17,24,39,0.18)',
      borderColor: 'rgba(255,255,255,0.14)',
    },
    statusPillDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusPillDotActive: {
      backgroundColor: '#D6FFE5',
    },
    statusPillDotPaused: {
      backgroundColor: 'rgba(255,255,255,0.72)',
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: TECH_COLORS.white,
    },
    planPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: TECH_RADIUS.pill,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
    },
    planPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: TECH_COLORS.white,
      letterSpacing: 0.3,
    },
    headerStats: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark
        ? 'rgba(10,14,20,0.28)'
        : 'rgba(255,255,255,0.15)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(255,255,255,0.20)',
      paddingVertical: 14,
      paddingHorizontal: 8,
      marginBottom: 4,
    },
    headerStatWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerStat: {
      flex: 1,
      alignItems: 'center',
    },
    headerStatNum: {
      fontSize: 16,
      fontWeight: '800',
      color: TECH_COLORS.white,
      letterSpacing: -0.3,
    },
    headerStatLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.72)',
      fontWeight: '500',
      marginTop: 2,
      textAlign: 'center',
    },
    headerStatDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.20)',
    },
    availabilityCard: {
      marginHorizontal: 20,
      marginTop: -14,
      paddingHorizontal: 16,
      paddingVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    availabilityCopy: {
      flex: 1,
      paddingRight: 16,
    },
    availabilityTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: TECH_COLORS.text,
    },
    availabilityText: {
      marginTop: 3,
      fontSize: 11,
      color: TECH_COLORS.textMuted,
    },
    metricGrid: {
      flexDirection: 'row',
      gap: 10,
      marginHorizontal: 20,
      marginTop: 12,
    },
    metricCard: {
      flex: 1,
    },
    alertButton: {
      marginHorizontal: 20,
      marginTop: 14,
      marginBottom: 12,
    },
    sectionWrap: {
      marginHorizontal: 20,
      marginTop: 2,
    },
    jobCard: {
      padding: 14,
      marginHorizontal: 20,
      marginBottom: 10,
    },
    jobTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    jobIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    jobCopyCard: {
      flex: 1,
    },
    jobTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    jobTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      color: TECH_COLORS.text,
    },
    jobSub: {
      marginTop: 3,
      fontSize: 11,
      color: TECH_COLORS.textMuted,
    },
    jobMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    slotText: {
      fontSize: 11,
      color: TECH_COLORS.gold,
      fontWeight: '800',
    },
    dotSep: {
      marginHorizontal: 6,
      color: TECH_COLORS.textMuted,
    },
    metaText: {
      fontSize: 11,
      color: TECH_COLORS.textMuted,
    },
    jobActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },
    secondaryJobButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: TECH_RADIUS.md,
      borderWidth: 1,
      borderColor: TECH_COLORS.border,
      backgroundColor: TECH_COLORS.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryJobText: {
      fontSize: 12,
      fontWeight: '700',
      color: TECH_COLORS.textSecondary,
    },
    primaryJobButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: TECH_RADIUS.md,
      backgroundColor: TECH_COLORS.coral,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      ...TECH_SHADOWS.glow,
    },
    primaryJobText: {
      fontSize: 12,
      fontWeight: '800',
      color: TECH_COLORS.white,
    },
  });

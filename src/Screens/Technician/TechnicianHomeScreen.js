import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { fetchTechnicianEarnings } from '../../technician/earningsStore';
import { fetchTechnicianAssignments } from '../../technician/jobAssignmentEngine';
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
  TechIconBubble,
  TechMetricCard,
  TechSection,
} from '../../technician/components/TechUi';

const getHomeJobPrimaryAction = (job) => {
  const bookingStatus = String(job?.raw?.bookings?.status || '').trim();

  if ([
    'otp_verified',
    'estimate_sent',
    'estimate_revision_requested',
    'estimate_approved',
    'in_progress',
    'work_completed',
    'payment_pending',
    'payment_requested',
  ].includes(bookingStatus)) {
    return { label: 'Open Job Progress', route: 'TechnicianJobInProgress' };
  }

  if (bookingStatus === 'arrived') {
    return { label: 'Open OTP', route: 'TechnicianSafetyOtp' };
  }

  return {
    label: bookingStatus === 'en_route' ? 'Open Route' : 'Start Job',
    route: 'TechnicianEnRoute',
  };
};

export default function TechnicianHomeScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    isDark,
    styles,
  } = useTechScreenTheme(createStyles);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [profile, setProfile] = useState(() => getTechnicianProfile());
  const [homeMetrics, setHomeMetrics] = useState({
    dailyEarnings: '₹0',
    dailySubtitle: '0 completed jobs today',
    jobsDone: String(getTechnicianProfile()?.jobsDone || '0'),
    jobsDoneSubtitle: 'Completed services overall',
  });
  const [activeJobs, setActiveJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setIsLoadingJobs(true);

      const [profileResult, earningsResult, assignmentsResult] = await Promise.all([
        syncTechnicianProfileFromRemote(),
        fetchTechnicianEarnings(),
        fetchTechnicianAssignments(),
      ]);

      const nextProfile = profileResult?.data || getTechnicianProfile();
      const dailyPeriod = earningsResult?.data?.periods?.Daily;
      const totalPeriod = earningsResult?.data?.periods?.Total;
      const jobsDoneValue = String(
        totalPeriod?.jobsDone ||
        nextProfile?.jobsDone ||
        getTechnicianProfile()?.jobsDone ||
        '0',
      );

      setHomeMetrics({
        dailyEarnings: dailyPeriod?.totalValue || '₹0',
        dailySubtitle: dailyPeriod?.subtitle || '0 completed jobs today',
        jobsDone: jobsDoneValue,
        jobsDoneSubtitle: 'Completed services overall',
      });

      if (!assignmentsResult?.error && assignmentsResult?.data?.Active) {
        setActiveJobs(assignmentsResult.data.Active.slice(0, 3));
      } else {
        setActiveJobs([]);
      }

      setIsLoadingJobs(false);
    };

    loadHomeData();
    return subscribeToTechnicianProfile(setProfile);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refreshHomeData = async () => {
        setIsLoadingJobs(true);

        const [profileResult, earningsResult, assignmentsResult] = await Promise.all([
          syncTechnicianProfileFromRemote(),
          fetchTechnicianEarnings(),
          fetchTechnicianAssignments(),
        ]);

        const nextProfile = profileResult?.data || getTechnicianProfile();
        const dailyPeriod = earningsResult?.data?.periods?.Daily;
        const totalPeriod = earningsResult?.data?.periods?.Total;
        const jobsDoneValue = String(
          totalPeriod?.jobsDone ||
          nextProfile?.jobsDone ||
          getTechnicianProfile()?.jobsDone ||
          '0',
        );

        setHomeMetrics((current) => ({
          ...current,
          dailyEarnings: dailyPeriod?.totalValue || current.dailyEarnings,
          dailySubtitle: dailyPeriod?.subtitle || '0 completed jobs today',
          jobsDone: jobsDoneValue,
          jobsDoneSubtitle: 'Completed services overall',
        }));

        if (!assignmentsResult?.error && assignmentsResult?.data?.Active) {
          setActiveJobs(assignmentsResult.data.Active.slice(0, 3));
        } else {
          setActiveJobs([]);
        }

        setIsLoadingJobs(false);
      };

      refreshHomeData();

      const intervalId = setInterval(() => {
        refreshHomeData();
      }, 6000);

      return () => {
        clearInterval(intervalId);
      };
    }, []),
  );

  const isOnline = Boolean(profile.isAvailable);

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
              value={homeMetrics.dailyEarnings}
              subtitle={homeMetrics.dailySubtitle}
              tone="amber"
              style={styles.metricCard}
            />
            <TechMetricCard
              label="Jobs Done"
              value={homeMetrics.jobsDone}
              subtitle={homeMetrics.jobsDoneSubtitle}
              tone="emerald"
              style={styles.metricCard}
            />
          </View>

          <TechGradientButton
            label="View New Job"
            onPress={() => navigation.navigate('TechnicianJobs', { initialTab: 'Upcoming' })}
            variant="emerald"
            icon="bell-ring-outline"
            style={styles.alertButton}
          />

          <View style={styles.sectionWrap}>
            <TechSection
              title="Today's Jobs"
              action={`${activeJobs.length} ${activeJobs.length === 1 ? 'Active Job' : 'Active Jobs'}`}
            />
          </View>

          {isLoadingJobs ? (
            <TechCard style={styles.jobsStateCard}>
              <ActivityIndicator color={TECH_COLORS.coral} />
              <Text style={styles.jobsStateTitle}>Loading active jobs</Text>
              <Text style={styles.jobsStateText}>Fetching your current technician assignments.</Text>
            </TechCard>
          ) : null}

          {!isLoadingJobs && !activeJobs.length ? (
            <TechCard style={styles.jobsStateCard}>
              <Icon name="briefcase-outline" size={26} color={TECH_COLORS.textMuted} />
              <Text style={styles.jobsStateTitle}>No active jobs right now</Text>
              <Text style={styles.jobsStateText}>
                Accepted jobs will appear here automatically as they move forward.
              </Text>
            </TechCard>
          ) : null}

          {!isLoadingJobs && activeJobs.map((job, index) => {
            const primaryAction = getHomeJobPrimaryAction(job);
            const highlighted = index === 0;

            return (
              <TechCard
                key={job.id}
                style={[styles.jobCard, highlighted && styles.highlightedCard]}
              >
                <View style={styles.jobAccentBar} />

                <View style={styles.cardTopRow}>
                  <View style={styles.jobIdentity}>
                    <TechIconBubble icon={job.icon} tone={job.iconBg} size={44} />

                    <View style={styles.jobCopyBlock}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <Text style={styles.jobIssue} numberOfLines={1}>{job.issue}</Text>
                      <Text style={styles.jobBookingMeta} numberOfLines={1}>
                        {job.bookingNumber || 'Booking pending'} • {job.customerName}
                      </Text>
                    </View>
                  </View>

                  <TechBadge label={job.status} tone={job.statusTone} />
                </View>

                <View style={styles.jobLocationRow}>
                  <Icon name="map-marker-outline" size={15} color={TECH_COLORS.textMuted} />
                  <Text style={styles.jobLocationValue} numberOfLines={1}>
                    {job.areaLabel ? `${job.areaLabel} • ${job.area}` : job.area}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Icon name="clock-outline" size={14} color={TECH_COLORS.gold} />
                    <Text style={styles.metaChipText}>{job.slot}</Text>
                  </View>

                  <View style={styles.metaChip}>
                    <Icon name="cash-multiple" size={14} color={TECH_COLORS.emerald} />
                    <Text style={styles.metaChipText}>{job.initialFeeLabel}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.actionButtonPrimary,
                      styles.singleActionButton,
                      highlighted && styles.actionButtonPrimaryHighlighted,
                    ]}
                    onPress={() => navigation.navigate('TechnicianJobDetail', { jobId: job.bookingId })}
                  >
                    <Text style={styles.actionPrimaryText}>{primaryAction.label}</Text>
                    <Icon name="arrow-right" size={16} color={TECH_COLORS.white} />
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
    jobsStateCard: {
      marginHorizontal: 20,
      marginBottom: 10,
      padding: 18,
      alignItems: 'center',
    },
    jobsStateTitle: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: '800',
      color: TECH_COLORS.text,
    },
    jobsStateText: {
      marginTop: 6,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      color: TECH_COLORS.textSecondary,
    },
    sectionWrap: {
      marginHorizontal: 20,
      marginTop: 2,
    },
    jobCard: {
      marginHorizontal: 20,
      marginTop: 14,
      marginBottom: 10,
      padding: 14,
      overflow: 'hidden',
    },
    highlightedCard: {
      borderColor: TECH_COLORS.coral,
    },
    jobAccentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: TECH_COLORS.coral,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    jobIdentity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    jobCopyBlock: {
      flex: 1,
    },
    jobTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '900',
      color: TECH_COLORS.text,
    },
    jobIssue: {
      marginTop: 2,
      fontSize: 12,
      color: TECH_COLORS.textSecondary,
    },
    jobBookingMeta: {
      marginTop: 4,
      fontSize: 11,
      color: TECH_COLORS.textMuted,
    },
    jobLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    jobLocationValue: {
      flex: 1,
      fontSize: 12,
      color: TECH_COLORS.textSecondary,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: TECH_COLORS.bgElevated,
      borderWidth: 1,
      borderColor: TECH_COLORS.border,
    },
    metaChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: TECH_COLORS.textSecondary,
    },
    actionRow: {
      marginTop: 14,
    },
    actionButtonPrimary: {
      minHeight: 44,
      borderRadius: 14,
      backgroundColor: TECH_COLORS.coral,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    actionButtonPrimaryHighlighted: {
      backgroundColor: TECH_COLORS.emerald,
    },
    singleActionButton: {
      width: '100%',
    },
    actionPrimaryText: {
      fontSize: 13,
      fontWeight: '800',
      color: TECH_COLORS.white,
    },
  });

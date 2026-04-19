import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  acceptTechnicianJob,
  fetchTechnicianAssignments,
} from '../../technician/jobAssignmentEngine';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechIconBubble,
} from '../../technician/components/TechUi';

const JOB_TABS = ['Active', 'Upcoming', 'Completed'];

const getSecondaryAction = (activeTab, job) => {
  if (activeTab === 'Completed' && job.paymentDone) {
    return {
      label: 'Receipt',
      icon: 'file-document-outline',
      route: 'TechnicianJobCompletion',
    };
  }

  if (activeTab === 'Upcoming') {
    return {
      label: 'Review',
      icon: 'file-search-outline',
      route: 'TechnicianJobDetail',
    };
  }

  if (job.status === 'En Route') {
    return {
      label: 'Call',
      icon: 'phone-outline',
      route: 'TechnicianJobDetail',
    };
  }

  return {
    label: 'Call',
    icon: 'phone-outline',
    route: 'TechnicianJobDetail',
  };
};

const getPrimaryAction = (activeTab, job) => {
  if (activeTab === 'Completed') {
    if (job.paymentDone) {
      return null;
    }

    return {
      label: 'Pending Payment',
      route: 'TechnicianJobCompletion',
    };
  }

  if (activeTab === 'Upcoming') {
    return {
      label: 'Accept Job',
      route: 'TechnicianJobDetail',
    };
  }

  if (job.status === 'In Progress') {
    return {
      label: 'Open Live Job',
      route: 'TechnicianJobInProgress',
    };
  }

  if (job.status === 'En Route') {
    return {
      label: 'Open Route',
      route: 'TechnicianEnRoute',
    };
  }

  return {
    label: 'View Job',
    route: 'TechnicianJobDetail',
  };
};

export default function TechnicianJobsScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [activeTab, setActiveTab] = useState('Active');
  const [jobsByTab, setJobsByTab] = useState({
    Active: [],
    Upcoming: [],
    Completed: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acceptingBookingId, setAcceptingBookingId] = useState('');

  const loadAssignments = async (options = {}) => {
    const useRefreshingState = options.refreshing === true;

    if (useRefreshingState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const result = await fetchTechnicianAssignments();

    if (result.error) {
      Alert.alert('Could not load jobs', result.error.message);
    } else if (result.data) {
      setJobsByTab(result.data);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAssignments({ refreshing: true });
    }, []),
  );

  const list = jobsByTab[activeTab] || [];
  const tabCounts = {
    Active: jobsByTab.Active.length,
    Upcoming: jobsByTab.Upcoming.length,
    Completed: jobsByTab.Completed.length,
  };

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle}>My Jobs</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.headerIconButton}
                onPress={() => loadAssignments({ refreshing: true })}
              >
                {isRefreshing ? (
                  <ActivityIndicator color={TECH_COLORS.text} size="small" />
                ) : (
                  <Icon
                    name="refresh"
                    size={20}
                    color={TECH_COLORS.text}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabsShell}>
            <View style={styles.tabsRow}>
              {JOB_TABS.map((tab) => {
                const isActive = tab === activeTab;

                return (
                  <TouchableOpacity
                    key={tab}
                    activeOpacity={0.88}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {tab}
                    </Text>
                    <View
                      style={[
                        styles.tabCountPill,
                        isActive && styles.tabCountPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabCountText,
                          isActive && styles.tabCountTextActive,
                        ]}
                      >
                        {tabCounts[tab]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'Active'
                ? 'Accepted Services'
                : activeTab === 'Upcoming'
                  ? 'New Requests'
                  : 'Completed Services'}
            </Text>
            <Text style={styles.sectionAction}>
              {list.length} {list.length === 1 ? 'job' : 'jobs'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={TECH_COLORS.coral} />
              <Text style={styles.emptyTitle}>Loading technician jobs</Text>
              <Text style={styles.emptyText}>
                Pulling the latest assignments from TrustFix.
              </Text>
            </View>
          ) : null}

          {!isLoading && !list.length ? (
            <View style={styles.emptyState}>
              <Icon
                name={activeTab === 'Upcoming' ? 'bell-outline' : 'briefcase-outline'}
                size={28}
                color={TECH_COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'Upcoming' ? 'No new requests yet' : 'No jobs here right now'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'Upcoming'
                  ? 'Turn Availability on from the home screen to receive new nearby bookings.'
                  : 'This tab will update automatically as your booking assignments move forward.'}
              </Text>
            </View>
          ) : null}

          {!isLoading && list.map((job, index) => {
            const highlighted = activeTab === 'Active' && index === 0;
            const secondaryAction = getSecondaryAction(activeTab, job);
            const primaryAction = getPrimaryAction(activeTab, job);
            const showSingleCompletedAction = activeTab === 'Completed';
            const showSingleActiveAction = activeTab === 'Active' && job.status === 'In Progress';
            const isAcceptingThisJob = acceptingBookingId === job.bookingId;

            return (
              <TechCard
                key={`${activeTab}-${job.id}-${index}`}
                style={[styles.jobCard, highlighted && styles.highlightedCard]}
              >
                <View style={styles.jobAccentBar} />

                <View style={styles.cardTopRow}>
                  <View style={styles.jobIdentity}>
                    <TechIconBubble icon={job.icon} tone={job.iconBg} size={48} />

                  <View style={styles.jobCopyBlock}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <Text style={styles.jobIssue}>{job.issue}</Text>
                      <Text style={styles.jobBookingMeta}>
                        {job.bookingNumber || 'Booking pending'} • {job.customerName}
                      </Text>
                    </View>
                  </View>

                  <TechBadge label={job.status} tone={job.statusTone} />
                </View>

                <View style={styles.locationRow}>
                  <Icon name="map-marker-outline" size={15} color={TECH_COLORS.textMuted} />
                  <Text style={styles.locationValue}>
                    {job.areaLabel ? `${job.areaLabel} • ${job.area}` : job.area}
                  </Text>
                </View>

                {!!job.customerPhone && (
                  <View style={styles.locationRow}>
                    <Icon name="phone-outline" size={15} color={TECH_COLORS.textMuted} />
                    <Text style={styles.locationValue}>{job.customerPhone}</Text>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Icon name="clock-outline" size={14} color={TECH_COLORS.gold} />
                    <Text style={styles.metaChipText}>{job.slot}</Text>
                  </View>

                  <View style={styles.metaChip}>
                    <Icon name="cash-multiple" size={14} color={TECH_COLORS.emerald} />
                    <Text style={styles.metaChipText}>{job.initialFeeLabel}</Text>
                  </View>

                  <View style={styles.metaChip}>
                    <Icon name="briefcase-outline" size={14} color={TECH_COLORS.sky} />
                    <Text style={styles.metaChipText}>{job.type}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  {showSingleCompletedAction ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[
                        styles.actionButtonPrimary,
                        styles.singleActionButton,
                      ]}
                      onPress={() => navigation.navigate(
                        job.paymentDone ? secondaryAction.route : primaryAction.route,
                        { jobId: job.bookingId },
                      )}
                    >
                      <Text style={styles.actionPrimaryText}>
                        {job.paymentDone ? secondaryAction.label : primaryAction.label}
                      </Text>
                      <Icon name="arrow-right" size={16} color={TECH_COLORS.white} />
                    </TouchableOpacity>
                  ) : showSingleActiveAction ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[
                        styles.actionButtonPrimary,
                        styles.singleActionButton,
                        highlighted && styles.actionButtonPrimaryHighlighted,
                      ]}
                      onPress={() => navigation.navigate(primaryAction.route, { jobId: job.bookingId })}
                    >
                      <Text style={styles.actionPrimaryText}>{primaryAction.label}</Text>
                      <Icon name="arrow-right" size={16} color={TECH_COLORS.white} />
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.actionButtonMuted}
                        onPress={() => navigation.navigate(secondaryAction.route, { jobId: job.bookingId })}
                      >
                        <Icon
                          name={secondaryAction.icon}
                          size={15}
                          color={TECH_COLORS.textSecondary}
                        />
                        <Text style={styles.actionMutedText}>{secondaryAction.label}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[
                          styles.actionButtonPrimary,
                          highlighted && styles.actionButtonPrimaryHighlighted,
                        ]}
                        disabled={activeTab === 'Upcoming' && isAcceptingThisJob}
                        onPress={async () => {
                          if (activeTab !== 'Upcoming') {
                            navigation.navigate(primaryAction.route, { jobId: job.bookingId });
                            return;
                          }

                          setAcceptingBookingId(job.bookingId);
                          const result = await acceptTechnicianJob(job.bookingId);
                          setAcceptingBookingId('');

                          if (result.error) {
                            Alert.alert('Could not accept job', result.error.message);
                            await loadAssignments({ refreshing: true });
                            return;
                          }

                          if (!result.data?.success) {
                            Alert.alert(
                              'Job already taken',
                              result.data?.message || 'Another technician accepted this job first.',
                            );
                            await loadAssignments({ refreshing: true });
                            return;
                          }

                          await loadAssignments({ refreshing: true });
                          setActiveTab('Active');
                        }}
                      >
                        {activeTab === 'Upcoming' && isAcceptingThisJob ? (
                          <ActivityIndicator color={TECH_COLORS.white} size="small" />
                        ) : (
                          <>
                            <Text style={styles.actionPrimaryText}>{primaryAction.label}</Text>
                            <Icon name="arrow-right" size={16} color={TECH_COLORS.white} />
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
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
}) => StyleSheet.create({
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
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    color: TECH_COLORS.text,
    letterSpacing: -0.7,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    ...TECH_SHADOWS.card,
  },
  tabsShell: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: TECH_COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    padding: 6,
    ...TECH_SHADOWS.card,
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: isDark ? TECH_COLORS.float : TECH_COLORS.cardAlt,
    borderWidth: 1,
    borderColor: TECH_COLORS.borderStrong,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: TECH_COLORS.textMuted,
  },
  tabTextActive: {
    color: TECH_COLORS.text,
  },
  tabCountPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: TECH_COLORS.float,
  },
  tabCountPillActive: {
    backgroundColor: TECH_COLORS.coralTint,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: TECH_COLORS.textSecondary,
  },
  tabCountTextActive: {
    color: TECH_COLORS.coral,
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TECH_COLORS.text,
    letterSpacing: -0.4,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: TECH_COLORS.coral,
  },
  emptyState: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: TECH_RADIUS.lg,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.card,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: TECH_COLORS.textSecondary,
  },
  jobCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    overflow: 'hidden',
  },
  highlightedCard: {
    borderColor: 'rgba(16,217,160,0.32)',
    shadowColor: TECH_COLORS.emerald,
    shadowOpacity: 0.18,
  },
  jobAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
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
    alignItems: 'center',
    gap: 12,
  },
  jobCopyBlock: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
    letterSpacing: -0.3,
  },
  jobIssue: {
    marginTop: 3,
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  jobBookingMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: TECH_COLORS.coral,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  locationValue: {
    marginLeft: 6,
    fontSize: 12,
    color: TECH_COLORS.textMuted,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: TECH_COLORS.float,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: TECH_COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionButtonMuted: {
    flex: 1,
    minHeight: 44,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionMutedText: {
    fontSize: 12,
    fontWeight: '700',
    color: TECH_COLORS.textSecondary,
  },
  actionButtonPrimary: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.coral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...TECH_SHADOWS.glow,
  },
  actionButtonPrimaryHighlighted: {
    backgroundColor: TECH_COLORS.emerald,
  },
  singleActionButton: {
    flex: 1,
  },
  actionPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
});

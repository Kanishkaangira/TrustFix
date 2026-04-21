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

const getPrimaryAction = (activeTab, job) => {
  if (activeTab === 'Upcoming') {
    return { label: 'Accept Job', route: 'TechnicianJobDetail' };
  }

  if (activeTab === 'Completed') {
    if (job.paymentDone) {
      return { label: 'Receipt', route: 'TechnicianJobCompletion' };
    }

    return { label: 'Pending Payment', route: 'TechnicianJobCompletion' };
  }

  return { label: 'View Job', route: 'TechnicianJobDetail' };
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
              <Text style={styles.headerTitle}>My Jobs</Text>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.headerIconButton}
                onPress={() => loadAssignments({ refreshing: true })}
              >
                {isRefreshing ? (
                  <ActivityIndicator color={TECH_COLORS.text} size="small" />
                ) : (
                  <Icon name="refresh" size={20} color={TECH_COLORS.text} />
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
                    <View style={[styles.tabCountPill, isActive && styles.tabCountPillActive]}>
                      <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
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
              <Text style={styles.emptyText}>Pulling the latest assignments from TrustFix.</Text>
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
            const primaryAction = getPrimaryAction(activeTab, job);
            const isAcceptingThisJob = acceptingBookingId === job.bookingId;

            return (
              <TechCard
                key={`${activeTab}-${job.id}-${index}`}
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

                {activeTab === 'Upcoming' ? (
                  <View style={styles.previewList}>
                    <View style={styles.previewItem}>
                      <Icon name="briefcase-outline" size={15} color={TECH_COLORS.sky} />
                      <Text style={styles.previewValue} numberOfLines={1}>
                        {job.title || job.serviceLabel || 'Service request'}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Icon name="wrench-outline" size={15} color={TECH_COLORS.coral} />
                      <Text style={styles.previewValue} numberOfLines={1}>
                        {job.issue || job.problemLabel || 'Problem shared by customer'}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Icon name="map-marker-outline" size={15} color={TECH_COLORS.textMuted} />
                      <Text style={styles.previewValue} numberOfLines={2}>
                        {job.area || job.addressLabel || 'Address pending'}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Icon name="clock-outline" size={15} color={TECH_COLORS.gold} />
                      <Text style={styles.previewValue} numberOfLines={1}>
                        {job.slot || job.scheduleLabel || 'Schedule pending'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.locationRow}>
                      <Icon name="map-marker-outline" size={15} color={TECH_COLORS.textMuted} />
                      <Text style={styles.locationValue} numberOfLines={1}>
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
                  </>
                )}

                <View style={styles.actionRow}>
                  {activeTab === 'Upcoming' ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.actionButtonPrimary, styles.singleActionButton]}
                      disabled={isAcceptingThisJob}
                      onPress={async () => {
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
                      {isAcceptingThisJob ? (
                        <ActivityIndicator color={TECH_COLORS.white} size="small" />
                      ) : (
                        <>
                          <Text style={styles.actionPrimaryText}>{primaryAction.label}</Text>
                          <Icon name="arrow-right" size={16} color={TECH_COLORS.white} />
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
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
    alignItems: 'center',
    gap: 14,
  },
  headerTitle: {
    flex: 1,
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
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: TECH_COLORS.float,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.textSecondary,
  },
  tabTextActive: {
    color: TECH_COLORS.text,
  },
  tabCountPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.bgElevated,
  },
  tabCountPillActive: {
    backgroundColor: TECH_COLORS.coralTint,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: TECH_COLORS.textMuted,
  },
  tabCountTextActive: {
    color: TECH_COLORS.coral,
  },
  sectionHeader: {
    marginTop: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: TECH_COLORS.text,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: TECH_COLORS.textMuted,
  },
  emptyState: {
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: TECH_COLORS.textSecondary,
  },
  jobCard: {
    marginHorizontal: 20,
    marginTop: 14,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  locationValue: {
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
  previewList: {
    marginTop: 12,
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  previewValue: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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

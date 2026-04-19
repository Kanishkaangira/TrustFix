import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { getTechnicianJobFlow } from '../../technician/jobFlowData';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechIconBubble,
} from '../../technician/components/TechUi';

const JOB_TABS = ['Active', 'Upcoming', 'Completed'];

const createJobCard = ({
  id,
  service,
  issue,
  area,
  slot,
  amountText,
  status,
  statusTone,
  type,
  icon,
  iconBg,
  paymentDone = false,
}) => ({
  id,
  title: service,
  issue,
  area,
  slot,
  visitText: amountText,
  status,
  statusTone,
  type,
  icon,
  iconBg,
  paymentDone,
});

const jobAc = getTechnicianJobFlow('job-ac');
const jobElectric = getTechnicianJobFlow('job-electric');
const jobPlumbing = getTechnicianJobFlow('job-plumbing');

const JOBS_BY_TAB = {
  Active: [
    createJobCard({
      id: jobAc.id,
      service: jobAc.service,
      issue: jobAc.issue,
      area: jobAc.location.area,
      slot: jobAc.scheduledSlot,
      amountText: 'Accepted service',
      status: 'In Progress',
      statusTone: 'emerald',
      type: 'Accepted',
      icon: jobAc.serviceIcon,
      iconBg: jobAc.serviceTone,
    }),
    createJobCard({
      id: jobElectric.id,
      service: jobElectric.service,
      issue: jobElectric.issue,
      area: jobElectric.location.area,
      slot: jobElectric.scheduledSlot,
      amountText: 'Accepted service',
      status: 'En Route',
      statusTone: 'amber',
      type: 'Accepted',
      icon: jobElectric.serviceIcon,
      iconBg: jobElectric.serviceTone,
    }),
  ],
  Upcoming: [
    createJobCard({
      id: jobPlumbing.id,
      service: jobPlumbing.service,
      issue: jobPlumbing.issue,
      area: jobPlumbing.location.area,
      slot: jobPlumbing.scheduledSlot,
      amountText: 'Waiting for acceptance',
      status: 'New',
      statusTone: 'sky',
      type: 'New request',
      icon: jobPlumbing.serviceIcon,
      iconBg: jobPlumbing.serviceTone,
    }),
  ],
  Completed: [
    createJobCard({
      id: jobAc.id,
      service: jobAc.service,
      issue: jobAc.issue,
      area: jobAc.location.area,
      slot: 'Yesterday, 2:00 PM - 4:00 PM',
      amountText: 'Customer total recorded',
      status: 'Completed',
      statusTone: 'emerald',
      type: 'Past service',
      icon: jobAc.serviceIcon,
      iconBg: jobAc.serviceTone,
      paymentDone: false,
    }),
  ],
};

const getJobsForTab = (activeTab) => {
  return JOBS_BY_TAB[activeTab] || JOBS_BY_TAB.Active;
};

const getSecondaryAction = (activeTab, job) => {
  if (activeTab === 'Completed' && job.paymentDone) {
    return {
      label: 'Receipt',
      icon: 'file-document-outline',
      onPressRoute: 'TechnicianJobCompletion',
    };
  }

  if (activeTab === 'Upcoming') {
    return {
      label: 'Review',
      icon: 'file-search-outline',
      onPressRoute: 'TechnicianJobDetail',
    };
  }

  if (job.status === 'En Route') {
    return {
      label: 'Route',
      icon: 'map-marker-path',
      onPressRoute: 'TechnicianEnRoute',
    };
  }

  return {
    label: 'Call',
    icon: 'phone-outline',
    onPressRoute: 'TechnicianJobDetail',
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
      label: 'Review Job',
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

  const list = getJobsForTab(activeTab);
  const tabCounts = {
    Active: JOBS_BY_TAB.Active.length,
    Upcoming: JOBS_BY_TAB.Upcoming.length,
    Completed: JOBS_BY_TAB.Completed.length,
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
                onPress={() => navigation.navigate('TechnicianJobAlert')}
              >
                <Icon
                  name="bell-ring-outline"
                  size={20}
                  color={TECH_COLORS.text}
                />
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

          {list.map((job, index) => {
            const highlighted = activeTab === 'Active' && index === 0;
            const secondaryAction = getSecondaryAction(activeTab, job);
            const primaryAction = getPrimaryAction(activeTab, job);
            const showSingleCompletedAction = activeTab === 'Completed';

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
                    </View>
                  </View>

                  <TechBadge label={job.status} tone={job.statusTone} />
                </View>

                <View style={styles.locationRow}>
                  <Icon name="map-marker-outline" size={15} color={TECH_COLORS.textMuted} />
                  <Text style={styles.locationValue}>{job.area}</Text>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Icon name="clock-outline" size={14} color={TECH_COLORS.gold} />
                    <Text style={styles.metaChipText}>{job.slot}</Text>
                  </View>

                  <View style={styles.metaChip}>
                    <Icon name="cash-multiple" size={14} color={TECH_COLORS.emerald} />
                    <Text style={styles.metaChipText}>{job.visitText}</Text>
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
                        job.paymentDone ? secondaryAction.onPressRoute : primaryAction.route,
                        { jobId: job.id },
                      )}
                    >
                      <Text style={styles.actionPrimaryText}>
                        {job.paymentDone ? secondaryAction.label : primaryAction.label}
                      </Text>
                      <Icon name="arrow-right" size={16} color={TECH_COLORS.white} />
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.actionButtonMuted}
                        onPress={() => navigation.navigate(secondaryAction.onPressRoute, { jobId: job.id })}
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
                        onPress={() => navigation.navigate(primaryAction.route, { jobId: job.id })}
                      >
                        <Text style={styles.actionPrimaryText}>{primaryAction.label}</Text>
                        <Icon name="arrow-right" size={16} color={TECH_COLORS.white} />
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

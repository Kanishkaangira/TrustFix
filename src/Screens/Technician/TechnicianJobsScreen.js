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
import { technicianJobs } from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechScreenHeader,
} from '../../technician/components/TechUi';

const JOB_TABS = ['Active', 'Upcoming', 'Completed'];

export default function TechnicianJobsScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [activeTab, setActiveTab] = useState('Active');

  const list = activeTab === 'Completed'
    ? [{ ...technicianJobs[0], status: 'Completed', statusTone: 'emerald', slot: 'Yesterday, 2:00 PM' }]
    : activeTab === 'Upcoming'
    ? [{ ...technicianJobs[1], status: 'Upcoming', statusTone: 'amber' }]
    : technicianJobs;

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader title="My Jobs" />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabsRow}>
            {JOB_TABS.map((tab) => {
              const isActive = tab === activeTab;

              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.86}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}{tab === 'Active' ? ' (2)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {list.map((job, index) => {
            const highlighted = activeTab === 'Active' && index === 0;

            return (
              <TechCard
                key={`${activeTab}-${job.id}-${index}`}
                style={[styles.jobCard, highlighted && styles.highlightedCard]}
              >
                <View style={styles.cardTop}>
                  <TechBadge label={job.status} tone={job.statusTone} />
                  <Text style={styles.slotText}>{job.slot}</Text>
                </View>

                <Text style={styles.jobTitle}>{job.title} - {job.issue}</Text>
                <Text style={styles.areaText}>📍 {job.area}</Text>

                <View style={styles.cardDivider} />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.actionButtonMuted}
                    onPress={() => {}}
                  >
                    <Icon
                      name={activeTab === 'Upcoming' ? 'map-marker-outline' : 'phone-outline'}
                      size={15}
                      color={TECH_COLORS.textSecondary}
                    />
                    <Text style={styles.actionMutedText}>
                      {activeTab === 'Upcoming' ? 'Map' : 'Call'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.actionButtonPrimary,
                      job.statusTone === 'emerald' && { backgroundColor: TECH_COLORS.emerald },
                    ]}
                    onPress={() => navigation.navigate(
                      activeTab === 'Completed'
                        ? 'TechnicianJobCompletion'
                        : job.status === 'En Route'
                        ? 'TechnicianEnRoute'
                        : 'TechnicianJobDetail',
                    )}
                  >
                    <Text
                      style={[
                        styles.actionPrimaryText,
                        job.statusTone === 'emerald' && { color: TECH_COLORS.bg },
                      ]}
                    >
                      View Job
                    </Text>
                    <Icon
                      name="arrow-right"
                      size={16}
                      color={job.statusTone === 'emerald' ? TECH_COLORS.bg : TECH_COLORS.white}
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
}) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TECH_COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: TECH_COLORS.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: TECH_COLORS.coral,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.textMuted,
  },
  tabTextActive: {
    color: TECH_COLORS.coral,
  },
  jobCard: {
    padding: 16,
    marginBottom: 10,
  },
  highlightedCard: {
    borderColor: 'rgba(16,217,160,0.36)',
    shadowColor: TECH_COLORS.emerald,
    shadowOpacity: 0.18,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotText: {
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  areaText: {
    marginTop: 4,
    fontSize: 12,
    color: TECH_COLORS.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonMuted: {
    flex: 1,
    minHeight: 42,
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
    flex: 2,
    minHeight: 42,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.coral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
});

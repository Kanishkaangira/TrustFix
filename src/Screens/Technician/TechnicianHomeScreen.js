import React, { useState } from 'react';
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
  technicianProfile,
} from '../../technician/mockData';
import {
  useTechScreenTheme,
} from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechIconBubble,
  TechMetricCard,
  TechSection,
} from '../../technician/components/TechUi';

export default function TechnicianHomeScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    gradients: TECH_GRADIENTS,
    getTone: getTechTone,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [isOnline, setIsOnline] = useState(true);

  const handleNavigate = (routeName) => {
    navigation.navigate(routeName);
  };

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroGlow} />

            <View style={styles.heroRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.name}>{technicianProfile.name}</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    {isOnline ? 'Online - accepting jobs' : 'Offline - paused'}
                  </Text>
                </View>
              </View>

              <View style={styles.profileCluster}>
                <LinearGradient
                  colors={TECH_GRADIENTS.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{technicianProfile.initials}</Text>
                </LinearGradient>
                <TechBadge label={technicianProfile.plan} tone="emerald" />
              </View>
            </View>

            <TechCard style={styles.availabilityCard}>
              <View style={styles.availabilityCopy}>
                <Text style={styles.availabilityTitle}>Availability</Text>
                <Text style={styles.availabilityText}>
                  Toggle to start or stop receiving jobs
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: TECH_COLORS.float, true: TECH_COLORS.emerald }}
                thumbColor={TECH_COLORS.white}
              />
            </TechCard>
          </View>

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

          <TechCard style={styles.ratingCard}>
            <TechIconBubble icon="star-four-points" tone="gold" size={48} />
            <View style={styles.ratingCopy}>
              <Text style={styles.ratingTitle}>Your Rating</Text>
              <Text style={styles.ratingText}>Based on 62 reviews</Text>
            </View>
            <Text style={styles.ratingValue}>{technicianProfile.rating}</Text>
          </TechCard>

          <TechGradientButton
            label="Open New Job Alert Demo"
            onPress={() => handleNavigate('TechnicianJobAlert')}
            variant="emerald"
            icon="bell-ring-outline"
            style={styles.alertButton}
          />

          <TechSection title="Today's Jobs" action="2 Active" />

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
                    <Icon name={job.icon} size={22} color={tone.text} />
                  </View>

                  <View style={styles.jobCopy}>
                    <View style={styles.jobTitleRow}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <TechBadge
                        label={job.status}
                        tone={job.statusTone === 'amber' ? 'amber' : 'emerald'}
                      />
                    </View>
                    <Text style={styles.jobSub}>{job.issue} · {job.area}</Text>
                    <View style={styles.jobMeta}>
                      <Text style={styles.slotText}>{job.slot}</Text>
                      <Text style={styles.dotSep}>•</Text>
                      <Text style={styles.metaText}>{job.visitText}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.jobActions}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.secondaryJobButton}
                    onPress={() => handleNavigate(index === 0 ? 'TechnicianJobInProgress' : 'TechnicianEnRoute')}
                  >
                    <Text style={styles.secondaryJobText}>
                      {index === 0 ? 'Open Live Job' : 'Open Route'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.primaryJobButton}
                    onPress={() => handleNavigate('TechnicianJobDetail')}
                  >
                    <Text style={styles.primaryJobText}>View Job</Text>
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
}) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TECH_COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
  },
  hero: {
    marginBottom: 14,
  },
  heroGlow: {
    position: 'absolute',
    top: -70,
    left: -30,
    right: -30,
    height: 200,
    borderRadius: 120,
    backgroundColor: 'rgba(16,217,160,0.08)',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    fontSize: 12,
    color: TECH_COLORS.textMuted,
    fontWeight: '500',
  },
  name: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.text,
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TECH_COLORS.emerald,
    shadowColor: TECH_COLORS.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    color: TECH_COLORS.emerald,
    fontWeight: '800',
  },
  profileCluster: {
    alignItems: 'flex-end',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  availabilityCard: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  },
  metricCard: {
    flex: 1,
  },
  ratingCard: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  ratingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  ratingText: {
    marginTop: 2,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: '800',
    color: TECH_COLORS.gold,
  },
  alertButton: {
    marginTop: 16,
    marginBottom: 18,
  },
  jobCard: {
    padding: 14,
    marginBottom: 10,
  },
  jobTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jobCopy: {
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

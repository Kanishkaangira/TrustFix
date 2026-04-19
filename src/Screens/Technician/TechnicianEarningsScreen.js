import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  earningsSummary,
  earningsTransactions,
} from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';
import { TechCard } from '../../technician/components/TechUi';

const PERIODS = ['Daily', 'Weekly', 'Monthly'];

export default function TechnicianEarningsScreen() {
  const {
    colors: TECH_COLORS,
    gradients: TECH_GRADIENTS,
    getTone: getTechTone,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [period, setPeriod] = useState('Daily');

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
          <LinearGradient
            colors={TECH_GRADIENTS.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroOrb} />
            <Text style={styles.heroTitle}>My Earnings</Text>
            <Text style={styles.heroSub}>{earningsSummary.month}</Text>
            <Text style={styles.heroValue}>{earningsSummary.total}</Text>
            <Text style={styles.heroFoot}>{earningsSummary.subtitle}</Text>
          </LinearGradient>

          <View style={styles.periodRow}>
            {PERIODS.map((item) => {
              const active = item === period;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.86}
                  style={[styles.periodButton, active && styles.periodButtonActive]}
                  onPress={() => setPeriod(item)}
                >
                  <Text style={[styles.periodText, active && styles.periodTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: TECH_COLORS.gold }]}>{earningsSummary.today}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{earningsSummary.jobsDone}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: TECH_COLORS.emerald }]}>
                {earningsSummary.commission}
              </Text>
              <Text style={styles.statLabel}>Commission</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>Today&apos;s Transactions</Text>

          {earningsTransactions.map((item) => {
            const tone = getTechTone(item.iconBg);

            return (
              <TechCard key={item.id} style={styles.transactionCard}>
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: tone.bg, borderColor: tone.border },
                  ]}
                >
                  <Icon name={item.icon} size={20} color={tone.text} />
                </View>

                <View style={styles.transactionCopy}>
                  <Text style={styles.transactionTitle}>{item.title}</Text>
                  <Text style={styles.transactionSub}>{item.subtitle}</Text>
                </View>

                <Text
                  style={[
                    styles.transactionAmount,
                    { color: item.tone === 'amber' ? TECH_COLORS.gold : TECH_COLORS.emerald },
                  ]}
                >
                  {item.amount}
                </Text>
              </TechCard>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const createStyles = ({ colors: TECH_COLORS }) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TECH_COLORS.bg,
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  heroSub: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.74)',
  },
  heroValue: {
    marginTop: 10,
    fontSize: 48,
    fontWeight: '800',
    color: TECH_COLORS.white,
    letterSpacing: -1.3,
  },
  heroFoot: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  periodRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.bgElevated,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  periodButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: TECH_COLORS.coral,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.textMuted,
  },
  periodTextActive: {
    color: TECH_COLORS.coral,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: TECH_COLORS.border,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: TECH_COLORS.card,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: TECH_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  eyebrow: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  transactionCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionCopy: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  transactionSub: {
    marginTop: 1,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
});

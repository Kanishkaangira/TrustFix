import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  StatusChip,
  SubScreenShell,
  useProfileColors,
} from '../../Components/ProfileComponents';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    sub: 'For occasional users',
    price: 'Free',
    priceSub: 'always',
    features: ['Standard booking', 'AI Diagnosis (3/month)'],
    missing: ['Free visit charges', 'Priority booking'],
    current: false,
  },
  {
    id: 'pro',
    name: 'HomeCare Pro',
    sub: 'Best for regular users',
    price: 'INR 199',
    priceSub: '/mo',
    features: [
      'Free visit charges',
      'Priority booking',
      'Unlimited AI Diagnosis',
      '1 free video consult/month',
    ],
    missing: [],
    current: true,
  },
  {
    id: 'amc',
    name: 'Annual AMC',
    sub: 'Best value - save INR 389',
    price: 'INR 1,999',
    priceSub: '/yr',
    strikePrice: 'INR 2,388',
    features: [
      'All Pro features',
      'Quarterly home checkup',
      'Dedicated account manager',
    ],
    missing: [],
    current: false,
  },
];

export default function SubscriptionScreen({ onBack }) {
  const colors = useProfileColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="My Plan"
        onBack={onBack}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>CURRENT PLAN</Text>
            <Text style={styles.currentName}>HomeCare Pro</Text>
            <Text style={styles.currentExp}>
              Renews April 11, 2026 | Auto-renew ON
            </Text>
            <Text style={styles.currentPrice}>
              INR 199 <Text style={styles.currentPriceSub}>/ month</Text>
            </Text>
            <View style={styles.perksRow}>
              {['Free visits', 'Priority booking', 'Unlimited AI'].map(perk => (
                <View key={perk} style={styles.perkChip}>
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>UPGRADE OPTIONS</Text>

          {PLANS.map(plan => (
            <View
              key={plan.id}
              style={[styles.planCard, plan.current && styles.planCardActive]}
            >
              {plan.current ? (
                <View style={styles.badgesRow}>
                  <StatusChip label="Current Plan" variant="brand" />
                  <StatusChip label="Active" variant="green" />
                </View>
              ) : null}

              <View style={styles.planTopRow}>
                <View style={styles.planTopCopy}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planSub}>{plan.sub}</Text>
                </View>
                <View style={styles.planPriceWrap}>
                  <Text style={styles.planPrice}>
                    {plan.price}{' '}
                    <Text style={styles.planPriceSub}>{plan.priceSub}</Text>
                  </Text>
                  {plan.strikePrice ? (
                    <Text style={styles.strikePrice}>{plan.strikePrice}</Text>
                  ) : null}
                </View>
              </View>

              {plan.features.map(feature => (
                <View key={feature} style={styles.featRow}>
                  <View
                    style={[styles.featDot, { backgroundColor: colors.green }]}
                  />
                  <Text style={styles.featText}>{feature}</Text>
                </View>
              ))}

              {plan.missing.map(feature => (
                <View key={feature} style={styles.featRow}>
                  <View
                    style={[styles.featDot, { backgroundColor: colors.border }]}
                  />
                  <Text style={[styles.featText, styles.featTextMuted]}>
                    {feature}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.planBtn,
                  plan.current ? styles.planBtnDisabled : styles.planBtnActive,
                ]}
                disabled={plan.current}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.planBtnText,
                    plan.current && styles.planBtnTextDisabled,
                  ]}
                >
                  {plan.current
                    ? 'Currently Active'
                    : plan.id === 'basic'
                    ? 'Downgrade to Basic'
                    : `Upgrade to ${plan.name}`}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    currentCard: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: colors.headerAccent,
      borderRadius: 22,
      padding: 20,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.isDark ? colors.border : 'transparent',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: colors.isDark ? 0.28 : 0.18,
      shadowRadius: 18,
      elevation: 5,
    },
    currentLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 1.4,
    },
    currentName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.white,
      marginTop: 4,
    },
    currentExp: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 2,
    },
    currentPrice: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.white,
      marginTop: 8,
    },
    currentPriceSub: {
      fontSize: 14,
      opacity: 0.7,
    },
    perksRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },
    perkChip: {
      backgroundColor: colors.headerPill,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    perkText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: '600',
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.muted,
      letterSpacing: 1.4,
      marginTop: 24,
      marginBottom: 12,
      marginHorizontal: 16,
    },
    planCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: colors.isDark ? 0.22 : 0.05,
      shadowRadius: 14,
      elevation: 3,
    },
    planCardActive: {
      borderColor: colors.brand,
      shadowColor: colors.brand,
      shadowOpacity: colors.isDark ? 0.18 : 0.12,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    planTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    planTopCopy: {
      flex: 1,
    },
    planPriceWrap: {
      alignItems: 'flex-end',
    },
    planName: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.ink,
    },
    planSub: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    planPrice: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.brand,
    },
    planPriceSub: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '400',
    },
    strikePrice: {
      fontSize: 11,
      color: colors.muted,
      textDecorationLine: 'line-through',
      textAlign: 'right',
    },
    featRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 7,
    },
    featDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      flexShrink: 0,
    },
    featText: {
      fontSize: 13,
      color: colors.inkMid,
      flex: 1,
    },
    featTextMuted: {
      color: colors.muted,
    },
    planBtn: {
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 14,
    },
    planBtnActive: {
      backgroundColor: colors.brand,
      shadowColor: colors.brand,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    planBtnDisabled: {
      backgroundColor: colors.brandSoft,
    },
    planBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.white,
    },
    planBtnTextDisabled: {
      color: colors.muted,
    },
  });

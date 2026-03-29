// src/Screens/ProfileFlow/SubscriptionScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { PC, StatusChip, SubScreenShell } from '../../Components/ProfileComponents';

const PLANS = [
  {
    id:       'basic',
    name:     'Basic',
    sub:      'For occasional users',
    price:    'Free',
    priceSub: 'always',
    features: ['Standard booking', 'AI Diagnosis (3/month)'],
    missing:  ['Free visit charges', 'Priority booking'],
    current:  false,
  },
  {
    id:       'pro',
    name:     'HomeCare Pro',
    sub:      'Best for regular users',
    price:    '₹199',
    priceSub: '/mo',
    features: ['Free visit charges', 'Priority booking', 'Unlimited AI Diagnosis', '1 free video consult/month'],
    missing:  [],
    current:  true,
  },
  {
    id:          'amc',
    name:        'Annual AMC',
    sub:         'Best value — save ₹389',
    price:       '₹1,999',
    priceSub:    '/yr',
    strikePrice: '₹2,388',
    features:    ['All Pro features', 'Quarterly home checkup', 'Dedicated account manager'],
    missing:     [],
    current:     false,
  },
];

export default function SubscriptionScreen({ onBack }) {
  return (
    <SubScreenShell title="My Plan" onBack={onBack}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Current plan hero */}
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>CURRENT PLAN</Text>
          <Text style={styles.currentName}>HomeCare Pro</Text>
          <Text style={styles.currentExp}>Renews April 11, 2026 · Auto-renew ON</Text>
          <Text style={styles.currentPrice}>
            ₹199{' '}
            <Text style={styles.currentPriceSub}>/ month</Text>
          </Text>
          <View style={styles.perksRow}>
            {['Free visits', 'Priority booking', 'Unlimited AI'].map(p => (
              <View key={p} style={styles.perkChip}>
                <Text style={styles.perkText}>{p}</Text>
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
            {plan.current && (
              <View style={styles.badgesRow}>
                <StatusChip label="Current Plan" variant="brand" />
                <StatusChip label="Active"        variant="green" />
              </View>
            )}

            <View style={styles.planTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planSub}>{plan.sub}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planPrice}>
                  {plan.price}{' '}
                  <Text style={styles.planPriceSub}>{plan.priceSub}</Text>
                </Text>
                {plan.strikePrice && (
                  <Text style={styles.strikePrice}>{plan.strikePrice}</Text>
                )}
              </View>
            </View>

            {plan.features.map(f => (
              <View key={f} style={styles.featRow}>
                <View style={[styles.featDot, { backgroundColor: PC.green }]} />
                <Text style={styles.featText}>{f}</Text>
              </View>
            ))}
            {plan.missing.map(f => (
              <View key={f} style={styles.featRow}>
                <View style={[styles.featDot, { backgroundColor: PC.border }]} />
                <Text style={[styles.featText, { color: PC.muted }]}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.planBtn, plan.current ? styles.planBtnDisabled : styles.planBtnActive]}
              disabled={plan.current}
              activeOpacity={0.85}
            >
              <Text style={[styles.planBtnText, plan.current && { color: PC.muted }]}>
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
  );
}

const styles = StyleSheet.create({
  currentCard: {
    marginHorizontal: 16,
    marginTop:        16,
    backgroundColor:  PC.brand,
    borderRadius:     20,
    padding:          20,
    shadowColor:      PC.brand,
    shadowOffset:     { width: 0, height: 8 },
    shadowOpacity:    0.25,
    shadowRadius:     16,
    elevation:        5,
  },
  currentLabel:    { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.4 },
  currentName:     { fontSize: 22, fontWeight: '800', color: PC.white, marginTop: 4  },
  currentExp:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2     },
  currentPrice:    { fontSize: 32, fontWeight: '800', color: PC.white, marginTop: 8  },
  currentPriceSub: { fontSize: 14, opacity: 0.7 },
  perksRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14   },
  perkChip:        { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  perkText:        { color: PC.white, fontSize: 11, fontWeight: '600' },

  sectionLabel: {
    fontSize:         10,
    fontWeight:       '800',
    color:            PC.muted,
    letterSpacing:    1.4,
    marginTop:        24,
    marginBottom:     12,
    marginHorizontal: 16,
  },

  planCard: {
    marginHorizontal: 16,
    marginBottom:     12,
    backgroundColor:  PC.surface,
    borderRadius:     18,
    padding:          18,
    borderWidth:      1.5,
    borderColor:      PC.border,
    shadowColor:      '#111318',
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.05,
    shadowRadius:     8,
    elevation:        2,
  },
  planCardActive: {
    borderColor:   PC.brand,
    shadowColor:   PC.brand,
    shadowOpacity: 0.12,
  },
  badgesRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  planTopRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  planName:    { fontSize: 17, fontWeight: '800', color: PC.ink   },
  planSub:     { fontSize: 12, color: PC.muted,   marginTop: 2    },
  planPrice:   { fontSize: 20, fontWeight: '800', color: PC.brand },
  planPriceSub:{ fontSize: 12, color: PC.muted, fontWeight: '400' },
  strikePrice: { fontSize: 11, color: PC.muted, textDecorationLine: 'line-through', textAlign: 'right' },

  featRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7  },
  featDot:  { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  featText: { fontSize: 13, color: PC.inkMid, flex: 1 },

  planBtn:         { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  planBtnActive:   { backgroundColor: PC.brand, shadowColor: PC.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  planBtnDisabled: { backgroundColor: PC.brandSoft },
  planBtnText:     { fontSize: 14, fontWeight: '700', color: PC.white },
});
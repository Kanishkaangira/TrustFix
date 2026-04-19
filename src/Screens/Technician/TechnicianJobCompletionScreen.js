import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { completionBill } from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechCard,
  TechGradientButton,
  TechRow,
  TechScreenHeader,
} from '../../technician/components/TechUi';

export default function TechnicianJobCompletionScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader
          title="Complete Job"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>Final Bill to Customer</Text>
          <TechCard style={styles.billCard}>
            {completionBill.map((item, index) => (
              <View key={item.id}>
                <TechRow label={item.label} value={item.value} muted={item.muted} />
                {index < completionBill.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
            <View style={styles.totalDivider} />
            <TechRow label="Total due now" value="₹1,130" />
          </TechCard>

          <View style={styles.earningsCard}>
            <Text style={styles.earningsEyebrow}>Your Earnings This Job</Text>
            <TechRow label="Visit fee cut" value="₹79" tone="emerald" />
            <View style={styles.earningsDivider} />
            <TechRow label="Labour (0% on ₹650, ≤₹800)" value="₹650" tone="emerald" />
            <View style={styles.earningsTotalRow}>
              <Text style={styles.earningsTotalLabel}>Total You Earn</Text>
              <Text style={styles.earningsTotalValue}>₹1,209</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>Payment Method</Text>

          {[
            { id: 'cash', label: '💵 Cash Collected' },
            { id: 'online', label: '💳 Paid Online (Razorpay)' },
          ].map((option) => {
            const selected = paymentMethod === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.86}
                style={[styles.paymentCard, selected && styles.paymentCardSelected]}
                onPress={() => setPaymentMethod(option.id)}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={[styles.paymentText, !selected && styles.paymentTextMuted]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TechGradientButton
            label="Submit and Close Job"
            variant="emerald"
            icon="check"
            onPress={() => navigation.navigate('TechnicianTabs', { screen: 'TechnicianHome' })}
            style={styles.primaryAction}
          />

          <Text style={styles.footerText}>
            Customer will receive a review prompt after closing
          </Text>
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
    paddingBottom: 32,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  billCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
  totalDivider: {
    height: 2,
    backgroundColor: TECH_COLORS.border,
    marginTop: 4,
  },
  earningsCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: TECH_RADIUS.xl,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
  },
  earningsEyebrow: {
    marginBottom: 12,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: TECH_COLORS.emerald,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: 'rgba(16,217,160,0.18)',
  },
  earningsTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,217,160,0.18)',
  },
  earningsTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  earningsTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.card,
    marginBottom: 8,
  },
  paymentCardSelected: {
    borderWidth: 2,
    borderColor: TECH_COLORS.coral,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TECH_COLORS.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: TECH_COLORS.coral,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: TECH_COLORS.coral,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  paymentTextMuted: {
    color: TECH_COLORS.textSecondary,
  },
  primaryAction: {
    marginTop: 10,
  },
  footerText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
});
